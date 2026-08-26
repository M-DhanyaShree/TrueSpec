import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { getDb } from '../db';
import { computeRecommendations, RecommendationRequest } from '../services/recommendationEngine';
import { exec } from 'child_process';
import path from 'path';

const router = Router();

// 1. GET /api/laptops — List + Filter + Sort + Pagination
router.get('/', async (req: Request, res: Response) => {
  try {
    const db = await getDb();
    const {
      brand,
      category,
      minPrice,
      maxPrice,
      search,
      sortBy = 'confidence_score',
      sortOrder = 'desc',
      page = '1',
      limit = '20'
    } = req.query;

    const pageNum = Math.max(1, parseInt(page as string, 10) || 1);
    const limitNum = Math.min(100, Math.max(1, parseInt(limit as string, 10) || 20));
    const offset = (pageNum - 1) * limitNum;

    let query = db('laptops')
      .leftJoin('laptop_scores', 'laptops.id', 'laptop_scores.laptop_id')
      .select(
        'laptops.*',
        'laptop_scores.confidence_score',
        'laptop_scores.wilson_lower_bound',
        'laptop_scores.positive_ratio',
        'laptop_scores.review_count',
        'laptop_scores.clean_review_count'
      );

    if (brand && brand !== 'all') {
      query = query.where('laptops.brand', brand as string);
    }

    if (category && category !== 'all') {
      query = query.where('laptops.category', category as string);
    }

    if (minPrice) {
      query = query.where('laptops.price', '>=', parseFloat(minPrice as string));
    }

    if (maxPrice) {
      query = query.where('laptops.price', '<=', parseFloat(maxPrice as string));
    }

    if (search) {
      const s = `%${search}%`;
      query = query.where((builder) => {
        builder.where('laptops.model_name', 'like', s)
          .orWhere('laptops.brand', 'like', s)
          .orWhere('laptops.cpu_name', 'like', s)
          .orWhere('laptops.gpu_name', 'like', s);
      });
    }

    // Clone for total count
    const countQuery = query.clone().clearSelect().count<{ total: number }>('laptops.id as total').first();
    const countResult = await countQuery;
    const total = countResult ? Number(countResult.total) : 0;

    // Sorting
    const validSortFields: Record<string, string> = {
      price: 'laptops.price',
      confidence_score: 'laptop_scores.confidence_score',
      battery_wh: 'laptops.battery_wh',
      weight_kg: 'laptops.weight_kg',
      cpu_score: 'laptops.cpu_score',
      created_at: 'laptops.created_at'
    };

    const sortColumn = validSortFields[sortBy as string] || 'laptop_scores.confidence_score';
    const order = (sortOrder as string).toLowerCase() === 'asc' ? 'asc' : 'desc';

    const laptops = await query
      .orderBy(sortColumn, order)
      .limit(limitNum)
      .offset(offset);

    res.json({
      data: laptops.map(l => ({
        ...l,
        confidence_score: l.confidence_score != null ? Number(l.confidence_score) : 50.0,
        positive_ratio: l.positive_ratio != null ? Number(l.positive_ratio) : 0.0,
        review_count: l.review_count != null ? Number(l.review_count) : 0,
        clean_review_count: l.clean_review_count != null ? Number(l.clean_review_count) : 0
      })),
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        totalPages: Math.ceil(total / limitNum)
      }
    });
  } catch (err: any) {
    console.error('Error fetching laptops:', err);
    res.status(500).json({ error: 'Failed to fetch laptops', details: err.message });
  }
});

