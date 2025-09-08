/**
 * Marketplace API Routes
 * Handle marketplace listings, purchases, and trading
 */
import { Router, type Request, type Response } from 'express';
import { supabase } from '../config/supabase.js';

const router = Router();

/**
 * Get marketplace listings
 * GET /api/marketplace
 */
router.get('/', async (req: Request, res: Response): Promise<void> => {
  try {
    const { 
      category = 'all', 
      rarity, 
      min_price, 
      max_price, 
      search, 
      sort_by = 'created_at', 
      sort_order = 'desc',
      page = 1, 
      limit = 20 
    } = req.query;
    const offset = (Number(page) - 1) * Number(limit);

    // Build query
    let query = supabase
      .from('marketplace_listings')
      .select(`
        *,
        seller:users!seller_id(
          id,
          username,
          level
        ),
        companion:ai_companions(
          id,
          name,
          type,
          level,
          rarity,
          skills,
          personality_traits,
          appearance
        )
      `)
      .eq('status', 'active')
      .lte('expires_at', new Date().toISOString());

    // Apply filters
    if (category !== 'all') {
      query = query.eq('item_type', category);
    }

    if (rarity) {
      query = query.eq('rarity', rarity);
    }

    if (min_price) {
      query = query.gte('price', Number(min_price));
    }

    if (max_price) {
      query = query.lte('price', Number(max_price));
    }

    if (search) {
      query = query.or(`title.ilike.%${search}%,description.ilike.%${search}%`);
    }

    // Apply sorting
    const validSortFields = ['created_at', 'price', 'title', 'rarity'];
    const sortField = validSortFields.includes(sort_by as string) ? sort_by as string : 'created_at';
    const sortAscending = sort_order === 'asc';

    const { data: listings, error } = await query
      .order(sortField, { ascending: sortAscending })
      .range(offset, offset + Number(limit) - 1);

    if (error) throw error;

    res.json({
      success: true,
      data: {
        listings: listings || [],
        pagination: {
          page: Number(page),
          limit: Number(limit)
        },
        filters: {
          category,
          rarity,
          min_price,
          max_price,
          search
        }
      }
    });
  } catch (error) {
    console.error('Get marketplace listings error:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch marketplace listings' });
  }
});

/**
 * Get specific marketplace listing
 * GET /api/marketplace/:id
 */
router.get('/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    const { id: listingId } = req.params;

    const { data: listing, error } = await supabase
      .from('marketplace_listings')
      .select(`
        *,
        seller:users!seller_id(
          id,
          username,
          level,
          created_at
        ),
        companion:ai_companions(
          id,
          name,
          type,
          level,
          rarity,
          skills,
          personality_traits,
          appearance,
          training_history
        )
      `)
      .eq('id', listingId)
      .eq('status', 'active')
      .single();

    if (error || !listing) {
      res.status(404).json({ success: false, error: 'Listing not found' });
      return;
    }

    // Check if listing has expired
    if (new Date() > new Date(listing.expires_at)) {
      // Mark as expired
      await supabase
        .from('marketplace_listings')
        .update({ status: 'expired' })
        .eq('id', listingId);

      res.status(404).json({ success: false, error: 'Listing has expired' });
      return;
    }

    res.json({
      success: true,
      data: { listing }
    });
  } catch (error) {
    console.error('Get marketplace listing error:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch listing' });
  }
});

/**
 * Create marketplace listing
 * POST /api/marketplace/list
 */
router.post('/list', async (req: Request, res: Response): Promise<void> => {
  try {
    const { 
      item_type, 
      item_id, 
      title, 
      description, 
      price, 
      duration_hours = 168, // 7 days default
      rarity,
      tags 
    } = req.body;
    const userId = req.user?.id;

    if (!userId) {
      res.status(401).json({ success: false, error: 'Authentication required' });
      return;
    }

    // Validate required fields
    if (!item_type || !item_id || !title || !price) {
      res.status(400).json({ 
        success: false, 
        error: 'Item type, item ID, title, and price are required' 
      });
      return;
    }

    if (Number(price) <= 0) {
      res.status(400).json({ success: false, error: 'Price must be greater than 0' });
      return;
    }

    const validItemTypes = ['companion', 'equipment', 'resource', 'blueprint'];
    if (!validItemTypes.includes(item_type)) {
      res.status(400).json({ 
        success: false, 
        error: `Invalid item type. Must be one of: ${validItemTypes.join(', ')}` 
      });
      return;
    }

    // Verify ownership based on item type
    let ownershipCheck;
    let itemDetails;

    if (item_type === 'companion') {
      const { data: companion, error: companionError } = await supabase
        .from('ai_companions')
        .select('*')
        .eq('id', item_id)
        .eq('owner_id', userId)
        .single();

      if (companionError || !companion) {
        res.status(404).json({ success: false, error: 'Companion not found or not owned by you' });
        return;
      }

      if (!companion.tradeable) {
        res.status(400).json({ success: false, error: 'This companion is not tradeable' });
        return;
      }

      // Check if companion is already listed
      const { data: existingListing } = await supabase
        .from('marketplace_listings')
        .select('id')
        .eq('item_type', 'companion')
        .eq('item_id', item_id)
        .eq('status', 'active')
        .single();

      if (existingListing) {
        res.status(409).json({ success: false, error: 'This companion is already listed on the marketplace' });
        return;
      }

      itemDetails = companion;
      ownershipCheck = true;
    } else {
      // For other item types, implement similar ownership checks
      // TODO: Add ownership verification for equipment, resources, blueprints
      ownershipCheck = true;
      itemDetails = { name: title };
    }

    if (!ownershipCheck) {
      res.status(403).json({ success: false, error: 'You do not own this item' });
      return;
    }

    // Calculate expiration time
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + Number(duration_hours));

    // Create marketplace listing
    const { data: listing, error } = await supabase
      .from('marketplace_listings')
      .insert({
        seller_id: userId,
        item_type,
        item_id,
        title,
        description: description || '',
        price: Number(price),
        rarity: rarity || itemDetails.rarity || 'common',
        tags: tags || [],
        status: 'active',
        expires_at: expiresAt.toISOString(),
        views: 0,
        favorites: 0
      })
      .select(`
        *,
        seller:users!seller_id(
          id,
          username,
          level
        )
      `)
      .single();

    if (error) throw error;

    res.status(201).json({
      success: true,
      data: {
        listing,
        message: `${title} has been listed on the marketplace!`
      }
    });
  } catch (error) {
    console.error('Create marketplace listing error:', error);
    res.status(500).json({ success: false, error: 'Failed to create marketplace listing' });
  }
});

