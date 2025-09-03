import { Router } from 'express';
import { supabase } from '../config/supabase.js';

const router = Router();

// Get available intelligence documents
router.get('/available', async (req, res) => {
  try {
    const { player_id, target_type, difficulty_level } = req.query;

    if (!player_id) {
      return res.status(400).json({ error: 'Player ID is required' });
    }

    let query = supabase
      .from('intelligence_docs')
      .select('*')
      .eq('is_available', true)
      .order('discovery_date', { ascending: false });

    if (target_type) {
      query = query.eq('target_type', target_type);
    }

    if (difficulty_level) {
      query = query.eq('difficulty_level', difficulty_level);
    }

    const { data: docs, error } = await query;

    if (error) {
      return res.status(500).json({ error: error.message });
    }

    // Check which documents the player has already investigated
    const { data: playerIntel, error: playerError } = await supabase
      .from('player_intelligence')
      .select('document_id, analysis_level')
      .eq('player_id', player_id);

    if (playerError) {
      console.error('Error fetching player intelligence:', playerError);
    }

    // Enhance documents with player progress
    const enhancedDocs = docs?.map(doc => {
      const playerProgress = playerIntel?.find(pi => pi.document_id === doc.id);
      return {
        ...doc,
        player_analysis_level: playerProgress?.analysis_level || 0,
        is_investigated: !!playerProgress,
        estimated_time: Math.ceil(doc.complexity_score * 10), // minutes
        potential_rewards: {
          credits: doc.complexity_score * 100,
          reputation: doc.difficulty_level === 'high' ? 50 : doc.difficulty_level === 'medium' ? 25 : 10,
          intel_points: doc.complexity_score * 5
        }
      };
    });

    res.json({
      documents: enhancedDocs || [],
      total_available: enhancedDocs?.length || 0,
      filters: {
        target_types: ['corporate', 'government', 'criminal', 'individual'],
        difficulty_levels: ['low', 'medium', 'high', 'extreme']
      }
    });

  } catch (error) {
    console.error('Error fetching available intelligence:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Start or continue investigation of a document
router.post('/investigate', async (req, res) => {
  try {
    const { player_id, document_id, investigation_type = 'analysis' } = req.body;

    if (!player_id || !document_id) {
      return res.status(400).json({ error: 'Player ID and document ID are required' });
    }

    // Get document details
    const { data: document, error: docError } = await supabase
      .from('intelligence_docs')
      .select('*')
      .eq('id', document_id)
      .single();

    if (docError || !document) {
      return res.status(404).json({ error: 'Document not found' });
    }

    // Check if player has sufficient resources (simplified check)
    const investigationCost = document.complexity_score * 50;
    
    // Get or create player intelligence record
    const { data: existingIntel, error: intelError } = await supabase
      .from('player_intelligence')
      .select('*')
      .eq('player_id', player_id)
      .eq('document_id', document_id)
      .single();

    let currentAnalysisLevel = 0;
    if (!intelError && existingIntel) {
      currentAnalysisLevel = existingIntel.analysis_level;
    }

    // Calculate new analysis level (max 100)
    const analysisGain = Math.min(25, 100 - currentAnalysisLevel);
    const newAnalysisLevel = Math.min(100, currentAnalysisLevel + analysisGain);

    // Create investigation session
    const { data: session, error: sessionError } = await supabase
      .from('investigation_sessions')
      .insert({
        player_id,
        document_id,
        session_type: investigation_type,
        start_time: new Date().toISOString(),
        estimated_duration: document.complexity_score * 10,
        status: 'active'
      })
      .select()
      .single();

    if (sessionError) {
      return res.status(500).json({ error: sessionError.message });
    }

    // Update or create player intelligence
    const { error: updateError } = await supabase
      .from('player_intelligence')
      .upsert({
        player_id,
        document_id,
        analysis_level: newAnalysisLevel,
        intel_points: (existingIntel?.intel_points || 0) + document.complexity_score * 5,
        last_investigated: new Date().toISOString()
      }, {
        onConflict: 'player_id,document_id'
      });

    if (updateError) {
      return res.status(500).json({ error: updateError.message });
    }

    // Generate investigation results based on analysis level
    const results = generateInvestigationResults(document, newAnalysisLevel);

    // Create investigation report
    const { data: report, error: reportError } = await supabase
      .from('investigation_reports')
      .insert({
        player_id,
        document_id,
        session_id: session.id,
        report_type: investigation_type,
        findings: results.findings,
        analysis_score: newAnalysisLevel,
        recommendations: results.recommendations
      })
      .select()
      .single();

    if (reportError) {
      console.error('Error creating report:', reportError);
    }

    res.json({
      success: true,
      session_id: session.id,
      analysis_level: newAnalysisLevel,
      analysis_gain: analysisGain,
      investigation_results: results,
      rewards: {
        credits: document.complexity_score * 100,
        reputation: document.difficulty_level === 'high' ? 50 : 25,
        intel_points: document.complexity_score * 5
      },
      is_complete: newAnalysisLevel >= 100
    });

  } catch (error) {
    console.error('Error investigating document:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get investigation reports for a player
router.get('/reports', async (req, res) => {
  try {
    const { player_id, document_id, report_type } = req.query;

    if (!player_id) {
      return res.status(400).json({ error: 'Player ID is required' });
    }

    let query = supabase
      .from('investigation_reports')
      .select(`
        *,
        intelligence_docs!inner(title, target_name, target_type, difficulty_level)
      `)
      .eq('player_id', player_id)
      .order('created_at', { ascending: false });

    if (document_id) {
      query = query.eq('document_id', document_id);
    }

    if (report_type) {
      query = query.eq('report_type', report_type);
    }

    const { data: reports, error } = await query;

    if (error) {
      return res.status(500).json({ error: error.message });
    }

    // Get summary statistics
    const stats = {
      total_reports: reports?.length || 0,
      completed_investigations: reports?.filter(r => r.analysis_score >= 100).length || 0,
      average_analysis_score: reports?.length ? 
        Math.round(reports.reduce((sum, r) => sum + r.analysis_score, 0) / reports.length) : 0,
      target_types_investigated: [...new Set(reports?.map(r => r.intelligence_docs.target_type) || [])]
    };

    res.json({
      reports: reports || [],
      statistics: stats
    });

  } catch (error) {
    console.error('Error fetching reports:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get target profiles based on intelligence gathered
router.get('/targets', async (req, res) => {
  try {
    const { player_id, target_type } = req.query;

    if (!player_id) {
      return res.status(400).json({ error: 'Player ID is required' });
    }

    // Get target profiles that player has intelligence on
    let query = supabase
      .from('target_profiles')
      .select(`
        *,
        player_intelligence!inner(analysis_level, intel_points)
      `)
      .eq('player_intelligence.player_id', player_id)
      .eq('is_active', true)
      .order('threat_level', { ascending: false });

    if (target_type) {
      query = query.eq('target_type', target_type);
    }

    const { data: targets, error } = await query;

    if (error) {
      return res.status(500).json({ error: error.message });
    }

    // Enhance targets with vulnerability analysis
    const enhancedTargets = targets?.map(target => {
      const intelLevel = target.player_intelligence[0]?.analysis_level || 0;
      const vulnerabilities = generateVulnerabilityAnalysis(target, intelLevel);
      
      return {
        ...target,
        intelligence_level: intelLevel,
        known_vulnerabilities: vulnerabilities,
        recommended_techniques: getRecommendedTechniques(target, vulnerabilities),
        success_probability: calculateSuccessProbability(target, intelLevel)
      };
    });

    res.json({
      targets: enhancedTargets || [],
      total_targets: enhancedTargets?.length || 0
    });

  } catch (error) {
    console.error('Error fetching targets:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Intelligence marketplace - buy/sell information
router.get('/marketplace', async (req, res) => {
  try {
    const { player_id, category } = req.query;

    let query = supabase
      .from('intelligence_marketplace')
      .select('*')
      .eq('is_available', true)
      .order('price', { ascending: true });

    if (category) {
      query = query.eq('category', category);
    }

    const { data: items, error } = await query;

    if (error) {
      return res.status(500).json({ error: error.message });
    }

    // Filter out items player already owns if player_id provided
    let availableItems = items || [];
    if (player_id) {
      const { data: ownedItems, error: ownedError } = await supabase
        .from('player_intelligence')
        .select('document_id')
        .eq('player_id', player_id);

      if (!ownedError && ownedItems) {
        const ownedDocIds = ownedItems.map(item => item.document_id);
        availableItems = items?.filter(item => 
          !ownedDocIds.includes(item.related_document_id)) || [];
      }
    }

    res.json({
      marketplace_items: availableItems,
      categories: ['vulnerability_data', 'access_credentials', 'network_maps', 'personnel_info', 'financial_records'],
      total_items: availableItems.length
    });

  } catch (error) {
    console.error('Error fetching marketplace:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Helper functions
function generateInvestigationResults(document, analysisLevel) {
  const findings = [];
  const recommendations = [];

  if (analysisLevel >= 25) {
    findings.push(`Basic information about ${document.target_name} confirmed`);
    findings.push(`Target type: ${document.target_type}`);
  }

  if (analysisLevel >= 50) {
    findings.push(`Security infrastructure partially mapped`);
    findings.push(`${Math.floor(Math.random() * 3) + 2} potential entry points identified`);
    recommendations.push('Consider social engineering approach');
  }

  if (analysisLevel >= 75) {
    findings.push(`Critical vulnerabilities discovered`);
    findings.push(`Network topology partially understood`);
    recommendations.push('Multi-stage attack recommended');
    recommendations.push('Partner coordination would increase success rate');
  }

  if (analysisLevel >= 100) {
    findings.push(`Complete target profile established`);
    findings.push(`Optimal attack vectors identified`);
    findings.push(`Security schedule patterns documented`);
    recommendations.push('Execute during identified vulnerability windows');
    recommendations.push('High success probability with current intelligence');
  }

  return { findings, recommendations };
}

function generateVulnerabilityAnalysis(target, intelLevel) {
  const vulnerabilities = [];

  if (intelLevel >= 25) {
    vulnerabilities.push({
      type: 'network',
      severity: 'medium',
      description: 'Outdated firewall configuration detected'
    });
  }

  if (intelLevel >= 50) {
    vulnerabilities.push({
      type: 'social',
      severity: 'high',
      description: 'Key personnel susceptible to social engineering'
    });
  }

  if (intelLevel >= 75) {
    vulnerabilities.push({
      type: 'physical',
      severity: 'medium',
      description: 'Security gaps in physical access controls'
    });
  }

  if (intelLevel >= 100) {
    vulnerabilities.push({
      type: 'system',
      severity: 'critical',
      description: 'Unpatched critical system vulnerabilities'
    });
  }

  return vulnerabilities;
}

function getRecommendedTechniques(target, vulnerabilities) {
  const techniques = [];

  vulnerabilities.forEach(vuln => {
    switch (vuln.type) {
      case 'network':
        techniques.push('man_in_the_middle', 'network_jamming');
        break;
      case 'social':
        techniques.push('social_engineering');
        break;
      case 'physical':
        techniques.push('physical_access');
        break;
      case 'system':
        techniques.push('brute_force', 'exploit_injection');
        break;
    }
  });

  return [...new Set(techniques)];
}

function calculateSuccessProbability(target, intelLevel) {
  const baseSuccess = 30;
  const intelBonus = intelLevel * 0.5;
  const difficultyPenalty = target.threat_level * 10;
  
  return Math.max(10, Math.min(95, baseSuccess + intelBonus - difficultyPenalty));
}

// Auto-gather endpoint for idle gameplay
router.post('/auto-gather', async (req, res) => {
  try {
    const { player_id, resourceAllocation = {}, speedMultiplier = 1.0 } = req.body;

    if (!player_id) {
      return res.status(400).json({ error: 'Player ID is required' });
    }

    // Get available documents for investigation
    const { data: availableDocs, error: docsError } = await supabase
      .from('intelligence_docs')
      .select('*')
      .eq('is_available', true)
      .lte('difficulty_level', 'medium') // Only auto-gather medium and lower difficulty
      .order('complexity_score', { ascending: true })
      .limit(10);

    if (docsError) {
      console.error('Error fetching available documents:', docsError);
      return res.status(500).json({ error: 'Failed to fetch documents' });
    }

    // Get player's current intelligence progress
    const { data: playerIntel, error: intelError } = await supabase
      .from('player_intelligence')
      .select('document_id, analysis_level, intel_points')
      .eq('player_id', player_id);

    if (intelError) {
      console.error('Error fetching player intelligence:', intelError);
      return res.status(500).json({ error: 'Failed to fetch player intelligence' });
    }

    const results = [];
    const gatherChance = Math.min(0.7, 0.2 + (resourceAllocation.intelligenceGathering || 0) * 0.5) * speedMultiplier;

    for (const doc of availableDocs) {
      if (Math.random() < gatherChance) {
        // Check if player already has this document
        const existingIntel = playerIntel?.find(pi => pi.document_id === doc.id);
        const currentLevel = existingIntel?.analysis_level || 0;

        // Skip if already fully analyzed
        if (currentLevel >= 100) continue;

        // Calculate analysis progress
        const analysisGain = Math.floor(Math.random() * 15) + 10; // 10-25% progress
        const newAnalysisLevel = Math.min(100, currentLevel + analysisGain);
        const intelPointsGain = Math.floor(doc.complexity_score * 3) + 5;
        const creditsGain = Math.floor(doc.complexity_score * 50) + 25;

        // Update or create player intelligence
        const { error: updateError } = await supabase
          .from('player_intelligence')
          .upsert({
            player_id,
            document_id: doc.id,
            analysis_level: newAnalysisLevel,
            intel_points: (existingIntel?.intel_points || 0) + intelPointsGain,
            last_investigated: new Date().toISOString()
          }, {
            onConflict: 'player_id,document_id'
          });

        if (!updateError) {
          // Create investigation session record
          await supabase
            .from('investigation_sessions')
            .insert({
              player_id,
              document_id: doc.id,
              session_type: 'auto_analysis',
              start_time: new Date().toISOString(),
              end_time: new Date().toISOString(),
              status: 'completed'
            });

          results.push({
            documentId: doc.id,
            documentName: doc.title,
            targetName: doc.target_name,
            analysisGain,
            newAnalysisLevel,
            intelPointsGain,
            creditsGain,
            isComplete: newAnalysisLevel >= 100
          });
        }
      }
    }

    // Calculate total rewards
    const totalIntelPoints = results.reduce((sum, r) => sum + r.intelPointsGain, 0);
    const totalCredits = results.reduce((sum, r) => sum + r.creditsGain, 0);
    const completedDocuments = results.filter(r => r.isComplete).length;

    res.json({
      success: true,
      investigationsCompleted: results.length,
      documentsCompleted: completedDocuments,
      results,
      totalRewards: {
        intelPoints: totalIntelPoints,
        credits: totalCredits
      },
      efficiency: Math.round((results.length / Math.max(1, availableDocs.length)) * 100)
    });
  } catch (error) {
    console.error('Auto-gather error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;