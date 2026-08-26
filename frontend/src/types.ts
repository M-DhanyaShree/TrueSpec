export interface Laptop {
  id: number;
  brand: string;
  model_name: string;
  cpu_name: string;
  cpu_score: number;
  gpu_name: string;
  gpu_score: number;
  ram_gb: number;
  storage_type: string;
  storage_gb: number;
  display_size: number;
  refresh_rate: number;
  battery_wh: number;
  weight_kg: number;
  price: number;
  currency: string;
  os: string;
  category: string;
  confidence_score: number;
  wilson_lower_bound?: number;
  positive_ratio?: number;
  review_count?: number;
  clean_review_count?: number;
  created_at?: string;
  avgRating?: number;
  sentimentSummary?: SentimentSummary;
}

export interface SentimentSummary {
  totalReviews: number;
  cleanReviews: number;
  flaggedReviews: number;
  positiveCount: number;
  neutralCount: number;
  negativeCount: number;
  positivePercent: number;
  neutralPercent: number;
  negativePercent: number;
}

export interface Review {
  id: number;
  laptop_id: number;
  source: string;
  review_text: string;
  rating: number;
  verified_purchase: boolean;
  is_flagged: boolean;
  sentiment_label: 'positive' | 'neutral' | 'negative' | null;
  created_at?: string;
}

export interface RecommendedLaptop extends Laptop {
  matchScore: number;
  matchPercentage: number;
  plainEnglishExplanation: string;
  pros: string[];
  tradeoffs: string[];
  specHighlights: { label: string; value: string; isStrong: boolean }[];
}

export interface RecommendationPayload {
  budgetMin?: number;
  budgetMax?: number;
  useCase: 'everyday' | 'student' | 'coding' | 'creative' | 'gaming' | 'business' | 'travel';
  priorityWeights?: {
    performance?: number;
    batteryLife?: number;
    portability?: number;
    display?: number;
    sentimentConfidence?: number;
    valueForMoney?: number;
  };
  preferredOs?: 'any' | 'macos' | 'windows';
  preferredBrands?: string[];
  minScreenSize?: number;
  maxScreenSize?: number;
}

export interface PlatformStats {
  totalLaptops: number;
  totalReviews: number;
  cleanReviews: number;
  flaggedReviews: number;
  flaggedPercentage: number;
  averageConfidenceScore: number;
  brandsCount: number;
  brands: string[];
  categories: string[];
}
