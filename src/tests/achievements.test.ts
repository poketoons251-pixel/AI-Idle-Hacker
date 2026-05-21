import { describe, it, expect } from 'vitest';

describe('Achievement definitions', () => {
  it('initialAchievements has at least 15 entries', async () => {
    const { useGameStore } = await import('../store/gameStore');
    const state = useGameStore.getState();
    expect(state.achievements.length).toBeGreaterThanOrEqual(15);
  });

  it('each achievement has required fields (id, name, description, icon, unlocked)', async () => {
    const { useGameStore } = await import('../store/gameStore');
    const state = useGameStore.getState();
    
    for (const ach of state.achievements) {
      expect(ach).toHaveProperty('id');
      expect(ach).toHaveProperty('name');
      expect(ach).toHaveProperty('description');
      expect(ach).toHaveProperty('icon');
      expect(ach).toHaveProperty('unlocked');
      expect(typeof ach.id).toBe('string');
      expect(typeof ach.name).toBe('string');
      expect(typeof ach.description).toBe('string');
      expect(typeof ach.icon).toBe('string');
      expect(typeof ach.unlocked).toBe('boolean');
    }
  });

  it('all achievement IDs are unique', async () => {
    const { useGameStore } = await import('../store/gameStore');
    const state = useGameStore.getState();
    const ids = state.achievements.map(a => a.id);
    const uniqueIds = new Set(ids);
    expect(uniqueIds.size).toBe(ids.length);
  });

  it('achievement IDs follow ach-* prefix pattern', async () => {
    const { useGameStore } = await import('../store/gameStore');
    const state = useGameStore.getState();
    
    for (const ach of state.achievements) {
      expect(ach.id).toMatch(/^ach-/);
    }
  });

  it('achievements cover credit milestones (1k, 10k, 100k, 1m)', async () => {
    const { useGameStore } = await import('../store/gameStore');
    const state = useGameStore.getState();
    const names = state.achievements.map(a => a.name.toLowerCase());
    const descriptions = state.achievements.map(a => a.description.toLowerCase());
    const allText = [...names, ...descriptions].join(' ');
    
    expect(allText).toContain('1,000');
    expect(allText).toContain('10,000');
    expect(allText).toContain('100,000');
    expect(allText).toContain('1,000,000');
  });

  it('achievements cover level milestones (5, 10, 25)', async () => {
    const { useGameStore } = await import('../store/gameStore');
    const state = useGameStore.getState();
    const ids = state.achievements.map(a => a.id);
    
    expect(ids).toContain('ach-level-5');
    expect(ids).toContain('ach-level-10');
    expect(ids).toContain('ach-level-25');
  });

  it('achievements cover operation milestones', async () => {
    const { useGameStore } = await import('../store/gameStore');
    const state = useGameStore.getState();
    const ids = state.achievements.map(a => a.id);
    
    expect(ids).toContain('ach-first-operation');
    expect(ids).toContain('ach-5-operations');
    expect(ids).toContain('ach-25-operations');
    expect(ids).toContain('ach-100-ops-total');
  });

  it('achievements cover first upgrade and first hack', async () => {
    const { useGameStore } = await import('../store/gameStore');
    const state = useGameStore.getState();
    const ids = state.achievements.map(a => a.id);
    
    expect(ids).toContain('ach-first-upgrade');
    expect(ids).toContain('ach-first-hack');
  });

  it('achievements cover target unlock milestones', async () => {
    const { useGameStore } = await import('../store/gameStore');
    const state = useGameStore.getState();
    const ids = state.achievements.map(a => a.id);
    
    expect(ids).toContain('ach-unlock-target-2');
    expect(ids).toContain('ach-unlock-target-5');
  });

  it('achievements cover equipment, rate, and energy milestones', async () => {
    const { useGameStore } = await import('../store/gameStore');
    const state = useGameStore.getState();
    const ids = state.achievements.map(a => a.id);
    
    expect(ids).toContain('ach-all-equipped');
    expect(ids).toContain('ach-10k-rate');
    expect(ids).toContain('ach-energy-max');
  });
});
