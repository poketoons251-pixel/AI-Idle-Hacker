/**
 * AI Companion Management API Routes
 * Handle companion creation, training, customization, and marketplace operations
 */
import { Router, type Request, type Response } from 'express';
import { supabase } from '../config/supabase.js';

const router = Router();

/**
 * Get user's AI companions
 * GET /api/companions
 */
router.get('/', async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user?.id;

    if (!userId) {
      res.status(401).json({ success: false, error: 'Authentication required' });
      return;
    }

    const { data: companions, error } = await supabase
      .from('ai_companions')
      .select('*')
      .eq('owner_id', userId)
      .order('level', { ascending: false });

    if (error) throw error;

    res.json({
      success: true,
      data: { companions }
    });
  } catch (error) {
    console.error('Get companions error:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch companions' });
  }
});

/**
 * Create a new AI companion
 * POST /api/companions
 */
router.post('/', async (req: Request, res: Response): Promise<void> => {
  try {
    const { name, type, personality_traits, appearance } = req.body;
    const userId = req.user?.id;

    if (!userId) {
      res.status(401).json({ success: false, error: 'Authentication required' });
      return;
    }

    if (!name || name.length < 2 || name.length > 50) {
      res.status(400).json({ success: false, error: 'Companion name must be 2-50 characters' });
      return;
    }

    if (!['hacker', 'social', 'combat', 'hybrid'].includes(type)) {
      res.status(400).json({ success: false, error: 'Invalid companion type' });
      return;
    }

    // Check companion limit (max 5 per user)
    const { data: existingCompanions } = await supabase
      .from('ai_companions')
      .select('id')
      .eq('owner_id', userId);

    if (existingCompanions && existingCompanions.length >= 5) {
      res.status(400).json({ success: false, error: 'Maximum companion limit reached (5)' });
      return;
    }

    // Generate initial skills based on type
    const initialSkills = {
      hacker: { hacking: 10, social: 5, combat: 3 },
      social: { hacking: 3, social: 10, combat: 5 },
      combat: { hacking: 5, social: 3, combat: 10 },
      hybrid: { hacking: 6, social: 6, combat: 6 }
    };

    const { data: companion, error } = await supabase
      .from('ai_companions')
      .insert({
        owner_id: userId,
        name,
        type,
        skills: initialSkills[type as keyof typeof initialSkills],
        personality_traits: personality_traits || {},
        appearance: appearance || {},
        rarity: 'common'
      })
      .select()
      .single();

    if (error) throw error;

    res.status(201).json({
      success: true,
      data: { companion }
    });
  } catch (error) {
    console.error('Create companion error:', error);
    res.status(500).json({ success: false, error: 'Failed to create companion' });
  }
});

/**
 * Train AI companion
 * POST /api/companions/:id/train
 */
router.post('/:id/train', async (req: Request, res: Response): Promise<void> => {
  try {
    const { id: companionId } = req.params;
    const { skill_type, training_duration, resources_spent } = req.body;
    const userId = req.user?.id;

    if (!userId) {
      res.status(401).json({ success: false, error: 'Authentication required' });
      return;
    }

    if (!['hacking', 'social', 'combat'].includes(skill_type)) {
      res.status(400).json({ success: false, error: 'Invalid skill type' });
      return;
    }

    if (!training_duration || training_duration < 5 || training_duration > 480) {
      res.status(400).json({ success: false, error: 'Training duration must be 5-480 minutes' });
      return;
    }

    // Verify companion ownership
    const { data: companion, error: companionError } = await supabase
      .from('ai_companions')
      .select('*')
      .eq('id', companionId)
      .eq('owner_id', userId)
      .single();

    if (companionError || !companion) {
      res.status(404).json({ success: false, error: 'Companion not found' });
      return;
    }

    // Check if companion is already training
    const { data: activeTraining } = await supabase
      .from('companion_training')
      .select('id')
      .eq('companion_id', companionId)
      .is('completed_at', null)
      .single();

    if (activeTraining) {
      res.status(400).json({ success: false, error: 'Companion is already training' });
      return;
    }

    // Calculate experience gain based on duration and resources
    const baseExp = Math.floor(training_duration / 10);
    const resourceBonus: number = Object.values(resources_spent || {}).reduce((sum: number, val: any) => sum + (Number(val) || 0), 0) as number;
    const experienceGained = baseExp + Math.floor(resourceBonus / 100);

    // Create training session
    const { data: training, error: trainingError } = await supabase
      .from('companion_training')
      .insert({
        companion_id: companionId,
        skill_type,
        training_duration,
        resources_spent: resources_spent || {},
        experience_gained: experienceGained,
        completed_at: new Date(Date.now() + training_duration * 60000).toISOString()
      })
      .select()
      .single();

    if (trainingError) throw trainingError;

    // Update companion's last trained timestamp
    const { error: updateError } = await supabase
      .from('ai_companions')
      .update({ last_trained: new Date().toISOString() })
      .eq('id', companionId);

    if (updateError) throw updateError;

    res.json({
      success: true,
      data: {
        training_id: training.id,
        skill_type,
        duration_minutes: training_duration,
        experience_gained: experienceGained,
        completion_time: training.completed_at
      }
    });
  } catch (error) {
    console.error('Train companion error:', error);
    res.status(500).json({ success: false, error: 'Failed to start training' });
  }
});

