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
  if (objective.isCompleted) return 'text-green-400';
  if (objective.current > 0 && !objective.isCompleted) return 'text-yellow-400';
  return 'text-gray-400';
};

const getObjectiveBackgroundColor = (objective: QuestObjective) => {
  if (objective.isCompleted) return 'bg-green-500/10 border-green-500/20';
  if (objective.current > 0 && !objective.isCompleted) return 'bg-yellow-500/10 border-yellow-500/20';
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
    if (objective.target <= 1) return null;

    const progress = formatProgress(objective.current, objective.target);
    
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
              objective.isCompleted
                ? 'bg-green-400'
                : objective.current > 0 && !objective.isCompleted
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
    // Hints not available in current interface
    return null;
  };

  const renderObjectiveActions = (objective: QuestObjective) => {
    if (objective.isCompleted || !onObjectiveAction) return null;

    return (
      <div className="flex gap-2 mt-3">
        {objective.current === 0 && (
          <button
            onClick={() => onObjectiveAction(objective.id, 'start')}
            className="flex items-center gap-1 px-3 py-1 bg-cyan-600 hover:bg-cyan-700 text-white rounded text-xs font-medium transition-colors"
          >
            <Play className="w-3 h-3" />
            <span>Start</span>
          </button>
        )}
        
        {objective.current > 0 && !objective.isCompleted && (
          <button
            onClick={() => onObjectiveAction(objective.id, 'complete')}
            className="flex items-center gap-1 px-3 py-1 bg-green-600 hover:bg-green-700 text-white rounded text-xs font-medium transition-colors"
          >
            <CheckCircle className="w-3 h-3" />
            <span>Complete</span>
          </button>
        )}
        
        {/* Hint functionality removed due to interface mismatch */}
      </div>
    );
  };

  const completedCount = quest.objectives.filter(obj => obj.isCompleted).length;
  const inProgressCount = quest.objectives.filter(obj => obj.current > 0 && !obj.isCompleted).length;
  const failedCount = 0; // Failed status not available in current interface

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
          const statusBg = getObjectiveBackgroundColor(objective);

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
                    {objective.isCompleted ? (
                      <CheckCircle className="w-5 h-5 text-green-400" />
                    ) : objective.current > 0 ? (
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
                      {objective.isOptional && (
                        <span className="text-xs bg-blue-500/20 text-blue-400 px-2 py-0.5 rounded-full">
                          Optional
                        </span>
                      )}
                    </div>
                    <h4 className={`font-medium ${statusColor} ${objective.isCompleted ? 'line-through' : ''}`}>
                      {objective.description}
                    </h4>
                    {objective.target > 1 && (
                      <div className="text-xs text-gray-400 mt-1">
                        Progress: {objective.current}/{objective.target}
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
                    {/* Detailed description removed due to interface mismatch */}

                    {/* Progress Bar */}
                    {renderObjectiveProgress(objective)}

                    {/* Narrative Context - Removed due to interface mismatch */}

                    {/* Hint */}
                    {renderObjectiveHint(objective)}

                    {/* Actions */}
                    {renderObjectiveActions(objective)}

                    {/* Completion Status */}
                    {objective.isCompleted && (
                      <div className="mt-3 text-xs text-green-400">
                        ✓ Completed
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