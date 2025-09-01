import React, { useState } from 'react';
import { 
  Settings as SettingsIcon, 
  Volume2, 
  VolumeX, 
  Monitor, 
  Palette, 
  Bell, 
  BellOff, 
  Save, 
  RotateCcw, 
  Download, 
  Upload, 
  Trash2, 
  Shield, 
  User, 
  Key,
  Eye,
  EyeOff,
  AlertTriangle
} from 'lucide-react';
import { useGameStore } from '../store/gameStore';

interface GameSettings {
  audio: {
    masterVolume: number;
    sfxVolume: number;
    musicVolume: number;
    muted: boolean;
  };
  display: {
    theme: 'dark' | 'light' | 'auto';
    animations: boolean;
    particleEffects: boolean;
    screenShake: boolean;
    fps: 30 | 60 | 120;
  };
  notifications: {
    operationComplete: boolean;
    levelUp: boolean;
    achievements: boolean;
    marketUpdates: boolean;
    energyFull: boolean;
  };
  gameplay: {
    autoSave: boolean;
    autoSaveInterval: 30 | 60 | 300;
    pauseOnBlur: boolean;
    confirmActions: boolean;
  };
  privacy: {
    shareStats: boolean;
    allowAnalytics: boolean;
    showOnLeaderboard: boolean;
  };
}

const defaultSettings: GameSettings = {
  audio: {
    masterVolume: 70,
    sfxVolume: 80,
    musicVolume: 60,
    muted: false
  },
  display: {
    theme: 'dark',
    animations: true,
    particleEffects: true,
    screenShake: true,
    fps: 60
  },
  notifications: {
    operationComplete: true,
    levelUp: true,
    achievements: true,
    marketUpdates: false,
    energyFull: true
  },
  gameplay: {
    autoSave: true,
    autoSaveInterval: 60,
    pauseOnBlur: true,
    confirmActions: true
  },
  privacy: {
    shareStats: true,
    allowAnalytics: false,
    showOnLeaderboard: true
  }
};

const SettingsSection: React.FC<{
  title: string;
  icon: React.ComponentType<any>;
  children: React.ReactNode;
}> = ({ title, icon: Icon, children }) => (
  <div className="cyber-card">
    <h2 className="text-lg font-cyber font-bold text-cyber-primary mb-4 flex items-center space-x-2">
      <Icon className="w-5 h-5" />
      <span>{title}</span>
    </h2>
    <div className="space-y-4">
      {children}
    </div>
  </div>
);

const SettingRow: React.FC<{
  label: string;
  description?: string;
  children: React.ReactNode;
}> = ({ label, description, children }) => (
  <div className="flex items-center justify-between py-2">
    <div className="flex-1">
      <h3 className="text-cyber-primary font-mono">{label}</h3>
      {description && (
        <p className="text-sm text-cyber-primary/60">{description}</p>
      )}
    </div>
    <div className="ml-4">
      {children}
    </div>
  </div>
);

const VolumeSlider: React.FC<{
  label: string;
  value: number;
  onChange: (value: number) => void;
  muted: boolean;
}> = ({ label, value, onChange, muted }) => (
  <SettingRow label={label}>
    <div className="flex items-center space-x-3">
      <input
        type="range"
        min="0"
        max="100"
        value={muted ? 0 : value}
        onChange={(e) => onChange(parseInt(e.target.value))}
        disabled={muted}
        className="w-24 accent-cyber-primary"
      />
      <span className="text-sm text-cyber-primary/80 font-mono w-8">
        {muted ? '0' : value}
      </span>
    </div>
  </SettingRow>
);

const Toggle: React.FC<{
  checked: boolean;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
}> = ({ checked, onChange, disabled = false }) => (
  <button
    onClick={() => !disabled && onChange(!checked)}
    disabled={disabled}
    className={`
      relative w-12 h-6 rounded-full transition-all duration-300
      ${checked ? 'bg-cyber-primary' : 'bg-cyber-primary/20'}
      ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
    `}
  >
    <div className={`
      absolute top-1 w-4 h-4 bg-white rounded-full transition-all duration-300
      ${checked ? 'left-7' : 'left-1'}
    `} />
  </button>
);

