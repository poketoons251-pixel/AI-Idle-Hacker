import { Router, Request, Response } from 'express';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const router = Router();

// Initialize Supabase client (you'll need to add your credentials)
const supabase = createClient(
  process.env.SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
);

// Interface definitions
interface HackingTechnique {
  id: string;
  name: string;
  description: string;
  base_success_rate: number;
  skill_requirements: Record<string, number>;
  resource_cost: number;
  execution_time: number;
  difficulty_level: number;
  unlock_level: number;
}

interface HackingExecution {
  player_id: string;
  technique_id: string;
  target_name: string;
  success: boolean;
  execution_time: number;
  rewards_gained: Record<string, any>;
}

interface ExecuteHackingRequest {
  technique_id: string;
  target_name: string;
  player_id: string;
  player_skills?: Record<string, number>;
  equipment_bonuses?: Record<string, number>;
}

// GET /api/hacking/techniques - Get all available hacking techniques
router.get('/techniques', async (req: Request, res: Response) => {
  try {
    const { data: techniques, error } = await supabase
      .from('hacking_techniques')
      .select('*')
      .order('unlock_level', { ascending: true });

    if (error) {
      console.error('Error fetching hacking techniques:', error);
      return res.status(500).json({ 
        error: 'Failed to fetch hacking techniques',
        details: error.message 
      });
    }

    res.json({
      success: true,
      data: techniques,
      count: techniques?.length || 0
    });
  } catch (error) {
    console.error('Unexpected error:', error);
    res.status(500).json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// GET /api/hacking/techniques/:id - Get specific hacking technique
router.get('/techniques/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const { data: technique, error } = await supabase
      .from('hacking_techniques')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return res.status(404).json({ 
          error: 'Hacking technique not found' 
        });
      }
      console.error('Error fetching hacking technique:', error);
      return res.status(500).json({ 
        error: 'Failed to fetch hacking technique',
        details: error.message 
      });
    }

    res.json({
      success: true,
      data: technique
    });
  } catch (error) {
    console.error('Unexpected error:', error);
    res.status(500).json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// POST /api/hacking/execute - Execute a hacking technique
router.post('/execute', async (req: Request, res: Response) => {
  try {
    const { 
      technique_id, 
      target_name, 
      player_id, 
      player_skills = {}, 
      equipment_bonuses = {} 
    }: ExecuteHackingRequest = req.body;

    // Validate required fields
    if (!technique_id || !target_name || !player_id) {
      return res.status(400).json({
        error: 'Missing required fields: technique_id, target_name, player_id'
      });
    }

    // Get the hacking technique details
    const { data: technique, error: techniqueError } = await supabase
      .from('hacking_techniques')
      .select('*')
      .eq('id', technique_id)
      .single();

    if (techniqueError || !technique) {
      return res.status(404).json({
        error: 'Hacking technique not found'
      });
    }

    // Calculate success probability based on player skills and equipment
    const successRate = calculateSuccessRate(
      technique,
      player_skills,
      equipment_bonuses
    );

    // Determine if the hack is successful
    const isSuccessful = Math.random() < successRate;

    // Calculate actual execution time (with optimized randomness)
    const baseTime = technique.execution_time;
    const timeVariation = baseTime * 0.15; // Reduced to ±15% for better predictability
    const actualTime = Math.round(
      baseTime + (Math.random() - 0.5) * 2 * timeVariation
    );

    // Calculate rewards based on success and technique difficulty
    const rewards = calculateRewards(technique, isSuccessful);

    // Record the execution
    const execution: Omit<HackingExecution, 'id'> = {
      player_id,
      technique_id,
      target_name,
      success: isSuccessful,
      execution_time: actualTime,
      rewards_gained: rewards
    };

    const { data: executionRecord, error: executionError } = await supabase
      .from('hacking_executions')
      .insert(execution)
      .select()
      .single();

    if (executionError) {
      console.error('Error recording execution:', executionError);
      return res.status(500).json({
        error: 'Failed to record hacking execution',
        details: executionError.message
      });
    }

    res.json({
      success: true,
      data: {
        execution_id: executionRecord.id,
        technique_name: technique.name,
        target_name,
        success: isSuccessful,
        execution_time: actualTime,
        success_rate: Math.round(successRate * 100),
        rewards: rewards,
        message: isSuccessful 
          ? `Successfully executed ${technique.name} against ${target_name}!`
          : `${technique.name} failed against ${target_name}. Better luck next time.`
      }
    });
  } catch (error) {
    console.error('Unexpected error during hacking execution:', error);
    res.status(500).json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// GET /api/hacking/history/:player_id - Get player's hacking history
router.get('/history/:player_id', async (req: Request, res: Response) => {
  try {
    const { player_id } = req.params;
    const { limit = 50, offset = 0 } = req.query;

    const { data: history, error } = await supabase
      .from('hacking_executions')
      .select(`
        *,
        hacking_techniques (
          name,
          description,
          difficulty_level
        )
      `)
      .eq('player_id', player_id)
      .order('executed_at', { ascending: false })
      .range(Number(offset), Number(offset) + Number(limit) - 1);

    if (error) {
      console.error('Error fetching hacking history:', error);
      return res.status(500).json({
        error: 'Failed to fetch hacking history',
        details: error.message
      });
    }

    res.json({
      success: true,
      data: history,
      count: history?.length || 0
    });
  } catch (error) {
    console.error('Unexpected error:', error);
    res.status(500).json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Helper function to calculate success rate based on skills and equipment
function calculateSuccessRate(
  technique: HackingTechnique,
  playerSkills: Record<string, number>,
  equipmentBonuses: Record<string, number>
): number {
  // Import balance config (would need proper import in real implementation)
  const skillBonusMultipliers = {
    perLevelAbove: 0.04, // Optimized from balance config
    perLevelBelow: -0.08
  };
  
  let successRate = technique.base_success_rate;
  const requirements = technique.skill_requirements;

  // Apply skill bonuses/penalties with optimized multipliers
  for (const [skill, requiredLevel] of Object.entries(requirements)) {
    const playerLevel = playerSkills[skill] || 0;
    const skillDifference = playerLevel - requiredLevel;
    
    // Use optimized multipliers for better balance
    if (skillDifference >= 0) {
      successRate += skillDifference * skillBonusMultipliers.perLevelAbove;
    } else {
      successRate += skillDifference * Math.abs(skillBonusMultipliers.perLevelBelow);
    }
  }

  // Apply equipment bonuses
  for (const [equipment, bonus] of Object.entries(equipmentBonuses)) {
    successRate += bonus;
  }

  // Ensure success rate stays within bounds
  return Math.max(0.05, Math.min(0.95, successRate));
}

// Helper function to calculate rewards based on technique and success
function calculateRewards(
  technique: HackingTechnique,
  success: boolean
): Record<string, any> {
  // Optimized scaling from balance config
  const experienceMultiplier = 1.8;
  const creditMultiplier = 4.5;
  const reputationBase = 1.2;
  
  const baseReward = technique.difficulty_level * 10;
  
  if (success) {
    return {
      experience: Math.round(baseReward * experienceMultiplier),
      credits: Math.round(baseReward * creditMultiplier),
      reputation: Math.round(technique.difficulty_level * reputationBase),
      technique_mastery: {
        [technique.name]: 1
      }
    };
  } else {
    // Improved partial rewards for failed attempts to encourage learning
    return {
      experience: Math.floor(baseReward * experienceMultiplier * 0.4), // Increased from 0.3
      credits: Math.floor(baseReward * creditMultiplier * 0.1), // Small credit reward
      reputation: 0,
      technique_mastery: {
        [technique.name]: 0.15 // Increased mastery gain from failures
      }
    };
  }
}

export default router;