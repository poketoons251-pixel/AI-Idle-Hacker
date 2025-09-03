import { Router } from 'express';
import { supabase } from '../config/supabase.js';

const router = Router();

// Get partner status and relationships
router.get('/status', async (req, res) => {
  try {
    const { player_id } = req.query;

    if (!player_id) {
      return res.status(400).json({ error: 'Player ID is required' });
    }

    // Get all AI partners
    const { data: partners, error: partnersError } = await supabase
      .from('ai_partners')
      .select('*')
      .eq('is_available', true)
      .order('partner_name', { ascending: true });

    if (partnersError) {
      return res.status(500).json({ error: partnersError.message });
    }

    // Get player relationships with partners
    const { data: relationships, error: relationshipsError } = await supabase
      .from('partner_relationships')
      .select('*')
      .eq('player_id', player_id);

    if (relationshipsError) {
      return res.status(500).json({ error: relationshipsError.message });
    }

    // Get active cooperation sessions
    const { data: activeSessions, error: sessionsError } = await supabase
      .from('active_cooperation_sessions')
      .select(`
        *,
        ai_partners!inner(partner_name, specialization)
      `)
      .eq('player_id', player_id)
      .eq('status', 'active');

    if (sessionsError) {
      console.error('Error fetching active sessions:', sessionsError);
    }

    // Enhance partners with relationship data
    const enhancedPartners = partners?.map(partner => {
      const relationship = relationships?.find(r => r.partner_id === partner.id);
      const activeSession = activeSessions?.find(s => s.partner_id === partner.id);
      
      return {
        ...partner,
        relationship: relationship || {
          trust_level: 0,
          cooperation_score: 0,
          missions_completed: 0,
          is_unlocked: partner.unlock_requirements?.level <= 1
        },
        is_active: !!activeSession,
        current_session: activeSession || null,
        availability_status: getPartnerAvailability(partner, relationship)
      };
    });

    // Calculate overall cooperation statistics
    const cooperationStats = {
      total_partners: partners?.length || 0,
      unlocked_partners: enhancedPartners?.filter(p => p.relationship.is_unlocked).length || 0,
      active_partnerships: activeSessions?.length || 0,
      average_trust: relationships?.length ? 
        Math.round(relationships.reduce((sum, r) => sum + r.trust_level, 0) / relationships.length) : 0
    };

    res.json({
      partners: enhancedPartners || [],
      active_sessions: activeSessions || [],
      cooperation_stats: cooperationStats
    });

  } catch (error) {
    console.error('Error fetching partner status:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Coordinate with a partner for missions
router.post('/coordinate', async (req, res) => {
  try {
    const { player_id, partner_id, mission_type, coordination_data } = req.body;

    if (!player_id || !partner_id || !mission_type) {
      return res.status(400).json({ error: 'Player ID, partner ID, and mission type are required' });
    }

    // Get partner details
    const { data: partner, error: partnerError } = await supabase
      .from('ai_partners')
      .select('*')
      .eq('id', partner_id)
      .single();

    if (partnerError || !partner) {
      return res.status(404).json({ error: 'Partner not found' });
    }

    // Get or create relationship
    const { data: relationship, error: relationshipError } = await supabase
      .from('partner_relationships')
      .select('*')
      .eq('player_id', player_id)
      .eq('partner_id', partner_id)
      .single();

    if (relationshipError && relationshipError.code !== 'PGRST116') {
      return res.status(500).json({ error: relationshipError.message });
    }

    // Check if partner is available and player meets requirements
    const trustLevel = relationship?.trust_level || 0;
    const missionRequirements = getMissionRequirements(mission_type);
    
    if (trustLevel < missionRequirements.min_trust) {
      return res.status(400).json({ 
        error: 'Insufficient trust level with partner',
        required_trust: missionRequirements.min_trust,
        current_trust: trustLevel
      });
    }

    // Create cooperation session
    const { data: session, error: sessionError } = await supabase
      .from('active_cooperation_sessions')
      .insert({
        player_id,
        partner_id,
        mission_type,
        coordination_level: calculateCoordinationLevel(partner, relationship),
        session_data: {
          ...coordination_data,
          partner_specialization: partner.specialization,
          trust_bonus: Math.floor(trustLevel / 10)
        },
        status: 'active',
        estimated_duration: missionRequirements.base_duration
      })
      .select()
      .single();

    if (sessionError) {
      return res.status(500).json({ error: sessionError.message });
    }

    // Create coordination event
    const { error: eventError } = await supabase
      .from('partner_coordination_events')
      .insert({
        player_id,
        partner_id,
        session_id: session.id,
        event_type: 'mission_start',
        event_data: {
          mission_type,
          coordination_level: session.coordination_level
        }
      });

    if (eventError) {
      console.error('Error creating coordination event:', eventError);
    }

    // Calculate mission bonuses
    const missionBonuses = calculateMissionBonuses(partner, relationship, mission_type);

    res.json({
      success: true,
      session_id: session.id,
      coordination_level: session.coordination_level,
      mission_bonuses: missionBonuses,
      estimated_completion: new Date(Date.now() + missionRequirements.base_duration * 60000).toISOString(),
      partner_contribution: {
        specialization_bonus: partner.skill_bonuses,
        trust_multiplier: 1 + (trustLevel / 100),
        coordination_efficiency: session.coordination_level / 100
      }
    });

  } catch (error) {
    console.error('Error coordinating with partner:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Manage partner relationships
router.post('/relationships', async (req, res) => {
  try {
    const { player_id, partner_id, action, interaction_data } = req.body;

    if (!player_id || !partner_id || !action) {
      return res.status(400).json({ error: 'Player ID, partner ID, and action are required' });
    }

    // Get current relationship
    const { data: currentRelationship, error: relationshipError } = await supabase
      .from('partner_relationships')
      .select('*')
      .eq('player_id', player_id)
      .eq('partner_id', partner_id)
      .single();

    let relationship = currentRelationship;
    if (relationshipError && relationshipError.code === 'PGRST116') {
      // Create new relationship
      const { data: newRelationship, error: createError } = await supabase
        .from('partner_relationships')
        .insert({
          player_id,
          partner_id,
          trust_level: 10,
          cooperation_score: 0,
          missions_completed: 0,
          relationship_status: 'acquaintance',
          is_unlocked: true
        })
        .select()
        .single();

      if (createError) {
        return res.status(500).json({ error: createError.message });
      }
      relationship = newRelationship;
    } else if (relationshipError) {
      return res.status(500).json({ error: relationshipError.message });
    }

    // Process relationship action
    const updates = processRelationshipAction(action, relationship, interaction_data);

    // Update relationship
    const { data: updatedRelationship, error: updateError } = await supabase
      .from('partner_relationships')
      .update(updates)
      .eq('player_id', player_id)
      .eq('partner_id', partner_id)
      .select()
      .single();

    if (updateError) {
      return res.status(500).json({ error: updateError.message });
    }

    // Record communication if applicable
    if (action === 'communicate') {
      const { error: commError } = await supabase
        .from('partner_communications')
        .insert({
          player_id,
          partner_id,
          communication_type: interaction_data?.type || 'general',
          message_content: interaction_data?.message || '',
          trust_impact: updates.trust_level - relationship.trust_level
        });

      if (commError) {
        console.error('Error recording communication:', commError);
      }
    }

    res.json({
      success: true,
      relationship: updatedRelationship,
      changes: {
        trust_change: updates.trust_level - relationship.trust_level,
        cooperation_change: updates.cooperation_score - relationship.cooperation_score,
        status_change: updates.relationship_status !== relationship.relationship_status
      }
    });

  } catch (error) {
    console.error('Error managing relationship:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get cooperation missions
router.get('/missions', async (req, res) => {
  try {
    const { player_id, status, mission_type } = req.query;

    if (!player_id) {
      return res.status(400).json({ error: 'Player ID is required' });
    }

    let query = supabase
      .from('cooperation_missions')
      .select(`
        *,
        ai_partners!inner(partner_name, specialization, avatar_url)
      `)
      .eq('player_id', player_id)
      .order('created_at', { ascending: false });

    if (status) {
      query = query.eq('status', status);
    }

    if (mission_type) {
      query = query.eq('mission_type', mission_type);
    }

    const { data: missions, error } = await query;

    if (error) {
      return res.status(500).json({ error: error.message });
    }

    // Get available mission types based on partner relationships
    const { data: relationships, error: relError } = await supabase
      .from('partner_relationships')
      .select('partner_id, trust_level')
      .eq('player_id', player_id)
      .gte('trust_level', 25);

    const availableMissionTypes = getAvailableMissionTypes(relationships || []);

    res.json({
      missions: missions || [],
      available_mission_types: availableMissionTypes,
      mission_stats: {
        total_missions: missions?.length || 0,
        completed_missions: missions?.filter(m => m.status === 'completed').length || 0,
        active_missions: missions?.filter(m => m.status === 'active').length || 0,
        success_rate: missions?.length ? 
          Math.round((missions.filter(m => m.status === 'completed' && m.success_rate >= 80).length / missions.length) * 100) : 0
      }
    });

  } catch (error) {
    console.error('Error fetching missions:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get partner skill synergies
router.get('/synergies', async (req, res) => {
  try {
    const { player_id, partner_ids } = req.query;

    if (!player_id) {
      return res.status(400).json({ error: 'Player ID is required' });
    }

    const partnerIdArray = partner_ids && typeof partner_ids === 'string' ? partner_ids.split(',') : [];

    let query = supabase
      .from('partner_skill_synergies')
      .select(`
        *,
        primary_partner:ai_partners!partner_skill_synergies_primary_partner_id_fkey(partner_name, specialization),
        secondary_partner:ai_partners!partner_skill_synergies_secondary_partner_id_fkey(partner_name, specialization)
      `)
      .eq('is_active', true);

    if (partnerIdArray.length > 0) {
      query = query.or(`primary_partner_id.in.(${partnerIdArray.join(',')}),secondary_partner_id.in.(${partnerIdArray.join(',')})`);
    }

    const { data: synergies, error } = await query;

    if (error) {
      return res.status(500).json({ error: error.message });
    }

    // Calculate synergy effectiveness based on player relationships
    const { data: relationships, error: relError } = await supabase
      .from('partner_relationships')
      .select('partner_id, trust_level, cooperation_score')
      .eq('player_id', player_id);

    const enhancedSynergies = synergies?.map(synergy => {
      const primaryRel = relationships?.find(r => r.partner_id === synergy.primary_partner_id);
      const secondaryRel = relationships?.find(r => r.partner_id === synergy.secondary_partner_id);
      
      const effectiveness = calculateSynergyEffectiveness(synergy, primaryRel, secondaryRel);
      
      return {
        ...synergy,
        effectiveness_percentage: effectiveness,
        is_available: (primaryRel?.trust_level || 0) >= 50 && (secondaryRel?.trust_level || 0) >= 50,
        bonus_multiplier: 1 + (effectiveness / 100)
      };
    });

    res.json({
      synergies: enhancedSynergies || [],
      total_synergies: enhancedSynergies?.length || 0,
      available_synergies: enhancedSynergies?.filter(s => s.is_available).length || 0
    });

  } catch (error) {
    console.error('Error fetching synergies:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Helper functions
function getPartnerAvailability(partner, relationship) {
  if (!relationship || !relationship.is_unlocked) {
    return 'locked';
  }
  
  if (relationship.trust_level < 25) {
    return 'limited';
  }
  
  if (relationship.trust_level >= 75) {
    return 'full_access';
  }
  
  return 'available';
}

function getMissionRequirements(missionType) {
  const requirements = {
    'reconnaissance': { min_trust: 25, base_duration: 30 },
    'infiltration': { min_trust: 50, base_duration: 60 },
    'data_extraction': { min_trust: 40, base_duration: 45 },
    'coordinated_attack': { min_trust: 75, base_duration: 90 },
    'intelligence_sharing': { min_trust: 30, base_duration: 20 }
  };
  
  return requirements[missionType] || { min_trust: 25, base_duration: 30 };
}

function calculateCoordinationLevel(partner, relationship) {
  const baseCoor = 50;
  const trustBonus = (relationship?.trust_level || 0) * 0.3;
  const cooperationBonus = (relationship?.cooperation_score || 0) * 0.2;
  const specializationBonus = partner.skill_level * 0.1;
  
  return Math.min(100, Math.round(baseCoor + trustBonus + cooperationBonus + specializationBonus));
}

function calculateMissionBonuses(partner, relationship, missionType) {
  const bonuses = {
    success_rate: 10 + (relationship?.trust_level || 0) * 0.5,
    efficiency: 1 + ((relationship?.cooperation_score || 0) / 100),
    resource_cost_reduction: Math.min(50, (relationship?.trust_level || 0) * 0.3),
    specialization_bonus: partner.specialization === missionType ? 25 : 0
  };
  
  return bonuses;
}

function processRelationshipAction(action, relationship, data) {
  const updates = { ...relationship };
  
  switch (action) {
    case 'communicate':
      updates.trust_level = Math.min(100, relationship.trust_level + 2);
      updates.last_interaction = new Date().toISOString();
      break;
      
    case 'complete_mission':
      updates.missions_completed = relationship.missions_completed + 1;
      updates.cooperation_score = Math.min(100, relationship.cooperation_score + 5);
      updates.trust_level = Math.min(100, relationship.trust_level + 3);
      break;
      
    case 'share_resources':
      updates.trust_level = Math.min(100, relationship.trust_level + 5);
      updates.cooperation_score = Math.min(100, relationship.cooperation_score + 3);
      break;
      
    case 'betray':
      updates.trust_level = Math.max(0, relationship.trust_level - 20);
      updates.cooperation_score = Math.max(0, relationship.cooperation_score - 15);
      break;
  }
  
  // Update relationship status based on trust level
  if (updates.trust_level >= 80) {
    updates.relationship_status = 'trusted_ally';
  } else if (updates.trust_level >= 60) {
    updates.relationship_status = 'partner';
  } else if (updates.trust_level >= 30) {
    updates.relationship_status = 'acquaintance';
  } else {
    updates.relationship_status = 'stranger';
  }
  
  return updates;
}

function getAvailableMissionTypes(relationships) {
  const missionTypes = [];
  
  relationships.forEach(rel => {
    if (rel.trust_level >= 25) missionTypes.push('reconnaissance');
    if (rel.trust_level >= 30) missionTypes.push('intelligence_sharing');
    if (rel.trust_level >= 40) missionTypes.push('data_extraction');
    if (rel.trust_level >= 50) missionTypes.push('infiltration');
    if (rel.trust_level >= 75) missionTypes.push('coordinated_attack');
  });
  
  return [...new Set(missionTypes)];
}

function calculateSynergyEffectiveness(synergy, primaryRel, secondaryRel) {
  const baseSynergy = synergy.synergy_bonus || 20;
  const primaryTrust = (primaryRel?.trust_level || 0) / 100;
  const secondaryTrust = (secondaryRel?.trust_level || 0) / 100;
  const averageTrust = (primaryTrust + secondaryTrust) / 2;
  
  return Math.round(baseSynergy * averageTrust);
}

export default router;