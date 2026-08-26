"""
TrueSpec ML Unit Tests (pytest)
Verifies:
1. Fake review heuristic detection (2-or-more threshold, single heuristic non-flagging, verified_purchase default safety)
2. Wilson score interval lower bound calculation (small sample vs large sample confidence dampening)
3. Volume and cleanliness confidence scoring scaling
"""
import pytest
from ml.ingest_reviews import evaluate_fake_heuristics
from ml.score_reviews_and_laptops import calculate_wilson_lower_bound, compute_confidence_score

class TestFakeReviewHeuristics:
    def test_single_heuristic_does_not_flag(self):
        """A review triggering only 1 heuristic should NOT be flagged (threshold is >= 2)."""
        # Case A: Only short text (< 20 words), normal punctuation, verified, unique
        short_text = "Really good laptop for college students and everyday work."
        assert len(short_text.split()) < 20
        is_flagged, reasons = evaluate_fake_heuristics(
            review_text=short_text,
            dup_count_for_laptop=1,
            verified_purchase=True
        )
        assert not is_flagged
        assert len(reasons) == 1
        assert "Short review" in reasons[0]

        # Case B: Long review with excessive exclamation marks only
        long_punct = "I have used this laptop for three full weeks for coding and video editing and I really love the screen resolution and battery life very much!!!!!!!!!"
        assert len(long_punct.split()) >= 20
        is_flagged, reasons = evaluate_fake_heuristics(
            review_text=long_punct,
            dup_count_for_laptop=1,
            verified_purchase=True
        )
        assert not is_flagged
        assert len(reasons) == 1

    def test_verified_purchase_true_default_does_not_cause_flagging(self):
        """
        Crucial test: Proves that setting verified_purchase=True by default does not add
        an artificial penalty, keeping legitimate short reviews from being falsely flagged.
        """
        legit_short = "Great lightweight laptop for daily commuting and taking notes."
        # With verified_purchase=True, only short text fires -> NOT flagged
        is_flagged_v_true, reasons_v_true = evaluate_fake_heuristics(
            review_text=legit_short,
            dup_count_for_laptop=1,
            verified_purchase=True
        )
        assert not is_flagged_v_true
        assert len(reasons_v_true) == 1

        # Note: If verified_purchase had erroneously defaulted to False:
        is_flagged_v_false, reasons_v_false = evaluate_fake_heuristics(
            review_text=legit_short,
            dup_count_for_laptop=1,
            verified_purchase=False
        )
        assert is_flagged_v_false # 2 heuristics would have fired!
        assert len(reasons_v_false) == 2

    def test_two_or_more_heuristics_triggers_flag(self):
        """When 2 or more heuristics trigger, the review MUST be flagged."""
        # Case A: Short (<20 words) + Spam Link
        spam_text = "Get 50% discount at http://laptop-deals.com/promo right now!"
        is_flagged, reasons = evaluate_fake_heuristics(
            review_text=spam_text,
            dup_count_for_laptop=1,
            verified_purchase=True
        )
        assert is_flagged
        assert len(reasons) >= 2

        # Case B: All uppercase + Excessive punctuation
        shouting_text = "THIS IS THE WORST JUNK EVER DO NOT BUY THIS AT ALL IT BROKE IN ONE DAY!!!!!!!"
        is_flagged, reasons = evaluate_fake_heuristics(
            review_text=shouting_text,
            dup_count_for_laptop=1,
            verified_purchase=True
        )
        assert is_flagged
        assert len(reasons) >= 2

        # Case C: Duplicate text + Short text
        dup_text = "Good laptop for office."
        is_flagged, reasons = evaluate_fake_heuristics(
            review_text=dup_text,
            dup_count_for_laptop=3, # Duplicate detected
            verified_purchase=True
        )
        assert is_flagged
        assert "Duplicate review" in str(reasons)
        assert "Short review" in str(reasons)


class TestWilsonScoreAndConfidence:
    def test_small_sample_scores_lower_than_large_sample(self):
        """
        Key algorithmic guarantee:
        Laptop A with 2 out of 2 positive reviews (100% raw positive)
        MUST score lower on Wilson lower bound than Laptop B with 180 out of 200 positive reviews (90% raw positive).
        """
        wilson_small = calculate_wilson_lower_bound(positives=2, total=2, z=1.96)
        wilson_large = calculate_wilson_lower_bound(positives=180, total=200, z=1.96)

        # 2/2 Wilson 95% lower bound is ~0.342
        # 180/200 Wilson 95% lower bound is ~0.850
        assert wilson_small < wilson_large
        assert wilson_small < 0.40
        assert wilson_large > 0.80

        # Confidence scores should also reflect this
        conf_small = compute_confidence_score(wilson_small, clean_count=2, flagged_count=0)
        conf_large = compute_confidence_score(wilson_large, clean_count=200, flagged_count=0)
        assert conf_small < conf_large

    def test_zero_and_boundary_cases(self):
        """Verifies Wilson lower bound on empty, all-negative, and all-positive datasets."""
        # 0 total reviews
        assert calculate_wilson_lower_bound(0, 0) == 0.0
        assert compute_confidence_score(0.0, 0, 0) == 0.0

        # 0 positive out of 50
        wilson_zero_pos = calculate_wilson_lower_bound(0, 50)
        assert wilson_zero_pos == 0.0

        # Large sample 100% positive (e.g. 500/500)
        wilson_huge_pos = calculate_wilson_lower_bound(500, 500)
        assert wilson_huge_pos > 0.99
