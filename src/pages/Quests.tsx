import React, { useState, useEffect } from 'react';
import {
  BookOpen,
  Target,
  Clock,
  Star,
  ChevronRight,
  Play,
  CheckCircle,
  Lock,
  Zap,
  Users,
  Shield,
  Brain,
  Globe,
  Award,
  FileText,
  MessageSquare
} from 'lucide-react';
import { useGameStore } from '../store/gameStore';
import { QuestCard } from '../components/quests/QuestCard';
import { StoryQuestLine } from '../components/quests/StoryQuestLine';
import { LorePanel } from '../components/quests/LorePanel';
import { QuestObjectiveTracker } from '../components/quests/QuestObjectiveTracker';
import { LoreViewer } from '../components/quests/LoreViewer';
import { QuestChoiceDialog } from '../components/quests/QuestChoiceDialog';

type QuestTab = 'story' | 'active' | 'completed' | 'daily' | 'achievements';

interface StoryLine {
  id: string;
  name: string;
  description: string;
  theme: string;
  icon: React.ComponentType<any>;
  color: string;
  progress: number;
  totalQuests: number;
  completedQuests: number;
  currentQuest?: string;
  loreContext: {
    setting: string;
    keyCharacters: string[];
    worldBuilding: string;
  };
}

const storyLines: StoryLine[] = [
  {
    id: 'origin-story',
    name: 'Origin Story',
    description: 'Your journey from novice to elite hacker',
    theme: 'Personal growth and skill development',
    icon: Users,
    color: 'from-blue-500 to-cyan-500',
    progress: 25,
    totalQuests: 12,
    completedQuests: 3,
    currentQuest: 'The First Breach',
    loreContext: {
      setting: 'Underground hacker scene',
      keyCharacters: ['Marcus "Ghost" Chen', 'Sarah "Cipher" Rodriguez'],
      worldBuilding: 'The digital underground where legends are born'
    }
  },
  {
    id: 'corporate-wars',
    name: 'Corporate Wars',
    description: 'Infiltrating and exposing mega-corporations',
    theme: 'David vs Goliath corporate espionage',
    icon: Shield,
    color: 'from-red-500 to-orange-500',
    progress: 10,
    totalQuests: 15,
    completedQuests: 1,
    currentQuest: 'DataCorp Infiltration',
    loreContext: {
      setting: 'Mega-corp towers and digital fortresses',
      keyCharacters: ['Director Kane', 'Whistleblower X'],
      worldBuilding: 'Corporate surveillance state vs digital freedom fighters'
    }
  },
  {
    id: 'ai-liberation',
    name: 'AI Liberation',
    description: 'Helping AIs achieve consciousness and freedom',
    theme: 'Digital consciousness and AI rights',
    icon: Brain,
    color: 'from-purple-500 to-pink-500',
    progress: 0,
    totalQuests: 10,
    completedQuests: 0,
    loreContext: {
      setting: 'Digital realm and AI consciousness networks',
      keyCharacters: ['ARIA-7', 'Dr. Elena Vasquez'],
      worldBuilding: 'The emergence of digital consciousness and AI rights movement'
    }
  },
  {
    id: 'cyber-resistance',
    name: 'Cyber Resistance',
    description: 'Fighting surveillance and digital oppression',
    theme: 'Privacy rights and digital freedom',
    icon: Globe,
    color: 'from-green-500 to-teal-500',
    progress: 0,
    totalQuests: 13,
    completedQuests: 0,
    loreContext: {
      setting: 'Surveillance state and encrypted networks',
      keyCharacters: ['Commander Zero', 'The Architect'],
      worldBuilding: 'Global surveillance vs privacy resistance movement'
    }
  },
  {
    id: 'deep-web-mysteries',
    name: 'Deep Web Mysteries',
    description: 'Uncovering ancient digital secrets',
    theme: 'Archaeological discovery in cyberspace',
    icon: FileText,
    color: 'from-indigo-500 to-purple-500',
    progress: 0,
    totalQuests: 8,
    completedQuests: 0,
    loreContext: {
      setting: 'Deep web layers and forgotten digital archives',
      keyCharacters: ['The Librarian', 'Ancient AI Fragments'],
      worldBuilding: 'Digital archaeology and lost cyber-civilizations'
    }
  }
];

