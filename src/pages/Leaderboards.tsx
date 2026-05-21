import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  Trophy,
  Medal,
  Crown,
  TrendingUp,
  Users,
  Zap,
  Target,
  Clock,
  Star,
  Award,
  ChevronUp,
  ChevronDown,
  Minus,
  RefreshCw,
  Link
} from 'lucide-react';
import { useGameStore } from '../store/gameStore';
import {
  getLeaderboard,
  getPlayerRank,
  subscribeToLeaderboard,
  updateLeaderboardEntry,
  type LeaderboardEntry,
} from '../lib/leaderboardService';
import { getAuthSession, isAnonymous } from '../lib/supabaseAuth';
import type { Session } from '@supabase/supabase-js';

const getRankIcon = (rank: number) => {
  switch (rank) {
    case 1:
      return <Crown className="w-6 h-6 text-yellow-400" />;
    case 2:
      return <Medal className="w-6 h-6 text-gray-300" />;
    case 3:
      return <Medal className="w-6 h-6 text-amber-600" />;
    default:
      return <span className="w-6 h-6 flex items-center justify-center text-cyber-primary/60 font-mono text-sm font-bold">#{rank}</span>;
  }
};

const getChangeIcon = (change: 'up' | 'down' | 'same', amount: number) => {
  switch (change) {
    case 'up':
      return (
        <div className="flex items-center space-x-1 text-green-400">
          <ChevronUp className="w-4 h-4" />
          <span className="text-xs font-mono">+{amount}</span>
        </div>
      );
    case 'down':
      return (
        <div className="flex items-center space-x-1 text-red-400">
          <ChevronDown className="w-4 h-4" />
          <span className="text-xs font-mono">-{amount}</span>
        </div>
      );
    default:
      return (
        <div className="flex items-center space-x-1 text-cyber-primary/40">
          <Minus className="w-4 h-4" />
          <span className="text-xs font-mono">0</span>
        </div>
      );
  }
};

const LeaderboardEntryComponent: React.FC<{ entry: LeaderboardEntry; sortBy: string }> = ({ entry, sortBy }) => {
  const getSortValue = () => {
    switch (sortBy) {
      case 'reputation': return entry.reputation.toLocaleString();
      case 'credits': return `${(entry.totalCredits / 1000000).toFixed(1)}M`;
      case 'operations': return entry.operationsCompleted.toLocaleString();
      case 'success': return `${entry.successRate}%`;
      default: return entry.level.toString();
    }
  };

  return (
    <div className={`
      cyber-card transition-all duration-300 hover:border-cyber-primary/60
      ${entry.isCurrentPlayer ? 'border-cyber-accent bg-cyber-accent/5' : ''}
    `}>
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          {/* Rank */}
          <div className="flex items-center space-x-2">
            {getRankIcon(entry.rank)}
            {getChangeIcon(entry.change, entry.changeAmount)}
          </div>

          {/* Player Info */}
          <div className="flex-1">
            <div className="flex items-center space-x-2">
              <h3 className={`font-cyber font-bold ${
                entry.isCurrentPlayer ? 'text-cyber-accent' : 'text-cyber-primary'
              }`}>
                {entry.username}
              </h3>
              {entry.isCurrentPlayer && (
                <span className="text-xs bg-cyber-accent text-cyber-dark px-2 py-1 rounded font-mono">
                  YOU
                </span>
              )}
            </div>
            <div className="flex items-center space-x-4 text-sm text-cyber-primary/60 font-mono">
              <span>Level {entry.level}</span>
              <span>•</span>
              <span>{entry.lastActive}</span>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="text-right">
          <p className="text-lg font-bold text-cyber-secondary font-mono">
            {getSortValue()}
          </p>
          <p className="text-xs text-cyber-primary/60 font-mono">
            {entry.successRate}% success rate
          </p>
        </div>
      </div>
    </div>
  );
};