export const Settings: React.FC = () => {
  const { addNotification } = useGameStore();
  const [settings, setSettings] = useState<GameSettings>(defaultSettings);
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  
  const updateSetting = (section: keyof GameSettings, key: string, value: any) => {
    setSettings(prev => ({
      ...prev,
      [section]: {
        ...prev[section],
        [key]: value
      }
    }));
  };
  
  const handleSave = () => {
    // In a real app, this would save to localStorage or send to server
    addNotification('Settings saved successfully!', 'success');
  };
  
  const handleReset = () => {
    setSettings(defaultSettings);
    setShowResetConfirm(false);
    addNotification('Settings reset to defaults', 'info');
  };
  
  const handleExport = () => {
    const dataStr = JSON.stringify(settings, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'ai-idle-hacker-settings.json';
    link.click();
    addNotification('Settings exported successfully!', 'success');
  };
  
  const handleImport = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const importedSettings = JSON.parse(e.target?.result as string);
          setSettings(importedSettings);
          addNotification('Settings imported successfully!', 'success');
        } catch (error) {
          addNotification('Failed to import settings file', 'error');
        }
      };
      reader.readAsText(file);
    }
  };
  
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center space-y-2">
        <h1 className="text-4xl font-cyber font-bold text-cyber-primary cyber-text-glow">
          SYSTEM SETTINGS
        </h1>
        <p className="text-cyber-primary/60 font-mono">
          Configure your hacking environment
        </p>
      </div>
      
      {/* Audio Settings */}
      <SettingsSection title="Audio Configuration" icon={Volume2}>
        <SettingRow label="Master Audio">
          <Toggle 
            checked={!settings.audio.muted}
            onChange={(checked) => updateSetting('audio', 'muted', !checked)}
          />
        </SettingRow>
        
        <VolumeSlider 
          label="Master Volume"
          value={settings.audio.masterVolume}
          onChange={(value) => updateSetting('audio', 'masterVolume', value)}
          muted={settings.audio.muted}
        />
        
        <VolumeSlider 
          label="Sound Effects"
          value={settings.audio.sfxVolume}
          onChange={(value) => updateSetting('audio', 'sfxVolume', value)}
          muted={settings.audio.muted}
        />
        
        <VolumeSlider 
          label="Background Music"
          value={settings.audio.musicVolume}
          onChange={(value) => updateSetting('audio', 'musicVolume', value)}
          muted={settings.audio.muted}
        />
      </SettingsSection>
      
      {/* Display Settings */}
      <SettingsSection title="Display & Performance" icon={Monitor}>
        <SettingRow label="Theme" description="Visual appearance mode">
          <select
            value={settings.display.theme}
            onChange={(e) => updateSetting('display', 'theme', e.target.value)}
            className="cyber-input"
          >
            <option value="dark">Dark</option>
            <option value="light">Light</option>
            <option value="auto">Auto</option>
          </select>
        </SettingRow>
        
        <SettingRow label="Animations" description="Enable UI animations and transitions">
          <Toggle 
            checked={settings.display.animations}
            onChange={(checked) => updateSetting('display', 'animations', checked)}
          />
        </SettingRow>
        
        <SettingRow label="Particle Effects" description="Visual effects during operations">
          <Toggle 
            checked={settings.display.particleEffects}
            onChange={(checked) => updateSetting('display', 'particleEffects', checked)}
          />
        </SettingRow>
        
        <SettingRow label="Screen Shake" description="Camera shake on critical events">
          <Toggle 
            checked={settings.display.screenShake}
            onChange={(checked) => updateSetting('display', 'screenShake', checked)}
          />
        </SettingRow>
        
        <SettingRow label="Frame Rate" description="Target FPS for animations">
          <select
            value={settings.display.fps}
            onChange={(e) => updateSetting('display', 'fps', parseInt(e.target.value))}
            className="cyber-input"
          >
            <option value={30}>30 FPS</option>
            <option value={60}>60 FPS</option>
            <option value={120}>120 FPS</option>
          </select>
        </SettingRow>
      </SettingsSection>
      
      {/* Notification Settings */}
      <SettingsSection title="Notifications" icon={Bell}>
        <SettingRow label="Operation Complete" description="Notify when hacking operations finish">
          <Toggle 
            checked={settings.notifications.operationComplete}
            onChange={(checked) => updateSetting('notifications', 'operationComplete', checked)}
          />
        </SettingRow>
        
        <SettingRow label="Level Up" description="Notify when gaining experience levels">
          <Toggle 
            checked={settings.notifications.levelUp}
            onChange={(checked) => updateSetting('notifications', 'levelUp', checked)}
          />
        </SettingRow>
        
        <SettingRow label="Achievements" description="Notify when unlocking achievements">
          <Toggle 
            checked={settings.notifications.achievements}
            onChange={(checked) => updateSetting('notifications', 'achievements', checked)}
          />
        </SettingRow>
        
        <SettingRow label="Market Updates" description="Notify about marketplace changes">
          <Toggle 
            checked={settings.notifications.marketUpdates}
            onChange={(checked) => updateSetting('notifications', 'marketUpdates', checked)}
          />
        </SettingRow>
        
        <SettingRow label="Energy Full" description="Notify when energy is fully restored">
          <Toggle 
            checked={settings.notifications.energyFull}
            onChange={(checked) => updateSetting('notifications', 'energyFull', checked)}
          />
        </SettingRow>
      </SettingsSection>
      
      {/* Gameplay Settings */}
      <SettingsSection title="Gameplay" icon={SettingsIcon}>
        <SettingRow label="Auto Save" description="Automatically save game progress">
          <Toggle 
            checked={settings.gameplay.autoSave}
            onChange={(checked) => updateSetting('gameplay', 'autoSave', checked)}
          />
        </SettingRow>
        
        <SettingRow label="Auto Save Interval" description="How often to save (seconds)">
          <select
            value={settings.gameplay.autoSaveInterval}
            onChange={(e) => updateSetting('gameplay', 'autoSaveInterval', parseInt(e.target.value))}
            disabled={!settings.gameplay.autoSave}
            className="cyber-input"
          >
            <option value={30}>30 seconds</option>
            <option value={60}>1 minute</option>
            <option value={300}>5 minutes</option>
          </select>
        </SettingRow>
        
        <SettingRow label="Pause on Blur" description="Pause game when window loses focus">
          <Toggle 
            checked={settings.gameplay.pauseOnBlur}
            onChange={(checked) => updateSetting('gameplay', 'pauseOnBlur', checked)}
          />
        </SettingRow>
        
        <SettingRow label="Confirm Actions" description="Show confirmation for important actions">
          <Toggle 
            checked={settings.gameplay.confirmActions}
            onChange={(checked) => updateSetting('gameplay', 'confirmActions', checked)}
          />
        </SettingRow>
      </SettingsSection>
      
      {/* Privacy Settings */}
      <SettingsSection title="Privacy & Data" icon={Shield}>
        <SettingRow label="Share Statistics" description="Allow sharing of game stats with other players">
          <Toggle 
            checked={settings.privacy.shareStats}
            onChange={(checked) => updateSetting('privacy', 'shareStats', checked)}
          />
        </SettingRow>
        
        <SettingRow label="Analytics" description="Help improve the game with usage data">
          <Toggle 
            checked={settings.privacy.allowAnalytics}
            onChange={(checked) => updateSetting('privacy', 'allowAnalytics', checked)}
          />
        </SettingRow>
        
        <SettingRow label="Leaderboard" description="Show your profile on public leaderboards">
          <Toggle 
            checked={settings.privacy.showOnLeaderboard}
            onChange={(checked) => updateSetting('privacy', 'showOnLeaderboard', checked)}
          />
        </SettingRow>
      </SettingsSection>
      
      {/* Account Settings */}
      <SettingsSection title="Account" icon={User}>
        <SettingRow label="Username" description="Your display name in the game">
          <input
            type="text"
            defaultValue="Anonymous_Hacker"
            className="cyber-input w-48"
            placeholder="Enter username"
          />
        </SettingRow>
        
        <SettingRow label="Password" description="Change your account password">
          <div className="flex items-center space-x-2">
            <input
              type={showPassword ? 'text' : 'password'}
              placeholder="Enter new password"
              className="cyber-input w-40"
            />
            <button
              onClick={() => setShowPassword(!showPassword)}
              className="p-2 text-cyber-primary/60 hover:text-cyber-primary"
            >
              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
        </SettingRow>
      </SettingsSection>
      
      {/* Data Management */}
      <SettingsSection title="Data Management" icon={Download}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <button
            onClick={handleExport}
            className="cyber-button flex items-center justify-center space-x-2"
          >
            <Download className="w-4 h-4" />
            <span>Export Settings</span>
          </button>
          
          <label className="cyber-button flex items-center justify-center space-x-2 cursor-pointer">
            <Upload className="w-4 h-4" />
            <span>Import Settings</span>
            <input
              type="file"
              accept=".json"
              onChange={handleImport}
              className="hidden"
            />
          </label>
        </div>
      </SettingsSection>
      
      {/* Action Buttons */}
      <div className="flex flex-col md:flex-row gap-4">
        <button
          onClick={handleSave}
          className="cyber-button flex items-center justify-center space-x-2 bg-cyber-primary text-cyber-dark"
        >
          <Save className="w-4 h-4" />
          <span>Save Settings</span>
        </button>
        
        <button
          onClick={() => setShowResetConfirm(true)}
          className="cyber-button flex items-center justify-center space-x-2 border-cyber-warning text-cyber-warning hover:bg-cyber-warning hover:text-cyber-dark"
        >
          <RotateCcw className="w-4 h-4" />
          <span>Reset to Defaults</span>
        </button>
      </div>
      
      {/* Reset Confirmation Modal */}
      {showResetConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="cyber-card max-w-md mx-4">
            <div className="flex items-center space-x-3 mb-4">
              <AlertTriangle className="w-6 h-6 text-cyber-warning" />
              <h3 className="text-lg font-cyber font-bold text-cyber-primary">
                Reset Settings
              </h3>
            </div>
            <p className="text-cyber-primary/70 mb-6">
              Are you sure you want to reset all settings to their default values? This action cannot be undone.
            </p>
            <div className="flex space-x-3">
              <button
                onClick={handleReset}
                className="flex-1 cyber-button bg-cyber-warning text-cyber-dark"
              >
                Reset
              </button>
              <button
                onClick={() => setShowResetConfirm(false)}
                className="flex-1 cyber-button"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};