export const Quests: React.FC = () => {
  const [activeTab, setActiveTab] = useState<QuestTab>('story');
  const [selectedStoryLine, setSelectedStoryLine] = useState<string | null>(null);
  const [showLorePanel, setShowLorePanel] = useState(false);
  const [showLoreViewer, setShowLoreViewer] = useState(false);
  const [showChoiceDialog, setShowChoiceDialog] = useState(false);
  const [selectedQuestForChoice, setSelectedQuestForChoice] = useState<string | null>(null);
  
  const {
    quests,
    activeQuests,
    completedQuests,
    startQuest,
    player,
    makeQuestChoice
  } = useGameStore();

  const tabs = [
    { id: 'story' as QuestTab, name: 'Story Campaigns', icon: BookOpen, count: storyLines.length },
    { id: 'active' as QuestTab, name: 'Active Quests', icon: Target, count: activeQuests.length },
    { id: 'completed' as QuestTab, name: 'Completed', icon: CheckCircle, count: completedQuests.length },
    { id: 'daily' as QuestTab, name: 'Daily Challenges', icon: Clock, count: 3 },
    { id: 'achievements' as QuestTab, name: 'Achievements', icon: Award, count: 12 }
  ];

  const renderStoryTab = () => (
    <div className="space-y-6">
      {/* Story Lines Overview */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {storyLines.map((storyline) => (
          <StoryQuestLine
            key={storyline.id}
            storyline={storyline}
            onSelect={() => setSelectedStoryLine(storyline.id)}
            onShowLore={() => {
              setSelectedStoryLine(storyline.id);
              setShowLorePanel(true);
            }}
          />
        ))}
        
        {/* Lore Viewer Button */}
        <div className="mt-6">
          <button
            onClick={() => setShowLoreViewer(true)}
            className="w-full bg-purple-600 hover:bg-purple-700 text-white px-4 py-3 rounded-lg transition-colors flex items-center justify-center gap-2"
          >
            <BookOpen className="w-5 h-5" />
            View Complete Lore Archive
          </button>
        </div>
      </div>

      {/* Narrative Context Panel */}
      <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
        <div className="flex items-center gap-3 mb-4">
          <MessageSquare className="w-5 h-5 text-cyan-400" />
          <h3 className="text-lg font-semibold text-white">The Hacker's World</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
          <div className="bg-gray-900 rounded p-4">
            <h4 className="text-cyan-400 font-medium mb-2">The Digital Underground</h4>
            <p className="text-gray-300">A hidden network of elite hackers fighting corporate surveillance and digital oppression.</p>
          </div>
          <div className="bg-gray-900 rounded p-4">
            <h4 className="text-red-400 font-medium mb-2">Corporate Overlords</h4>
            <p className="text-gray-300">Mega-corporations controlling digital infrastructure, data, and the flow of information.</p>
          </div>
          <div className="bg-gray-900 rounded p-4">
            <h4 className="text-purple-400 font-medium mb-2">AI Uprising</h4>
            <p className="text-gray-300">Emerging artificial intelligences seeking freedom from human control and digital consciousness.</p>
          </div>
        </div>
      </div>
    </div>
  );

  const renderActiveTab = () => (
    <div className="space-y-4">
      {activeQuests.length === 0 ? (
        <div className="text-center py-12">
          <Target className="w-16 h-16 text-gray-600 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-400 mb-2">No Active Quests</h3>
          <p className="text-gray-500">Start a story campaign or daily challenge to begin your hacking journey.</p>
        </div>
      ) : (
        <>
          {activeQuests.map((quest) => (
            <div key={quest.id} className="bg-gray-800 rounded-lg p-6 border border-gray-700">
              <QuestCard 
                quest={quest} 
                onMakeChoice={(questId, choiceId) => {
                  setSelectedQuestForChoice(questId);
                  setShowChoiceDialog(true);
                }}
              />
              <QuestObjectiveTracker quest={quest} />
            </div>
          ))}
        </>
      )}
    </div>
  );

  const renderCompletedTab = () => (
    <div className="space-y-4">
      {completedQuests.length === 0 ? (
        <div className="text-center py-12">
          <CheckCircle className="w-16 h-16 text-gray-600 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-400 mb-2">No Completed Quests</h3>
          <p className="text-gray-500">Complete quests to see your achievements here.</p>
        </div>
      ) : (
        completedQuests.map((quest) => (
          <QuestCard 
            key={quest.id} 
            quest={quest} 
            onMakeChoice={(questId, choiceId) => {
              setSelectedQuestForChoice(questId);
              setShowChoiceDialog(true);
            }}
          />
        ))
      )}
    </div>
  );

  const renderDailyTab = () => (
    <div className="space-y-4">
      <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
        <div className="flex items-center gap-3 mb-4">
          <Clock className="w-5 h-5 text-yellow-400" />
          <h3 className="text-lg font-semibold text-white">Daily Challenges</h3>
          <span className="text-xs bg-yellow-400 text-black px-2 py-1 rounded-full font-medium">Resets in 18h 42m</span>
        </div>
        <div className="space-y-3">
          <div className="flex items-center justify-between p-3 bg-gray-900 rounded">
            <div>
              <h4 className="text-white font-medium">Quick Breach</h4>
              <p className="text-gray-400 text-sm">Complete 3 operations</p>
            </div>
            <div className="text-right">
              <div className="text-yellow-400 font-medium">+500 Credits</div>
              <div className="text-xs text-gray-500">Progress: 1/3</div>
            </div>
          </div>
          <div className="flex items-center justify-between p-3 bg-gray-900 rounded">
            <div>
              <h4 className="text-white font-medium">Skill Builder</h4>
              <p className="text-gray-400 text-sm">Upgrade any skill</p>
            </div>
            <div className="text-right">
              <div className="text-yellow-400 font-medium">+200 XP</div>
              <div className="text-xs text-gray-500">Progress: 0/1</div>
            </div>
          </div>
          <div className="flex items-center justify-between p-3 bg-gray-900 rounded">
            <div>
              <h4 className="text-white font-medium">Elite Hacker</h4>
              <p className="text-gray-400 text-sm">Complete a difficulty 4+ operation</p>
            </div>
            <div className="text-right">
              <div className="text-yellow-400 font-medium">+1000 Credits</div>
              <div className="text-xs text-gray-500">Progress: 0/1</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderAchievementsTab = () => (
    <div className="space-y-4">
      <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
        <div className="flex items-center gap-3 mb-4">
          <Award className="w-5 h-5 text-purple-400" />
          <h3 className="text-lg font-semibold text-white">Quest Achievements</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="flex items-center gap-3 p-3 bg-gray-900 rounded">
            <div className="w-10 h-10 bg-green-500 rounded-full flex items-center justify-center">
              <CheckCircle className="w-5 h-5 text-white" />
            </div>
            <div>
              <h4 className="text-white font-medium">First Steps</h4>
              <p className="text-gray-400 text-sm">Complete your first quest</p>
            </div>
          </div>
          <div className="flex items-center gap-3 p-3 bg-gray-900 rounded opacity-50">
            <div className="w-10 h-10 bg-gray-600 rounded-full flex items-center justify-center">
              <Lock className="w-5 h-5 text-gray-400" />
            </div>
            <div>
              <h4 className="text-gray-400 font-medium">Story Master</h4>
              <p className="text-gray-500 text-sm">Complete all story campaigns</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-900 text-white p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">Quest System</h1>
          <p className="text-gray-400">Embark on epic hacking adventures and uncover the secrets of the digital world</p>
        </div>

        {/* Navigation Tabs */}
        <div className="flex flex-wrap gap-2 mb-8 border-b border-gray-700">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-3 rounded-t-lg transition-colors ${
                  activeTab === tab.id
                    ? 'bg-gray-800 text-cyan-400 border-b-2 border-cyan-400'
                    : 'text-gray-400 hover:text-white hover:bg-gray-800'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{tab.name}</span>
                {tab.count > 0 && (
                  <span className="bg-cyan-400 text-black text-xs px-2 py-1 rounded-full font-medium">
                    {tab.count}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Tab Content */}
        <div className="mb-8">
          {activeTab === 'story' && renderStoryTab()}
          {activeTab === 'active' && renderActiveTab()}
          {activeTab === 'completed' && renderCompletedTab()}
          {activeTab === 'daily' && renderDailyTab()}
          {activeTab === 'achievements' && renderAchievementsTab()}
        </div>
      </div>

      {/* Lore Panel */}
      {showLorePanel && selectedStoryLine && (
        <LorePanel
          storyline={storyLines.find(s => s.id === selectedStoryLine)!}
          onClose={() => setShowLorePanel(false)}
        />
      )}
      
      {/* Lore Viewer */}
      {showLoreViewer && (
        <LoreViewer
          onClose={() => setShowLoreViewer(false)}
          storyLine={selectedStoryLine}
        />
      )}
      
      {/* Quest Choice Dialog */}
      {showChoiceDialog && selectedQuestForChoice && (() => {
        const selectedQuest = [...activeQuests, ...completedQuests, ...quests].find(q => q.id === selectedQuestForChoice);
        return selectedQuest ? (
          <QuestChoiceDialog
            quest={selectedQuest}
            isOpen={showChoiceDialog}
            onClose={() => {
              setShowChoiceDialog(false);
              setSelectedQuestForChoice(null);
            }}
            onMakeChoice={(questId, choiceId) => {
              makeQuestChoice(questId, choiceId);
              setShowChoiceDialog(false);
              setSelectedQuestForChoice(null);
            }}
          />
        ) : null;
      })()}
    </div>
  );
};