"""
TrueSpec ML Pipeline - Batch Review Scoring & Laptop Confidence Calculation
1. Scores all unscored reviews using the champion sentiment model (ml/models/sentiment_model.pkl).
2. Computes the Wilson score lower bound (95% confidence interval) on clean (non-flagged) reviews.
3. Computes the TrueSpec Confidence Score (0-100) combining Wilson lower bound with volume confidence.
4. Writes results to the laptop_scores table.
"""
import os
import math
import joblib
import pandas as pd
from pathlib import Path
from sqlalchemy import text
try:
    from ml.db import get_db_engine, init_tables_if_needed
except ImportError:
    from db import get_db_engine, init_tables_if_needed

def calculate_wilson_lower_bound(positives: int, total: int, z: float = 1.96) -> float:
    """
    Computes the Wilson score interval lower bound for a Bernoulli parameter.
    z=1.96 corresponds to a 95% confidence interval.
    
    Formula:
    w = (p_hat + z^2 / (2n) - z * sqrt((p_hat*(1 - p_hat) + z^2 / (4n)) / n)) / (1 + z^2 / n)
    """
    if total <= 0:
        return 0.0
    
    p_hat = float(positives) / float(total)
    n = float(total)
    z2 = z * z
    
    numerator = p_hat + (z2 / (2.0 * n)) - z * math.sqrt((p_hat * (1.0 - p_hat) + (z2 / (4.0 * n))) / n)
    denominator = 1.0 + (z2 / n)
    
    return max(0.0, min(1.0, numerator / denominator))

def compute_confidence_score(wilson_score: float, clean_count: int, flagged_count: int) -> float:
    """
    Computes TrueSpec 0-100 confidence score from the Wilson lower bound,
    adjusting with a small volume cleanliness stability factor.
    """
    if clean_count == 0:
        return 0.0
        
    total_reviews = clean_count + flagged_count
    # Volume stabilization factor: asymptotic curve approaching 1.0 as n >= 15
    volume_factor = min(1.0, 0.75 + 0.25 * (1.0 - math.exp(-clean_count / 10.0)))
    
    # Flagged penalty: minor discount if a significant portion of reviews were flagged
    flag_ratio = (flagged_count / total_reviews) if total_reviews > 0 else 0.0
    cleanliness_penalty = max(0.85, 1.0 - (flag_ratio * 0.3))
    
    raw_score = wilson_score * 100.0 * volume_factor * cleanliness_penalty
    return round(max(0.0, min(100.0, raw_score)), 1)

def score_reviews_and_laptops():
    model_path = Path(__file__).resolve().parent / 'models' / 'sentiment_model.pkl'
    if not model_path.exists():
        raise FileNotFoundError(f"Trained sentiment model not found at {model_path}. Please run train_sentiment_model.py first.")

    print(f"[TrueSpec Scoring Pipeline] Loading sentiment model from {model_path}...")
    model = joblib.load(model_path)

    engine = get_db_engine()
    init_tables_if_needed(engine)

    # 1. Fetch unscored reviews and predict sentiment
    with engine.connect() as conn:
        reviews_res = conn.execute(text("SELECT id, review_text FROM reviews WHERE sentiment_label IS NULL"))
        unscored = reviews_res.fetchall()

    if unscored:
        print(f"Scoring {len(unscored)} unlabelled reviews with NLP model...")
        rev_ids = [r[0] for r in unscored]
        rev_texts = [str(r[1]) for r in unscored]
        predictions = model.predict(rev_texts)

        with engine.begin() as conn:
            for rid, pred in zip(rev_ids, predictions):
                conn.execute(text("UPDATE reviews SET sentiment_label = :label WHERE id = :id"), {
                    'label': str(pred).lower(),
                    'id': rid
                })
        print(f"Successfully updated {len(unscored)} review sentiment labels.")
    else:
        print("All reviews are already sentiment-labelled.")

    # 2. Fetch all laptops and calculate aggregate confidence scores
    with engine.connect() as conn:
        laptops_res = conn.execute(text("SELECT id, brand, model_name FROM laptops"))
        laptops = [{"id": r[0], "brand": r[1], "model_name": r[2]} for r in laptops_res.fetchall()]

        # Fetch all reviews grouped by laptop
        reviews_df = pd.read_sql("SELECT id, laptop_id, is_flagged, sentiment_label, rating FROM reviews", engine)

    print(f"Computing Wilson lower bounds and confidence scores for {len(laptops)} laptops...")
    laptop_scores = []

    for lap in laptops:
        lid = lap['id']
        lap_revs = reviews_df[reviews_df['laptop_id'] == lid]
        total_rev_count = len(lap_revs)
        
        # Clean (non-flagged) reviews only for Wilson score
        clean_revs = lap_revs[lap_revs['is_flagged'] == 0]
        flagged_count = len(lap_revs[lap_revs['is_flagged'] == 1])
        clean_count = len(clean_revs)

        if clean_count > 0:
            positive_count = len(clean_revs[clean_revs['sentiment_label'] == 'positive'])
            pos_ratio = round(positive_count / clean_count, 4)
            wilson_lb = calculate_wilson_lower_bound(positive_count, clean_count, z=1.96)
            conf_score = compute_confidence_score(wilson_lb, clean_count, flagged_count)
        else:
            pos_ratio = 0.0
            wilson_lb = 0.0
            conf_score = 0.0

        laptop_scores.append({
            'laptop_id': lid,
            'confidence_score': conf_score,
            'wilson_lower_bound': round(wilson_lb, 4),
            'positive_ratio': round(pos_ratio * 100, 1),
            'review_count': total_rev_count,
            'clean_review_count': clean_count
        })

    # 3. Write / Upsert to laptop_scores table
    with engine.begin() as conn:
        conn.execute(text("DELETE FROM laptop_scores;"))
        for sc in laptop_scores:
            conn.execute(text("""
                INSERT INTO laptop_scores (
                    laptop_id, confidence_score, wilson_lower_bound,
                    positive_ratio, review_count, clean_review_count
                ) VALUES (
                    :laptop_id, :confidence_score, :wilson_lower_bound,
                    :positive_ratio, :review_count, :clean_review_count
                )
            """), sc)

    print(f"[TrueSpec Scoring Complete] Successfully scored {len(laptop_scores)} laptops.")
    
    # Print sample top scored laptops
    top_scores = sorted(laptop_scores, key=lambda x: x['confidence_score'], reverse=True)[:5]
    print("\nTop 5 TrueSpec Confidence Scores:")
    for rank, item in enumerate(top_scores, 1):
        matching_lap = next((l for l in laptops if l['id'] == item['laptop_id']), None)
        name = f"{matching_lap['brand']} {matching_lap['model_name']}" if matching_lap else f"ID {item['laptop_id']}"
        print(f"  {rank}. {name}: Confidence {item['confidence_score']}/100 | Wilson LB: {item['wilson_lower_bound']:.3f} | Clean Revs: {item['clean_review_count']}")

    return len(laptop_scores)

if __name__ == '__main__':
    score_reviews_and_laptops()
