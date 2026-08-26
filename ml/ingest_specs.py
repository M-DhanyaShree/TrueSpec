"""
TrueSpec ML Pipeline - Laptop Specification Ingestion
Reads data/raw/laptops_cleaned.csv and writes structured laptop specifications
into the database (MySQL/SQLite).
"""
import os
import re
import sys
import pandas as pd
from pathlib import Path
from sqlalchemy import text
try:
    from ml.db import get_db_engine, init_tables_if_needed
except ImportError:
    from db import get_db_engine, init_tables_if_needed

# Explicit Simplifying Assumptions:
# 1. storage_type: Defaulted to "SSD" as the dataset does not have a dedicated storage type column.
# 2. resolution: Standard baseline assumed 1920x1080 for standard display scaling where resolution is omitted.

TIER_CPU_MAP = {
    'flagship': 95,
    'premium': 90,
    'high': 80,
    'mid': 65,
    'entry': 45,
    'budget': 35
}

TIER_GPU_MAP = {
    'flagship': 95,
    'premium': 90,
    'high': 80,
    'mid': 65,
    'entry': 40,
    'budget': 25
}

def derive_cpu_score(cpu_tier: str, cpu_name: str) -> int:
    """Derives a 0-100 score for CPU using tier mapping or keyword heuristics."""
    if isinstance(cpu_tier, str) and cpu_tier.strip().lower() in TIER_CPU_MAP:
        return TIER_CPU_MAP[cpu_tier.strip().lower()]
    
    # Heuristic fallback based on cpu_name keywords
    name = str(cpu_name).lower()
    if any(k in name for k in ['i9', 'ryzen 9', 'm3 max', 'm2 max', 'ultra 9', '14900', '13900']):
        return 95
    if any(k in name for k in ['i7', 'ryzen 7', 'm3 pro', 'm2 pro', 'ultra 7', '13700', '14700', '8945', '7840']):
        return 82
    if any(k in name for k in ['i5', 'ryzen 5', 'm3', 'm2', 'm1', 'ultra 5', '13420', '1235', '7530', '7520']):
        return 65
    if any(k in name for k in ['i3', 'ryzen 3', 'celeron', 'pentium', 'athlon']):
        return 45
    return 55

def derive_gpu_score(gpu_tier: str, gpu_name: str, vram_gb: float) -> int:
    """Derives a 0-100 score for GPU using tier mapping, keyword heuristics, and dedicated VRAM bonus."""
    base_score = 0
    if isinstance(gpu_tier, str) and gpu_tier.strip().lower() in TIER_GPU_MAP:
        base_score = TIER_GPU_MAP[gpu_tier.strip().lower()]
    else:
        # Heuristic fallback
        name = str(gpu_name).lower()
        if any(k in name for k in ['rtx 4090', 'rtx 4080', 'm3 max', 'm2 max']):
            base_score = 95
        elif any(k in name for k in ['rtx 4070', 'rtx 3080', 'm3 pro']):
            base_score = 88
        elif any(k in name for k in ['rtx 4060', 'rtx 3070', 'rtx 3060']):
            base_score = 78
        elif any(k in name for k in ['rtx 4050', 'rtx 3050', 'gtx 1650']):
            base_score = 65
        elif any(k in name for k in ['arc', 'radeon 780m', 'radeon 680m', 'm2 gpu', 'm3 gpu']):
            base_score = 50
        elif any(k in name for k in ['iris', 'uhd', 'integrated', 'radeon graphics', '610m']):
            base_score = 25
        else:
            base_score = 40
            
    # Add bonus for dedicated VRAM (e.g. 8GB VRAM gives +8 points, capped at 100)
    vram = float(vram_gb) if pd.notna(vram_gb) else 0.0
    if vram > 0:
        base_score += min(15, int(vram * 1.5))
        
    return min(100, max(10, base_score))

def parse_battery_wh(battery_info: str) -> float:
    """Parses Watt-Hour float value from text like '56Wh' or '3-cell 41Wh' or '52.6Wh'."""
    if not isinstance(battery_info, str):
        return 50.0
    match = re.search(r'([\d.]+)\s*wh', battery_info, re.IGNORECASE)
    if match:
        try:
            return float(match.group(1))
        except ValueError:
            pass
    return 50.0

def clean_model_name(name: str, brand: str) -> str:
    """Strips redundant leading brand token from model name if present."""
    name_str = str(name).strip()
    brand_str = str(brand).strip()
    pattern = rf'^{re.escape(brand_str)}\s+'
    cleaned = re.sub(pattern, '', name_str, flags=re.IGNORECASE)
    return cleaned.strip() or name_str

