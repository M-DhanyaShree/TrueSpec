"""
TrueSpec ML Pipeline - Sentiment Model Training
Loads data/raw/Laptop_Train_v2.csv, trains two candidate pipelines:
1. TF-IDF + Logistic Regression
2. TF-IDF + Multinomial Naive Bayes
Evaluates both on a held-out test split, exports the champion model to ml/models/sentiment_model.pkl,
and writes a comprehensive metrics report to ml/models/sentiment_model_report.txt.
"""
import os
import joblib
import pandas as pd
from pathlib import Path
from sklearn.model_selection import train_test_split
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.linear_model import LogisticRegression
from sklearn.naive_bayes import MultinomialNB
from sklearn.pipeline import Pipeline
from sklearn.metrics import accuracy_score, precision_recall_fscore_support, classification_report

def train_sentiment_model(csv_path: str = None):
    if csv_path is None:
        csv_path = Path(__file__).resolve().parent.parent / 'data' / 'raw' / 'Laptop_Train_v2.csv'

    models_dir = Path(__file__).resolve().parent / 'models'
    models_dir.mkdir(parents=True, exist_ok=True)

    print(f"[TrueSpec NLP Sentiment Training] Loading: {csv_path}")
    if not Path(csv_path).exists():
        raise FileNotFoundError(f"Missing training dataset at {csv_path}")

    df = pd.read_csv(csv_path)
    
    # Text column: Sentence, Label column: polarity
    # Map 'conflict' -> 'neutral' as required
    df['clean_polarity'] = df['polarity'].astype(str).str.strip().str.lower()
    df['clean_polarity'] = df['clean_polarity'].replace({'conflict': 'neutral'})

    # Filter for valid labels
    df = df[df['clean_polarity'].isin(['positive', 'negative', 'neutral'])].dropna(subset=['Sentence'])

    X = df['Sentence'].astype(str)
    y = df['clean_polarity'].astype(str)

    print(f"  - Total clean training samples: {len(X)}")
    print(f"  - Class distribution:\n{y.value_counts()}")

    # Stratified Train-Test Split (80% train, 20% test)
    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.20, random_state=42, stratify=y
    )

    # Candidate 1: TF-IDF + Logistic Regression
    pipe_lr = Pipeline([
        ('tfidf', TfidfVectorizer(ngram_range=(1, 2), max_features=5000, sublinear_tf=True)),
        ('clf', LogisticRegression(C=2.0, max_iter=1000, random_state=42))
    ])
    pipe_lr.fit(X_train, y_train)
    y_pred_lr = pipe_lr.predict(X_test)
    acc_lr = accuracy_score(y_test, y_pred_lr)
    prec_lr, rec_lr, f1_lr, _ = precision_recall_fscore_support(y_test, y_pred_lr, average='macro', zero_division=0)

    # Candidate 2: TF-IDF + Multinomial Naive Bayes
    pipe_nb = Pipeline([
        ('tfidf', TfidfVectorizer(ngram_range=(1, 2), max_features=5000, sublinear_tf=True)),
        ('clf', MultinomialNB(alpha=0.5))
    ])
    pipe_nb.fit(X_train, y_train)
    y_pred_nb = pipe_nb.predict(X_test)
    acc_nb = accuracy_score(y_test, y_pred_nb)
    prec_nb, rec_nb, f1_nb, _ = precision_recall_fscore_support(y_test, y_pred_nb, average='macro', zero_division=0)

    print("\n--- Model Evaluation Results (Held-Out Test Set) ---")
    print(f"Candidate 1: TF-IDF + Logistic Regression")
    print(f"  Accuracy:  {acc_lr:.4f} | Precision (macro): {prec_lr:.4f} | Recall (macro): {rec_lr:.4f} | Macro-F1: {f1_lr:.4f}")
    print(f"Candidate 2: TF-IDF + Multinomial Naive Bayes")
    print(f"  Accuracy:  {acc_nb:.4f} | Precision (macro): {prec_nb:.4f} | Recall (macro): {rec_nb:.4f} | Macro-F1: {f1_nb:.4f}")

    # Select champion model based on Macro-F1
    if f1_lr >= f1_nb:
        champion_name = "TF-IDF + Logistic Regression"
        champion_model = pipe_lr
        champion_metrics = {"accuracy": acc_lr, "precision": prec_lr, "recall": rec_lr, "macro_f1": f1_lr}
        selected_report = classification_report(y_test, y_pred_lr)
    else:
        champion_name = "TF-IDF + Multinomial Naive Bayes"
        champion_model = pipe_nb
        champion_metrics = {"accuracy": acc_nb, "precision": prec_nb, "recall": rec_nb, "macro_f1": f1_nb}
        selected_report = classification_report(y_test, y_pred_nb)

    # Save champion model
    model_export_path = models_dir / 'sentiment_model.pkl'
    joblib.dump(champion_model, model_export_path)
    print(f"\n[Champion Selected]: {champion_name} (Macro-F1: {champion_metrics['macro_f1']:.4f})")
    print(f"Saved model binary to: {model_export_path}")

    # Write metrics report
    report_path = models_dir / 'sentiment_model_report.txt'
    with open(report_path, 'w', encoding='utf-8') as f:
        f.write("=====================================================\n")
        f.write("TrueSpec ML Pipeline - Sentiment Model Training Report\n")
        f.write("=====================================================\n\n")
        f.write(f"Training Dataset: {csv_path}\n")
        f.write(f"Total Samples: {len(X)} (Train: {len(X_train)}, Test: {len(X_test)})\n")
        f.write("Class Mapping: conflict -> neutral\n\n")
        f.write("--- Candidate 1: TF-IDF + Logistic Regression ---\n")
        f.write(f"  Accuracy:       {acc_lr:.4f}\n")
        f.write(f"  Macro Precision:{prec_lr:.4f}\n")
        f.write(f"  Macro Recall:   {rec_lr:.4f}\n")
        f.write(f"  Macro F1-Score: {f1_lr:.4f}\n\n")
        f.write("--- Candidate 2: TF-IDF + Multinomial Naive Bayes ---\n")
        f.write(f"  Accuracy:       {acc_nb:.4f}\n")
        f.write(f"  Macro Precision:{prec_nb:.4f}\n")
        f.write(f"  Macro Recall:   {rec_nb:.4f}\n")
        f.write(f"  Macro F1-Score: {f1_nb:.4f}\n\n")
        f.write("=====================================================\n")
        f.write(f"CHAMPION MODEL SELECTED: {champion_name}\n")
        f.write(f"Selection Criterion: Highest Macro F1-Score ({champion_metrics['macro_f1']:.4f})\n")
        f.write("=====================================================\n\n")
        f.write("Champion Classification Report:\n")
        f.write(selected_report)
        f.write("\n")

    print(f"Saved metrics report to: {report_path}")
    return champion_name, champion_metrics

if __name__ == '__main__':
    train_sentiment_model()
