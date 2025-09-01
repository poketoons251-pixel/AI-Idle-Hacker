import React from 'react';
import { useGameStore } from '../../store/gameStore';
import { Settings, Target, Zap, Shield, TrendingUp } from 'lucide-react';

export const StrategyConfigurator: React.FC = () => {
  const { aiConfig, updateAIConfig } = useGameStore();

  const handlePriorityChange = (key: keyof typeof aiConfig.priorities, value: number) => {
    updateAIConfig({
      priorities: {
        ...aiConfig.priorities,
        [key]: value / 100,
      },
    });
  };

  const handleRiskToleranceChange = (value: number) => {
    updateAIConfig({ riskTolerance: value / 100 });
  };

  const handleResourceAllocationChange = (key: keyof typeof aiConfig.resourceAllocation, value: number) => {
    updateAIConfig({
      resourceAllocation: {
        ...aiConfig.resourceAllocation,
        [key]: value / 100,
      },
    });
  };

  const handleToggleChange = (key: keyof typeof aiConfig, value: boolean) => {
    updateAIConfig({ [key]: value });
  };

  const SliderComponent: React.FC<{
    label: string;
    value: number;
    onChange: (value: number) => void;
    icon: React.ReactNode;
    color: string;
    description: string;
  }> = ({ label, value, onChange, icon, color, description }) => (
    <div className="bg-gray-900/50 border border-gray-700 rounded-lg p-4">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center space-x-2">
          <div className={`text-${color}-400`}>{icon}</div>
          <span className="font-semibold text-white">{label}</span>
        </div>
        <span className={`text-${color}-400 font-bold`}>{Math.round(value)}%</span>
      </div>
      
      <div className="mb-3">
        <input
          type="range"
          min="0"
          max="100"
          value={value}
          onChange={(e) => onChange(Number(e.target.value))}
          className={`w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer slider-${color}`}
        />
      </div>
      
      <p className="text-sm text-gray-400">{description}</p>
    </div>
  );

  const ToggleComponent: React.FC<{
    label: string;
    value: boolean;
    onChange: (value: boolean) => void;
    description: string;
  }> = ({ label, value, onChange, description }) => (
    <div className="bg-gray-900/50 border border-gray-700 rounded-lg p-4">
      <div className="flex items-center justify-between mb-2">
        <span className="font-semibold text-white">{label}</span>
        <button
          onClick={() => onChange(!value)}
          className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
            value ? 'bg-cyber-accent' : 'bg-gray-600'
          }`}
        >
          <span
            className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
              value ? 'translate-x-6' : 'translate-x-1'
            }`}
          />
        </button>
      </div>
      <p className="text-sm text-gray-400">{description}</p>
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Priority Settings */}
      <div>
        <h3 className="text-lg font-bold text-cyber-accent mb-4 flex items-center space-x-2">
          <Target className="w-5 h-5" />
          <span>AI Priorities</span>
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <SliderComponent
            label="Operations"
            value={aiConfig.priorities.operations * 100}
            onChange={(value) => handlePriorityChange('operations', value)}
            icon={<Zap className="w-4 h-4" />}
            color="cyber-accent"
            description="How often the AI should start new hacking operations"
          />
          
          <SliderComponent
            label="Upgrades"
            value={aiConfig.priorities.upgrades * 100}
            onChange={(value) => handlePriorityChange('upgrades', value)}
            icon={<TrendingUp className="w-4 h-4" />}
            color="cyber-primary"
            description="Priority for upgrading equipment and skills"
          />
          
          <SliderComponent
            label="Skills"
            value={aiConfig.priorities.skills * 100}
            onChange={(value) => handlePriorityChange('skills', value)}
            icon={<Shield className="w-4 h-4" />}
            color="cyber-secondary"
            description="Focus on improving character skills and abilities"
          />
          
          <SliderComponent
            label="Equipment"
            value={aiConfig.priorities.equipment * 100}
            onChange={(value) => handlePriorityChange('equipment', value)}
            icon={<Settings className="w-4 h-4" />}
            color="cyber-warning"
            description="Priority for acquiring and managing equipment"
          />
        </div>
      </div>

      {/* Risk Tolerance */}
      <div>
        <h3 className="text-lg font-bold text-cyber-accent mb-4 flex items-center space-x-2">
          <Shield className="w-5 h-5" />
          <span>Risk Management</span>
        </h3>
        
        <SliderComponent
          label="Risk Tolerance"
          value={aiConfig.riskTolerance * 100}
          onChange={handleRiskToleranceChange}
          icon={<Shield className="w-4 h-4" />}
          color="cyber-danger"
          description="How risky operations the AI should attempt (higher = more challenging targets)"
        />
      </div>

      {/* Resource Allocation */}
      <div>
        <h3 className="text-lg font-bold text-cyber-accent mb-4 flex items-center space-x-2">
          <TrendingUp className="w-5 h-5" />
          <span>Resource Allocation</span>
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <SliderComponent
            label="Credits for Operations"
            value={aiConfig.resourceAllocation.operations * 100}
            onChange={(value) => handleResourceAllocationChange('operations', value)}
            icon={<Zap className="w-4 h-4" />}
            color="cyber-accent"
            description="Percentage of credits to spend on operations"
          />
          
          <SliderComponent
            label="Credits for Upgrades"
            value={aiConfig.resourceAllocation.upgrades * 100}
            onChange={(value) => handleResourceAllocationChange('upgrades', value)}
            icon={<TrendingUp className="w-4 h-4" />}
            color="green"
            description="Percentage of credits to spend on upgrades"
          />
          
          <SliderComponent
            label="Credits for Equipment"
            value={aiConfig.resourceAllocation.equipment * 100}
            onChange={(value) => handleResourceAllocationChange('equipment', value)}
            icon={<Settings className="w-4 h-4" />}
            color="yellow"
            description="Percentage of credits to spend on equipment"
          />
          
          <SliderComponent
            label="Emergency Reserve"
            value={aiConfig.resourceAllocation.reserve * 100}
            onChange={(value) => handleResourceAllocationChange('reserve', value)}
            icon={<Shield className="w-4 h-4" />}
            color="purple"
            description="Percentage of credits to keep as emergency reserve"
          />
        </div>
      </div>

      {/* Automation Settings */}
      <div>
        <h3 className="text-lg font-bold text-cyber-accent mb-4 flex items-center space-x-2">
          <Settings className="w-5 h-5" />
          <span>Automation Settings</span>
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <ToggleComponent
            label="Auto Upgrade Equipment"
            value={aiConfig.autoUpgrade}
            onChange={(value) => handleToggleChange('autoUpgrade', value)}
            description="Automatically upgrade equipment when beneficial"
          />
          
          <ToggleComponent
            label="Smart Energy Management"
            value={aiConfig.energyManagement}
            onChange={(value) => handleToggleChange('energyManagement', value)}
            description="Optimize energy usage for maximum efficiency"
          />
        </div>
      </div>

      {/* Strategy Presets */}
      <div>
        <h3 className="text-lg font-bold text-cyber-accent mb-4">Strategy Presets</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <button
            onClick={() => updateAIConfig({
              priorities: { operations: 0.8, upgrades: 0.3, skills: 0.4, equipment: 0.2 },
              riskTolerance: 0.7,
              resourceAllocation: { operations: 0.6, upgrades: 0.2, equipment: 0.1, reserve: 0.1 },
            })}
            className="bg-red-900/30 border border-cyber-danger text-cyber-danger rounded-lg p-4 hover:bg-red-900/50 transition-all duration-300"
          >
            <div className="font-bold mb-2">AGGRESSIVE</div>
            <div className="text-sm">High risk, high reward operations</div>
          </button>
          
          <button
            onClick={() => updateAIConfig({
              priorities: { operations: 0.5, upgrades: 0.6, skills: 0.7, equipment: 0.4 },
              riskTolerance: 0.4,
              resourceAllocation: { operations: 0.3, upgrades: 0.4, equipment: 0.2, reserve: 0.1 },
            })}
            className="bg-blue-900/30 border border-cyber-accent text-cyber-accent rounded-lg p-4 hover:bg-blue-900/50 transition-all duration-300"
          >
            <div className="font-bold mb-2">BALANCED</div>
            <div className="text-sm">Steady growth and moderate risk</div>
          </button>
          
          <button
            onClick={() => updateAIConfig({
              priorities: { operations: 0.3, upgrades: 0.8, skills: 0.9, equipment: 0.6 },
              riskTolerance: 0.2,
              resourceAllocation: { operations: 0.2, upgrades: 0.5, equipment: 0.2, reserve: 0.1 },
            })}
            className="bg-green-900/30 border border-cyber-primary text-cyber-primary rounded-lg p-4 hover:bg-green-900/50 transition-all duration-300"
          >
            <div className="font-bold mb-2">CONSERVATIVE</div>
            <div className="text-sm">Safe upgrades and skill building</div>
          </button>
        </div>
      </div>
    </div>
  );
};