def ingest_specs(csv_path: str = None):
    if csv_path is None:
        csv_path = Path(__file__).resolve().parent.parent / 'data' / 'raw' / 'laptops_cleaned.csv'
    
    print(f"[TrueSpec Specs Ingestion] Loading: {csv_path}")
    if not Path(csv_path).exists():
        raise FileNotFoundError(f"Missing specs CSV at {csv_path}")

    df = pd.read_csv(csv_path)
    engine = get_db_engine()
    init_tables_if_needed(engine)

    total_rows = len(df)
    skipped_rows = 0
    valid_laptops = []

    for idx, row in df.iterrows():
        brand = row.get('brand')
        name = row.get('name')
        price = row.get('price')

        # Skip rows missing brand, model name, or price
        if pd.isna(brand) or pd.isna(name) or pd.isna(price) or str(brand).strip() == '' or str(name).strip() == '':
            skipped_rows += 1
            continue

        try:
            price_val = float(price)
            if price_val <= 0:
                skipped_rows += 1
                continue
        except (ValueError, TypeError):
            skipped_rows += 1
            continue

        model_name = clean_model_name(str(name), str(brand))
        cpu_name = str(row.get('cpu_name', 'Intel Core i5'))
        gpu_name = str(row.get('gpu_name', 'Integrated Graphics'))
        ram_gb = int(row.get('ram_gb', 16)) if pd.notna(row.get('ram_gb')) else 16
        vram_gb = float(row.get('vram_gb', 0)) if pd.notna(row.get('vram_gb')) else 0.0
        storage_gb = int(row.get('storage_gb', 512)) if pd.notna(row.get('storage_gb')) else 512
        weight_kg = float(row.get('weight_kg', 1.5)) if pd.notna(row.get('weight_kg')) else 1.5
        display_size = float(row.get('screen_size_inches', 14.0)) if pd.notna(row.get('screen_size_inches')) else 14.0
        refresh_rate = int(row.get('refresh_rate_hz', 60)) if pd.notna(row.get('refresh_rate_hz')) else 60
        category = str(row.get('primary_use_case', 'Everyday')).strip()
        os_name = str(row.get('os', 'Windows 11')).strip()

        cpu_score = derive_cpu_score(str(row.get('cpu_tier', '')), cpu_name)
        gpu_score = derive_gpu_score(str(row.get('gpu_tier', '')), gpu_name, vram_gb)
        battery_wh = parse_battery_wh(str(row.get('battery_info', '50Wh')))

        valid_laptops.append({
            'brand': str(brand).strip(),
            'model_name': model_name,
            'cpu_name': cpu_name,
            'cpu_score': cpu_score,
            'gpu_name': gpu_name,
            'gpu_score': gpu_score,
            'ram_gb': ram_gb,
            'storage_type': 'SSD', # Stated simplifying assumption: default to SSD
            'storage_gb': storage_gb,
            'display_size': display_size,
            'refresh_rate': refresh_rate,
            'battery_wh': battery_wh,
            'weight_kg': weight_kg,
            'price': price_val,
            'currency': 'INR',
            'os': os_name,
            'category': category
        })

    # Clear existing and insert clean data
    with engine.begin() as conn:
        conn.execute(text("DELETE FROM laptop_scores;"))
        conn.execute(text("DELETE FROM reviews;"))
        conn.execute(text("DELETE FROM laptops;"))
        for lap in valid_laptops:
            conn.execute(text("""
                INSERT INTO laptops (
                    brand, model_name, cpu_name, cpu_score, gpu_name, gpu_score,
                    ram_gb, storage_type, storage_gb, display_size, refresh_rate,
                    battery_wh, weight_kg, price, currency, os, category
                ) VALUES (
                    :brand, :model_name, :cpu_name, :cpu_score, :gpu_name, :gpu_score,
                    :ram_gb, :storage_type, :storage_gb, :display_size, :refresh_rate,
                    :battery_wh, :weight_kg, :price, :currency, :os, :category
                )
            """), lap)

    print(f"[TrueSpec Specs Ingestion Complete]")
    print(f"  - Total source rows: {total_rows}")
    print(f"  - Successfully ingested laptops: {len(valid_laptops)}")
    print(f"  - Skipped invalid rows: {skipped_rows}")
    return len(valid_laptops)

if __name__ == '__main__':
    ingest_specs()
