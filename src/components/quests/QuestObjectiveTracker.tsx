import React, { useState } from 'react';
import {
  CheckCircle,
  Circle,
  Target,
  Clock,
  Zap,
  AlertCircle,
  ChevronDown,
  ChevronRight,
  Play,
  Pause,
  RotateCcw,
  Eye,
  MessageSquare,
  Code,
  Shield,
  Database,
  Globe
} from 'lucide-react';
import { Quest, QuestObjective } from '../../store/gameStore';

interface QuestObjectiveTrackerProps {
  quest: Quest;
  onObjectiveAction?: (objectiveId: string, action: 'start' | 'complete' | 'hint') => void;
}

const getObjectiveTypeIcon = (type: string) => {
  switch (type) {
    case 'hack': return Code;
    case 'infiltrate': return Shield;
    case 'extract': return Database;
    case 'social': return MessageSquare;
    case 'recon': return Eye;
    case 'network': return Globe;
    default: return Target;
  }
};

const getObjectiveStatusColor = (objective: QuestObjective) => {
  if (objective.completed) return 'text-green-400';
  if (objective.inProgress) return 'text-yellow-400';
  if (objective.failed) return 'text-red-400';
  return 'text-gray-400';
};

const getObjectiveStatusBg = (objective: QuestObjective) => {
  if (objective.completed) return 'bg-green-500/10 border-green-500/20';
  if (objective.inProgress) return 'bg-yellow-500/10 border-yellow-500/20';
  if (objective.failed) return 'bg-red-500/10 border-red-500/20';
  return 'bg-gray-500/10 border-gray-500/20';
};

