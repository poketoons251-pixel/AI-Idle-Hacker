import React, { useState, useEffect } from 'react';
import { Search, FileText, Target, Eye, Clock, Zap, AlertTriangle, CheckCircle, XCircle } from 'lucide-react';

interface IntelligenceDoc {
  id: string;
  title: string;
  doc_type: 'target_profile' | 'vulnerability_report' | 'network_map' | 'security_protocol' | 'communication_log';
  content: Record<string, any>;
  difficulty_level: number;
  required_tools: string[];
  analysis_time_minutes: number;
  reward_credits: number;
  unlock_requirements?: {
    min_level?: number;
    completed_investigations?: string[];
    required_reputation?: number;
  };
  is_analyzed: boolean;
  analysis_progress?: number;
}

interface InvestigationReport {
  id: string;
  document_id: string;
  analysis_results: Record<string, any>;
  vulnerabilities_found: string[];
  recommended_techniques: string[];
  success_probability: number;
  investigation_notes: string;
  completed_at: string;
}

interface InvestigationPanelProps {
  availableDocs: IntelligenceDoc[];
  activeInvestigations: InvestigationReport[];
  onStartInvestigation: (docId: string) => Promise<void>;
  onViewReport: (reportId: string) => void;
  isLoading?: boolean;
  playerLevel: number;
  playerReputation: number;
}

