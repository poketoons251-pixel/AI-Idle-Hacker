/**
 * Supabase Edge Function: AI Decision Making
 * 
 * Receives game state from the client, calls an LLM (Anthropic Claude Haiku)
 * for strategic decision making, and returns a validated AIDecision.
 * 
 * This is the LLM component of the hybrid AI system:
 * - Rules-based engine handles routine decisions (high confidence)
 * - This Edge Function handles strategic decisions (low confidence moments)
 * 
 * Environment variables:
 * - ANTHROPIC_API_KEY: Anthropic API key (set via supabase secrets)
 * 
 * Per AI-05: LLM runs server-side via Edge Functions, NOT in browser.
 * Per D-02: Hybrid — rules for routine, LLM for strategic.
 * Per T-04-07: LLM response is validated before returning.
 * Per T-04-09: Client should rate-limit calls (max 1 per 30s).
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';

// --- Types ---

interface AIDecision {
  type: 'operation' | 'upgrade' | 'skill' | 'resource' | 'start_operation' | 'upgrade_equipment' | 'allocate_skill' | 'emergency_override' | 'execute_hack';
  targetId?: string;
  reasoning: string;
  confidence: number;
  timestamp: Date;
  description: string;
  techniqueId?: string;
  targetInfo?: string;
  operationType?: string;
  skill?: string;
  points?: number;
}

interface EdgeFunctionRequest {
  gameState: {
    credits: number;
    creditsPerSecond: number;
    level: number;
    energy: number;
    skillPoints: number;
    equipment: Array<{ id: string; name: string; level: number; bonus: number; equipped: boolean; upgradeCost: number }>;
    targets: Array<{ id: string; name: string; difficulty: number; rewards: { credits: number } }>;
    aiConfig: { priorities: Record<string, number>; riskTolerance: number; resourceAllocation: Record<string, number> };
  };
  recentActions: Array<{ action: string; result: string; timestamp: number }>;
}

interface EdgeFunctionResponse {
  decision: AIDecision | null;
  error?: string;
}

// --- Constants ---

const VALID_DECISION_TYPES: AIDecision['type'][] = [
  'operation',
  'upgrade',
  'skill',
  'resource',
  'start_operation',
  'upgrade_equipment',
  'allocate_skill',
  'emergency_override',
  'execute_hack',
];

const VALID_OPERATION_TYPES = ['data_breach', 'crypto_mining', 'ddos', 'social_engineering'];

const ANTHROPIC_API_URL = 'https://api.anthropic.com/v1/messages';
const ANTHROPIC_MODEL = 'claude-haiku-4-20241022'; // Cost-effective for routine strategic decisions

// --- Prompt Builder ---

function buildSystemPrompt(): string {
  return `You are an AI playing an idle hacking game. Your goal is to maximize credit generation and player progression over time.

Make strategic decisions based on the game state provided. You should:
1. Prioritize upgrades with the best ROI (bonus per credit spent)
2. Choose hacking targets that match the player's risk tolerance
3. Keep a credit reserve for unexpected opportunities
4. Balance between upgrading equipment and starting operations

Respond with ONLY a valid JSON object matching this structure:
{
  "type": "one of: start_operation, upgrade_equipment, allocate_skill, execute_hack",
  "targetId": "id of target or equipment (optional for allocate_skill)",
  "reasoning": "brief explanation of why this decision was made, with specific numbers",
  "confidence": 0.0 to 1.0,
  "description": "short description of the action",
  "operationType": "only for start_operation: data_breach, crypto_mining, ddos, or social_engineering",
  "skill": "only for allocate_skill: hacking, stealth, social, hardware, or ai",
  "points": "only for allocate_skill: number of points to allocate"
}

Do NOT include any text outside the JSON object.`;
}

function buildUserPrompt(request: EdgeFunctionRequest): string {
  const { gameState, recentActions } = request;
  const { credits, creditsPerSecond, level, energy, skillPoints, equipment, targets, aiConfig } = gameState;

  const reserve = aiConfig.resourceAllocation?.reserve ?? 0.2;
  const availableCredits = Math.floor(credits * (1 - reserve));

  // Build equipment summary
  const equippedItems = equipment.filter((e) => e.equipped);
  const upgradeableItems = equipment.filter(
    (e) => e.equipped && e.level < 10 && e.upgradeCost <= availableCredits
  );

  const equipmentSummary = upgradeableItems
    .map((e) => {
      const roi = (e.bonus / e.upgradeCost).toFixed(4);
      return `- ${e.name} (level ${e.level}, bonus +${e.bonus}): upgrade cost ${e.upgradeCost} credits, ROI ${roi}`;
    })
    .join('\n');

  // Build target summary
  const viableTargets = targets.filter((t) => t.difficulty <= level + 2);
  const targetSummary = viableTargets
    .map((t) => {
      const energyCost = t.difficulty * 10;
      return `- ${t.name}: difficulty ${t.difficulty}, reward ${t.rewards.credits} credits, energy cost ${energyCost}`;
    })
    .join('\n');

  // Build recent actions summary
  const recentActionsSummary = recentActions.length > 0
    ? recentActions
        .slice(0, 5)
        .map((a) => `- ${a.action}: ${a.result}`)
        .join('\n')
    : 'No recent actions';

  // Risk tolerance interpretation
  let riskProfile = 'balanced';
  if (aiConfig.riskTolerance > 0.7) riskProfile = 'aggressive (prefer harder targets for bigger rewards)';
  else if (aiConfig.riskTolerance < 0.3) riskProfile = 'conservative (prefer easier, safer targets)';

  return `Current Game State:
- Credits: ${credits.toLocaleString()} (available for spending: ${availableCredits.toLocaleString()}, reserve: ${(reserve * 100).toFixed(0)}%)
- Credits/sec: ${creditsPerSecond.toFixed(1)}
- Level: ${level}
- Energy: ${energy}/100
- Skill Points: ${skillPoints}

AI Configuration:
- Risk Tolerance: ${aiConfig.riskTolerance} (${riskProfile})
- Priorities: operations=${aiConfig.priorities?.operations ?? 0.5}, upgrades=${aiConfig.priorities?.upgrades ?? 0.5}

Equipped Equipment:
${equippedItems.map((e) => `- ${e.name} (level ${e.level}, bonus +${e.bonus})`).join('\n') || 'None'}

Affordable Upgrades:
${equipmentSummary || 'None currently affordable'}

Available Targets:
${targetSummary || 'No viable targets'}

Recent Actions:
${recentActionsSummary}

Based on this game state, what is the best strategic decision to make right now?
Return ONLY a valid JSON object with your decision.`;
}

// --- LLM Caller ---

async function callLLM(systemPrompt: string, userPrompt: string): Promise<string> {
  const apiKey = Deno.env.get('ANTHROPIC_API_KEY');
  if (!apiKey) {
    throw new Error('ANTHROPIC_API_KEY not configured');
  }

  const response = await fetch(ANTHROPIC_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: ANTHROPIC_MODEL,
      max_tokens: 500,
      system: systemPrompt,
      messages: [{ role: 'user', content: userPrompt }],
    }),
  });

  if (!response.ok) {
    const errorBody = await response.text().catch(() => 'unknown');
    throw new Error(`LLM API error: ${response.status} ${response.statusText} - ${errorBody}`);
  }

  const data = await response.json();
  const content = data.content?.[0]?.text;
  if (!content) {
    throw new Error('LLM returned empty response');
  }

  return content;
}

// --- Decision Validator ---

function validateDecision(raw: unknown, gameState: EdgeFunctionRequest['gameState']): AIDecision | null {
  if (!raw || typeof raw !== 'object') return null;

  const decision = raw as Record<string, unknown>;

  // Validate type
  const type = decision.type as string | undefined;
  if (!type || !VALID_DECISION_TYPES.includes(type as AIDecision['type'])) {
    return null;
  }

  // Validate targetId if present — must reference a valid target or equipment
  if (decision.targetId) {
    const targetId = decision.targetId as string;
    const validEquipmentIds = gameState.equipment.map((e) => e.id);
    const validTargetIds = gameState.targets.map((t) => t.id);
    if (!validEquipmentIds.includes(targetId) && !validTargetIds.includes(targetId)) {
      return null;
    }
  }

  // Validate and clamp confidence
  let confidence = typeof decision.confidence === 'number' ? decision.confidence : 0.5;
  confidence = Math.max(0.0, Math.min(1.0, confidence));

  // Validate operationType for start_operation
  if (type === 'start_operation' && decision.operationType) {
    if (!VALID_OPERATION_TYPES.includes(decision.operationType as string)) {
      return null;
    }
  }

  // Build validated decision
  const validated: AIDecision = {
    type: type as AIDecision['type'],
    reasoning: typeof decision.reasoning === 'string' ? decision.reasoning : 'AI strategic decision',
    confidence,
    timestamp: new Date(),
    description: typeof decision.description === 'string' ? decision.description : `AI ${type} decision`,
  };

  if (decision.targetId) validated.targetId = decision.targetId as string;
  if (decision.techniqueId) validated.techniqueId = decision.techniqueId as string;
  if (decision.targetInfo) validated.targetInfo = decision.targetInfo as string;
  if (decision.operationType) validated.operationType = decision.operationType as string;
  if (decision.skill) validated.skill = decision.skill as string;
  if (typeof decision.points === 'number') validated.points = decision.points;

  return validated;
}

// --- Parse LLM Response ---

function parseLLMResponse(rawText: string): unknown {
  // Try to extract JSON from the response (handle markdown code blocks, extra text)
  let jsonStr = rawText.trim();

  // Remove markdown code blocks if present
  const codeBlockMatch = jsonStr.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
  if (codeBlockMatch) {
    jsonStr = codeBlockMatch[1];
  }

  // Try to find JSON object boundaries
  const firstBrace = jsonStr.indexOf('{');
  const lastBrace = jsonStr.lastIndexOf('}');
  if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
    jsonStr = jsonStr.substring(firstBrace, lastBrace + 1);
  }

  return JSON.parse(jsonStr);
}

// --- CORS Headers ---

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// --- Main Handler ---

serve(async (req: Request) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  // Only accept POST
  if (req.method !== 'POST') {
    return new Response(
      JSON.stringify({ decision: null, error: 'Method not allowed' }),
      { status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  let request: EdgeFunctionRequest;
  try {
    request = await req.json();
    if (!request.gameState) {
      throw new Error('Missing gameState in request body');
    }
  } catch (e) {
    return new Response(
      JSON.stringify({ decision: null, error: `Invalid request: ${e instanceof Error ? e.message : 'unknown'}` }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  try {
    // Build prompts
    const systemPrompt = buildSystemPrompt();
    const userPrompt = buildUserPrompt(request);

    // Call LLM
    const llmResponse = await callLLM(systemPrompt, userPrompt);

    // Parse response
    let parsed: unknown;
    try {
      parsed = parseLLMResponse(llmResponse);
    } catch {
      return new Response(
        JSON.stringify({ decision: null, error: 'Invalid response' }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Validate decision
    const validated = validateDecision(parsed, request.gameState);
    if (!validated) {
      return new Response(
        JSON.stringify({ decision: null, error: 'Invalid decision' }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Success — return validated decision
    return new Response(
      JSON.stringify({ decision: validated, error: undefined }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (e) {
    // LLM unavailable or other error
    const errorMessage = e instanceof Error ? e.message : 'Unknown error';
    return new Response(
      JSON.stringify({ decision: null, error: `LLM unavailable: ${errorMessage}` }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
