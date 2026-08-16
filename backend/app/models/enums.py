from enum import Enum


class UsageRole(str, Enum):
    student = "student"
    developer = "developer"
    creator = "creator"
    business = "business"
    gaming = "gaming"
    general = "general"


class ReviewSource(str, Enum):
    seed = "seed"
    reddit = "reddit"
    youtube = "youtube"
    manufacturer = "manufacturer"


class ConfidenceLabel(str, Enum):
    high = "high"
    medium = "medium"
    low = "low"


class RecommendationStatus(str, Enum):
    spec_only = "spec_only"
    with_reviews = "with_reviews"
