import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Progress } from '../ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { 
  Zap, Clock, Shield, Sword, Users, Search, 
  Wrench, Eye, Code, Globe, AlertTriangle,
  Star, Trophy, Gift, Target
} from 'lucide-react';
import { 
  questTypes, 
  QuestType, 
  generateQuestFromType,
  getQuestTypesByCategory,
  getRandomQuestType
} from '../../data/questTypes';
import { 
  questMechanicsHandler, 
  QuestProgressInfo,
  MechanicUpdateResult
} from '../../utils/questMechanics';
import { useGameStore } from '../../store/gameStore';
import { Quest } from '../../store/gameStore';

interface GeneratedQuest extends Quest {
  questType: QuestType;
  mechanicsProgress?: QuestProgressInfo;
}

const QuestGenerator: React.FC = () => {
  const { player, addQuest, updateQuest, claimReward } = useGameStore();
  const [generatedQuests, setGeneratedQuests] = useState<GeneratedQuest[]>([]);
  const [activeQuests, setActiveQuests] = useState<GeneratedQuest[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedDifficulty, setSelectedDifficulty] = useState<string>('all');
  const [isGenerating, setIsGenerating] = useState(false);

  // Generate initial quests
  useEffect(() => {
    generateInitialQuests();
  }, []);

  // Update quest progress periodically
  useEffect(() => {
    const interval = setInterval(() => {
      updateActiveQuestProgress();
    }, 5000); // Update every 5 seconds

    return () => clearInterval(interval);
  }, [activeQuests]);

  const generateInitialQuests = () => {
    const initialQuests: GeneratedQuest[] = [];
    
    // Generate 2-3 quests of each category
    const categories: ('story' | 'side' | 'daily' | 'challenge')[] = ['story', 'side', 'daily', 'challenge'];
    
    categories.forEach(category => {
      const categoryTypes = getQuestTypesByCategory(category);
      const questCount = category === 'story' ? 3 : 2;
      
      for (let i = 0; i < questCount && i < categoryTypes.length; i++) {
        const questType = categoryTypes[i];
        const generatedQuest = createQuestFromType(questType);
        initialQuests.push(generatedQuest);
      }
    });
    
    setGeneratedQuests(initialQuests);
  };

  const mapQuestTypeCategory = (category: string): 'combat' | 'progression' | 'social' | 'exploration' | 'mastery' => {
    const categoryMap: { [key: string]: 'combat' | 'progression' | 'social' | 'exploration' | 'mastery' } = {
      'story': 'progression',
      'side': 'exploration',
      'daily': 'progression',
      'challenge': 'mastery'
    };
    return categoryMap[category] || 'exploration';
  };

  const createQuestFromType = (questType: QuestType): GeneratedQuest => {
    const baseQuest = generateQuestFromType(questType);
    
    const quest: GeneratedQuest = {
      id: `generated_${questType.id}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      title: baseQuest.title || questType.name,
      description: baseQuest.description || questType.description,
      type: questType.category === 'story' ? 'story' : questType.category === 'daily' ? 'daily' : questType.category === 'challenge' ? 'special' : 'weekly',
      objectives: baseQuest.objectives || [],
      rewards: baseQuest.rewards || [],
      difficulty: (baseQuest.difficulty || questType.difficulty) as 1 | 2 | 3 | 4 | 5,
      category: mapQuestTypeCategory(questType.category),
      status: 'available',
      isRepeatable: questType.category === 'daily' || questType.category === 'challenge',
      progress: {
        startedAt: 0,
        lastUpdated: Date.now(),
        completionPercentage: 0
      },
      questType,
      storyLine: 'generated',
      prerequisites: []
    };
    
    return quest;
  };

  const startQuest = (quest: GeneratedQuest) => {
    // Initialize quest mechanics
    questMechanicsHandler.initializeQuest(
      quest.id,
      [], // No mechanics for now
      player
    );
    
    const startTime = Date.now();
    const updatedQuest = {
      ...quest,
      status: 'active' as const,
      startedAt: startTime,
      progress: {
        startedAt: startTime,
        lastUpdated: startTime,
        completionPercentage: 0
      },
      mechanicsProgress: questMechanicsHandler.getQuestProgress(quest.id)
    };
    
    setActiveQuests(prev => [...prev, updatedQuest]);
    setGeneratedQuests(prev => prev.filter(q => q.id !== quest.id));
    
    // Add to game store
    addQuest(updatedQuest);
  };

  const updateActiveQuestProgress = () => {
    setActiveQuests(prev => prev.map(quest => {
      const progressInfo = questMechanicsHandler.getQuestProgress(quest.id);
      
      if (progressInfo) {
        const updatedQuest = {
          ...quest,
          mechanicsProgress: progressInfo,
          progress: {
            startedAt: quest.progress?.startedAt || quest.startedAt || Date.now(),
            lastUpdated: Date.now(),
            completionPercentage: progressInfo.overallProgress
          }
        };
        
        // Check if quest is completed
        if (progressInfo.overallProgress >= 100) {
          completeQuest(updatedQuest);
          return updatedQuest;
        }
        
        // Check if quest failed
        if (progressInfo.failed) {
          failQuest(updatedQuest);
          return updatedQuest;
        }
        
        return updatedQuest;
      }
      
      return quest;
    }));
  };

  const simulateQuestAction = (quest: GeneratedQuest, actionType: string) => {
    if (!quest.mechanicsProgress?.activeMechanic) return;
    
    const mechanicId = quest.mechanicsProgress.activeMechanic.id;
    const progressDelta = getProgressDeltaForAction(actionType, quest.questType);
    
    const result = questMechanicsHandler.updateMechanic(
      quest.id,
      mechanicId,
      progressDelta
    );
    
    if (!result.success && result.error) {
      // Show error message (could be integrated with toast system)
      console.warn(`Quest action failed: ${result.error}`);
    }
  };

  const getProgressDeltaForAction = (actionType: string, questType: QuestType): number => {
    const baseProgress = {
      'hack': 25,
      'investigate': 20,
      'craft': 30,
      'explore': 15,
      'combat': 35,
      'social': 20,
      'stealth': 25,
      'puzzle': 40
    };
    
    return baseProgress[actionType as keyof typeof baseProgress] || 10;
  };

  const completeQuest = (quest: GeneratedQuest) => {
    // Update quest status
    const completedQuest = {
      ...quest,
      status: 'completed' as const,
      completedAt: Date.now()
    };
    
    updateQuest(completedQuest.id, completedQuest);
    
    // Remove from active quests
    setActiveQuests(prev => prev.filter(q => q.id !== quest.id));
    
    // Cleanup mechanics
    questMechanicsHandler.cleanupQuest(quest.id);
    
    // Award rewards - claim quest rewards using the quest ID
    claimReward(quest.id);
  };

  const failQuest = (quest: GeneratedQuest) => {
    const failedQuest = {
      ...quest,
      status: 'failed' as const,
      failedAt: Date.now()
    };
    
    updateQuest(failedQuest.id, failedQuest);
    setActiveQuests(prev => prev.filter(q => q.id !== quest.id));
    questMechanicsHandler.cleanupQuest(quest.id);
  };

  const generateNewQuest = () => {
    setIsGenerating(true);
    
    setTimeout(() => {
      const filters: any = {};
      if (selectedCategory !== 'all') filters.category = selectedCategory;
      if (selectedDifficulty !== 'all') filters.difficulty = selectedDifficulty;
      
      const questType = getRandomQuestType();
      
      if (questType) {
        const newQuest = createQuestFromType(questType);
        setGeneratedQuests(prev => [...prev, newQuest]);
      }
      
      setIsGenerating(false);
    }, 1000);
  };

  const getMechanicIcon = (mechanicType: string) => {
    const icons = {
      'timer': Clock,
      'resource_management': Zap,
      'puzzle': Target,
      'stealth': Eye,
      'combat': Sword,
      'social': Users,
      'exploration': Globe,
      'crafting': Wrench,
      'investigation': Search,
      'hacking': Code
    };
    
    return icons[mechanicType as keyof typeof icons] || AlertTriangle;
  };

  const getDifficultyColor = (difficulty: number | string) => {
    const difficultyMap: { [key: number]: string } = {
      1: 'easy',
      2: 'medium', 
      3: 'hard',
      4: 'expert',
      5: 'expert'
    };
    
    const difficultyStr = typeof difficulty === 'number' ? difficultyMap[difficulty] || 'medium' : difficulty;
    
    const colors = {
      'easy': 'bg-green-500',
      'medium': 'bg-yellow-500',
      'hard': 'bg-orange-500',
      'expert': 'bg-red-500'
    };
    
    return colors[difficultyStr as keyof typeof colors] || 'bg-gray-500';
  };

  const getCategoryColor = (category: string) => {
    const colors = {
      'story': 'bg-purple-500',
      'side': 'bg-blue-500',
      'daily': 'bg-green-500',
      'weekly': 'bg-orange-500',
      'event': 'bg-red-500'
    };
    
    return colors[category as keyof typeof colors] || 'bg-gray-500';
  };

  const filteredQuests = generatedQuests.filter(quest => {
    if (selectedCategory !== 'all' && quest.category !== selectedCategory) return false;
    if (selectedDifficulty !== 'all' && quest.difficulty !== parseInt(selectedDifficulty)) return false;
    return true;
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-green-400">Quest Generator</h2>
        <Button 
          onClick={generateNewQuest} 
          disabled={isGenerating}
          className="bg-green-600 hover:bg-green-700"
        >
          {isGenerating ? 'Generating...' : 'Generate New Quest'}
        </Button>
      </div>

      <Tabs defaultValue="available" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="available">Available Quests</TabsTrigger>
          <TabsTrigger value="active">Active Quests</TabsTrigger>
          <TabsTrigger value="types">Quest Types</TabsTrigger>
        </TabsList>

        <TabsContent value="available" className="space-y-4">
          <div className="flex gap-4 mb-4">
            <select 
              value={selectedCategory} 
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="bg-gray-800 border border-gray-600 rounded px-3 py-2 text-white"
            >
              <option value="all">All Categories</option>
              <option value="story">Story</option>
              <option value="side">Side</option>
              <option value="daily">Daily</option>
              <option value="weekly">Weekly</option>
              <option value="event">Event</option>
            </select>
            
            <select 
              value={selectedDifficulty} 
              onChange={(e) => setSelectedDifficulty(e.target.value)}
              className="bg-gray-800 border border-gray-600 rounded px-3 py-2 text-white"
            >
              <option value="all">All Difficulties</option>
              <option value="easy">Easy</option>
              <option value="medium">Medium</option>
              <option value="hard">Hard</option>
              <option value="expert">Expert</option>
            </select>
          </div>

          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {filteredQuests.map(quest => (
              <Card key={quest.id} className="bg-gray-800 border-gray-700">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <CardTitle className="text-lg text-green-400">{quest.title}</CardTitle>
                    <div className="flex gap-2">
                      <Badge className={`${getCategoryColor(quest.category)} text-white`}>
                        {quest.category}
                      </Badge>
                      <Badge className={`${getDifficultyColor(quest.difficulty)} text-white`}>
                        {quest.difficulty}
                      </Badge>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-gray-300 text-sm">{quest.description}</p>
                  
                  <div className="space-y-2">
                    <h4 className="text-sm font-semibold text-green-400">Tags:</h4>
                    <div className="flex flex-wrap gap-1">
                      {(quest.questType?.tags || []).map((tag, index) => (
                        <span key={index} className="px-2 py-1 bg-gray-700 rounded text-xs text-gray-300">
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <h4 className="text-sm font-semibold text-green-400">Rewards:</h4>
                    <div className="flex flex-wrap gap-2">
                      {(Array.isArray(quest.rewards) ? quest.rewards : []).map((reward, index) => (
                        <div key={index} className="flex items-center gap-1 text-xs bg-blue-900 px-2 py-1 rounded">
                          <Gift className="w-3 h-3" />
                          <span>{reward.type}: {reward.amount || reward.itemId || reward.title}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between pt-2">
                    <span className="text-xs text-gray-400">Duration: {quest.questType.estimatedDuration}min</span>
                    <Button 
                      onClick={() => startQuest(quest)}
                      size="sm"
                      className="bg-green-600 hover:bg-green-700"
                    >
                      Start Quest
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="active" className="space-y-4">
          {activeQuests.length === 0 ? (
            <Card className="bg-gray-800 border-gray-700">
              <CardContent className="text-center py-8">
                <p className="text-gray-400">No active quests. Start a quest from the Available tab!</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4">
              {activeQuests.map(quest => (
                <Card key={quest.id} className="bg-gray-800 border-gray-700">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <CardTitle className="text-lg text-green-400">{quest.title}</CardTitle>
                      <div className="flex gap-2">
                        <Badge className={`${getCategoryColor(quest.category)} text-white`}>
                          {quest.category}
                        </Badge>
                        <Badge className={`${getDifficultyColor(quest.difficulty)} text-white`}>
                          {quest.difficulty}
                        </Badge>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-semibold text-green-400">Overall Progress</span>
                        <span className="text-sm text-gray-400">
                          {quest.mechanicsProgress?.overallProgress.toFixed(1) || 0}%
                        </span>
                      </div>
                      <Progress 
                        value={quest.mechanicsProgress?.overallProgress || 0} 
                        className="h-2"
                      />
                    </div>
                    
                    {quest.mechanicsProgress?.activeMechanic && (
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-semibold text-blue-400">
                            Current: {quest.mechanicsProgress.activeMechanic.type.replace('_', ' ')}
                          </span>
                          <span className="text-sm text-gray-400">
                            {quest.mechanicsProgress.activeMechanic.progressPercentage.toFixed(1)}%
                          </span>
                        </div>
                        <Progress 
                          value={quest.mechanicsProgress.activeMechanic.progressPercentage} 
                          className="h-2"
                        />
                        
                        <div className="flex gap-2 mt-3">
                          <Button 
                            size="sm" 
                            onClick={() => simulateQuestAction(quest, 'hack')}
                            className="bg-purple-600 hover:bg-purple-700"
                          >
                            Hack
                          </Button>
                          <Button 
                            size="sm" 
                            onClick={() => simulateQuestAction(quest, 'investigate')}
                            className="bg-blue-600 hover:bg-blue-700"
                          >
                            Investigate
                          </Button>
                          <Button 
                            size="sm" 
                            onClick={() => simulateQuestAction(quest, 'stealth')}
                            className="bg-gray-600 hover:bg-gray-700"
                          >
                            Stealth
                          </Button>
                        </div>
                      </div>
                    )}
                    
                    <div className="text-xs text-gray-400">
                      Mechanics: {quest.mechanicsProgress?.completedMechanics || 0} / {quest.mechanicsProgress?.totalMechanics || 0} completed
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="types" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {questTypes.map(questType => (
              <Card key={questType.id} className="bg-gray-800 border-gray-700">
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg text-green-400">{questType.name}</CardTitle>
                  <div className="flex gap-2">
                    <Badge className={`${getCategoryColor(questType.category)} text-white`}>
                      {questType.category}
                    </Badge>
                    <Badge className={`${getDifficultyColor(questType.difficulty)} text-white`}>
                      {questType.difficulty}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <p className="text-gray-300 text-sm">{questType.description}</p>
                  
                  <div className="space-y-2">
                    <h4 className="text-sm font-semibold text-green-400">Tags:</h4>
                    <div className="flex flex-wrap gap-1">
                      {questType.tags.map((tag, index) => (
                        <span key={index} className="px-2 py-1 bg-gray-700 rounded text-xs text-gray-300">
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                  
                  <div className="text-xs text-gray-400">
                    Duration: {questType.estimatedDuration}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default QuestGenerator;