import { useGameStore, GameState } from '../store/gameStore';

interface AchievementCondition {
  id: string;
  check: (state: GameState) => boolean;
}

const conditions: AchievementCondition[] = [
  { id: 'ach-first-operation', check: (s) => s.operations.some(o => o.status === 'completed') },
  { id: 'ach-first-upgrade', check: (s) => s.equipment.some(e => e.level > 1) },
  { id: 'ach-1k-credits', check: (s) => s.player.credits >= 1000 },
  { id: 'ach-10k-credits', check: (s) => s.player.credits >= 10000 },
  { id: 'ach-100k-credits', check: (s) => s.player.credits >= 100000 },
  { id: 'ach-1m-credits', check: (s) => s.player.credits >= 1000000 },
  { id: 'ach-level-5', check: (s) => s.player.level >= 5 },
  { id: 'ach-level-10', check: (s) => s.player.level >= 10 },
  { id: 'ach-level-25', check: (s) => s.player.level >= 25 },
  { id: 'ach-5-operations', check: (s) => s.operations.filter(o => o.status === 'completed').length >= 5 },
  { id: 'ach-25-operations', check: (s) => s.operations.filter(o => o.status === 'completed').length >= 25 },
  { id: 'ach-unlock-target-2', check: (s) => s.targets.filter(t => t.unlocked).length >= 2 },
  { id: 'ach-unlock-target-5', check: (s) => s.targets.filter(t => t.unlocked).length >= 5 },
  { id: 'ach-all-equipped', check: (s) => {
    const hasHardware = s.equipment.some(e => e.type === 'hardware' && e.equipped);
    const hasSoftware = s.equipment.some(e => e.type === 'software' && e.equipped);
    return hasHardware && hasSoftware;
  }},
  { id: 'ach-100-ops-total', check: (s) => s.operations.filter(o => o.status === 'completed').length >= 100 },
  { id: 'ach-10k-rate', check: (s) => s.getCreditRate() >= 10000 },
  { id: 'ach-energy-max', check: (s) => s.player.energy >= s.player.maxEnergy },
  { id: 'ach-first-hack', check: (s) => s.operations.some(o => o.type === 'data_breach') },
];

export function createAchievementChecker() {
  const checkAchievements = () => {
    const state = useGameStore.getState();

    for (const condition of conditions) {
      const achievement = state.achievements.find(a => a.id === condition.id);
      if (achievement && !achievement.unlocked && condition.check(state)) {
        state.unlockAchievement(condition.id);
        // Trigger notification and popup via custom event
        window.dispatchEvent(new CustomEvent('achievement-unlocked', {
          detail: { id: condition.id, name: achievement.name, description: achievement.description }
        }));
      }
    }
  };

  // Subscribe to store changes
  const unsubscribe = useGameStore.subscribe(checkAchievements);

  // Run initial check (for achievements already met on load)
  checkAchievements();

  return unsubscribe;
}
