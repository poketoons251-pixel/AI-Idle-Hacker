import React from 'react';
import { DollarSign, Star, Zap, TrendingUp } from 'lucide-react';
import { useGameStore } from '../store/gameStore';
import { useResourceFlash } from '../hooks/useResourceFlash';
import { AnimatedCounter } from './AnimatedCounter';
import { FloatingPopup } from './FloatingPopup';
import { AIToggle } from './AIToggle';

export const HudBar: React.FC = () => {
  // Individual Zustand selectors to prevent re-render storms
  // (per RESEARCH.md Section 6 — selector best practices)
  const credits = useGameStore((s) => s.player?.credits ?? 0);
  const level = useGameStore((s) => s.player?.level ?? 1);
  const energy = useGameStore((s) => s.player?.energy ?? 0);
  const maxEnergy = useGameStore((s) => s.player?.maxEnergy ?? 100);
  const reputation = useGameStore((s) => s.player?.reputation ?? 0);
  const experience = useGameStore((s) => s.player?.experience ?? 0);
  const username = useGameStore((s) => s.player?.username ?? 'Anonymous');
  const creditsPerSecond = useGameStore((s) => s.getCreditRate?.() ?? 0);

  // Resource flash detection
  const { creditFlash, repFlash, xpFlash, creditPopup, repPopup, xpPopup } = useResourceFlash();

  const energyPercent = maxEnergy > 0 ? (energy / maxEnergy) * 100 : 0;

  return (
    <div className="w-full bg-cyber-darker/90 backdrop-blur-sm border-b border-cyber-primary/30">
      <div className="container mx-auto px-4 py-2">
        <div className="flex items-center justify-between gap-4">
          {/* Title */}
          <div className="hidden sm:block font-cyber text-sm tracking-wider text-cyber-primary cyber-text-glow flex-shrink-0">
            AI IDLE HACKER
          </div>

          {/* Resource Counters */}
          <div className="flex items-center gap-6 flex-wrap">
            {/* Credits */}
            <div className="flex items-center gap-2 relative">
              <DollarSign className="w-4 h-4 text-cyber-accent flex-shrink-0" />
              <div className="relative">
                <div className="text-[10px] uppercase tracking-wider text-cyber-gray-lighter">
                  Credits
                </div>
                <div className="font-mono text-sm font-bold text-cyber-accent cyber-text-glow">
                  <AnimatedCounter value={credits} isFlashing={creditFlash} flashColor="green" />
                </div>
                <FloatingPopup value={creditPopup ?? 0} color="green" />
                <div className="flex items-center gap-1 text-[10px] text-cyber-accent/60 font-mono">
                  <span>+{creditsPerSecond}/sec</span>
                </div>
              </div>
            </div>

            {/* Level */}
            <div className="flex items-center gap-2">
              <Star className="w-4 h-4 text-cyber-secondary flex-shrink-0" />
              <div>
                <div className="text-[10px] uppercase tracking-wider text-cyber-gray-lighter">
                  Level
                </div>
                <div className="font-mono text-sm font-bold text-cyber-secondary cyber-text-glow">
                  {level}
                </div>
              </div>
            </div>

            {/* Experience */}
            <div className="flex items-center gap-2 relative">
              <Star className="w-4 h-4 text-cyber-secondary flex-shrink-0" />
              <div className="relative">
                <div className="text-[10px] uppercase tracking-wider text-cyber-gray-lighter">
                  XP
                </div>
                <div className="font-mono text-sm font-bold text-cyber-secondary cyber-text-glow">
                  <AnimatedCounter value={experience} isFlashing={xpFlash} flashColor="cyan" />
                </div>
                <FloatingPopup value={xpPopup ?? 0} color="cyan" />
              </div>
            </div>

            {/* Energy */}
            <div className="flex items-center gap-2">
              <Zap className="w-4 h-4 text-cyber-warning flex-shrink-0" />
              <div>
                <div className="text-[10px] uppercase tracking-wider text-cyber-gray-lighter">
                  Energy
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-mono text-sm font-bold text-cyber-warning cyber-text-glow">
                    {energy}/{maxEnergy}
                  </span>
                  <div className="w-16 h-1.5 bg-cyber-gray rounded-full overflow-hidden">
                    <div
                      className="h-full bg-cyber-warning transition-all duration-300"
                      style={{ width: `${energyPercent}%` }}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Reputation */}
            <div className="flex items-center gap-2 relative">
              <TrendingUp className="w-4 h-4 text-cyber-primary flex-shrink-0" />
              <div className="relative">
                <div className="text-[10px] uppercase tracking-wider text-cyber-gray-lighter">
                  Reputation
                </div>
                <div className="font-mono text-sm font-bold text-cyber-primary cyber-text-glow">
                  <AnimatedCounter value={reputation} isFlashing={repFlash} flashColor="pink" />
                </div>
                <FloatingPopup value={repPopup ?? 0} color="pink" />
              </div>
            </div>
          </div>

          {/* AI Auto-Play Toggle */}
          <AIToggle />

          {/* Username */}
          <div className="flex-shrink-0 font-mono text-xs text-cyber-gray-lighter">
            {username}
          </div>
        </div>
      </div>
    </div>
  );
};