// 2. GET /api/laptops/compare — Compare 2-4 laptops by ?ids=1,2,3
router.get('/compare', async (req: Request, res: Response) => {
  try {
    const { ids } = req.query;
    if (!ids) {
      return res.status(400).json({ error: 'Please provide comma-separated laptop ids via ?ids=1,2,3' });
    }

    const idList = (ids as string)
      .split(',')
      .map(id => parseInt(id.trim(), 10))
      .filter(id => !isNaN(id) && id > 0)
      .slice(0, 4);

    if (idList.length < 2) {
      return res.status(400).json({ error: 'Comparison requires at least 2 valid laptop IDs (max 4).' });
    }

    const db = await getDb();
    const laptops = await db('laptops')
      .leftJoin('laptop_scores', 'laptops.id', 'laptop_scores.laptop_id')
      .whereIn('laptops.id', idList)
      .select(
        'laptops.*',
        'laptop_scores.confidence_score',
        'laptop_scores.wilson_lower_bound',
        'laptop_scores.positive_ratio',
        'laptop_scores.review_count',
        'laptop_scores.clean_review_count'
      );

    if (laptops.length === 0) {
      return res.status(404).json({ error: 'None of the specified laptops were found.' });
    }

    // Sentiment breakdown for each compared laptop
    const reviews = await db('reviews')
      .whereIn('laptop_id', idList)
      .select('laptop_id', 'sentiment_label', 'is_flagged');

    const laptopsWithDetails = laptops.map(lap => {
      const lapReviews = reviews.filter(r => r.laptop_id === lap.id);
      const positiveCount = lapReviews.filter(r => !r.is_flagged && r.sentiment_label === 'positive').length;
      const neutralCount = lapReviews.filter(r => !r.is_flagged && r.sentiment_label === 'neutral').length;
      const negativeCount = lapReviews.filter(r => !r.is_flagged && r.sentiment_label === 'negative').length;
      const flaggedCount = lapReviews.filter(r => r.is_flagged).length;

      return {
        ...lap,
        sentimentBreakdown: {
          positive: positiveCount,
          neutral: neutralCount,
          negative: negativeCount,
          flagged: flaggedCount,
          cleanTotal: positiveCount + neutralCount + negativeCount
        }
      };
    });

    res.json({
      data: laptopsWithDetails,
      comparedCount: laptopsWithDetails.length
    });
  } catch (err: any) {
    console.error('Error comparing laptops:', err);
    res.status(500).json({ error: 'Failed to compare laptops', details: err.message });
  }
});

// 3. GET /api/laptops/:id — Full Laptop Detail
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) {
      return res.status(400).json({ error: 'Invalid laptop ID' });
    }

    const db = await getDb();
    const laptop = await db('laptops')
      .leftJoin('laptop_scores', 'laptops.id', 'laptop_scores.laptop_id')
      .where('laptops.id', id)
      .select(
        'laptops.*',
        'laptop_scores.confidence_score',
        'laptop_scores.wilson_lower_bound',
        'laptop_scores.positive_ratio',
        'laptop_scores.review_count',
        'laptop_scores.clean_review_count'
      )
      .first();

    if (!laptop) {
      return res.status(404).json({ error: `Laptop with ID ${id} not found` });
    }

    // Aggregate sentiment stats
    const reviewStats = await db('reviews')
      .where('laptop_id', id)
      .select('sentiment_label', 'is_flagged', 'rating');

    const totalRevs = reviewStats.length;
    const cleanRevs = reviewStats.filter(r => !r.is_flagged);
    const positiveCount = cleanRevs.filter(r => r.sentiment_label === 'positive').length;
    const neutralCount = cleanRevs.filter(r => r.sentiment_label === 'neutral').length;
    const negativeCount = cleanRevs.filter(r => r.sentiment_label === 'negative').length;
    const flaggedCount = reviewStats.filter(r => r.is_flagged).length;

    const avgRating = totalRevs > 0
      ? (reviewStats.reduce((acc, r) => acc + (Number(r.rating) || 0), 0) / totalRevs).toFixed(1)
      : '0.0';

    res.json({
      data: {
        ...laptop,
        avgRating: Number(avgRating),
        sentimentSummary: {
          totalReviews: totalRevs,
          cleanReviews: cleanRevs.length,
          flaggedReviews: flaggedCount,
          positiveCount,
          neutralCount,
          negativeCount,
          positivePercent: cleanRevs.length > 0 ? Math.round((positiveCount / cleanRevs.length) * 100) : 0,
          neutralPercent: cleanRevs.length > 0 ? Math.round((neutralCount / cleanRevs.length) * 100) : 0,
          negativePercent: cleanRevs.length > 0 ? Math.round((negativeCount / cleanRevs.length) * 100) : 0,
        }
      }
    });
  } catch (err: any) {
    console.error('Error fetching laptop detail:', err);
    res.status(500).json({ error: 'Failed to fetch laptop details', details: err.message });
  }
});

