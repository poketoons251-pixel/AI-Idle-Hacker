import React from 'react';
import { Trophy, Star, Book, Zap, Crown, Shield, Award } from 'lucide-react';
import { useGameStore } from '../../store/gameStore';

interface ProgressionPanelProps {
  className?: string;
}

export const ProgressionPanel: React.FC<ProgressionPanelProps> = ({ className = '' }) => {
  const { player, achievements, loreEntries } = useGameStore();

  const unlockedAchievements = achievements.filter(a => a.unlocked);
  const unlockedLore = loreEntries.filter(l => l.isUnlocked);
  const playerAbilities = player.abilities || [];
  const playerTitles = player.titles || [];

  return (
    <div className={`bg-gray-900 border border-gray-700 rounded-lg p-6 ${className}`}>
      <div className="flex items-center gap-2 mb-6">
        <Trophy className="w-6 h-6 text-yellow-400" />
        <h2 className="text-xl font-bold text-white">Progression</h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Player Stats */}
        <div className="bg-gray-800 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-3">
            <Star className="w-5 h-5 text-blue-400" />
            <h3 className="font-semibold text-white">Stats</h3>
          </div>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-400">Level:</span>
              <span className="text-white font-medium">{player.level}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Experience:</span>
              <span className="text-white font-medium">{player.experience}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Credits:</span>
              <span className="text-green-400 font-medium">{player.credits.toLocaleString()}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Reputation:</span>
              <span className="text-purple-400 font-medium">{player.reputation}</span>
            </div>
          </div>
        </div>

        {/* Achievements */}
        <div className="bg-gray-800 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-3">
            <Award className="w-5 h-5 text-yellow-400" />
            <h3 className="font-semibold text-white">Achievements</h3>
            <span className="text-xs bg-gray-700 px-2 py-1 rounded">
              {unlockedAchievements.length}/{achievements.length}
            </span>
          </div>
          <div className="space-y-2 max-h-32 overflow-y-auto">
            {unlockedAchievements.length > 0 ? (
              unlockedAchievements.slice(0, 3).map((achievement) => (
                <div key={achievement.id} className="flex items-start gap-2">
                  <Trophy className="w-4 h-4 text-yellow-400 mt-0.5 flex-shrink-0" />
                  <div>
                    <div className="text-sm font-medium text-white">{achievement.name}</div>
                    <div className="text-xs text-gray-400">{achievement.description}</div>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-sm text-gray-500">No achievements unlocked yet</div>
            )}
            {unlockedAchievements.length > 3 && (
              <div className="text-xs text-gray-400">+{unlockedAchievements.length - 3} more...</div>
            )}
          </div>
        </div>

        {/* Abilities */}
        <div className="bg-gray-800 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-3">
            <Zap className="w-5 h-5 text-cyan-400" />
            <h3 className="font-semibold text-white">Abilities</h3>
            <span className="text-xs bg-gray-700 px-2 py-1 rounded">
              {playerAbilities.length}
            </span>
          </div>
          <div className="space-y-2 max-h-32 overflow-y-auto">
            {playerAbilities.length > 0 ? (
              playerAbilities.slice(0, 3).map((ability, index) => (
                <div key={index} className="flex items-start gap-2">
                  <Shield className="w-4 h-4 text-cyan-400 mt-0.5 flex-shrink-0" />
                  <div>
                    <div className="text-sm font-medium text-white">{ability.title}</div>
                    <div className="text-xs text-gray-400">{ability.description}</div>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-sm text-gray-500">No special abilities unlocked</div>
            )}
            {playerAbilities.length > 3 && (
              <div className="text-xs text-gray-400">+{playerAbilities.length - 3} more...</div>
            )}
          </div>
        </div>

        {/* Story Progress */}
        <div className="bg-gray-800 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-3">
            <Book className="w-5 h-5 text-green-400" />
            <h3 className="font-semibold text-white">Lore</h3>
            <span className="text-xs bg-gray-700 px-2 py-1 rounded">
              {unlockedLore.length}/{loreEntries.length}
            </span>
          </div>
          <div className="space-y-2 max-h-32 overflow-y-auto">
            {unlockedLore.length > 0 ? (
              unlockedLore.slice(0, 3).map((lore) => (
                <div key={lore.id} className="flex items-start gap-2">
                  <Book className="w-4 h-4 text-green-400 mt-0.5 flex-shrink-0" />
                  <div>
                    <div className="text-sm font-medium text-white">{lore.title}</div>
                    <div className="text-xs text-gray-400 capitalize">{lore.category.replace('_', ' ')}</div>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-sm text-gray-500">No lore entries discovered</div>
            )}
            {unlockedLore.length > 3 && (
              <div className="text-xs text-gray-400">+{unlockedLore.length - 3} more...</div>
            )}
          </div>
        </div>
      </div>

      {/* Player Titles */}
      {playerTitles.length > 0 && (
        <div className="mt-6 bg-gray-800 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-3">
            <Crown className="w-5 h-5 text-yellow-400" />
            <h3 className="font-semibold text-white">Titles</h3>
          </div>
          <div className="flex flex-wrap gap-2">
            {playerTitles.map((title, index) => (
              <span
                key={index}
                className="px-3 py-1 bg-gradient-to-r from-yellow-600 to-yellow-500 text-white text-sm font-medium rounded-full"
              >
                {title.title}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default ProgressionPanel;