import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  Home, 
  Target, 
  User, 
  Settings, 
  Zap,
  DollarSign,
  Star,
  Brain,
  HardDrive,
  Scroll,
  Users,
  MessageCircle,
  RefreshCw,
  Bot
} from 'lucide-react';
import { useGameStore } from '../store/gameStore';

const NavLink: React.FC<{
  to: string;
  icon: React.ComponentType<any>;
  children: React.ReactNode;
}> = ({ to, icon: Icon, children }) => {
  const location = useLocation();
  const isActive = location.pathname === to;
  
  return (
    <Link
      to={to}
      className={`
        flex items-center space-x-2 px-4 py-2 rounded-lg transition-all duration-200
        ${isActive 
          ? 'bg-cyber-accent/20 text-cyber-accent border border-cyber-accent/30 cyber-text-glow' 
          : 'text-cyber-primary/70 hover:text-cyber-primary hover:bg-cyber-primary/10'
        }
      `}
    >
      <Icon className="w-4 h-4" />
      <span className="font-mono text-sm">{children}</span>
    </Link>
  );
};

export const Navigation: React.FC = () => {
  const { player } = useGameStore();
  

  
  if (!player) {
    return (
      <nav className="cyber-card mb-6">
        <div className="flex items-center justify-center py-4">
          <div className="animate-pulse text-cyber-primary/60 font-mono text-sm">
            Loading neural interface...
          </div>
        </div>
      </nav>
    );
  }
  
  return (
    <nav className="cyber-card mb-6">
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
        {/* Player Stats */}
        <div className="flex items-center space-x-6">
          <div className="flex items-center space-x-2">
            <DollarSign className="w-4 h-4 text-cyber-accent" />
            <span className="font-mono text-sm text-cyber-primary">
              {player.credits.toLocaleString()}
            </span>
          </div>
          
          <div className="flex items-center space-x-2">
            <Star className="w-4 h-4 text-cyber-secondary" />
            <span className="font-mono text-sm text-cyber-primary">
              Level {player.level}
            </span>
          </div>
          
          <div className="flex items-center space-x-3">
            <Zap className="w-4 h-4 text-cyber-warning" />
            <div className="flex items-center space-x-2">
              <div className="w-24 h-2 bg-cyber-dark rounded-full overflow-hidden border border-cyber-primary/30">
                <div 
                  className="h-full bg-gradient-to-r from-cyber-warning to-cyber-accent transition-all duration-300"
                  style={{ width: `${(player.energy / player.maxEnergy) * 100}%` }}
                />
              </div>
              <span className="font-mono text-xs text-cyber-primary">
                {player.energy}/{player.maxEnergy}
              </span>
            </div>
          </div>
        </div>
        
        {/* Navigation Links */}
        <div className="flex flex-wrap gap-2">
          <NavLink to="/" icon={Home}>Dashboard</NavLink>
          <NavLink to="/operations" icon={Target}>Operations</NavLink>
          <NavLink to="/character" icon={User}>Character</NavLink>
          <NavLink to="/equipment" icon={HardDrive}>Equipment</NavLink>
          <NavLink to="/quests" icon={Scroll}>Quests</NavLink>
          <NavLink to="/ai-autoplay" icon={Brain}>AI Autoplay</NavLink>
          <NavLink to="/guild" icon={Users}>Guild</NavLink>
          <NavLink to="/ai-companions" icon={Bot}>AI Companions</NavLink>
          <NavLink to="/social" icon={MessageCircle}>Social</NavLink>
          <NavLink to="/sync" icon={RefreshCw}>Sync</NavLink>
          <NavLink to="/settings" icon={Settings}>Settings</NavLink>
        </div>
      </div>
    </nav>
  );
};