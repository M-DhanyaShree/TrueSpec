"""
TrueSpec ML Pipeline - Review Ingestion & Fake Review Detection
Reads data/raw/laptops_dataset_final_600.csv, matches reviews to ingested laptops,
applies multi-heuristic fake/low-trust review detection, and writes to database.
"""
import os
import re
import sys
import pandas as pd
from collections import Counter
from pathlib import Path
from sqlalchemy import text
try:
    from ml.db import get_db_engine, init_tables_if_needed
except ImportError:
    from db import get_db_engine, init_tables_if_needed

# STATED ASSUMPTION & CRITICAL CALIBRATION:
# verified_purchase: Defaults to True in this dataset.
# REASON: The source dataset does not contain a verified_purchase column.
# If we defaulted to False, the "unverified purchase" heuristic would fire on 100% of reviews,
# effectively collapsing the 2-heuristic threshold down to a single heuristic and mass-flagging
# genuine, legitimate reviews. Defaulting to True preserves accurate heuristic calibration.

PROMO_LINK_REGEX = re.compile(
    r'(https?://[^\s]+|www\.[^\s]+|bit\.ly/[^\s]+|tinyurl\.com/[^\s]+|discount\d+|deal\d+)',
    re.IGNORECASE
)
EXCESSIVE_PUNCT_REGEX = re.compile(r'(!{3,}|\?{3,}|[!?]{3,})')

def normalize_text_for_dup(text_str: str) -> str:
    """Normalizes string for O(N) duplicate detection."""
    return re.sub(r'\s+', ' ', str(text_str).strip().lower())

def evaluate_fake_heuristics(
    review_text: str,
    dup_count_for_laptop: int,
    verified_purchase: bool = True
) -> tuple[bool, list[str]]:
    """
    Evaluates 6 heuristics for fake / low-trust review detection.
    Flags review if and only if 2 OR MORE heuristics fire.
    Returns (is_flagged, triggered_reasons).
    """
    reasons = []
    text_clean = str(review_text).strip()
    words = text_clean.split()
    word_count = len(words)

    # 1. Review text under ~20 words
    if word_count < 20:
        reasons.append("Short review (<20 words)")

    # 2. Duplicate review text within the same laptop set (O(N) lookup)
    if dup_count_for_laptop > 1:
        reasons.append("Duplicate review content for this model")

    # 3. Promotional links present
    if PROMO_LINK_REGEX.search(text_clean):
        reasons.append("Contains promotional or spam link")

    # 4. Excessive capitalization (>50% of letters uppercase on reasonably long text)
    letters = [c for c in text_clean if c.isalpha()]
    if len(letters) >= 20:
        upper_ratio = sum(1 for c in letters if c.isupper()) / len(letters)
        if upper_ratio > 0.5:
            reasons.append("Excessive capitalization (>50% uppercase)")

    # 5. Excessive punctuation (e.g. "!!!" or "???")
    if EXCESSIVE_PUNCT_REGEX.search(text_clean):
        reasons.append("Excessive emotional punctuation (!!!/???)")

    # 6. Unverified purchase
    if not verified_purchase:
        reasons.append("Unverified buyer purchase")

    # Flag only if 2 or more heuristics fire
    is_flagged = len(reasons) >= 2
    return is_flagged, reasons

def match_laptop_fuzzy(product_name: str, laptops_list: list[dict]) -> dict | None:
    """
    Matches review product_name to an ingested laptop:
    Brand must match, plus at least one distinct model token must match.
    """
    p_norm = str(product_name).lower()
    
    for lap in laptops_list:
        brand = lap['brand'].lower()
        model_name = lap['model_name'].lower()
        
        # Check brand match
        if brand not in p_norm:
            continue
            
        # Check model tokens match
        model_tokens = [t for t in re.split(r'[\s\-_]+', model_name) if len(t) > 2 and t not in brand]
        if not model_tokens:
            return lap
            
        # Count matching tokens
        matched_tokens = sum(1 for t in model_tokens if t in p_norm)
        if matched_tokens >= 1:
            return lap
            
    return None

