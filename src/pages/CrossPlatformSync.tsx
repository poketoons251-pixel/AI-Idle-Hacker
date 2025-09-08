import React, { useState, useEffect } from 'react';
import { Smartphone, Monitor, Tablet, Cloud, RefreshCw, CheckCircle, AlertCircle, Clock, Settings, Download, Upload, Wifi, WifiOff } from 'lucide-react';
import { useGameStore } from '../store/gameStore';
import { StatusIndicator, SyncStatus } from '../components/ui/StatusIndicator';

interface Device {
  id: string;
  name: string;
  type: 'mobile' | 'desktop' | 'tablet';
  platform: string;
  lastSync: string;
  status: 'online' | 'offline' | 'syncing';
  version: string;
  dataSize: string;
}

interface SyncData {
  category: string;
  size: string;
  lastUpdated: string;
  status: 'synced' | 'pending' | 'conflict' | 'error';
  conflicts?: number;
}

interface SyncHistory {
  id: string;
  timestamp: string;
  type: 'manual' | 'automatic';
  status: 'success' | 'failed' | 'partial';
  devices: string[];
  dataTransferred: string;
  duration: string;
  errors?: string[];
}

const CrossPlatformSync: React.FC = () => {
  const { player } = useGameStore();
  const [devices, setDevices] = useState<Device[]>([]);
  const [syncData, setSyncData] = useState<SyncData[]>([]);
  const [syncHistory, setSyncHistory] = useState<SyncHistory[]>([]);
  const [isOnline, setIsOnline] = useState(true);
  const [autoSync, setAutoSync] = useState(true);
  const [syncInterval, setSyncInterval] = useState(5); // minutes
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSync, setLastSync] = useState<string>('');
  const [selectedDevice, setSelectedDevice] = useState<Device | null>(null);
  const [activeTab, setActiveTab] = useState<'devices' | 'data' | 'history' | 'settings'>('devices');

  // Mock data for demonstration
  useEffect(() => {
    const mockDevices: Device[] = [
      {
        id: 'device-1',
        name: 'Gaming PC',
        type: 'desktop',
        platform: 'Windows 11',
        lastSync: '2024-01-10T12:00:00Z',
        status: 'online',
        version: '1.5.0',
        dataSize: '2.3 MB'
      },
      {
        id: 'device-2',
        name: 'iPhone 15',
        type: 'mobile',
        platform: 'iOS 17',
        lastSync: '2024-01-10T11:45:00Z',
        status: 'online',
        version: '1.5.0',
        dataSize: '1.8 MB'
      },
      {
        id: 'device-3',
        name: 'MacBook Pro',
        type: 'desktop',
        platform: 'macOS Sonoma',
        lastSync: '2024-01-09T18:30:00Z',
        status: 'offline',
        version: '1.4.8',
        dataSize: '2.1 MB'
      },
      {
        id: 'device-4',
        name: 'iPad Air',
        type: 'tablet',
        platform: 'iPadOS 17',
        lastSync: '2024-01-10T10:15:00Z',
        status: 'online',
        version: '1.5.0',
        dataSize: '1.9 MB'
      }
    ];

    const mockSyncData: SyncData[] = [
      {
        category: 'Player Progress',
        size: '1.2 MB',
        lastUpdated: '2024-01-10T12:00:00Z',
        status: 'synced'
      },
      {
        category: 'Equipment & Inventory',
        size: '450 KB',
        lastUpdated: '2024-01-10T11:58:00Z',
        status: 'synced'
      },
      {
        category: 'AI Companions',
        size: '320 KB',
        lastUpdated: '2024-01-10T11:55:00Z',
        status: 'pending'
      },
      {
        category: 'Guild Data',
        size: '180 KB',
        lastUpdated: '2024-01-10T11:50:00Z',
        status: 'synced'
      },
      {
        category: 'Settings & Preferences',
        size: '25 KB',
        lastUpdated: '2024-01-10T11:45:00Z',
        status: 'conflict',
        conflicts: 2
      },
      {
        category: 'Achievement Progress',
        size: '95 KB',
        lastUpdated: '2024-01-10T11:40:00Z',
        status: 'synced'
      }
    ];

    const mockHistory: SyncHistory[] = [
      {
        id: 'sync-1',
        timestamp: '2024-01-10T12:00:00Z',
        type: 'automatic',
        status: 'success',
        devices: ['Gaming PC', 'iPhone 15', 'iPad Air'],
        dataTransferred: '2.3 MB',
        duration: '12s'
      },
      {
        id: 'sync-2',
        timestamp: '2024-01-10T11:55:00Z',
        type: 'manual',
        status: 'partial',
        devices: ['Gaming PC', 'MacBook Pro'],
        dataTransferred: '1.8 MB',
        duration: '8s',
        errors: ['MacBook Pro: Connection timeout']
      },
      {
        id: 'sync-3',
        timestamp: '2024-01-10T11:50:00Z',
        type: 'automatic',
        status: 'success',
        devices: ['iPhone 15', 'iPad Air'],
        dataTransferred: '1.1 MB',
        duration: '6s'
      }
    ];

    setDevices(mockDevices);
    setSyncData(mockSyncData);
    setSyncHistory(mockHistory);
    setLastSync('2024-01-10T12:00:00Z');
    setSelectedDevice(mockDevices[0]);
  }, []);

  const handleManualSync = async () => {
    setIsSyncing(true);
    try {
      // Simulate sync process
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      // Update sync status
      setSyncData(prev => prev.map(data => ({ ...data, status: 'synced' as const })));
      setLastSync(new Date().toISOString());
      
      // Add to history
      const newHistoryEntry: SyncHistory = {
        id: `sync-${Date.now()}`,
        timestamp: new Date().toISOString(),
        type: 'manual',
        status: 'success',
        devices: devices.filter(d => d.status === 'online').map(d => d.name),
        dataTransferred: '2.1 MB',
        duration: '3s'
      };
      setSyncHistory(prev => [newHistoryEntry, ...prev]);
    } catch (error) {
      console.error('Sync failed:', error);
    } finally {
      setIsSyncing(false);
    }
  };

  const handleResolveConflict = async (category: string) => {
    try {
      // API call to resolve conflict
      console.log('Resolving conflict for:', category);
      setSyncData(prev => 
        prev.map(data => 
          data.category === category 
            ? { ...data, status: 'synced' as const, conflicts: undefined }
            : data
        )
      );
    } catch (error) {
      console.error('Failed to resolve conflict:', error);
    }
  };

  const getDeviceIcon = (type: string) => {
    switch (type) {
      case 'mobile': return Smartphone;
      case 'tablet': return Tablet;
      case 'desktop': return Monitor;
      default: return Monitor;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'online': return 'text-green-400';
      case 'offline': return 'text-gray-400';
      case 'syncing': return 'text-blue-400';
      default: return 'text-gray-400';
    }
  };

  const getSyncStatusColor = (status: string) => {
    switch (status) {
      case 'synced': return 'text-green-400';
      case 'pending': return 'text-yellow-400';
      case 'conflict': return 'text-red-400';
      case 'error': return 'text-red-400';
      default: return 'text-gray-400';
    }
  };

  const getSyncStatusIcon = (status: string) => {
    switch (status) {
      case 'synced': return CheckCircle;
      case 'pending': return Clock;
      case 'conflict': return AlertCircle;
      case 'error': return AlertCircle;
      default: return Clock;
    }
  };

  const renderDevices = () => (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-xl font-bold text-white">Connected Devices ({devices.length})</h3>
        <div className="flex items-center space-x-4">
          <div className={`flex items-center space-x-2 ${isOnline ? 'text-green-400' : 'text-red-400'}`}>
            {isOnline ? <Wifi className="w-4 h-4" /> : <WifiOff className="w-4 h-4" />}
            <span className="text-sm">{isOnline ? 'Online' : 'Offline'}</span>
          </div>
          <button 
            onClick={handleManualSync}
            disabled={isSyncing || !isOnline}
            className="bg-purple-600 hover:bg-purple-700 disabled:bg-gray-600 text-white px-4 py-2 rounded-lg transition-colors flex items-center space-x-2"
          >
            <RefreshCw className={`w-4 h-4 ${isSyncing ? 'animate-spin' : ''}`} />
            <span>{isSyncing ? 'Syncing...' : 'Sync Now'}</span>
          </button>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {devices.map((device) => {
          const DeviceIcon = getDeviceIcon(device.type);
          return (
            <div 
              key={device.id} 
              onClick={() => setSelectedDevice(device)}
              className={`bg-gray-800/50 rounded-lg p-4 border cursor-pointer transition-all ${
                selectedDevice?.id === device.id 
                  ? 'border-purple-500 bg-purple-900/20' 
                  : 'border-gray-700 hover:border-gray-600'
              }`}
            >
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-blue-500 rounded-lg flex items-center justify-center">
                    <DeviceIcon className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-white">{device.name}</h4>
                    <p className="text-sm text-gray-400">{device.platform}</p>
                  </div>
                </div>
                <SyncStatus 
                  isSyncing={device.status === 'syncing'}
                  label={device.status}
                  size="sm"
                />
              </div>
              
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-400">Status:</span>
                  <span className={`capitalize ${getStatusColor(device.status)}`}>{device.status}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Version:</span>
                  <span className="text-white">{device.version}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Data Size:</span>
                  <span className="text-white">{device.dataSize}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Last Sync:</span>
                  <span className="text-white">
                    {new Date(device.lastSync).toLocaleDateString()}
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
      
      {selectedDevice && (
        <div className="bg-gray-800/50 rounded-lg p-6 border border-gray-700">
          <h4 className="text-lg font-bold text-white mb-4">Device Details: {selectedDevice.name}</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-3">
              <h5 className="font-semibold text-purple-400">Device Information</h5>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-400">Platform:</span>
                  <span className="text-white">{selectedDevice.platform}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">App Version:</span>
                  <span className="text-white">{selectedDevice.version}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Total Data:</span>
                  <span className="text-white">{selectedDevice.dataSize}</span>
                </div>
              </div>
            </div>
            <div className="space-y-3">
              <h5 className="font-semibold text-purple-400">Sync Status</h5>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-400">Connection:</span>
                  <span className={getStatusColor(selectedDevice.status)}>
                    {selectedDevice.status}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Last Sync:</span>
                  <span className="text-white">
                    {new Date(selectedDevice.lastSync).toLocaleString()}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );

  const renderSyncData = () => (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-xl font-bold text-white">Sync Data Categories</h3>
        <div className="text-sm text-gray-400">
          Last sync: {new Date(lastSync).toLocaleString()}
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {syncData.map((data, index) => {
          const StatusIcon = getSyncStatusIcon(data.status);
          return (
            <div key={index} className="bg-gray-800/50 rounded-lg p-4 border border-gray-700">
              <div className="flex items-center justify-between mb-3">
                <h4 className="font-semibold text-white">{data.category}</h4>
                <div className={`flex items-center space-x-1 ${getSyncStatusColor(data.status)}`}>
                  <StatusIcon className="w-4 h-4" />
                  <span className="text-sm capitalize">{data.status}</span>
                </div>
              </div>
              
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-400">Size:</span>
                  <span className="text-white">{data.size}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Last Updated:</span>
                  <span className="text-white">
                    {new Date(data.lastUpdated).toLocaleTimeString()}
                  </span>
                </div>
                {data.conflicts && (
                  <div className="flex justify-between">
                    <span className="text-gray-400">Conflicts:</span>
                    <span className="text-red-400">{data.conflicts}</span>
                  </div>
                )}
              </div>
              
              {data.status === 'conflict' && (
                <button 
                  onClick={() => handleResolveConflict(data.category)}
                  className="w-full mt-3 bg-red-600 hover:bg-red-700 text-white py-2 rounded-lg transition-colors text-sm"
                >
                  Resolve Conflicts
                </button>
              )}
              
              {data.status === 'pending' && (
                <div className="mt-3 bg-yellow-900/30 border border-yellow-500/30 rounded-lg p-2">
                  <p className="text-yellow-400 text-xs">Waiting for sync...</p>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );

  const renderHistory = () => (
    <div className="space-y-6">
      <h3 className="text-xl font-bold text-white">Sync History</h3>
      
      <div className="space-y-4">
        {syncHistory.map((entry) => (
          <div key={entry.id} className="bg-gray-800/50 rounded-lg p-4 border border-gray-700">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center space-x-3">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                  entry.status === 'success' ? 'bg-green-500/20 text-green-400' :
                  entry.status === 'partial' ? 'bg-yellow-500/20 text-yellow-400' :
                  'bg-red-500/20 text-red-400'
                }`}>
                  {entry.status === 'success' ? <CheckCircle className="w-4 h-4" /> :
                   entry.status === 'partial' ? <AlertCircle className="w-4 h-4" /> :
                   <AlertCircle className="w-4 h-4" />}
                </div>
                <div>
                  <h4 className="font-semibold text-white capitalize">
                    {entry.type} Sync
                  </h4>
                  <p className="text-sm text-gray-400">
                    {new Date(entry.timestamp).toLocaleString()}
                  </p>
                </div>
              </div>
              <div className="text-right text-sm">
                <div className="text-white">{entry.dataTransferred}</div>
                <div className="text-gray-400">{entry.duration}</div>
              </div>
            </div>
            
            <div className="flex flex-wrap gap-2 mb-3">
              {entry.devices.map((device, index) => (
                <span key={index} className="bg-purple-900/30 text-purple-300 px-2 py-1 rounded text-xs">
                  {device}
                </span>
              ))}
            </div>
            
            {entry.errors && entry.errors.length > 0 && (
              <div className="bg-red-900/30 border border-red-500/30 rounded-lg p-3">
                <h5 className="text-red-400 text-sm font-semibold mb-2">Errors:</h5>
                <ul className="text-red-300 text-xs space-y-1">
                  {entry.errors.map((error, index) => (
                    <li key={index}>• {error}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );

  const renderSettings = () => (
    <div className="space-y-6">
      <h3 className="text-xl font-bold text-white">Sync Settings</h3>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-gray-800/50 rounded-lg p-6 border border-gray-700">
          <h4 className="font-semibold text-white mb-4">Automatic Sync</h4>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-gray-300">Enable Auto Sync</span>
              <button 
                onClick={() => setAutoSync(!autoSync)}
                className={`w-12 h-6 rounded-full transition-colors ${
                  autoSync ? 'bg-purple-600' : 'bg-gray-600'
                } relative`}
              >
                <div className={`w-5 h-5 bg-white rounded-full absolute top-0.5 transition-transform ${
                  autoSync ? 'translate-x-6' : 'translate-x-0.5'
                }`} />
              </button>
            </div>
            
            {autoSync && (
              <div>
                <label className="block text-gray-300 mb-2">Sync Interval (minutes)</label>
                <select 
                  value={syncInterval}
                  onChange={(e) => setSyncInterval(Number(e.target.value))}
                  className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-purple-500"
                >
                  <option value={1}>1 minute</option>
                  <option value={5}>5 minutes</option>
                  <option value={15}>15 minutes</option>
                  <option value={30}>30 minutes</option>
                  <option value={60}>1 hour</option>
                </select>
              </div>
            )}
          </div>
        </div>
        
        <div className="bg-gray-800/50 rounded-lg p-6 border border-gray-700">
          <h4 className="font-semibold text-white mb-4">Data Management</h4>
          <div className="space-y-3">
            <button className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-lg transition-colors flex items-center justify-center space-x-2">
              <Download className="w-4 h-4" />
              <span>Export Data</span>
            </button>
            <button className="w-full bg-green-600 hover:bg-green-700 text-white py-2 rounded-lg transition-colors flex items-center justify-center space-x-2">
              <Upload className="w-4 h-4" />
              <span>Import Data</span>
            </button>
            <button className="w-full bg-purple-600 hover:bg-purple-700 text-white py-2 rounded-lg transition-colors flex items-center justify-center space-x-2">
              <Cloud className="w-4 h-4" />
              <span>Backup to Cloud</span>
            </button>
          </div>
        </div>
      </div>
      
      <div className="bg-gray-800/50 rounded-lg p-6 border border-gray-700">
        <h4 className="font-semibold text-white mb-4">Sync Statistics</h4>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-purple-400">24</div>
            <div className="text-sm text-gray-400">Total Syncs</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-green-400">22</div>
            <div className="text-sm text-gray-400">Successful</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-yellow-400">2</div>
            <div className="text-sm text-gray-400">Partial</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-400">15.2 MB</div>
            <div className="text-sm text-gray-400">Data Synced</div>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-blue-900 p-6">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">Cross-Platform Sync</h1>
          <p className="text-gray-400">Manage your game data across all devices</p>
        </div>

        {/* Navigation Tabs */}
        <div className="flex space-x-1 mb-8 bg-gray-800/50 p-1 rounded-lg">
          {[
            { id: 'devices', label: 'Devices', icon: Monitor },
            { id: 'data', label: 'Sync Data', icon: Cloud },
            { id: 'history', label: 'History', icon: Clock },
            { id: 'settings', label: 'Settings', icon: Settings }
          ].map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setActiveTab(id as any)}
              className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors ${
                activeTab === id
                  ? 'bg-purple-600 text-white'
                  : 'text-gray-400 hover:text-white hover:bg-gray-700'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{label}</span>
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <div className="bg-gray-800/30 rounded-xl p-6 border border-gray-700">
          {activeTab === 'devices' && renderDevices()}
          {activeTab === 'data' && renderSyncData()}
          {activeTab === 'history' && renderHistory()}
          {activeTab === 'settings' && renderSettings()}
        </div>
      </div>
    </div>
  );
};

export default CrossPlatformSync;