/**
 * Purchase marketplace item
 * POST /api/marketplace/:id/purchase
 */
router.post('/:id/purchase', async (req: Request, res: Response): Promise<void> => {
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
        seller:users!seller_id(
          id,
          username
        )
      `)
      .eq('id', listingId)
      .eq('status', 'active')
      .single();

    if (listingError || !listing) {
      res.status(404).json({ success: false, error: 'Listing not found or no longer available' });
      return;
    }

    // Check if listing has expired
    if (new Date() > new Date(listing.expires_at)) {
      await supabase
        .from('marketplace_listings')
        .update({ status: 'expired' })
        .eq('id', listingId);

      res.status(400).json({ success: false, error: 'Listing has expired' });
      return;
    }

    // Check if buyer is not the seller
    if (listing.seller_id === userId) {
      res.status(400).json({ success: false, error: 'You cannot purchase your own listing' });
      return;
    }

    // Get buyer's current currency/credits
    const { data: buyer, error: buyerError } = await supabase
      .from('users')
      .select('id, username, credits')
      .eq('id', userId)
      .single();

    if (buyerError || !buyer) {
      res.status(404).json({ success: false, error: 'Buyer not found' });
      return;
    }

    // Check if buyer has enough credits
    if ((buyer.credits || 0) < listing.price) {
      res.status(400).json({ 
        success: false, 
        error: `Insufficient credits. You need ${listing.price} credits but only have ${buyer.credits || 0}` 
      });
      return;
    }

    // Additional checks for companions
    if (listing.item_type === 'companion') {
      // Check buyer's companion limit
      const { data: buyerCompanions } = await supabase
        .from('ai_companions')
        .select('id')
        .eq('owner_id', userId);

      if (buyerCompanions && buyerCompanions.length >= 5) {
        res.status(400).json({ 
          success: false, 
          error: 'You have reached the maximum number of companions (5)' 
        });
        return;
      }
    }

    // Start transaction-like operations
    try {
      // 1. Transfer ownership of the item
      if (listing.item_type === 'companion') {
        const { error: transferError } = await supabase
          .from('ai_companions')
          .update({ 
            owner_id: userId,
            acquired_at: new Date().toISOString()
          })
          .eq('id', listing.item_id);

        if (transferError) throw transferError;
      }

      // 2. Update buyer's credits
      const { error: buyerUpdateError } = await supabase
        .from('users')
        .update({ credits: buyer.credits - listing.price })
        .eq('id', userId);

      if (buyerUpdateError) throw buyerUpdateError;

      // 3. Get seller's current credits and update
      const { data: seller, error: sellerFetchError } = await supabase
        .from('users')
        .select('credits')
        .eq('id', listing.seller_id)
        .single();

      if (sellerFetchError) throw sellerFetchError;

      const { error: sellerUpdateError } = await supabase
        .from('users')
        .update({ credits: (seller.credits || 0) + listing.price })
        .eq('id', listing.seller_id);

      if (sellerUpdateError) throw sellerUpdateError;

      // 4. Mark listing as sold
      const { error: listingUpdateError } = await supabase
        .from('marketplace_listings')
        .update({ 
          status: 'sold',
          buyer_id: userId,
          sold_at: new Date().toISOString()
        })
        .eq('id', listingId);

      if (listingUpdateError) throw listingUpdateError;

      // 5. Create transaction record (optional)
      try {
        await supabase
          .from('marketplace_transactions')
          .insert({
            listing_id: listingId,
            seller_id: listing.seller_id,
            buyer_id: userId,
            item_type: listing.item_type,
            item_id: listing.item_id,
            price: listing.price,
            transaction_type: 'purchase'
          });
      } catch {
        // Ignore if transactions table doesn't exist
      }

      res.json({
        success: true,
        data: {
          transaction: {
            item_type: listing.item_type,
            item_id: listing.item_id,
            title: listing.title,
            price: listing.price,
            seller: listing.seller.username
          },
          remaining_credits: buyer.credits - listing.price,
          message: `Successfully purchased ${listing.title}!`
        }
      });
    } catch (transactionError) {
      console.error('Purchase transaction error:', transactionError);
      res.status(500).json({ 
        success: false, 
        error: 'Purchase failed. Please try again.' 
      });
    }
  } catch (error) {
    console.error('Purchase marketplace item error:', error);
    res.status(500).json({ success: false, error: 'Failed to purchase item' });
  }
});

/**
 * Remove/cancel marketplace listing
 * DELETE /api/marketplace/:id
 */
router.delete('/:id', async (req: Request, res: Response): Promise<void> => {
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
      .select('*')
      .eq('id', listingId)
      .single();

    if (listingError || !listing) {
      res.status(404).json({ success: false, error: 'Listing not found' });
      return;
    }

    // Check if user owns the listing
    if (listing.seller_id !== userId) {
      res.status(403).json({ success: false, error: 'You can only remove your own listings' });
      return;
    }

    // Check if listing can be cancelled
    if (listing.status === 'sold') {
      res.status(400).json({ success: false, error: 'Cannot cancel a sold listing' });
      return;
    }

    // Cancel the listing
    const { error: updateError } = await supabase
      .from('marketplace_listings')
      .update({ 
        status: 'cancelled',
        cancelled_at: new Date().toISOString()
      })
      .eq('id', listingId);

    if (updateError) throw updateError;

    res.json({
      success: true,
      data: {
        message: 'Listing has been cancelled successfully'
      }
    });
  } catch (error) {
    console.error('Cancel marketplace listing error:', error);
    res.status(500).json({ success: false, error: 'Failed to cancel listing' });
  }
});

/**
 * Get user's marketplace activity (listings and purchases)
 * GET /api/marketplace/user/activity
 */
router.get('/user/activity', async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user?.id;
    const { type = 'all', status = 'all', page = 1, limit = 10 } = req.query;
    const offset = (Number(page) - 1) * Number(limit);

    if (!userId) {
      res.status(401).json({ success: false, error: 'Authentication required' });
      return;
    }

    let listings = [];
    let purchases = [];

    // Get user's listings
    if (type === 'all' || type === 'listings') {
      let listingsQuery = supabase
        .from('marketplace_listings')
        .select(`
          *,
          buyer:users!buyer_id(
            id,
            username
          )
        `)
        .eq('seller_id', userId);

      if (status !== 'all') {
        listingsQuery = listingsQuery.eq('status', status);
      }

      const { data: userListings } = await listingsQuery
        .order('created_at', { ascending: false })
        .range(offset, offset + Number(limit) - 1);

      listings = userListings || [];
    }

    // Get user's purchases
    if (type === 'all' || type === 'purchases') {
      const { data: userPurchases } = await supabase
        .from('marketplace_listings')
        .select(`
          *,
          seller:users!seller_id(
            id,
            username
          )
        `)
        .eq('buyer_id', userId)
        .eq('status', 'sold')
        .order('sold_at', { ascending: false })
        .range(offset, offset + Number(limit) - 1);

      purchases = userPurchases || [];
    }

    res.json({
      success: true,
      data: {
        listings,
        purchases,
        pagination: {
          page: Number(page),
          limit: Number(limit)
        }
      }
    });
  } catch (error) {
    console.error('Get user marketplace activity error:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch marketplace activity' });
  }
});

/**
 * Add listing to favorites
 * POST /api/marketplace/:id/favorite
 */
router.post('/:id/favorite', async (req: Request, res: Response): Promise<void> => {
  try {
    const { id: listingId } = req.params;
    const userId = req.user?.id;

    if (!userId) {
      res.status(401).json({ success: false, error: 'Authentication required' });
      return;
    }

    // Check if listing exists
    const { data: listing } = await supabase
      .from('marketplace_listings')
      .select('id, favorites')
      .eq('id', listingId)
      .single();

    if (!listing) {
      res.status(404).json({ success: false, error: 'Listing not found' });
      return;
    }

    // Add to favorites (using a hypothetical user_favorites table)
    const { error: favoriteError } = await supabase
      .from('user_favorites')
      .insert({
        user_id: userId,
        item_type: 'marketplace_listing',
        item_id: listingId
      })
      .select()
      .single();

    // Update favorites count
    await supabase
      .from('marketplace_listings')
      .update({ favorites: (listing.favorites || 0) + 1 })
      .eq('id', listingId);

    res.json({
      success: true,
      data: {
        message: 'Added to favorites!'
      }
    });
  } catch (error) {
    console.error('Add to favorites error:', error);
    res.status(500).json({ success: false, error: 'Failed to add to favorites' });
  }
});

export default router;