def ingest_reviews(csv_path: str = None):
    if csv_path is None:
        csv_path = Path(__file__).resolve().parent.parent / 'data' / 'raw' / 'laptops_dataset_final_600.csv'

    print(f"[TrueSpec Review Ingestion] Loading: {csv_path}")
    if not Path(csv_path).exists():
        raise FileNotFoundError(f"Missing reviews CSV at {csv_path}")

    df = pd.read_csv(csv_path)
    engine = get_db_engine()
    init_tables_if_needed(engine)

    # Fetch ingested laptops for fuzzy matching
    with engine.connect() as conn:
        result = conn.execute(text("SELECT id, brand, model_name FROM laptops"))
        laptops_list = [{"id": r[0], "brand": r[1], "model_name": r[2]} for r in result.fetchall()]

    if not laptops_list:
        raise ValueError("No laptops found in database. Please run ml/ingest_specs.py first.")

    total_rows = len(df)
    unmatched_count = 0
    parsed_reviews = []

    # First pass: map and group reviews by laptop for O(N) duplicate detection
    laptop_to_normalized_texts = {}

    for idx, row in df.iterrows():
        p_name = row.get('product_name', '')
        matched_laptop = match_laptop_fuzzy(p_name, laptops_list)
        if not matched_laptop:
            unmatched_count += 1
            continue

        title = str(row.get('title', '')).strip() if pd.notna(row.get('title')) else ''
        review = str(row.get('review', '')).strip() if pd.notna(row.get('review')) else ''
        
        # Combine title and review into review_text
        if title and review and title.lower() != review.lower():
            review_text = f"{title}. {review}"
        elif review:
            review_text = review
        elif title:
            review_text = title
        else:
            unmatched_count += 1
            continue

        try:
            rating_val = float(row.get('rating', 5.0))
        except (ValueError, TypeError):
            rating_val = 5.0

        laptop_id = matched_laptop['id']
        norm_text = normalize_text_for_dup(review_text)

        if laptop_id not in laptop_to_normalized_texts:
            laptop_to_normalized_texts[laptop_id] = []
        laptop_to_normalized_texts[laptop_id].append(norm_text)

        parsed_reviews.append({
            'laptop_id': laptop_id,
            'source': 'Verified Retailer',
            'review_text': review_text,
            'rating': rating_val,
            'verified_purchase': True, # Inferred baseline default
            'review_date': None,
            'norm_text': norm_text
        })

    # Compute duplicate frequency counters per laptop in O(N)
    laptop_dup_counters = {
        lid: Counter(texts) for lid, texts in laptop_to_normalized_texts.items()
    }

    # Second pass: evaluate fake review heuristics and insert
    flagged_count = 0
    clean_reviews = []

    with engine.begin() as conn:
        conn.execute(text("DELETE FROM reviews;"))
        for rev in parsed_reviews:
            lid = rev['laptop_id']
            dup_count = laptop_dup_counters[lid][rev['norm_text']]
            is_flagged, reasons = evaluate_fake_heuristics(
                rev['review_text'],
                dup_count,
                rev['verified_purchase']
            )
            if is_flagged:
                flagged_count += 1

            conn.execute(text("""
                INSERT INTO reviews (
                    laptop_id, source, review_text, rating, verified_purchase,
                    review_date, is_flagged, sentiment_label
                ) VALUES (
                    :laptop_id, :source, :review_text, :rating, :verified_purchase,
                    :review_date, :is_flagged, NULL
                )
            """), {
                'laptop_id': lid,
                'source': rev['source'],
                'review_text': rev['review_text'],
                'rating': rev['rating'],
                'verified_purchase': 1 if rev['verified_purchase'] else 0,
                'review_date': None,
                'is_flagged': 1 if is_flagged else 0
            })

    total_ingested = len(parsed_reviews)
    flag_pct = (flagged_count / total_ingested * 100) if total_ingested > 0 else 0

    print(f"[TrueSpec Review Ingestion Complete]")
    print(f"  - Total reviews in source CSV: {total_rows}")
    print(f"  - Successfully matched & ingested: {total_ingested}")
    print(f"  - Unmatched / skipped reviews: {unmatched_count}")
    print(f"  - Flagged suspicious reviews: {flagged_count} ({flag_pct:.1f}%)")
    print(f"  - Clean reviews for confidence scoring: {total_ingested - flagged_count}")
    return total_ingested, flagged_count

if __name__ == '__main__':
    ingest_reviews()
