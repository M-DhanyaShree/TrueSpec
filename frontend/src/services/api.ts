import { Laptop, Review, RecommendedLaptop, RecommendationPayload, PlatformStats } from '../types';

const API_BASE = '/api';

export async function fetchLaptops(params?: {
  brand?: string;
  category?: string;
  minPrice?: number;
  maxPrice?: number;
  search?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  page?: number;
  limit?: number;
}): Promise<{ data: Laptop[]; pagination: { page: number; limit: number; total: number; totalPages: number } }> {
  const query = new URLSearchParams();
  if (params?.brand && params.brand !== 'all') query.set('brand', params.brand);
  if (params?.category && params.category !== 'all') query.set('category', params.category);
  if (params?.minPrice != null) query.set('minPrice', params.minPrice.toString());
  if (params?.maxPrice != null) query.set('maxPrice', params.maxPrice.toString());
  if (params?.search) query.set('search', params.search);
  if (params?.sortBy) query.set('sortBy', params.sortBy);
  if (params?.sortOrder) query.set('sortOrder', params.sortOrder);
  if (params?.page) query.set('page', params.page.toString());
  if (params?.limit) query.set('limit', params.limit.toString());

  const res = await fetch(`${API_BASE}/laptops?${query.toString()}`);
  if (!res.ok) {
    throw new Error(`Failed to fetch laptops (HTTP ${res.status})`);
  }
  return res.json();
}

export async function fetchLaptopDetail(id: number | string): Promise<Laptop> {
  const res = await fetch(`${API_BASE}/laptops/${id}`);
  if (!res.ok) {
    throw new Error(`Laptop not found (HTTP ${res.status})`);
  }
  const json = await res.json();
  return json.data;
}

export async function fetchLaptopReviews(
  id: number | string,
  params?: { page?: number; limit?: number; filter?: string }
): Promise<{ data: Review[]; pagination: { page: number; limit: number; total: number; totalPages: number } }> {
  const query = new URLSearchParams();
  if (params?.page) query.set('page', params.page.toString());
  if (params?.limit) query.set('limit', params.limit.toString());
  if (params?.filter) query.set('filter', params.filter);

  const res = await fetch(`${API_BASE}/laptops/${id}/reviews?${query.toString()}`);
  if (!res.ok) {
    throw new Error(`Failed to fetch reviews (HTTP ${res.status})`);
  }
  return res.json();
}

export async function fetchLaptopComparison(ids: (number | string)[]): Promise<{ data: Laptop[]; comparedCount: number }> {
  const query = new URLSearchParams({ ids: ids.join(',') });
  const res = await fetch(`${API_BASE}/laptops/compare?${query.toString()}`);
  if (!res.ok) {
    throw new Error(`Failed to compare laptops (HTTP ${res.status})`);
  }
  return res.json();
}

export async function getRecommendations(payload: RecommendationPayload): Promise<{
  query: RecommendationPayload;
  totalMatched: number;
  recommendations: RecommendedLaptop[];
}> {
  const res = await fetch(`${API_BASE}/recommendations`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || `Failed to generate recommendations (HTTP ${res.status})`);
  }
  return res.json();
}

export async function fetchPlatformStats(): Promise<PlatformStats> {
  const res = await fetch(`${API_BASE}/stats/overview`);
  if (!res.ok) {
    throw new Error(`Failed to fetch platform stats (HTTP ${res.status})`);
  }
  const json = await res.json();
  return json.data;
}
