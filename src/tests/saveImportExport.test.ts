import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { useGameStore } from '../store/gameStore';

describe('Save export/import/reset', () => {
  beforeEach(() => {
    // Reset store before each test
    useGameStore.persist.clearStorage();
    // Reset to initial state
    useGameStore.setState({
      player: useGameStore.getState().player,
      skills: { hacking: 1, stealth: 1, social: 1, hardware: 1, ai: 1 },
      equipment: useGameStore.getState().equipment,
      operations: [],
      currentOperation: null,
      targets: useGameStore.getState().targets,
      achievements: useGameStore.getState().achievements,
      activeQuests: [],
      completedQuests: [],
      notifications: [],
      lastUpdate: Date.now(),
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  // Test 1: exportSave() returns a non-empty base64 string
  it('exportSave returns a non-empty base64 string', () => {
    const result = useGameStore.getState().exportSave();
    expect(result).toBeDefined();
    expect(typeof result).toBe('string');
    expect(result.length).toBeGreaterThan(0);
  });

  // Test 2: atob(exportSave()) decodes to valid JSON with player.credits field
  it('exportSave output decodes to valid JSON with player.credits', () => {
    const encoded = useGameStore.getState().exportSave();
    const decoded = atob(encoded);
    const data = JSON.parse(decoded);
    expect(data.player).toBeDefined();
    expect(typeof data.player.credits).toBe('number');
    expect(data.player.credits).toBe(1000);
  });

  // Test 3: importSave(validBase64) returns { success: true } and updates store state
  it('importSave with valid data returns success and updates state', () => {
    // Create a valid save
    const state = useGameStore.getState();
    const saveData = {
      player: { ...state.player, credits: 5000, level: 10 },
      skills: { hacking: 5, stealth: 3, social: 2, hardware: 4, ai: 3 },
      equipment: state.equipment,
      targets: state.targets,
      achievements: state.achievements,
      operations: [],
      lastUpdate: Date.now(),
    };
    const encoded = btoa(JSON.stringify(saveData));

    const result = useGameStore.getState().importSave(encoded);
    expect(result.success).toBe(true);

    // Verify state was updated
    const newState = useGameStore.getState();
    expect(newState.player.credits).toBe(5000);
    expect(newState.player.level).toBe(10);
    expect(newState.skills.hacking).toBe(5);
  });

  // Test 4: importSave("not-base64") returns { success: false, error: "..." }
  it('importSave with invalid base64 returns failure', () => {
    const result = useGameStore.getState().importSave('not-valid-base64!!!');
    expect(result.success).toBe(false);
    expect(result.error).toBeDefined();
    expect(typeof result.error).toBe('string');
  });

  // Test 5: importSave(atob("invalid-json")) returns { success: false, error: "..." }
  it('importSave with valid base64 but invalid JSON returns failure', () => {
    const encoded = btoa('this is not json');
    const result = useGameStore.getState().importSave(encoded);
    expect(result.success).toBe(false);
    expect(result.error).toBeDefined();
  });

  // Test 6: importSave with missing player field returns { success: false, error: "..." }
  it('importSave with missing required fields returns failure', () => {
    const invalidData = { skills: {}, equipment: [] }; // missing player
    const encoded = btoa(JSON.stringify(invalidData));
    const result = useGameStore.getState().importSave(encoded);
    expect(result.success).toBe(false);
    expect(result.error).toBeDefined();
  });

  // Test 7: resetSave() restores player to initial state (credits: 1000, level: 1)
  it('resetSave restores player to initial state', () => {
    // First modify state
    useGameStore.getState().updatePlayer({ credits: 9999, level: 50 });

    // Reset
    useGameStore.getState().resetSave();

    const state = useGameStore.getState();
    expect(state.player.credits).toBe(1000);
    expect(state.player.level).toBe(1);
    expect(state.player.experience).toBe(0);
    expect(state.skills.hacking).toBe(1);
    expect(state.operations).toEqual([]);
  });

  // Test 8: exportSave output includes player, skills, equipment, targets, achievements, operations, lastUpdate
  it('exportSave output includes all required fields', () => {
    const encoded = useGameStore.getState().exportSave();
    const decoded = atob(encoded);
    const data = JSON.parse(decoded);

    expect(data).toHaveProperty('player');
    expect(data).toHaveProperty('skills');
    expect(data).toHaveProperty('equipment');
    expect(data).toHaveProperty('targets');
    expect(data).toHaveProperty('achievements');
    expect(data).toHaveProperty('operations');
    expect(data).toHaveProperty('lastUpdate');
    expect(data).toHaveProperty('version');
    expect(data).toHaveProperty('exportedAt');
    expect(data.version).toBe('1.0.0');
  });

  // Additional: importSave with missing player.credits type returns failure
  it('importSave with non-number player.credits returns failure', () => {
    const state = useGameStore.getState();
    const invalidData = {
      player: { ...state.player, credits: 'not-a-number' },
      skills: state.skills,
      equipment: state.equipment,
    };
    const encoded = btoa(JSON.stringify(invalidData));
    const result = useGameStore.getState().importSave(encoded);
    expect(result.success).toBe(false);
    expect(result.error).toBeDefined();
  });
});
