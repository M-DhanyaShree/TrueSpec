import request from 'supertest';
import { createApp } from '../src/app';
import { computeRecommendations, LaptopRecord, RecommendationRequest } from '../src/services/recommendationEngine';

describe('TrueSpec Recommendation Engine Unit Tests', () => {
  const sampleLaptops: LaptopRecord[] = [
    {
      id: 1,
      brand: 'Apple',
      model_name: 'MacBook Air M3',
      cpu_name: 'Apple M3 8-Core',
      cpu_score: 80,
      gpu_name: 'Apple M3 10-Core GPU',
      gpu_score: 65,
      ram_gb: 16,
      storage_type: 'SSD',
      storage_gb: 512,
      display_size: 13.6,
      refresh_rate: 60,
      battery_wh: 52.6,
      weight_kg: 1.24,
      price: 1099,
      currency: 'USD',
      os: 'macOS',
      category: 'Productivity',
      confidence_score: 88.5,
      clean_review_count: 40
    },
    {
      id: 2,
      brand: 'Lenovo',
      model_name: 'Legion Pro 7i',
      cpu_name: 'Intel Core i9-13900HX',
      cpu_score: 95,
      gpu_name: 'NVIDIA GeForce RTX 4080',
      gpu_score: 95,
      ram_gb: 32,
      storage_type: 'SSD',
      storage_gb: 1024,
      display_size: 16.0,
      refresh_rate: 240,
      battery_wh: 99.9,
      weight_kg: 2.8,
      price: 2399,
      currency: 'USD',
      os: 'Windows 11',
      category: 'Gaming',
      confidence_score: 91.2,
      clean_review_count: 35
    },
    {
      id: 3,
      brand: 'Acer',
      model_name: 'Aspire 5',
      cpu_name: 'AMD Ryzen 5 7520U',
      cpu_score: 45,
      gpu_name: 'AMD Radeon 610M',
      gpu_score: 25,
      ram_gb: 8,
      storage_type: 'SSD',
      storage_gb: 512,
      display_size: 15.6,
      refresh_rate: 60,
      battery_wh: 50.0,
      weight_kg: 1.75,
      price: 499,
      currency: 'USD',
      os: 'Windows 11',
      category: 'Budget',
      confidence_score: 62.0,
      clean_review_count: 20
    }
  ];

  test('Gaming use case prioritizes high GPU and high refresh rate machine', () => {
    const req: RecommendationRequest = {
      useCase: 'gaming',
      budgetMax: 3000,
      priorityWeights: {
        performance: 5,
        batteryLife: 1,
        portability: 1,
        display: 5,
        sentimentConfidence: 4,
        valueForMoney: 2
      }
    };

    const results = computeRecommendations(sampleLaptops, req);
    expect(results.length).toBeGreaterThan(0);
    expect(results[0].model_name).toBe('Legion Pro 7i');
    expect(results[0].pros.length).toBeGreaterThan(0);
    expect(results[0].plainEnglishExplanation).toContain('TrueSpec recommends');
  });

  test('Travel / Student use case prioritizes lightweight frame and battery life', () => {
    const req: RecommendationRequest = {
      useCase: 'student',
      budgetMax: 1500,
      priorityWeights: {
        performance: 3,
        batteryLife: 5,
        portability: 5,
        display: 3,
        sentimentConfidence: 4,
        valueForMoney: 4
      }
    };

    const results = computeRecommendations(sampleLaptops, req);
    expect(results[0].model_name).toBe('MacBook Air M3');
    expect(results[0].weight_kg).toBeLessThan(1.5);
  });

  test('Generates clear plain-English explanation without raw jargon', () => {
    const req: RecommendationRequest = {
      useCase: 'everyday',
      budgetMax: 1200
    };

    const results = computeRecommendations(sampleLaptops, req);
    const top = results[0];
    expect(top.plainEnglishExplanation).toBeDefined();
    expect(typeof top.plainEnglishExplanation).toBe('string');
    expect(top.plainEnglishExplanation.length).toBeGreaterThan(30);
    expect(top.tradeoffs).toBeDefined();
  });
});

describe('POST /api/recommendations API Validation Tests', () => {
  const app = createApp();

  test('Rejects invalid useCase with 400 Bad Request and validation details', async () => {
    const response = await request(app)
      .post('/api/recommendations')
      .send({
        useCase: 'invalid_case_123',
        budgetMax: 1500
      });

    expect(response.status).toBe(400);
    expect(response.body.error).toContain('Invalid recommendation request');
  });

  test('Rejects out-of-range priority weights (>5)', async () => {
    const response = await request(app)
      .post('/api/recommendations')
      .send({
        useCase: 'coding',
        priorityWeights: {
          performance: 99
        }
      });

    expect(response.status).toBe(400);
  });

  test('Accepts valid payload with correct schema structure', async () => {
    const response = await request(app)
      .post('/api/recommendations')
      .send({
        useCase: 'coding',
        budgetMin: 800,
        budgetMax: 2000,
        priorityWeights: {
          performance: 4,
          batteryLife: 4,
          portability: 3,
          sentimentConfidence: 5
        },
        preferredOs: 'any'
      });

    // In SQLite fallback or MySQL with seeded database, response is 200
    expect([200, 404]).toContain(response.status);
    if (response.status === 200) {
      expect(response.body.recommendations).toBeInstanceOf(Array);
    }
  });
});
