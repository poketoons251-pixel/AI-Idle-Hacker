import React, { useState } from 'react';
import { 
  ShoppingCart, 
  TrendingUp, 
  TrendingDown, 
  Clock, 
  Users, 
  Star, 
  Filter,
  Search,
  Package,
  Zap,
  Shield,
  Brain,
  Cpu,
  HardDrive,
  Wifi
} from 'lucide-react';
import { useGameStore } from '../store/gameStore';

interface MarketItem {
  id: string;
  name: string;
  description: string;
  price: number;
  category: 'software' | 'hardware' | 'data' | 'service';
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
  seller: string;
  rating: number;
  reviews: number;
  timeLeft: string;
  trending: 'up' | 'down' | 'stable';
  discount?: number;
  icon: React.ComponentType<any>;
  effect: string;
}

const marketItems: MarketItem[] = [
  {
    id: '1',
    name: 'Neural Bypass Kit',
    description: 'Advanced AI-assisted hacking toolkit that increases success rates by 25%',
    price: 2500,
    category: 'software',
    rarity: 'epic',
    seller: 'CyberNinja_X',
    rating: 4.8,
    reviews: 127,
    timeLeft: '2h 15m',
    trending: 'up',
    discount: 15,
    icon: Brain,
    effect: '+25% Hacking Success Rate'
  },
  {
    id: '2',
    name: 'Quantum Processor',
    description: 'Military-grade quantum processing unit for complex calculations',
    price: 5000,
    category: 'hardware',
    rarity: 'legendary',
    seller: 'QuantumDealer',
    rating: 4.9,
    reviews: 89,
    timeLeft: '1h 42m',
    trending: 'up',
    icon: Cpu,
    effect: '+50% Processing Speed'
  },
  {
    id: '3',
    name: 'Stealth Protocol v3.0',
    description: 'Latest stealth technology to avoid detection during operations',
    price: 1800,
    category: 'software',
    rarity: 'rare',
    seller: 'GhostInShell',
    rating: 4.6,
    reviews: 203,
    timeLeft: '4h 33m',
    trending: 'stable',
    discount: 10,
    icon: Shield,
    effect: '+30% Stealth Rating'
  },
  {
    id: '4',
    name: 'Corporate Database Access',
    description: 'Leaked credentials for major corporate networks',
    price: 3200,
    category: 'data',
    rarity: 'epic',
    seller: 'DataBroker_99',
    rating: 4.4,
    reviews: 156,
    timeLeft: '6h 18m',
    trending: 'down',
    icon: HardDrive,
    effect: 'Unlock Premium Targets'
  },
  {
    id: '5',
    name: 'Network Amplifier',
    description: 'Boosts network connection speed and bandwidth',
    price: 1200,
    category: 'hardware',
    rarity: 'common',
    seller: 'TechSupplier',
    rating: 4.2,
    reviews: 341,
    timeLeft: '12h 05m',
    trending: 'stable',
    icon: Wifi,
    effect: '+20% Network Speed'
  },
  {
    id: '6',
    name: 'AI Companion Upgrade',
    description: 'Enhanced AI assistant with advanced automation capabilities',
    price: 4500,
    category: 'service',
    rarity: 'legendary',
    seller: 'AIForge_Labs',
    rating: 4.7,
    reviews: 78,
    timeLeft: '3h 27m',
    trending: 'up',
    icon: Brain,
    effect: '+40% Automation Efficiency'
  }
];

const rarityColors = {
  common: 'text-gray-400 border-gray-400',
  rare: 'text-blue-400 border-blue-400',
  epic: 'text-purple-400 border-purple-400',
  legendary: 'text-yellow-400 border-yellow-400'
};

const categoryIcons = {
  software: Brain,
  hardware: Cpu,
  data: HardDrive,
  service: Users
};