export const QuestObjectiveTracker: React.FC<QuestObjectiveTrackerProps> = ({
  quest,
  onObjectiveAction
}) => {
  const [expandedObjectives, setExpandedObjectives] = useState<Set<string>>(new Set());
  const [showHints, setShowHints] = useState<Set<string>>(new Set());

  const toggleObjectiveExpansion = (objectiveId: string) => {
    const newExpanded = new Set(expandedObjectives);
    if (newExpanded.has(objectiveId)) {
      newExpanded.delete(objectiveId);
    } else {
      newExpanded.add(objectiveId);
    }
    setExpandedObjectives(newExpanded);
  };

  const toggleHint = (objectiveId: string) => {
    const newHints = new Set(showHints);
    if (newHints.has(objectiveId)) {
      newHints.delete(objectiveId);
    } else {
      newHints.add(objectiveId);
    }
    setShowHints(newHints);
  };

  const formatProgress = (current: number, target: number) => {
    const percentage = Math.min((current / target) * 100, 100);
    return { current, target, percentage };
  };

  const renderObjectiveProgress = (objective: QuestObjective) => {
    if (!objective.progress || objective.progress.target <= 1) return null;

    const progress = formatProgress(objective.progress.current, objective.progress.target);
    
    return (
      <div className="mt-2">
        <div className="flex justify-between items-center mb-1">
          <span className="text-xs text-gray-400">Progress</span>
          <span className="text-xs text-gray-400">
            {progress.current}/{progress.target}
          </span>
        </div>
        <div className="w-full bg-gray-700 rounded-full h-1.5">
          <div
            className={`h-1.5 rounded-full transition-all duration-300 ${
              objective.completed
                ? 'bg-green-400'
                : objective.inProgress
                ? 'bg-yellow-400'
                : 'bg-gray-600'
            }`}
            style={{ width: `${progress.percentage}%` }}
          />
        </div>
      </div>
    );
  };

  const renderObjectiveHint = (objective: QuestObjective) => {
    if (!objective.hint || !showHints.has(objective.id)) return null;

    return (
      <div className="mt-3 p-3 bg-blue-500/10 border border-blue-500/20 rounded-lg">
        <div className="flex items-center gap-2 mb-2">
          <Zap className="w-4 h-4 text-blue-400" />
          <span className="text-xs text-blue-400 font-medium">HINT</span>
        </div>
        <p className="text-blue-300 text-sm">{objective.hint}</p>
      </div>
    );
  };

  const renderObjectiveActions = (objective: QuestObjective) => {
    if (objective.completed || !onObjectiveAction) return null;

    return (
      <div className="flex gap-2 mt-3">
        {!objective.inProgress && (
          <button
            onClick={() => onObjectiveAction(objective.id, 'start')}
            className="flex items-center gap-1 px-3 py-1 bg-cyan-600 hover:bg-cyan-700 text-white rounded text-xs font-medium transition-colors"
          >
            <Play className="w-3 h-3" />
            <span>Start</span>
          </button>
        )}
        
        {objective.inProgress && (
          <button
            onClick={() => onObjectiveAction(objective.id, 'complete')}
            className="flex items-center gap-1 px-3 py-1 bg-green-600 hover:bg-green-700 text-white rounded text-xs font-medium transition-colors"
          >
            <CheckCircle className="w-3 h-3" />
            <span>Complete</span>
          </button>
        )}
        
        {objective.hint && (
          <button
            onClick={() => toggleHint(objective.id)}
            className="flex items-center gap-1 px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded text-xs font-medium transition-colors"
          >
            <Eye className="w-3 h-3" />
            <span>{showHints.has(objective.id) ? 'Hide Hint' : 'Show Hint'}</span>
          </button>
        )}
      </div>
    );
  };

  const completedCount = quest.objectives.filter(obj => obj.completed).length;
  const inProgressCount = quest.objectives.filter(obj => obj.inProgress).length;
  const failedCount = quest.objectives.filter(obj => obj.failed).length;

  return (
    <div className="bg-gray-900 rounded-lg p-4 border border-gray-700">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <Target className="w-5 h-5 text-cyan-400" />
          <h3 className="text-lg font-semibold text-white">Quest Objectives</h3>
        </div>
        
        {/* Summary Stats */}
        <div className="flex items-center gap-4 text-sm">
          <div className="flex items-center gap-1 text-green-400">
            <CheckCircle className="w-4 h-4" />
            <span>{completedCount}</span>
          </div>
          {inProgressCount > 0 && (
            <div className="flex items-center gap-1 text-yellow-400">
              <Clock className="w-4 h-4" />
              <span>{inProgressCount}</span>
            </div>
          )}
          {failedCount > 0 && (
            <div className="flex items-center gap-1 text-red-400">
              <AlertCircle className="w-4 h-4" />
              <span>{failedCount}</span>
            </div>
          )}
          <div className="text-gray-400">
            {completedCount}/{quest.objectives.length}
          </div>
        </div>
      </div>

      {/* Overall Progress */}
      <div className="mb-6">
        <div className="flex justify-between items-center mb-2">
          <span className="text-sm text-gray-400">Overall Progress</span>
          <span className="text-sm text-gray-400">
            {Math.round((completedCount / quest.objectives.length) * 100)}%
          </span>
        </div>
        <div className="w-full bg-gray-700 rounded-full h-2">
          <div
            className="bg-gradient-to-r from-cyan-500 to-blue-500 h-2 rounded-full transition-all duration-500"
            style={{ width: `${(completedCount / quest.objectives.length) * 100}%` }}
          />
        </div>
      </div>

      {/* Objectives List */}
      <div className="space-y-3">
        {quest.objectives.map((objective, index) => {
          const TypeIcon = getObjectiveTypeIcon(objective.type || 'default');
          const isExpanded = expandedObjectives.has(objective.id);
          const statusColor = getObjectiveStatusColor(objective);
          const statusBg = getObjectiveStatusBg(objective);

          return (
            <div
              key={objective.id}
              className={`border rounded-lg transition-all duration-200 ${statusBg}`}
            >
              {/* Objective Header */}
              <div
                className="p-3 cursor-pointer hover:bg-gray-800/50 transition-colors"
                onClick={() => toggleObjectiveExpansion(objective.id)}
              >
                <div className="flex items-center gap-3">
                  {/* Status Icon */}
                  <div className="flex-shrink-0">
                    {objective.completed ? (
                      <CheckCircle className="w-5 h-5 text-green-400" />
                    ) : objective.failed ? (
                      <AlertCircle className="w-5 h-5 text-red-400" />
                    ) : objective.inProgress ? (
                      <Clock className="w-5 h-5 text-yellow-400" />
                    ) : (
                      <Circle className="w-5 h-5 text-gray-400" />
                    )}
                  </div>

                  {/* Type Icon */}
                  <TypeIcon className={`w-4 h-4 ${statusColor}`} />

                  {/* Objective Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-gray-500 font-medium">
                        OBJECTIVE {index + 1}
                      </span>
                      {objective.optional && (
                        <span className="text-xs bg-blue-500/20 text-blue-400 px-2 py-0.5 rounded-full">
                          Optional
                        </span>
                      )}
                    </div>
                    <h4 className={`font-medium ${statusColor} ${objective.completed ? 'line-through' : ''}`}>
                      {objective.description}
                    </h4>
                    {objective.progress && objective.progress.target > 1 && (
                      <div className="text-xs text-gray-400 mt-1">
                        Progress: {objective.progress.current}/{objective.progress.target}
                      </div>
                    )}
                  </div>

                  {/* Expand Icon */}
                  <div className="flex-shrink-0">
                    {isExpanded ? (
                      <ChevronDown className="w-4 h-4 text-gray-400" />
                    ) : (
                      <ChevronRight className="w-4 h-4 text-gray-400" />
                    )}
                  </div>
                </div>
              </div>

              {/* Expanded Content */}
              {isExpanded && (
                <div className="px-3 pb-3 border-t border-gray-700/50">
                  <div className="pt-3">
                    {/* Detailed Description */}
                    {objective.detailedDescription && (
                      <div className="mb-3">
                        <p className="text-gray-300 text-sm leading-relaxed">
                          {objective.detailedDescription}
                        </p>
                      </div>
                    )}

                    {/* Progress Bar */}
                    {renderObjectiveProgress(objective)}

                    {/* Narrative Context */}
                    {objective.narrativeContext && (
                      <div className="mt-3 p-3 bg-gray-800 rounded-lg">
                        <div className="flex items-center gap-2 mb-2">
                          <MessageSquare className="w-4 h-4 text-purple-400" />
                          <span className="text-xs text-purple-400 font-medium">CONTEXT</span>
                        </div>
                        <p className="text-gray-300 text-sm">{objective.narrativeContext}</p>
                      </div>
                    )}

                    {/* Hint */}
                    {renderObjectiveHint(objective)}

                    {/* Actions */}
                    {renderObjectiveActions(objective)}

                    {/* Completion Time */}
                    {objective.completedAt && (
                      <div className="mt-3 text-xs text-gray-500">
                        Completed: {new Date(objective.completedAt).toLocaleString()}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Quest Actions */}
      {quest.status === 'active' && (
        <div className="mt-6 pt-4 border-t border-gray-700">
          <div className="flex gap-2">
            <button className="flex items-center gap-2 px-4 py-2 bg-gray-700 hover:bg-gray-600 text-gray-300 rounded-lg text-sm font-medium transition-colors">
              <Pause className="w-4 h-4" />
              <span>Pause Quest</span>
            </button>
            
            <button className="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm font-medium transition-colors">
              <RotateCcw className="w-4 h-4" />
              <span>Restart Quest</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};