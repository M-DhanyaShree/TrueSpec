# Seed Scripts

These scripts implement the MVP seed pipeline:
1. Normalize a Kaggle CSV into canonical files under `data/processed`.
2. Load canonical files into PostgreSQL.

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