const InvestigationPanel: React.FC<InvestigationPanelProps> = ({
  availableDocs,
  activeInvestigations,
  onStartInvestigation,
  onViewReport,
  isLoading = false,
  playerLevel,
  playerReputation
}) => {
  const [selectedTab, setSelectedTab] = useState<'available' | 'active' | 'completed'>('available');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<string>('all');
  const [selectedDoc, setSelectedDoc] = useState<IntelligenceDoc | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState<string | null>(null);

  const docTypeIcons = {
    target_profile: <Target className="w-4 h-4" />,
    vulnerability_report: <AlertTriangle className="w-4 h-4" />,
    network_map: <Search className="w-4 h-4" />,
    security_protocol: <Eye className="w-4 h-4" />,
    communication_log: <FileText className="w-4 h-4" />
  };

  const docTypeColors = {
    target_profile: 'text-red-400 border-red-500/30 bg-red-900/20',
    vulnerability_report: 'text-orange-400 border-orange-500/30 bg-orange-900/20',
    network_map: 'text-blue-400 border-blue-500/30 bg-blue-900/20',
    security_protocol: 'text-purple-400 border-purple-500/30 bg-purple-900/20',
    communication_log: 'text-green-400 border-green-500/30 bg-green-900/20'
  };

  const filteredDocs = availableDocs.filter(doc => {
    const matchesSearch = doc.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         doc.doc_type.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = filterType === 'all' || doc.doc_type === filterType;
    return matchesSearch && matchesType;
  });

  const completedReports = activeInvestigations.filter(report => report.completed_at);
  const ongoingInvestigations = activeInvestigations.filter(report => !report.completed_at);

  const canStartInvestigation = (doc: IntelligenceDoc) => {
    if (doc.is_analyzed) return false;
    if (doc.unlock_requirements?.min_level && playerLevel < doc.unlock_requirements.min_level) return false;
    if (doc.unlock_requirements?.required_reputation && playerReputation < doc.unlock_requirements.required_reputation) return false;
    return true;
  };

  const handleStartInvestigation = async (docId: string) => {
    setIsAnalyzing(docId);
    try {
      await onStartInvestigation(docId);
    } catch (error) {
      console.error('Error starting investigation:', error);
    } finally {
      setIsAnalyzing(null);
    }
  };

  const getDifficultyColor = (level: number) => {
    if (level <= 2) return 'text-green-400';
    if (level <= 4) return 'text-yellow-400';
    if (level <= 6) return 'text-orange-400';
    return 'text-red-400';
  };

  const getDifficultyLabel = (level: number) => {
    if (level <= 2) return 'Novice';
    if (level <= 4) return 'Intermediate';
    if (level <= 6) return 'Advanced';
    return 'Expert';
  };

  return (
    <div className="bg-gray-900 border border-cyan-500/30 rounded-lg shadow-xl">
      {/* Header */}
      <div className="bg-gradient-to-r from-cyan-900/50 to-blue-900/50 p-4 border-b border-cyan-500/30">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-cyan-400 flex items-center gap-2">
            <Search className="w-5 h-5" />
            Intelligence Analysis Hub
          </h2>
          <div className="text-sm text-gray-400">
            Level {playerLevel} • Reputation: {playerReputation}
          </div>
        </div>

        {/* Tabs */}
        <div className="flex space-x-1">
          {[
            { key: 'available', label: 'Available Docs', count: filteredDocs.length },
            { key: 'active', label: 'Active', count: ongoingInvestigations.length },
            { key: 'completed', label: 'Completed', count: completedReports.length }
          ].map(tab => (
            <button
              key={tab.key}
              onClick={() => setSelectedTab(tab.key as any)}
              className={`
                px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200
                ${
                  selectedTab === tab.key
                    ? 'bg-cyan-600 text-white shadow-lg'
                    : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                }
              `}
            >
              {tab.label} ({tab.count})
            </button>
          ))}
        </div>
      </div>

      {/* Controls */}
      {selectedTab === 'available' && (
        <div className="p-4 border-b border-gray-700">
          <div className="flex gap-4">
            <div className="flex-1">
              <input
                type="text"
                placeholder="Search documents..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:border-cyan-500 focus:outline-none"
              />
            </div>
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="px-3 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white focus:border-cyan-500 focus:outline-none"
            >
              <option value="all">All Types</option>
              <option value="target_profile">Target Profiles</option>
              <option value="vulnerability_report">Vulnerability Reports</option>
              <option value="network_map">Network Maps</option>
              <option value="security_protocol">Security Protocols</option>
              <option value="communication_log">Communication Logs</option>
            </select>
          </div>
        </div>
      )}

      {/* Content */}
      <div className="p-4 max-h-96 overflow-y-auto">
        {selectedTab === 'available' && (
          <div className="space-y-3">
            {filteredDocs.map(doc => {
              const canStart = canStartInvestigation(doc);
              const isCurrentlyAnalyzing = isAnalyzing === doc.id;
              
              return (
                <div
                  key={doc.id}
                  className={`
                    border rounded-lg p-4 transition-all duration-200
                    ${
                      doc.is_analyzed
                        ? 'border-green-500/30 bg-green-900/10'
                        : canStart
                        ? 'border-gray-600 hover:border-cyan-500/50 cursor-pointer'
                        : 'border-gray-700 opacity-60'
                    }
                  `}
                  onClick={() => canStart && !isCurrentlyAnalyzing && setSelectedDoc(doc)}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <div className={`p-1 rounded border ${docTypeColors[doc.doc_type]}`}>
                          {docTypeIcons[doc.doc_type]}
                        </div>
                        <h3 className="font-medium text-white">{doc.title}</h3>
                        {doc.is_analyzed && (
                          <CheckCircle className="w-4 h-4 text-green-400" />
                        )}
                      </div>
                      
                      <div className="flex items-center gap-4 text-sm text-gray-400 mb-2">
                        <span className={`font-medium ${getDifficultyColor(doc.difficulty_level)}`}>
                          {getDifficultyLabel(doc.difficulty_level)}
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {doc.analysis_time_minutes}m
                        </span>
                        <span className="flex items-center gap-1">
                          <Zap className="w-3 h-3" />
                          {doc.reward_credits.toLocaleString()} credits
                        </span>
                      </div>
                      
                      {doc.required_tools.length > 0 && (
                        <div className="flex flex-wrap gap-1 mb-2">
                          {doc.required_tools.map(tool => (
                            <span
                              key={tool}
                              className="px-2 py-1 bg-gray-800 border border-gray-600 rounded text-xs text-gray-300"
                            >
                              {tool}
                            </span>
                          ))}
                        </div>
                      )}
                      
                      {doc.unlock_requirements && !canStart && (
                        <div className="text-xs text-red-400 flex items-center gap-1">
                          <XCircle className="w-3 h-3" />
                          {doc.unlock_requirements.min_level && playerLevel < doc.unlock_requirements.min_level && (
                            <span>Requires Level {doc.unlock_requirements.min_level}</span>
                          )}
                          {doc.unlock_requirements.required_reputation && playerReputation < doc.unlock_requirements.required_reputation && (
                            <span>Requires {doc.unlock_requirements.required_reputation} Reputation</span>
                          )}
                        </div>
                      )}
                    </div>
                    
                    {canStart && !doc.is_analyzed && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleStartInvestigation(doc.id);
                        }}
                        disabled={isCurrentlyAnalyzing || isLoading}
                        className="px-3 py-1 bg-cyan-600 hover:bg-cyan-700 disabled:bg-gray-600 text-white text-sm rounded transition-colors"
                      >
                        {isCurrentlyAnalyzing ? (
                          <div className="flex items-center gap-1">
                            <div className="animate-spin w-3 h-3 border border-white border-t-transparent rounded-full" />
                            Analyzing...
                          </div>
                        ) : (
                          'Analyze'
                        )}
                      </button>
                    )}
                  </div>
                  
                  {doc.analysis_progress !== undefined && doc.analysis_progress < 100 && (
                    <div className="mt-3">
                      <div className="flex items-center justify-between text-xs text-gray-400 mb-1">
                        <span>Analysis Progress</span>
                        <span>{doc.analysis_progress}%</span>
                      </div>
                      <div className="w-full bg-gray-700 rounded-full h-2">
                        <div 
                          className="bg-gradient-to-r from-cyan-500 to-blue-500 h-2 rounded-full transition-all duration-500"
                          style={{ width: `${doc.analysis_progress}%` }}
                        />
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
            
            {filteredDocs.length === 0 && (
              <div className="text-center py-8 text-gray-400">
                <FileText className="w-12 h-12 mx-auto mb-2 opacity-50" />
                <p>No documents match your search criteria</p>
              </div>
            )}
          </div>
        )}

        {selectedTab === 'active' && (
          <div className="space-y-3">
            {ongoingInvestigations.map(investigation => (
              <div
                key={investigation.id}
                className="border border-yellow-500/30 bg-yellow-900/10 rounded-lg p-4"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-medium text-white mb-1">
                      Investigation #{investigation.id.slice(0, 8)}
                    </h3>
                    <p className="text-sm text-gray-400">
                      Document: {investigation.document_id}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 text-yellow-400">
                    <div className="animate-spin w-4 h-4 border-2 border-yellow-400 border-t-transparent rounded-full" />
                    <span className="text-sm">In Progress</span>
                  </div>
                </div>
              </div>
            ))}
            
            {ongoingInvestigations.length === 0 && (
              <div className="text-center py-8 text-gray-400">
                <Clock className="w-12 h-12 mx-auto mb-2 opacity-50" />
                <p>No active investigations</p>
              </div>
            )}
          </div>
        )}

        {selectedTab === 'completed' && (
          <div className="space-y-3">
            {completedReports.map(report => (
              <div
                key={report.id}
                className="border border-green-500/30 bg-green-900/10 rounded-lg p-4 cursor-pointer hover:bg-green-900/20 transition-colors"
                onClick={() => onViewReport(report.id)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <h3 className="font-medium text-white mb-1">
                      Investigation Report #{report.id.slice(0, 8)}
                    </h3>
                    <p className="text-sm text-gray-400 mb-2">
                      Completed: {new Date(report.completed_at).toLocaleDateString()}
                    </p>
                    
                    <div className="flex items-center gap-4 text-sm">
                      <span className="text-green-400">
                        Success Rate: {report.success_probability}%
                      </span>
                      <span className="text-blue-400">
                        Vulnerabilities: {report.vulnerabilities_found.length}
                      </span>
                      <span className="text-purple-400">
                        Techniques: {report.recommended_techniques.length}
                      </span>
                    </div>
                  </div>
                  
                  <CheckCircle className="w-5 h-5 text-green-400" />
                </div>
              </div>
            ))}
            
            {completedReports.length === 0 && (
              <div className="text-center py-8 text-gray-400">
                <FileText className="w-12 h-12 mx-auto mb-2 opacity-50" />
                <p>No completed investigations</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default InvestigationPanel;