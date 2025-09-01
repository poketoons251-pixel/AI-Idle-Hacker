import React, { useState } from 'react';
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
  Minus
} from 'lucide-react';
import { useGameStore } from '../store/gameStore';

interface LeaderboardEntry {
  rank: number;
  username: string;
  level: number;
  reputation: number;
  totalCredits: number;
  operationsCompleted: number;
  successRate: number;
  lastActive: string;
  change: 'up' | 'down' | 'same';
  changeAmount: number;
  isCurrentPlayer?: boolean;
}

const mockLeaderboardData: LeaderboardEntry[] = [
  {
    rank: 1,
    username: 'CyberGhost_Prime',
    level: 47,
    reputation: 9850,
    totalCredits: 2450000,
    operationsCompleted: 1247,
    successRate: 98.5,
    lastActive: '2 minutes ago',
    change: 'same',
    changeAmount: 0
  },
  {
    rank: 2,
    username: 'QuantumHacker',
    level: 45,
    reputation: 9720,
    totalCredits: 2380000,
    operationsCompleted: 1198,
    successRate: 97.8,
    lastActive: '15 minutes ago',
    change: 'up',
    changeAmount: 1
  },
  {
    rank: 3,
    username: 'NeonSamurai',
    level: 44,
    reputation: 9650,
    totalCredits: 2320000,
    operationsCompleted: 1156,
    successRate: 96.9,
    lastActive: '1 hour ago',
    change: 'down',
    changeAmount: 1
  },
  {
    rank: 4,
    username: 'DataViper',
    level: 43,
    reputation: 9480,
    totalCredits: 2180000,
    operationsCompleted: 1089,
    successRate: 95.7,
    lastActive: '3 hours ago',
    change: 'up',
    changeAmount: 2
  },
  {
    rank: 5,
    username: 'ShadowBreaker',
    level: 42,
    reputation: 9350,
    totalCredits: 2050000,
    operationsCompleted: 1034,
    successRate: 94.8,
    lastActive: '5 hours ago',
    change: 'down',
    changeAmount: 1
  },
  {
    rank: 6,
    username: 'EliteHacker_X',
    level: 41,
    reputation: 9200,
    totalCredits: 1980000,
    operationsCompleted: 987,
    successRate: 93.5,
    lastActive: '8 hours ago',
    change: 'same',
    changeAmount: 0
  },
  {
    rank: 7,
    username: 'CyberNinja_99',
    level: 40,
    reputation: 9050,
    totalCredits: 1890000,
    operationsCompleted: 945,
    successRate: 92.3,
    lastActive: '12 hours ago',
    change: 'up',
    changeAmount: 3
  },
  {
    rank: 8,
    username: 'DigitalPhantom',
    level: 39,
    reputation: 8900,
    totalCredits: 1820000,
    operationsCompleted: 898,
    successRate: 91.7,
    lastActive: '1 day ago',
    change: 'down',
    changeAmount: 2
  },
  {
    rank: 9,
    username: 'CodeBreaker_AI',
    level: 38,
    reputation: 8750,
    totalCredits: 1750000,
    operationsCompleted: 856,
    successRate: 90.8,
    lastActive: '1 day ago',
    change: 'same',
    changeAmount: 0
  },
  {
    rank: 10,
    username: 'You',
    level: 1,
    reputation: 100,
    totalCredits: 1000,
    operationsCompleted: 0,
    successRate: 0,
    lastActive: 'Now',
    change: 'same',
    changeAmount: 0,
    isCurrentPlayer: true
  }
];

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

const LeaderboardEntry: React.FC<{ entry: LeaderboardEntry; sortBy: string }> = ({ entry, sortBy }) => {
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
  
  // Update current player data in leaderboard
  const leaderboardData = mockLeaderboardData.map(entry => {
    if (entry.isCurrentPlayer) {
      return {
        ...entry,
        level: player.level,
        reputation: player.reputation,
        totalCredits: player.credits,
        // These would come from actual game state in a real implementation
        operationsCompleted: 0,
        successRate: 0
      };
    }
    return entry;
  });
  
  const sortedData = [...leaderboardData].sort((a, b) => {
    switch (sortBy) {
      case 'reputation': return b.reputation - a.reputation;
      case 'credits': return b.totalCredits - a.totalCredits;
      case 'operations': return b.operationsCompleted - a.operationsCompleted;
      case 'success': return b.successRate - a.successRate;
      default: return b.level - a.level;
    }
  });
  
  const currentPlayerRank = sortedData.findIndex(entry => entry.isCurrentPlayer) + 1;
  
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
          value={`#${currentPlayerRank}`} 
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
        {sortedData.map((entry, index) => (
          <LeaderboardEntry 
            key={entry.username} 
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
            <p className="text-sm text-cyber-primary/70">CyberGhost_Prime</p>
            <p className="text-xs text-cyber-primary/60 font-mono">Fastest operation: 0.3s</p>
          </div>
          
          <div className="text-center space-y-2">
            <Target className="w-8 h-8 text-cyber-secondary mx-auto" />
            <h3 className="font-cyber text-cyber-primary">Perfect Strike</h3>
            <p className="text-sm text-cyber-primary/70">QuantumHacker</p>
            <p className="text-xs text-cyber-primary/60 font-mono">100% success rate (50 ops)</p>
          </div>
          
          <div className="text-center space-y-2">
            <Clock className="w-8 h-8 text-cyber-accent mx-auto" />
            <h3 className="font-cyber text-cyber-primary">Night Owl</h3>
            <p className="text-sm text-cyber-primary/70">NeonSamurai</p>
            <p className="text-xs text-cyber-primary/60 font-mono">72 hours active time</p>
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
              Next reset: 3 days, 14 hours, 27 minutes
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};