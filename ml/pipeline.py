"""
TrueSpec ML Pipeline - Master Batch Execution Runner
Executes the full offline batch pipeline:
1. Specs Ingestion (data/raw/laptops_cleaned.csv -> laptops table)
2. Reviews Ingestion & Heuristic Fake Review Detection (data/raw/laptops_dataset_final_600.csv -> reviews table)
3. NLP Aspect Sentiment Model Training (data/raw/Laptop_Train_v2.csv -> ml/models/sentiment_model.pkl)
4. Batch Review Scoring & Confidence Scoring (reviews table + laptop_scores table)
"""
import sys
import time
from pathlib import Path

# Add ml/ directory to path
sys.path.insert(0, str(Path(__file__).resolve().parent))

from ingest_specs import ingest_specs
from ingest_reviews import ingest_reviews
from train_sentiment_model import train_sentiment_model
from score_reviews_and_laptops import score_reviews_and_laptops

def run_full_pipeline():
    start_time = time.time()
    print("=" * 65)
    print(" TrueSpec Machine Learning & Ingestion Pipeline")
    print("=" * 65)

    print("\n>>> Step 1/4: Ingesting Laptop Specifications...")
    lap_count = ingest_specs()

    print("\n>>> Step 2/4: Ingesting Reviews & Applying Fake Review Heuristics...")
    rev_count, flagged_count = ingest_reviews()

    print("\n>>> Step 3/4: Training NLP Aspect Sentiment Models...")
    champ_name, metrics = train_sentiment_model()

    print("\n>>> Step 4/4: Scoring Reviews & Calculating Wilson Confidence Bounds...")
    score_count = score_reviews_and_laptops()

    elapsed = time.time() - start_time
    print("\n" + "=" * 65)
    print(" TrueSpec Pipeline Run Succeeded!")
    print(f" Summary:")
    print(f"   • Laptops Ingested:        {lap_count}")
    print(f"   • Reviews Processed:       {rev_count} ({flagged_count} flagged suspicious)")
    print(f"   • NLP Sentiment Champion:  {champ_name} (F1: {metrics['macro_f1']:.4f})")
    print(f"   • Laptops Scored in DB:    {score_count}")
    print(f"   • Total Pipeline Duration: {elapsed:.2f}s")
    print("=" * 65)

if __name__ == '__main__':
    run_full_pipeline()