/**
 * Customize AI companion
 * PUT /api/companions/:id/customize
 */
router.put('/:id/customize', async (req: Request, res: Response): Promise<void> => {
  try {
    const { id: companionId } = req.params;
    const { name, personality_traits, appearance } = req.body;
    const userId = req.user?.id;

    if (!userId) {
      res.status(401).json({ success: false, error: 'Authentication required' });
      return;
    }

    // Verify companion ownership
    const { data: companion, error: companionError } = await supabase
      .from('ai_companions')
      .select('*')
      .eq('id', companionId)
      .eq('owner_id', userId)
      .single();

    if (companionError || !companion) {
      res.status(404).json({ success: false, error: 'Companion not found' });
      return;
    }

    // Prepare update data
    const updateData: any = {};
    if (name && name.length >= 2 && name.length <= 50) {
      updateData.name = name;
    }
    if (personality_traits) {
      updateData.personality_traits = { ...companion.personality_traits, ...personality_traits };
    }
    if (appearance) {
      updateData.appearance = { ...companion.appearance, ...appearance };
    }

    if (Object.keys(updateData).length === 0) {
      res.status(400).json({ success: false, error: 'No valid customization data provided' });
      return;
    }

    // Update companion
    const { data: updatedCompanion, error } = await supabase
      .from('ai_companions')
      .update(updateData)
      .eq('id', companionId)
      .select()
      .single();

    if (error) throw error;

    res.json({
      success: true,
      data: { companion: updatedCompanion }
    });
  } catch (error) {
    console.error('Customize companion error:', error);
    res.status(500).json({ success: false, error: 'Failed to customize companion' });
  }
});

/**
 * Get companion marketplace listings
 * GET /api/marketplace/companions
 */
router.get('/marketplace', async (req: Request, res: Response): Promise<void> => {
  try {
    const { rarity, skill_level, price_range, sort_by = 'created_at', page = 1, limit = 20 } = req.query;
    const offset = (Number(page) - 1) * Number(limit);

    let query = supabase
      .from('marketplace_listings')
      .select(`
        id,
        price,
        currency_type,
        created_at,
        ai_companions (
          id,
          name,
          type,
          level,
          skills,
          rarity,
          appearance
        ),
        users!seller_id (
          id,
          username
        )
      `)
      .eq('status', 'active')
      .order(sort_by as string, { ascending: sort_by === 'price' })
      .range(offset, offset + Number(limit) - 1);

    // Apply filters
    if (rarity) {
      query = query.eq('ai_companions.rarity', rarity);
    }

    if (skill_level) {
      // This would need a more complex query in practice
      // For now, we'll filter after fetching
    }

    if (price_range) {
      const [min, max] = (price_range as string).split('-').map(Number);
      if (min) query = query.gte('price', min);
      if (max) query = query.lte('price', max);
    }

    const { data: listings, error } = await query;

    if (error) throw error;

    res.json({
      success: true,
      data: {
        listings,
        pagination: {
          page: Number(page),
          limit: Number(limit)
        }
      }
    });
  } catch (error) {
    console.error('Get marketplace error:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch marketplace listings' });
  }
});

