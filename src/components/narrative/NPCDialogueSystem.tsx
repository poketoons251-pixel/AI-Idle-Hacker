import React, { useState, useEffect, useMemo } from 'react';
import { useGameStore } from '../../store/gameStore';
import { getNPCById, getNPCsByStoryLine, getAvailableDialogues, getDialogueOptions, DialogOption, Dialog, NPC, getDialogById } from '../../data/npcDialogues';
import { MessageCircle, User, Zap, ArrowRight, X, Clock, Star, AlertTriangle } from 'lucide-react';

interface NPCDialogueSystemProps {
  className?: string;
  npcId?: string;
  storyLine?: string;
  onClose?: () => void;
}

const NPCDialogueSystem: React.FC<NPCDialogueSystemProps> = ({ 
  className = '', 
  npcId, 
  storyLine, 
  onClose 
}) => {
  const { player, claimReward } = useGameStore();
  const [selectedNPC, setSelectedNPC] = useState<NPC | null>(null);
  const [currentDialogue, setCurrentDialogue] = useState<Dialog | null>(null);
  const [dialogueHistory, setDialogueHistory] = useState<string[]>([]);
  const [isTyping, setIsTyping] = useState(false);

  // Mock player progress for demonstration
  const playerProgress = {
    completedQuests: ['origin-1', 'origin-2', 'corp-1'],
    activeQuests: ['ai-1', 'resistance-1'],
    reputation: player.reputation || 0,
    skills: player.skills || {},
    hasItem: (item: string) => false, // Simplified for now as player.equipment structure is unclear
    questProgress: {
      'origin-2': { completed: true },
      'corp-1': { completed: true },
      'ai-1': { inProgress: true }
    }
  };

  const availableNPCs = useMemo(() => {
    if (npcId) {
      const npc = getNPCById(npcId);
      return npc ? [npc] : [];
    }
    if (storyLine) {
      return getNPCsByStoryLine(storyLine);
    }
    return getNPCsByStoryLine('origin'); // Default to origin story
  }, [npcId, storyLine]);

  useEffect(() => {
    if (npcId && !selectedNPC) {
      const npc = getNPCById(npcId);
      if (npc) {
        setSelectedNPC(npc);
        initializeDialogue(npc);
      }
    }
  }, [npcId, selectedNPC]);

  const initializeDialogue = (npc: NPC) => {
    const availableDialogues = getAvailableDialogues(npc.id);
    if (availableDialogues.length > 0) {
      setCurrentDialogue(availableDialogues[0]);
      setDialogueHistory([]);
    }
  };

  const handleNPCSelect = (npc: NPC) => {
    setSelectedNPC(npc);
    initializeDialogue(npc);
  };

  const handleOptionSelect = async (option: DialogOption) => {
    if (!selectedNPC || !currentDialogue) return;

    // Add player's choice to history
    setDialogueHistory(prev => [...prev, `You: ${option.text}`]);
    setIsTyping(true);

    // Simulate typing delay
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Add NPC response to history (simplified for now)
    setDialogueHistory(prev => [...prev, `${selectedNPC.name}: Thank you for your choice.`]);

    // Navigate to next dialogue or end conversation
    if (option.nextDialogId) {
      const nextDialog = getDialogById(option.nextDialogId);
      if (nextDialog) {
        setCurrentDialogue(nextDialog);
      }
    } else {
      // End conversation
      setTimeout(() => {
        setCurrentDialogue(null);
        setDialogueHistory([]);
        if (onClose) onClose();
      }, 2000);
    }

    setIsTyping(false);
  };

  const getRelationshipColor = (relationship: string) => {
    switch (relationship) {
      case 'ally': return 'text-green-400';
      case 'neutral': return 'text-gray-400';
      case 'suspicious': return 'text-yellow-400';
      case 'hostile': return 'text-red-400';
      case 'unknown': return 'text-purple-400';
      default: return 'text-gray-400';
    }
  };

  const getRelationshipIcon = (relationship: string) => {
    switch (relationship) {
      case 'ally': return <Star className="w-4 h-4" />;
      case 'neutral': return <User className="w-4 h-4" />;
      case 'suspicious': return <AlertTriangle className="w-4 h-4" />;
      case 'hostile': return <X className="w-4 h-4" />;
      case 'unknown': return <MessageCircle className="w-4 h-4" />;
      default: return <User className="w-4 h-4" />;
    }
  };

  if (!selectedNPC) {
    return (
      <div className={`bg-gray-900 rounded-lg border border-gray-700 ${className}`}>
        <div className="p-6 border-b border-gray-700">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold text-cyan-400 flex items-center gap-2">
              <MessageCircle className="w-6 h-6" />
              NPC Contacts
            </h2>
            {onClose && (
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-white transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            )}
          </div>
        </div>

        <div className="p-6">
          <div className="grid gap-4">
            {availableNPCs.map((npc) => {
              const availableDialogues = getAvailableDialogues(npc.id);
              const hasNewDialogue = availableDialogues.length > 0;

              return (
                <div
                  key={npc.id}
                  onClick={() => hasNewDialogue && handleNPCSelect(npc)}
                  className={`p-4 border border-gray-700 rounded-lg transition-all duration-200 ${
                    hasNewDialogue 
                      ? 'cursor-pointer hover:border-cyan-500 bg-gray-800/50' 
                      : 'opacity-50 cursor-not-allowed bg-gray-800/20'
                  }`}
                >
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h3 className="text-lg font-semibold text-cyan-400">{npc.name}</h3>
                      <p className="text-sm text-gray-400">{npc.personality}</p>
                    </div>
                    <div className={`flex items-center gap-1 ${getRelationshipColor('neutral')}`}>
                      {getRelationshipIcon('neutral')}
                      <span className="text-sm capitalize">neutral</span>
                    </div>
                  </div>

                  <p className="text-gray-300 text-sm mb-3">{npc.description}</p>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Zap className="w-3 h-3 text-purple-400" />
                      <span className="text-xs text-purple-400 capitalize">
                        {npc.location} Story
                      </span>
                    </div>
                    {hasNewDialogue && (
                      <div className="flex items-center gap-1 text-green-400">
                        <MessageCircle className="w-3 h-3" />
                        <span className="text-xs">Available</span>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
  }

  if (!currentDialogue) {
    return (
      <div className={`bg-gray-900 rounded-lg border border-gray-700 ${className}`}>
        <div className="p-6 text-center">
          <MessageCircle className="w-12 h-12 text-gray-500 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-400 mb-2">No Dialogue Available</h3>
          <p className="text-gray-500">This contact has nothing new to say right now.</p>
          <button
            onClick={() => setSelectedNPC(null)}
            className="mt-4 px-4 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-600 transition-colors"
          >
            Back to Contacts
          </button>
        </div>
      </div>
    );
  }

  const availableOptions = getDialogueOptions(currentDialogue.id);

  return (
    <div className={`bg-gray-900 rounded-lg border border-gray-700 ${className}`}>
      {/* Header */}
      <div className="p-6 border-b border-gray-700">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSelectedNPC(null)}
              className="text-gray-400 hover:text-white transition-colors"
            >
              <ArrowRight className="w-5 h-5 rotate-180" />
            </button>
            <div>
              <h2 className="text-xl font-bold text-cyan-400">{selectedNPC.name}</h2>
              <p className="text-sm text-gray-400">{selectedNPC.personality}</p>
            </div>
          </div>
          <div className={`flex items-center gap-1 ${getRelationshipColor('neutral')}`}>
            {getRelationshipIcon('neutral')}
            <span className="text-sm capitalize">neutral</span>
          </div>
        </div>
      </div>

      {/* Dialogue Area */}
      <div className="p-6">
        {/* Dialogue History */}
        <div className="mb-6 space-y-3 max-h-64 overflow-y-auto">
          {dialogueHistory.map((message, index) => {
            const isPlayer = message.startsWith('You:');
            return (
              <div
                key={index}
                className={`flex ${isPlayer ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                    isPlayer
                      ? 'bg-cyan-600 text-white'
                      : 'bg-gray-700 text-gray-300'
                  }`}
                >
                  <p className="text-sm">{message.replace(/^(You:|[^:]+:)\s*/, '')}</p>
                </div>
              </div>
            );
          })}
          {isTyping && (
            <div className="flex justify-start">
              <div className="bg-gray-700 text-gray-300 px-4 py-2 rounded-lg">
                <div className="flex items-center gap-1">
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-pulse"></div>
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-pulse" style={{ animationDelay: '0.2s' }}></div>
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-pulse" style={{ animationDelay: '0.4s' }}></div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Current Dialogue */}
        <div className="mb-6">
          <div className="bg-gray-800 p-4 rounded-lg border-l-4 border-cyan-500">
            <div className="flex items-center gap-2 mb-2">
              <User className="w-4 h-4 text-cyan-400" />
              <span className="font-semibold text-cyan-400">{selectedNPC.name}</span>
            </div>
            <p className="text-gray-300">{currentDialogue.text}</p>
          </div>
        </div>

        {/* Dialogue Options */}
        <div className="space-y-3">
          {availableOptions.map((option, index) => (
            <button
              key={index}
              onClick={() => handleOptionSelect(option)}
              disabled={isTyping}
              className="w-full p-3 text-left bg-gray-800 border border-gray-600 rounded-lg hover:border-cyan-500 hover:bg-gray-700 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <div className="flex items-center justify-between">
                <span className="text-gray-300">{option.text}</span>
                <ArrowRight className="w-4 h-4 text-gray-500" />
              </div>

            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default NPCDialogueSystem;