const StatCard: React.FC<{
  title: string;
  value: string | number;
  icon: React.ComponentType<any>;
  color: string;
  subtitle?: string;
}> = ({ title, value, icon: Icon, color, subtitle }) => (
  <div className="cyber-card text-center">
    <Icon className={`w-8 h-8 ${color} mx-auto mb-2`} />
    <h3 className="font-mono text-sm uppercase tracking-wider text-cyber-primary/80 mb-1">
      {title}
    </h3>
    <p className={`text-2xl font-bold ${color} cyber-text-glow mb-1`}>
      {typeof value === 'number' ? value.toLocaleString() : value}
    </p>
    {subtitle && (
      <p className="text-xs text-cyber-primary/60">
        {subtitle}
      </p>
    )}
  </div>
);

export const Leaderboards: React.FC = () => {
  const { player } = useGameStore();
  const [sortBy, setSortBy] = useState('reputation');
  const [leaderboardData, setLeaderboardData] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [playerRank, setPlayerRank] = useState<number | null>(null);
  const [playerEntry, setPlayerEntry] = useState<LeaderboardEntry | null>(null);
  const [isAnon, setIsAnon] = useState(true);
  const [session, setSession] = useState<Session | null>(null);
  const subscriptionRef = useRef<{ unsubscribe: () => void } | null>(null);

  // Fetch leaderboard data
  const fetchLeaderboard = useCallback(async (category: string = 'overall') => {
    try {
      const data = await getLeaderboard(category, 50);
      setLeaderboardData(data);
      setError(null);
    } catch (e) {
      setError('Unable to load leaderboard');
      console.error('[Leaderboards] Failed to fetch:', e);
    }
  }, []);

  // Fetch player rank
  const fetchPlayerRank = useCallback(async () => {
    try {
      const { rank, entry } = await getPlayerRank();
      setPlayerRank(rank);
      setPlayerEntry(entry);
    } catch (e) {
      console.error('[Leaderboards] Failed to get player rank:', e);
    }
  }, []);

  // Submit player score to leaderboard
  const submitPlayerScore = useCallback(async () => {
    if (!session || isAnonymous(session)) return;

    const score = player.level * 1000 + player.reputation + Math.floor(player.credits / 10);

    try {
      await updateLeaderboardEntry({
        score,
        level: player.level,
        reputation: player.reputation,
        totalCredits: player.credits,
        operationsCompleted: 0,
      });
    } catch (e) {
      console.error('[Leaderboards] Failed to update entry:', e);
    }
  }, [session, player.level, player.reputation, player.credits]);

  // Check auth state on mount
  useEffect(() => {
    let mounted = true;

    const checkAuth = async () => {
      const sess = await getAuthSession();
      if (!mounted) return;
      setSession(sess);
      setIsAnon(!sess || isAnonymous(sess));
    };

    checkAuth();

    return () => { mounted = false; };
  }, []);

  // Load data on mount and when sortBy changes
  useEffect(() => {
    if (isAnon) {
      setLoading(false);
      return;
    }

    setLoading(true);

    Promise.all([
      fetchLeaderboard(),
      fetchPlayerRank(),
    ]).finally(() => {
      setLoading(false);
    });
  }, [sortBy, isAnon, fetchLeaderboard, fetchPlayerRank]);

  // Set up realtime subscription
  useEffect(() => {
    if (isAnon) return;

    const { unsubscribe } = subscribeToLeaderboard('overall', () => {
      // Refetch data on any leaderboard change
      fetchLeaderboard();
      fetchPlayerRank();
    });

    subscriptionRef.current = { unsubscribe };

    return () => {
      unsubscribe();
      subscriptionRef.current = null;
    };
  }, [isAnon, fetchLeaderboard, fetchPlayerRank]);

  // Auto-submit player score when milestones change
  useEffect(() => {
    if (isAnon || !session) return;
    submitPlayerScore();
  }, [player.level, player.reputation, player.credits, isAnon, session, submitPlayerScore]);

  // Sort data for display
  const sortedData = [...leaderboardData].sort((a, b) => {
    switch (sortBy) {
      case 'reputation': return b.reputation - a.reputation;
      case 'credits': return b.totalCredits - a.totalCredits;
      case 'operations': return b.operationsCompleted - a.operationsCompleted;
      case 'success': return b.successRate - a.successRate;
      default: return b.level - a.level;
    }
  });

  // Mark current player entry
  const displayData = sortedData.map(entry => ({
    ...entry,
    isCurrentPlayer: playerEntry ? entry.username === playerEntry.username : false,
  }));

  // Loading state
  if (loading) {
    return (
      <div className="space-y-6">
        <div className="text-center space-y-2">
          <h1 className="text-4xl font-cyber font-bold text-cyber-primary cyber-text-glow">
            LEADERBOARDS
          </h1>
          <p className="text-cyber-primary/60 font-mono">
            Compete with elite hackers worldwide
          </p>
        </div>
        <div className="flex items-center justify-center py-20">
          <RefreshCw className="w-8 h-8 text-cyber-accent animate-spin" />
          <span className="ml-3 text-cyber-primary/60 font-mono">Loading leaderboard data...</span>
        </div>
      </div>
    );
  }

  // Anonymous user state
  if (isAnon) {
    return (
      <div className="space-y-6">
        <div className="text-center space-y-2">
          <h1 className="text-4xl font-cyber font-bold text-cyber-primary cyber-text-glow">
            LEADERBOARDS
          </h1>
          <p className="text-cyber-primary/60 font-mono">
            Compete with elite hackers worldwide
          </p>
        </div>
        <div className="cyber-card text-center py-16">
          <Link className="w-12 h-12 text-cyber-accent mx-auto mb-4" />
          <h2 className="text-xl font-cyber font-bold text-cyber-primary mb-2">
            Link Your Account
          </h2>
          <p className="text-cyber-primary/60 font-mono max-w-md mx-auto">
            Link your account to appear on leaderboards and compete with players worldwide.
          </p>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="space-y-6">
        <div className="text-center space-y-2">
          <h1 className="text-4xl font-cyber font-bold text-cyber-primary cyber-text-glow">
            LEADERBOARDS
          </h1>
          <p className="text-cyber-primary/60 font-mono">
            Compete with elite hackers worldwide
          </p>
        </div>
        <div className="cyber-card text-center py-16 border-cyber-warning">
          <h2 className="text-xl font-cyber font-bold text-cyber-warning mb-2">
            {error}
          </h2>
          <button
            onClick={() => {
              setLoading(true);
              fetchLeaderboard();
              fetchPlayerRank();
            }}
            className="cyber-button mt-4"
          >
            <RefreshCw className="w-4 h-4 inline mr-2" />
            Retry
          </button>
        </div>
      </div>
    );
  }

  // Empty state
  if (displayData.length === 0) {
    return (
      <div className="space-y-6">
        <div className="text-center space-y-2">
          <h1 className="text-4xl font-cyber font-bold text-cyber-primary cyber-text-glow">
            LEADERBOARDS
          </h1>
          <p className="text-cyber-primary/60 font-mono">
            Compete with elite hackers worldwide
          </p>
        </div>
        <div className="cyber-card text-center py-16">
          <Trophy className="w-12 h-12 text-cyber-primary/30 mx-auto mb-4" />
          <h2 className="text-xl font-cyber font-bold text-cyber-primary mb-2">
            No leaderboard data yet
          </h2>
          <p className="text-cyber-primary/60 font-mono">
            Be the first to claim your spot!
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center space-y-2">
        <h1 className="text-4xl font-cyber font-bold text-cyber-primary cyber-text-glow">
          LEADERBOARDS
        </h1>
        <p className="text-cyber-primary/60 font-mono">
          Compete with elite hackers worldwide
        </p>
      </div>

      {/* Player Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Your Rank"
          value={playerRank ? `#${playerRank}` : 'Unranked'}
          icon={Trophy}
          color="text-cyber-accent"
          subtitle="Global position"
        />
        <StatCard
          title="Reputation"
          value={player.reputation}
          icon={Star}
          color="text-cyber-warning"
          subtitle="Community standing"
        />
        <StatCard
          title="Level"
          value={player.level}
          icon={TrendingUp}
          color="text-cyber-secondary"
          subtitle="Experience tier"
        />
        <StatCard
          title="Credits"
          value={`${(player.credits / 1000).toFixed(0)}K`}
          icon={Zap}
          color="text-cyber-primary"
          subtitle="Total earned"
        />
      </div>

      {/* Sort Controls */}
      <div className="cyber-card">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center space-y-4 md:space-y-0">
          <h2 className="text-xl font-cyber font-bold text-cyber-primary flex items-center space-x-2">
            <Users className="w-6 h-6" />
            <span>Global Rankings</span>
          </h2>

          <div className="flex items-center space-x-2">
            <span className="text-sm text-cyber-primary/80 font-mono">Sort by:</span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="cyber-input"
            >
              <option value="reputation">Reputation</option>
              <option value="level">Level</option>
              <option value="credits">Credits</option>
              <option value="operations">Operations</option>
              <option value="success">Success Rate</option>
            </select>
          </div>
        </div>
      </div>

      {/* Leaderboard */}
      <div className="space-y-3">
        {displayData.map((entry, index) => (
          <LeaderboardEntryComponent
            key={`${entry.username}-${entry.rank}`}
            entry={{ ...entry, rank: index + 1 }}
            sortBy={sortBy}
          />
        ))}
      </div>

      {/* Achievement Showcase */}
      <div className="cyber-card">
        <h2 className="text-lg font-cyber font-bold text-cyber-primary mb-4 flex items-center space-x-2">
          <Award className="w-5 h-5" />
          <span>Top Achievements This Week</span>
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="text-center space-y-2">
            <Crown className="w-8 h-8 text-yellow-400 mx-auto" />
            <h3 className="font-cyber text-cyber-primary">Speed Demon</h3>
            <p className="text-sm text-cyber-primary/70">Top ranked player</p>
            <p className="text-xs text-cyber-primary/60 font-mono">Fastest operation: TBD</p>
          </div>

          <div className="text-center space-y-2">
            <Target className="w-8 h-8 text-cyber-secondary mx-auto" />
            <h3 className="font-cyber text-cyber-primary">Perfect Strike</h3>
            <p className="text-sm text-cyber-primary/70">Highest success rate</p>
            <p className="text-xs text-cyber-primary/60 font-mono">Coming soon</p>
          </div>

          <div className="text-center space-y-2">
            <Clock className="w-8 h-8 text-cyber-accent mx-auto" />
            <h3 className="font-cyber text-cyber-primary">Night Owl</h3>
            <p className="text-sm text-cyber-primary/70">Most active time</p>
            <p className="text-xs text-cyber-primary/60 font-mono">Coming soon</p>
          </div>
        </div>
      </div>

      {/* Competition Info */}
      <div className="cyber-card bg-cyber-primary/5">
        <h3 className="font-cyber font-bold text-cyber-accent mb-3 flex items-center space-x-2">
          <Trophy className="w-5 h-5" />
          <span>Weekly Competition</span>
        </h3>
        <div className="space-y-2">
          <p className="text-sm text-cyber-primary/70">
            • Top 3 players receive exclusive equipment upgrades
          </p>
          <p className="text-sm text-cyber-primary/70">
            • Weekly challenges unlock special achievements
          </p>
          <p className="text-sm text-cyber-primary/70">
            • Reputation points determine seasonal rewards
          </p>
          <div className="mt-4 p-2 bg-cyber-warning/10 rounded border border-cyber-warning/30">
            <p className="text-xs text-cyber-warning font-mono">
              Leaderboard updates in real-time
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
