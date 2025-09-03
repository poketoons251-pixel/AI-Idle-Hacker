import { Router } from 'express';
import { supabase } from '../config/supabase.js';
import { authenticateUser } from '../middleware/auth.js';

const router = Router();

// Get all available partner personalities
router.get('/personalities', async (req, res) => {
  try {
    const { data: personalities, error } = await supabase
      .from('partner_personalities')
      .select('*')
      .eq('is_active', true)
      .order('name', { ascending: true });

    if (error) {
      console.error('Error fetching personalities:', error);
      return res.status(500).json({ error: 'Failed to fetch personalities' });
    }

    res.json({ personalities });
  } catch (error) {
    console.error('Personalities fetch error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get specific partner personality
router.get('/personalities/:partnerId', async (req, res) => {
  try {
    const { partnerId } = req.params;

    const { data: personality, error } = await supabase
      .from('partner_personalities')
      .select('*')
      .eq('partner_id', partnerId)
      .eq('is_active', true)
      .single();

    if (error) {
      console.error('Error fetching personality:', error);
      return res.status(404).json({ error: 'Partner personality not found' });
    }

    res.json({ personality });
  } catch (error) {
    console.error('Personality fetch error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get all personality traits
router.get('/traits', async (req, res) => {
  try {
    const { category, trait_type, rarity } = req.query;
    
    let query = supabase
      .from('personality_traits')
      .select('*')
      .eq('is_active', true);

    if (category) query = query.eq('category', category);
    if (trait_type) query = query.eq('trait_type', trait_type);
    if (rarity) query = query.eq('rarity', rarity);

    const { data: traits, error } = await query.order('name', { ascending: true });

    if (error) {
      console.error('Error fetching traits:', error);
      return res.status(500).json({ error: 'Failed to fetch traits' });
    }

    res.json({ traits });
  } catch (error) {
    console.error('Traits fetch error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get player's relationship dynamics (requires authentication)
router.get('/relationships', authenticateUser, async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    const { data: relationships, error } = await supabase
      .from('relationship_dynamics')
      .select(`
        *,
        partner_personalities!inner(
          partner_id,
          name,
          archetype,
          communication_style
        )
      `)
      .eq('player_id', userId)
      .order('last_interaction_at', { ascending: false });

    if (error) {
      console.error('Error fetching relationships:', error);
      return res.status(500).json({ error: 'Failed to fetch relationships' });
    }

    res.json({ relationships });
  } catch (error) {
    console.error('Relationships fetch error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get specific relationship dynamics
router.get('/relationships/:partnerId', authenticateUser, async (req, res) => {
  try {
    const userId = req.user?.id;
    const { partnerId } = req.params;

    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    const { data: relationship, error } = await supabase
      .from('relationship_dynamics')
      .select(`
        *,
        partner_personalities!inner(
          partner_id,
          name,
          archetype,
          personality_type,
          core_traits,
          communication_style,
          trust_threshold,
          loyalty_factor
        )
      `)
      .eq('player_id', userId)
      .eq('partner_id', partnerId)
      .single();

    if (error && error.code !== 'PGRST116') {
      console.error('Error fetching relationship:', error);
      return res.status(500).json({ error: 'Failed to fetch relationship' });
    }

    // If no relationship exists, create initial relationship
    if (!relationship) {
      const { data: partner, error: partnerError } = await supabase
        .from('partner_personalities')
        .select('trust_threshold')
        .eq('partner_id', partnerId)
        .single();

      if (partnerError) {
        return res.status(404).json({ error: 'Partner not found' });
      }

      const { data: newRelationship, error: createError } = await supabase
        .from('relationship_dynamics')
        .insert({
          player_id: userId,
          partner_id: partnerId,
          relationship_type: 'professional',
          trust_level: Math.max(0, partner.trust_threshold - 20), // Start below threshold
          respect_level: 25,
          intimacy_level: 0,
          conflict_level: 0,
          compatibility_score: 50.00
        })
        .select(`
          *,
          partner_personalities!inner(
            partner_id,
            name,
            archetype,
            personality_type,
            core_traits,
            communication_style,
            trust_threshold,
            loyalty_factor
          )
        `)
        .single();

      if (createError) {
        console.error('Error creating relationship:', createError);
        return res.status(500).json({ error: 'Failed to create relationship' });
      }

      return res.json({ relationship: newRelationship });
    }

    res.json({ relationship });
  } catch (error) {
    console.error('Relationship fetch error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update relationship dynamics
router.put('/relationships/:partnerId', authenticateUser, async (req, res) => {
  try {
    const userId = req.user?.id;
    const { partnerId } = req.params;
    const {
      trust_change,
      respect_change,
      intimacy_change,
      conflict_change,
      interaction_type,
      interaction_context,
      player_choice,
      partner_response
    } = req.body;

    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    // Get current relationship state
    const { data: currentRelationship, error: fetchError } = await supabase
      .from('relationship_dynamics')
      .select('*')
      .eq('player_id', userId)
      .eq('partner_id', partnerId)
      .single();

    if (fetchError) {
      return res.status(404).json({ error: 'Relationship not found' });
    }

    // Calculate new values with bounds checking
    const newTrustLevel = Math.max(0, Math.min(100, currentRelationship.trust_level + (trust_change || 0)));
    const newRespectLevel = Math.max(0, Math.min(100, currentRelationship.respect_level + (respect_change || 0)));
    const newIntimacyLevel = Math.max(0, Math.min(100, currentRelationship.intimacy_level + (intimacy_change || 0)));
    const newConflictLevel = Math.max(0, Math.min(100, currentRelationship.conflict_level + (conflict_change || 0)));

    // Calculate new compatibility score
    const compatibilityScore = (
      (newTrustLevel * 0.4) + 
      (newRespectLevel * 0.3) + 
      (newIntimacyLevel * 0.2) + 
      ((100 - newConflictLevel) * 0.1)
    );

    // Determine relationship type based on levels
    let relationshipType = currentRelationship.relationship_type;
    if (newTrustLevel >= 80 && newIntimacyLevel >= 60) {
      relationshipType = 'romantic';
    } else if (newTrustLevel >= 70 && newRespectLevel >= 70) {
      relationshipType = 'friendly';
    } else if (newConflictLevel >= 60) {
      relationshipType = 'rival';
    } else if (newRespectLevel >= 80 && newTrustLevel >= 60) {
      relationshipType = 'mentor';
    }

    // Update relationship
    const { data: updatedRelationship, error: updateError } = await supabase
      .from('relationship_dynamics')
      .update({
        trust_level: newTrustLevel,
        respect_level: newRespectLevel,
        intimacy_level: newIntimacyLevel,
        conflict_level: newConflictLevel,
        relationship_type: relationshipType,
        compatibility_score: compatibilityScore,
        shared_experiences: currentRelationship.shared_experiences + 1,
        last_interaction_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('player_id', userId)
      .eq('partner_id', partnerId)
      .select()
      .single();

    if (updateError) {
      console.error('Error updating relationship:', updateError);
      return res.status(500).json({ error: 'Failed to update relationship' });
    }

    // Record the interaction
    if (interaction_type) {
      const interactionQuality = compatibilityScore >= 75 ? 'excellent' : 
                               compatibilityScore >= 50 ? 'good' : 
                               compatibilityScore >= 25 ? 'neutral' : 'poor';

      await supabase
        .from('partner_interactions')
        .insert({
          player_id: userId,
          partner_id: partnerId,
          interaction_type,
          interaction_context,
          player_choice,
          partner_response,
          trust_change: trust_change || 0,
          respect_change: respect_change || 0,
          intimacy_change: intimacy_change || 0,
          interaction_quality: interactionQuality
        });
    }

    res.json({ relationship: updatedRelationship });
  } catch (error) {
    console.error('Relationship update error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get partner dialogue based on context and relationship
router.get('/:partnerId/dialogue/:context', authenticateUser, async (req, res) => {
  try {
    const userId = req.user?.id;
    const { partnerId, context } = req.params;

    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    // Get relationship state
    const { data: relationship, error: relationshipError } = await supabase
      .from('relationship_dynamics')
      .select('trust_level, respect_level, intimacy_level, current_mood, relationship_type')
      .eq('player_id', userId)
      .eq('partner_id', partnerId)
      .single();

    // Get available dialogue options
    const { data: dialogueOptions, error: dialogueError } = await supabase
      .from('partner_dialogue')
      .select('*')
      .eq('partner_id', partnerId)
      .eq('context', context)
      .eq('is_active', true);

    if (dialogueError) {
      console.error('Error fetching dialogue:', dialogueError);
      return res.status(500).json({ error: 'Failed to fetch dialogue' });
    }

    // Filter dialogue based on relationship requirements
    const availableDialogue = dialogueOptions?.filter(dialogue => {
      if (!dialogue.relationship_requirements) return true;
      
      const requirements = dialogue.relationship_requirements;
      if (requirements.trust_level && relationship?.trust_level < requirements.trust_level) return false;
      if (requirements.respect_level && relationship?.respect_level < requirements.respect_level) return false;
      if (requirements.intimacy_level && relationship?.intimacy_level < requirements.intimacy_level) return false;
      if (requirements.relationship_type && relationship?.relationship_type !== requirements.relationship_type) return false;
      
      return true;
    }) || [];

    // Select appropriate dialogue (could be randomized or based on other factors)
    const selectedDialogue = availableDialogue.length > 0 ? 
      availableDialogue[Math.floor(Math.random() * availableDialogue.length)] : null;

    if (!selectedDialogue) {
      return res.status(404).json({ error: 'No appropriate dialogue found' });
    }

    // Apply mood variants if available
    let finalDialogue = selectedDialogue.dialogue_text;
    if (selectedDialogue.mood_variants && relationship?.current_mood) {
      const moodVariant = selectedDialogue.mood_variants[relationship.current_mood];
      if (moodVariant) {
        finalDialogue = moodVariant;
      }
    }

    // Update usage count
    await supabase
      .from('partner_dialogue')
      .update({ usage_count: selectedDialogue.usage_count + 1 })
      .eq('id', selectedDialogue.id);

    res.json({
      dialogue: {
        ...selectedDialogue,
        dialogue_text: finalDialogue,
        relationship_context: relationship
      }
    });
  } catch (error) {
    console.error('Dialogue fetch error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get partner evolution status
router.get('/evolution/:partnerId', authenticateUser, async (req, res) => {
  try {
    const userId = req.user?.id;
    const { partnerId } = req.params;

    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    const { data: evolution, error } = await supabase
      .from('partner_evolution')
      .select('*')
      .eq('player_id', userId)
      .eq('partner_id', partnerId)
      .single();

    if (error && error.code !== 'PGRST116') {
      console.error('Error fetching evolution:', error);
      return res.status(500).json({ error: 'Failed to fetch evolution' });
    }

    // If no evolution record exists, create initial one
    if (!evolution) {
      const { data: newEvolution, error: createError } = await supabase
        .from('partner_evolution')
        .insert({
          player_id: userId,
          partner_id: partnerId,
          evolution_stage: 1,
          experience_points: 0,
          next_evolution_requirements: {
            experience_points: 1000,
            trust_level: 50,
            shared_experiences: 10
          }
        })
        .select()
        .single();

      if (createError) {
        console.error('Error creating evolution:', createError);
        return res.status(500).json({ error: 'Failed to create evolution' });
      }

      return res.json({ evolution: newEvolution });
    }

    res.json({ evolution });
  } catch (error) {
    console.error('Evolution fetch error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update partner evolution
router.put('/evolution/:partnerId', authenticateUser, async (req, res) => {
  try {
    const userId = req.user?.id;
    const { partnerId } = req.params;
    const { experience_gained, skill_improvements, personality_shifts } = req.body;

    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    // Get current evolution state
    const { data: currentEvolution, error: fetchError } = await supabase
      .from('partner_evolution')
      .select('*')
      .eq('player_id', userId)
      .eq('partner_id', partnerId)
      .single();

    if (fetchError) {
      return res.status(404).json({ error: 'Evolution record not found' });
    }

    const newExperiencePoints = currentEvolution.experience_points + (experience_gained || 0);
    const updatedSkills = { ...currentEvolution.skill_improvements, ...skill_improvements };
    const updatedPersonality = { ...currentEvolution.personality_shifts, ...personality_shifts };

    // Check for evolution stage advancement
    let newStage = currentEvolution.evolution_stage;
    let newRequirements = currentEvolution.next_evolution_requirements;
    
    if (newExperiencePoints >= currentEvolution.next_evolution_requirements?.experience_points) {
      newStage += 1;
      newRequirements = {
        experience_points: newExperiencePoints + (1000 * newStage),
        trust_level: 50 + (newStage * 10),
        shared_experiences: 10 * newStage
      };
    }

    const { data: updatedEvolution, error: updateError } = await supabase
      .from('partner_evolution')
      .update({
        evolution_stage: newStage,
        experience_points: newExperiencePoints,
        skill_improvements: updatedSkills,
        personality_shifts: updatedPersonality,
        next_evolution_requirements: newRequirements,
        updated_at: new Date().toISOString()
      })
      .eq('player_id', userId)
      .eq('partner_id', partnerId)
      .select()
      .single();

    if (updateError) {
      console.error('Error updating evolution:', updateError);
      return res.status(500).json({ error: 'Failed to update evolution' });
    }

    res.json({ evolution: updatedEvolution });
  } catch (error) {
    console.error('Evolution update error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get interaction history
router.get('/:partnerId/interactions', authenticateUser, async (req, res) => {
  try {
    const userId = req.user?.id;
    const { partnerId } = req.params;
    const { limit = 50, offset = 0 } = req.query;

    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    const { data: interactions, error } = await supabase
      .from('partner_interactions')
      .select('*')
      .eq('player_id', userId)
      .eq('partner_id', partnerId)
      .order('occurred_at', { ascending: false })
      .range(parseInt(offset as string), parseInt(offset as string) + parseInt(limit as string) - 1);

    if (error) {
      console.error('Error fetching interactions:', error);
      return res.status(500).json({ error: 'Failed to fetch interactions' });
    }

    res.json({ interactions });
  } catch (error) {
    console.error('Interactions fetch error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Auto-interact endpoint for idle gameplay
router.post('/auto-interact', authenticateUser, async (req, res) => {
  try {
    const userId = req.user?.id;
    const { resourceAllocation = {}, speedMultiplier = 1.0 } = req.body;

    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    // Get active relationships
    const { data: relationships, error: relationshipsError } = await supabase
      .from('relationship_dynamics')
      .select(`
        *,
        partner_personalities!inner(
          partner_id,
          name,
          archetype,
          communication_style
        )
      `)
      .eq('player_id', userId)
      .gte('trust_level', 20); // Only interact with partners we have some trust with

    if (relationshipsError) {
      console.error('Error fetching relationships:', relationshipsError);
      return res.status(500).json({ error: 'Failed to fetch relationships' });
    }

    const results = [];
    const interactionChance = Math.min(0.8, 0.3 + (resourceAllocation.partnerInteraction || 0) * 0.5) * speedMultiplier;

    for (const relationship of relationships) {
      if (Math.random() < interactionChance) {
        // Calculate interaction effects
        const trustGain = Math.floor(Math.random() * 3) + 1;
        const respectGain = Math.floor(Math.random() * 2) + 1;
        const experienceGain = Math.floor(Math.random() * 50) + 25;

        // Update relationship
        const { error: updateError } = await supabase
          .from('relationship_dynamics')
          .update({
            trust_level: Math.min(100, relationship.trust_level + trustGain),
            respect_level: Math.min(100, relationship.respect_level + respectGain),
            last_interaction_at: new Date().toISOString()
          })
          .eq('player_id', userId)
          .eq('partner_id', relationship.partner_id);

        if (!updateError) {
          // Record interaction
          await supabase
            .from('partner_interactions')
            .insert({
              player_id: userId,
              partner_id: relationship.partner_id,
              interaction_type: 'auto_interaction',
              outcome: 'positive',
              trust_change: trustGain,
              respect_change: respectGain,
              occurred_at: new Date().toISOString()
            });

          // Update partner evolution
          await supabase
            .from('partner_evolution')
            .upsert({
              player_id: userId,
              partner_id: relationship.partner_id,
              experience_points: experienceGain,
              updated_at: new Date().toISOString()
            }, {
              onConflict: 'player_id,partner_id'
            });

          results.push({
            partnerId: relationship.partner_id,
            partnerName: relationship.partner_personalities.name,
            trustGain,
            respectGain,
            experienceGain
          });
        }
      }
    }

    res.json({
      success: true,
      interactionsCompleted: results.length,
      results,
      efficiency: Math.round((results.length / Math.max(1, relationships.length)) * 100)
    });
  } catch (error) {
    console.error('Auto-interact error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Auto-maintain endpoint for idle gameplay
router.post('/auto-maintain', authenticateUser, async (req, res) => {
  try {
    const userId = req.user?.id;
    const { resourceAllocation = {}, speedMultiplier = 1.0 } = req.body;

    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    // Get relationships that need maintenance (declining trust/respect)
    const { data: relationships, error: relationshipsError } = await supabase
      .from('relationship_dynamics')
      .select(`
        *,
        partner_personalities!inner(
          partner_id,
          name,
          archetype,
          loyalty_factor
        )
      `)
      .eq('player_id', userId)
      .or('trust_level.lt.80,respect_level.lt.80,conflict_level.gt.20');

    if (relationshipsError) {
      console.error('Error fetching relationships for maintenance:', relationshipsError);
      return res.status(500).json({ error: 'Failed to fetch relationships' });
    }

    const results = [];
    const maintenanceChance = Math.min(0.9, 0.4 + (resourceAllocation.relationshipMaintenance || 0) * 0.5) * speedMultiplier;

    for (const relationship of relationships) {
      if (Math.random() < maintenanceChance) {
        // Calculate maintenance effects
        const trustRepair = Math.floor(Math.random() * 4) + 2;
        const respectRepair = Math.floor(Math.random() * 3) + 1;
        const conflictReduction = Math.floor(Math.random() * 5) + 3;

        // Update relationship
        const { error: updateError } = await supabase
          .from('relationship_dynamics')
          .update({
            trust_level: Math.min(100, relationship.trust_level + trustRepair),
            respect_level: Math.min(100, relationship.respect_level + respectRepair),
            conflict_level: Math.max(0, relationship.conflict_level - conflictReduction),
            last_interaction_at: new Date().toISOString()
          })
          .eq('player_id', userId)
          .eq('partner_id', relationship.partner_id);

        if (!updateError) {
          // Record maintenance interaction
          await supabase
            .from('partner_interactions')
            .insert({
              player_id: userId,
              partner_id: relationship.partner_id,
              interaction_type: 'maintenance',
              outcome: 'positive',
              trust_change: trustRepair,
              respect_change: respectRepair,
              occurred_at: new Date().toISOString()
            });

          results.push({
            partnerId: relationship.partner_id,
            partnerName: relationship.partner_personalities.name,
            trustRepair,
            respectRepair,
            conflictReduction
          });
        }
      }
    }

    res.json({
      success: true,
      maintenanceCompleted: results.length,
      results,
      efficiency: Math.round((results.length / Math.max(1, relationships.length)) * 100)
    });
  } catch (error) {
    console.error('Auto-maintain error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;