const MarketItemCard: React.FC<{ item: MarketItem }> = ({ item }) => {
  const { player, spendCredits, addNotification } = useGameStore();
  const [isPurchasing, setIsPurchasing] = useState(false);
  
  const Icon = item.icon;
  const CategoryIcon = categoryIcons[item.category];
  const canAfford = player.credits >= item.price;
  const finalPrice = item.discount ? Math.floor(item.price * (1 - item.discount / 100)) : item.price;
  
  const handlePurchase = async () => {
    if (!canAfford || isPurchasing) return;
    
    setIsPurchasing(true);
    
    // Simulate purchase delay
    setTimeout(() => {
      if (spendCredits(finalPrice)) {
        addNotification(`Successfully purchased ${item.name}!`, 'success');
        addNotification(item.effect, 'info');
      }
      setIsPurchasing(false);
    }, 1000);
  };
  
  return (
    <div className={`cyber-card hover:border-cyber-primary/60 transition-all duration-300 ${rarityColors[item.rarity].split(' ')[1]}/20`}>
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-cyber-primary/20 rounded-lg">
            <Icon className="w-6 h-6 text-cyber-primary" />
          </div>
          <div>
            <h3 className="font-cyber font-bold text-cyber-primary">
              {item.name}
            </h3>
            <div className="flex items-center space-x-2">
              <CategoryIcon className="w-3 h-3 text-cyber-primary/60" />
              <span className="text-xs text-cyber-primary/60 font-mono capitalize">
                {item.category}
              </span>
              <span className={`text-xs font-mono uppercase px-1 py-0.5 rounded border ${rarityColors[item.rarity]}`}>
                {item.rarity}
              </span>
            </div>
          </div>
        </div>
        
        <div className="text-right">
          {item.trending === 'up' && <TrendingUp className="w-4 h-4 text-green-400" />}
          {item.trending === 'down' && <TrendingDown className="w-4 h-4 text-red-400" />}
          {item.discount && (
            <span className="text-xs bg-cyber-warning text-cyber-dark px-1 py-0.5 rounded font-mono">
              -{item.discount}%
            </span>
          )}
        </div>
      </div>
      
      {/* Description */}
      <p className="text-sm text-cyber-primary/70 mb-4">
        {item.description}
      </p>
      
      {/* Effect */}
      <div className="mb-4 p-2 bg-cyber-primary/5 rounded border border-cyber-primary/20">
        <p className="text-sm text-cyber-accent font-mono">
          <Zap className="w-3 h-3 inline mr-1" />
          {item.effect}
        </p>
      </div>
      
      {/* Seller Info */}
      <div className="flex items-center justify-between mb-4 text-xs">
        <div className="flex items-center space-x-2">
          <Users className="w-3 h-3 text-cyber-primary/60" />
          <span className="text-cyber-primary/60 font-mono">{item.seller}</span>
        </div>
        <div className="flex items-center space-x-1">
          <Star className="w-3 h-3 text-cyber-warning fill-current" />
          <span className="text-cyber-primary/80 font-mono">
            {item.rating} ({item.reviews})
          </span>
        </div>
      </div>
      
      {/* Time Left */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-1 text-xs text-cyber-primary/60">
          <Clock className="w-3 h-3" />
          <span className="font-mono">{item.timeLeft} left</span>
        </div>
      </div>
      
      {/* Price and Purchase */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div>
            {item.discount && (
              <span className="text-sm text-cyber-primary/50 line-through font-mono">
                {item.price.toLocaleString()}
              </span>
            )}
            <span className="text-lg font-bold text-cyber-accent font-mono ml-2">
              {finalPrice.toLocaleString()} credits
            </span>
          </div>
        </div>
        
        <button
          onClick={handlePurchase}
          disabled={!canAfford || isPurchasing}
          className={`
            w-full flex items-center justify-center space-x-2 p-3 rounded border transition-all duration-300
            ${canAfford && !isPurchasing
              ? 'border-cyber-primary text-cyber-primary hover:bg-cyber-primary hover:text-cyber-dark cyber-button'
              : 'border-cyber-primary/20 text-cyber-primary/40 cursor-not-allowed'
            }
          `}
        >
          <ShoppingCart className="w-4 h-4" />
          <span className="font-mono text-sm uppercase">
            {isPurchasing ? 'Processing...' : canAfford ? 'Purchase' : 'Insufficient Credits'}
          </span>
        </button>
      </div>
    </div>
  );
};

const FilterBar: React.FC<{
  selectedCategory: string;
  selectedRarity: string;
  searchTerm: string;
  onCategoryChange: (category: string) => void;
  onRarityChange: (rarity: string) => void;
  onSearchChange: (term: string) => void;
}> = ({ selectedCategory, selectedRarity, searchTerm, onCategoryChange, onRarityChange, onSearchChange }) => {
  return (
    <div className="cyber-card">
      <div className="flex flex-col md:flex-row gap-4">
        {/* Search */}
        <div className="flex-1">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-cyber-primary/60" />
            <input
              type="text"
              placeholder="Search marketplace..."
              value={searchTerm}
              onChange={(e) => onSearchChange(e.target.value)}
              className="cyber-input pl-10"
            />
          </div>
        </div>
        
        {/* Category Filter */}
        <select
          value={selectedCategory}
          onChange={(e) => onCategoryChange(e.target.value)}
          className="cyber-input"
        >
          <option value="all">All Categories</option>
          <option value="software">Software</option>
          <option value="hardware">Hardware</option>
          <option value="data">Data</option>
          <option value="service">Service</option>
        </select>
        
        {/* Rarity Filter */}
        <select
          value={selectedRarity}
          onChange={(e) => onRarityChange(e.target.value)}
          className="cyber-input"
        >
          <option value="all">All Rarities</option>
          <option value="common">Common</option>
          <option value="rare">Rare</option>
          <option value="epic">Epic</option>
          <option value="legendary">Legendary</option>
        </select>
      </div>
    </div>
  );
};

export const Marketplace: React.FC = () => {
  const { player } = useGameStore();
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedRarity, setSelectedRarity] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  
  const filteredItems = marketItems.filter(item => {
    const matchesCategory = selectedCategory === 'all' || item.category === selectedCategory;
    const matchesRarity = selectedRarity === 'all' || item.rarity === selectedRarity;
    const matchesSearch = searchTerm === '' || 
      item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.description.toLowerCase().includes(searchTerm.toLowerCase());
    
    return matchesCategory && matchesRarity && matchesSearch;
  });
  
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center space-y-2">
        <h1 className="text-4xl font-cyber font-bold text-cyber-primary cyber-text-glow">
          BLACK MARKET
        </h1>
        <p className="text-cyber-primary/60 font-mono">
          Trade rare items and upgrade your arsenal
        </p>
        <div className="flex justify-center items-center space-x-4 mt-4">
          <div className="flex items-center space-x-2">
            <Package className="w-5 h-5 text-cyber-accent" />
            <span className="font-mono text-cyber-accent">
              Available: {player.credits.toLocaleString()} credits
            </span>
          </div>
        </div>
      </div>
      
      {/* Filters */}
      <FilterBar 
        selectedCategory={selectedCategory}
        selectedRarity={selectedRarity}
        searchTerm={searchTerm}
        onCategoryChange={setSelectedCategory}
        onRarityChange={setSelectedRarity}
        onSearchChange={setSearchTerm}
      />
      
      {/* Market Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="cyber-card text-center">
          <Package className="w-6 h-6 text-cyber-primary mx-auto mb-2" />
          <p className="text-sm text-cyber-primary/80 font-mono">Total Items</p>
          <p className="text-xl font-bold text-cyber-secondary">{marketItems.length}</p>
        </div>
        <div className="cyber-card text-center">
          <TrendingUp className="w-6 h-6 text-green-400 mx-auto mb-2" />
          <p className="text-sm text-cyber-primary/80 font-mono">Trending Up</p>
          <p className="text-xl font-bold text-green-400">
            {marketItems.filter(item => item.trending === 'up').length}
          </p>
        </div>
        <div className="cyber-card text-center">
          <Star className="w-6 h-6 text-cyber-warning mx-auto mb-2" />
          <p className="text-sm text-cyber-primary/80 font-mono">Avg Rating</p>
          <p className="text-xl font-bold text-cyber-warning">
            {(marketItems.reduce((sum, item) => sum + item.rating, 0) / marketItems.length).toFixed(1)}
          </p>
        </div>
        <div className="cyber-card text-center">
          <Filter className="w-6 h-6 text-cyber-accent mx-auto mb-2" />
          <p className="text-sm text-cyber-primary/80 font-mono">Filtered</p>
          <p className="text-xl font-bold text-cyber-accent">{filteredItems.length}</p>
        </div>
      </div>
      
      {/* Market Items */}
      <div className="space-y-4">
        <h2 className="text-xl font-cyber font-bold text-cyber-primary flex items-center space-x-2">
          <ShoppingCart className="w-6 h-6" />
          <span>Available Items</span>
        </h2>
        
        {filteredItems.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredItems.map(item => (
              <MarketItemCard key={item.id} item={item} />
            ))}
          </div>
        ) : (
          <div className="cyber-card text-center py-12">
            <Package className="w-12 h-12 text-cyber-primary/30 mx-auto mb-4" />
            <p className="text-cyber-primary/60 font-mono">No items match your current filters</p>
            <button
              onClick={() => {
                setSelectedCategory('all');
                setSelectedRarity('all');
                setSearchTerm('');
              }}
              className="mt-4 cyber-button"
            >
              Clear Filters
            </button>
          </div>
        )}
      </div>
    </div>
  );
};