/**
 * List companion on marketplace
 * POST /api/marketplace/list
 */
router.post('/marketplace/list', async (req: Request, res: Response): Promise<void> => {
  try {
    const { companion_id, price, currency_type = 'credits' } = req.body;
    const userId = req.user?.id;

    if (!userId) {
      res.status(401).json({ success: false, error: 'Authentication required' });
      return;
    }

    if (!companion_id || !price || price <= 0) {
      res.status(400).json({ success: false, error: 'Valid companion ID and price required' });
      return;
    }

    // Verify companion ownership and tradeable status
    const { data: companion, error: companionError } = await supabase
      .from('ai_companions')
      .select('*')
      .eq('id', companion_id)
      .eq('owner_id', userId)
      .eq('is_tradeable', true)
      .single();

    if (companionError || !companion) {
      res.status(404).json({ success: false, error: 'Companion not found or not tradeable' });
      return;
    }

    // Check if companion is already listed
    const { data: existingListing } = await supabase
      .from('marketplace_listings')
      .select('id')
      .eq('companion_id', companion_id)
      .eq('status', 'active')
      .single();

    if (existingListing) {
      res.status(400).json({ success: false, error: 'Companion is already listed' });
      return;
    }

    // Create marketplace listing
    const { data: listing, error } = await supabase
      .from('marketplace_listings')
      .insert({
        companion_id,
        seller_id: userId,
        price,
        currency_type
      })
      .select()
      .single();

    if (error) throw error;

    res.status(201).json({
      success: true,
      data: { listing }
    });
  } catch (error) {
    console.error('List companion error:', error);
    res.status(500).json({ success: false, error: 'Failed to list companion' });
  }
});

/**
 * Purchase companion from marketplace
 * POST /api/marketplace/:id/purchase
 */
router.post('/marketplace/:id/purchase', async (req: Request, res: Response): Promise<void> => {
  try {
    const { id: listingId } = req.params;
    const userId = req.user?.id;

    if (!userId) {
      res.status(401).json({ success: false, error: 'Authentication required' });
      return;
    }

    // Get listing details
    const { data: listing, error: listingError } = await supabase
      .from('marketplace_listings')
      .select(`
        *,
        ai_companions (*)
      `)
      .eq('id', listingId)
      .eq('status', 'active')
      .single();

    if (listingError || !listing) {
      res.status(404).json({ success: false, error: 'Listing not found' });
      return;
    }

    if (listing.seller_id === userId) {
      res.status(400).json({ success: false, error: 'Cannot purchase your own companion' });
      return;
    }

    // Check buyer's companion limit
    const { data: buyerCompanions } = await supabase
      .from('ai_companions')
      .select('id')
      .eq('owner_id', userId);

    if (buyerCompanions && buyerCompanions.length >= 5) {
      res.status(400).json({ success: false, error: 'Maximum companion limit reached (5)' });
      return;
    }

    // TODO: Implement currency/credits check and deduction
    // For now, we'll assume the purchase is valid

    // Transfer companion ownership
    const { error: transferError } = await supabase
      .from('ai_companions')
      .update({ owner_id: userId })
      .eq('id', listing.companion_id);

    if (transferError) throw transferError;

    // Update listing status
    const { error: updateError } = await supabase
      .from('marketplace_listings')
      .update({
        status: 'sold',
        buyer_id: userId,
        sold_at: new Date().toISOString()
      })
      .eq('id', listingId);

    if (updateError) throw updateError;

    res.json({
      success: true,
      data: {
        companion: listing.ai_companions,
        price: listing.price,
        currency_type: listing.currency_type,
        status: 'purchased'
      }
    });
  } catch (error) {
    console.error('Purchase companion error:', error);
    res.status(500).json({ success: false, error: 'Failed to purchase companion' });
  }
});

export default router;