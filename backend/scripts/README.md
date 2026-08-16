# Seed Scripts

These scripts implement the MVP seed pipeline:
1. Normalize a Kaggle CSV into canonical files under `data/processed`.
2. Score review quality with heuristics and write `data/processed/review_quality_report.csv`.
3. Infer review sentiment and write `data/processed/review_sentiment_report.csv`.
4. Load canonical files into PostgreSQL (including quality and sentiment metadata on reviews).

## Low-quality review heuristics
The loader flags reviews before sentiment aggregation using lightweight rules:
- too short / low token count
- duplicate review text
- promotional terms and outbound links
- excessive caps, punctuation, or repetitive wording

Reviews are not deleted. They are persisted with:
- `is_suspected_low_quality`
- `low_quality_score`

Recommendation aggregation excludes `is_suspected_low_quality=true` reviews.

## Sentiment model training
Place labeled review data in `data/raw/sentiment` and train from `backend/`:

```bash
python scripts/train_sentiment_model.py --input-csv ../data/raw/sentiment/labeled_reviews.csv
```

This writes:
- `backend/models/sentiment_pipeline.pkl`
- `backend/models/sentiment_metrics.json`

When loading seed data, `scripts/load_seed_to_db.py` uses the trained model if present.
If not present, it falls back to rating-based sentiment labels.

## Prerequisites
- PostgreSQL running with `DATABASE_URL` configured in `backend/.env`
- Python dependencies installed from `backend/requirements.txt`

## Kaggle credentials (needed only for `--download`)
Provide one of the following:
- Environment vars: `KAGGLE_USERNAME`, `KAGGLE_KEY`
- Or file: `%USERPROFILE%/.kaggle/kaggle.json`

## Commands
From `backend/`:

```bash
python scripts/kaggle_seed_pipeline.py --input-csv ../data/raw/kaggle/your_file.csv
python scripts/load_seed_to_db.py
```

To auto-download first:

```bash
python scripts/kaggle_seed_pipeline.py --download --dataset owner/dataset
python scripts/load_seed_to_db.py
```