// Add custom CSS for sliders
const style = document.createElement('style');
style.textContent = `
  .slider-cyber-accent::-webkit-slider-thumb {
    appearance: none;
    height: 20px;
    width: 20px;
    border-radius: 50%;
    background: #00d4ff;
    cursor: pointer;
    box-shadow: 0 0 10px #00d4ff;
  }
  
  .slider-cyber-primary::-webkit-slider-thumb {
    appearance: none;
    height: 20px;
    width: 20px;
    border-radius: 50%;
    background: #00ff88;
    cursor: pointer;
    box-shadow: 0 0 10px #00ff88;
  }
  
  .slider-cyber-secondary::-webkit-slider-thumb {
    appearance: none;
    height: 20px;
    width: 20px;
    border-radius: 50%;
    background: #8844ff;
    cursor: pointer;
    box-shadow: 0 0 10px #8844ff;
  }
  
  .slider-cyber-warning::-webkit-slider-thumb {
    appearance: none;
    height: 20px;
    width: 20px;
    border-radius: 50%;
    background: #ffaa00;
    cursor: pointer;
    box-shadow: 0 0 10px #ffaa00;
  }
  
  .slider-cyber-danger::-webkit-slider-thumb {
    appearance: none;
    height: 20px;
    width: 20px;
    border-radius: 50%;
    background: #ff4444;
    cursor: pointer;
    box-shadow: 0 0 10px #ff4444;
  }
`;
document.head.appendChild(style);