// 4. GET /api/laptops/:id/reviews — Paginated reviews (showing flagged reviews with visible badge)
router.get('/:id/reviews', async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) {
      return res.status(400).json({ error: 'Invalid laptop ID' });
    }

    const { page = '1', limit = '10', filter = 'all' } = req.query;
    const pageNum = Math.max(1, parseInt(page as string, 10) || 1);
    const limitNum = Math.min(50, Math.max(1, parseInt(limit as string, 10) || 10));
    const offset = (pageNum - 1) * limitNum;

    const db = await getDb();

    let query = db('reviews').where('laptop_id', id);

    if (filter === 'clean') {
      query = query.where('is_flagged', false);
    } else if (filter === 'flagged') {
      query = query.where('is_flagged', true);
    } else if (filter === 'positive' || filter === 'negative' || filter === 'neutral') {
      query = query.where('sentiment_label', filter).where('is_flagged', false);
    }

    const countQuery = query.clone().count<{ total: number }>('id as total').first();
    const countRes = await countQuery;
    const total = countRes ? Number(countRes.total) : 0;

    const reviews = await query
      .orderBy('id', 'asc')
      .limit(limitNum)
      .offset(offset);

    res.json({
      data: reviews.map(r => ({
        id: r.id,
        laptop_id: r.laptop_id,
        source: r.source,
        review_text: r.review_text,
        rating: r.rating,
        verified_purchase: Boolean(r.verified_purchase),
        is_flagged: Boolean(r.is_flagged),
        sentiment_label: r.sentiment_label,
        created_at: r.created_at
      })),
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        totalPages: Math.ceil(total / limitNum)
      }
    });
  } catch (err: any) {
    console.error('Error fetching reviews:', err);
    res.status(500).json({ error: 'Failed to fetch reviews', details: err.message });
  }
});

// 5. POST /api/recommendations — Recommendation engine validation & execution
const recommendationSchema = z.object({
  budgetMin: z.number().nonnegative().optional(),
  budgetMax: z.number().positive().optional(),
  useCase: z.enum(['everyday', 'student', 'coding', 'creative', 'gaming', 'business', 'travel']),
  priorityWeights: z.object({
    performance: z.number().min(1).max(5).optional(),
    batteryLife: z.number().min(1).max(5).optional(),
    portability: z.number().min(1).max(5).optional(),
    display: z.number().min(1).max(5).optional(),
    sentimentConfidence: z.number().min(1).max(5).optional(),
    valueForMoney: z.number().min(1).max(5).optional(),
  }).optional(),
  preferredOs: z.enum(['any', 'macos', 'windows']).optional(),
  preferredBrands: z.array(z.string()).optional(),
  minScreenSize: z.number().optional(),
  maxScreenSize: z.number().optional(),
});

router.post('/recommendations', async (req: Request, res: Response) => {
  try {
    const parseResult = recommendationSchema.safeParse(req.body);
    if (!parseResult.success) {
      return res.status(400).json({
        error: 'Invalid recommendation request parameters',
        details: parseResult.error.errors.map(e => ({ field: e.path.join('.'), message: e.message }))
      });
    }

    const payload: RecommendationRequest = parseResult.data;
    const db = await getDb();

    const laptops = await db('laptops')
      .leftJoin('laptop_scores', 'laptops.id', 'laptop_scores.laptop_id')
      .select(
        'laptops.*',
        'laptop_scores.confidence_score',
        'laptop_scores.wilson_lower_bound',
        'laptop_scores.positive_ratio',
        'laptop_scores.review_count',
        'laptop_scores.clean_review_count'
      );

    if (!laptops || laptops.length === 0) {
      return res.status(404).json({
        error: 'No laptops found in database. Please run ingestion first.'
      });
    }

    const recommendations = computeRecommendations(laptops, payload);

    res.json({
      query: payload,
      totalMatched: recommendations.length,
      recommendations: recommendations.slice(0, 10) // Top 10 matches
    });
  } catch (err: any) {
    console.error('Error generating recommendations:', err);
    res.status(500).json({ error: 'Failed to compute recommendations', details: err.message });
  }
});

// 6. POST /api/admin/seed — Triggers ML ingestion glue
router.post('/admin/seed', async (req: Request, res: Response) => {
  try {
    console.log('[TrueSpec Admin] Triggering ML ingestion pipeline...');
    const pythonScript = path.resolve(__dirname, '../../../ml/pipeline.py');
    const projectRoot = path.resolve(__dirname, '../../../');

    exec(`PYTHONPATH=. python3 ml/pipeline.py`, { cwd: projectRoot }, (error, stdout, stderr) => {
      if (error) {
        console.error('[TrueSpec Admin] Pipeline execution error:', stderr);
        return res.status(500).json({
          success: false,
          error: 'ML pipeline execution failed',
          details: stderr || error.message
        });
      }

      console.log('[TrueSpec Admin] Pipeline stdout:\n', stdout);
      return res.json({
        success: true,
        message: 'Successfully executed ML ingestion & scoring pipeline!',
        output: stdout
      });
    });
  } catch (err: any) {
    console.error('Error running admin seed:', err);
    res.status(500).json({ error: 'Internal server error running seed', details: err.message });
  }
});

// 7. GET /api/stats — Platform Statistics
router.get('/stats/overview', async (req: Request, res: Response) => {
  try {
    const db = await getDb();

    const laptopCountRes = await db('laptops').count<{ total: number }>('id as total').first();
    const reviewCountRes = await db('reviews').count<{ total: number }>('id as total').first();
    const flaggedCountRes = await db('reviews').where('is_flagged', true).count<{ total: number }>('id as total').first();
    const avgConfidenceRes = await db('laptop_scores').avg<{ avg: number }>('confidence_score as avg').first();

    const brandsRes = await db('laptops').distinct('brand').select('brand');
    const categoriesRes = await db('laptops').distinct('category').select('category');

    const totalLaptops = laptopCountRes ? Number(laptopCountRes.total) : 0;
    const totalReviews = reviewCountRes ? Number(reviewCountRes.total) : 0;
    const flaggedReviews = flaggedCountRes ? Number(flaggedCountRes.total) : 0;
    const cleanReviews = totalReviews - flaggedReviews;
    const avgConfidence = avgConfidenceRes && avgConfidenceRes.avg ? Number(Number(avgConfidenceRes.avg).toFixed(1)) : 0;

    res.json({
      data: {
        totalLaptops,
        totalReviews,
        cleanReviews,
        flaggedReviews,
        flaggedPercentage: totalReviews > 0 ? Number(((flaggedReviews / totalReviews) * 100).toFixed(1)) : 0,
        averageConfidenceScore: avgConfidence,
        brandsCount: brandsRes.length,
        brands: brandsRes.map(b => b.brand),
        categories: categoriesRes.map(c => c.category)
      }
    });
  } catch (err: any) {
    console.error('Error fetching stats overview:', err);
    res.status(500).json({ error: 'Failed to fetch platform stats', details: err.message });
  }
});

export default router;
