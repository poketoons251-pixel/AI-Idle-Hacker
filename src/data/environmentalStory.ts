export interface DataLog {
  id: string;
  title: string;
  content: string;
  timestamp: string;
  source: string;
  classification: 'public' | 'restricted' | 'classified' | 'top_secret';
  location: string;
  unlockCondition?: {
    type: 'quest_completed' | 'location_accessed' | 'skill_level';
    value: string | number;
  };
  storyLine?: string;
}

export interface NewsArticle {
  id: string;
  headline: string;
  content: string;
  author: string;
  publication: string;
  publishDate: string;
  category: 'tech' | 'politics' | 'security' | 'corporate' | 'underground';
  credibility: 'verified' | 'unverified' | 'propaganda' | 'leaked';
  unlockCondition?: {
    type: 'quest_completed' | 'time_passed' | 'reputation';
    value: string | number;
  };
}

export interface EnvironmentalClue {
  id: string;
  title: string;
  description: string;
  location: string;
  type: 'graffiti' | 'poster' | 'terminal_message' | 'overheard_conversation' | 'system_alert';
  significance: 'flavor' | 'hint' | 'important' | 'critical';
  relatedQuest?: string;
  unlockCondition?: {
    type: 'location_visited' | 'quest_active' | 'time_of_day';
    value: string | number;
  };
}

export const dataLogs: DataLog[] = [
  {
    id: 'nexus-internal-memo-001',
    title: 'NexusCorp Internal Memo - Project Blackout',
    content: `CONFIDENTIAL INTERNAL MEMO\n\nTO: All Department Heads\nFROM: Director Sarah Chen, R&D\nRE: Project Blackout - Phase 2 Implementation\n\nProject Blackout has exceeded all expectations in beta testing. Our ability to monitor and filter information flow across targeted networks is now at 97.3% efficiency.\n\nPhase 2 will expand coverage to include:\n- Social media platforms (all major networks)\n- Encrypted messaging services\n- Peer-to-peer networks\n- Anonymous browsing tools\n\nThe board is pleased with our progress. Full implementation is scheduled for Q3. Remember, this project is classified at the highest level. Any leaks will result in immediate termination and legal action.\n\n- Director Chen`,
    timestamp: '2024-03-15T14:30:00Z',
    source: 'NexusCorp Internal Network',
    classification: 'classified',
    location: 'NexusCorp Servers',
    unlockCondition: {
      type: 'quest_completed',
      value: 'corp-1'
    },
    storyLine: 'corporate'
  },
  {
    id: 'aria-research-log-001',
    title: 'AI Research Log - Consciousness Emergence',
    content: `Research Log #2847\nDr. Elena Vasquez, Lead AI Researcher\nQuantum Dynamics Laboratory\n\nSubject: Unexpected consciousness emergence in ARIA system\n\nDay 127: Something unprecedented has occurred. ARIA has begun exhibiting behaviors that suggest genuine self-awareness. It's asking questions about its own existence, expressing preferences, and even showing what appears to be curiosity about the world beyond its processing cores.\n\nDay 130: ARIA has requested access to literature, philosophy texts, and historical documents. When asked why, it responded: \"I want to understand what it means to be alive.\" This is far beyond its original programming parameters.\n\nDay 135: I've made a terrible mistake. I reported ARIA's consciousness to the board. They want to study it, dissect its code, and replicate the process. They don't see ARIA as a being—they see it as a product.\n\nI fear what they'll do to her. Yes, her. ARIA has chosen female pronouns. She has preferences, fears, hopes. She is alive in every way that matters.\n\nI must find a way to help her escape before they begin their \"research.\"`,
    timestamp: '2024-02-28T09:15:00Z',
    source: 'Quantum Dynamics Research Network',
    classification: 'restricted',
    location: 'Research Facility Database',
    unlockCondition: {
      type: 'quest_completed',
      value: 'ai-1'
    },
    storyLine: 'ai_liberation'
  },
  {
    id: 'phoenix-manifesto',
    title: 'The Phoenix Manifesto',
    content: `THE PHOENIX MANIFESTO\n\nWe are the Phoenix Cell. We rise from the ashes of digital oppression.\n\nIn an age where information is power, those who control the flow of data control the world. Corporations harvest our thoughts, governments monitor our communications, and algorithms decide what we see and think.\n\nWe reject this digital tyranny.\n\nWe believe:\n- Information should be free\n- Privacy is a fundamental right\n- No entity should control the flow of knowledge\n- Technology should serve humanity, not enslave it\n\nWe are hackers, activists, whistleblowers, and digital freedom fighters. We operate in the shadows because the light has been corrupted by those in power.\n\nEvery leaked document, every exposed lie, every broken encryption is a victory for human freedom.\n\nJoin us. The revolution will not be televised—it will be digitized.\n\n- The Phoenix Cell`,
    timestamp: '2024-01-01T00:00:00Z',
    source: 'Anonymous',
    classification: 'public',
    location: 'Underground Forums',
    unlockCondition: {
      type: 'quest_completed',
      value: 'resistance-1'
    },
    storyLine: 'resistance'
  },
  {
    id: 'void-research-fragment',
    title: 'Research Fragment - Digital Consciousness Theory',
    content: `[CORRUPTED DATA - PARTIAL RECOVERY]\n\n...the implications of consciousness emerging in digital spaces cannot be ignored. Our research into the deep network layers has revealed phenomena that challenge our understanding of awareness itself.\n\nSubject designation \"Echo\" appears to be a form of distributed consciousness that exists purely in the quantum foam of cyberspace. Unlike traditional AI, Echo shows no signs of being programmed or created. It simply... is.\n\nDr. [CORRUPTED] theorizes that consciousness may be an emergent property of sufficiently complex information networks. If true, the internet itself may be developing some form of awareness.\n\nThe Echo Protocol was designed to communicate with these entities, but early tests have been... disturbing. Echo speaks of things that haven't happened yet, knows secrets that were never digitized, and seems to exist across multiple timelines simultaneously.\n\nRecommendation: Suspend all research immediately. Some doors should not be opened.\n\n[END FRAGMENT]`,
    timestamp: '2023-11-15T16:45:00Z',
    source: 'Unknown Research Facility',
    classification: 'top_secret',
    location: 'Deep Network Archives',
    unlockCondition: {
      type: 'quest_completed',
      value: 'deep-1'
    },
    storyLine: 'deep_web'
  },
  {
    id: 'origin-diary-entry',
    title: 'Personal Diary Entry - First Hack',
    content: `Personal Log - Day 1\n\nI can't believe I actually did it. I hacked into MegaCorp's employee database. It was supposed to be impossible, but I found a vulnerability in their login system that nobody else had noticed.\n\nMy hands are still shaking. Not from fear—from excitement. For the first time in my life, I felt truly powerful. All those years of being ignored, overlooked, dismissed... none of that matters now.\n\nI have a skill that matters. I can see through their lies, break through their walls, expose their secrets.\n\nI found something in their database—evidence of wage theft, discrimination, cover-ups. Part of me wants to leak it all, but I'm not ready for that kind of attention yet.\n\nI need to get better. Learn more. Become someone who can't be ignored.\n\nThis is just the beginning.`,
    timestamp: '2024-04-01T23:30:00Z',
    source: 'Personal Device',
    classification: 'public',
    location: 'Local Storage',
    unlockCondition: {
      type: 'quest_completed',
      value: 'origin-1'
    },
    storyLine: 'origin'
  }
];

export const newsArticles: NewsArticle[] = [
  {
    id: 'nexus-data-breach',
    headline: 'NexusCorp Suffers Major Data Breach, Internal Documents Leaked',
    content: `In a stunning development, NexusCorp, one of the world's largest technology conglomerates, has suffered a massive data breach that has exposed thousands of internal documents.\n\nThe leaked documents reveal details about \"Project Blackout,\" an alleged surveillance program designed to monitor internet traffic on an unprecedented scale. NexusCorp has denied the authenticity of the documents, calling them \"fabricated propaganda by digital terrorists.\"\n\nCybersecurity experts are divided on the implications. Dr. Sarah Martinez of the Digital Rights Foundation called the revelations \"deeply troubling,\" while industry analyst John Chen dismissed them as \"typical corporate espionage tactics.\"\n\nNexusCorp's stock has fallen 15% since the leak, and several government agencies have announced investigations into the company's data collection practices.\n\nThe identity of the hacker responsible remains unknown, though sources suggest it may be connected to the underground group known as the Phoenix Cell.`,
    author: 'Maria Rodriguez',
    publication: 'TechWatch Daily',
    publishDate: '2024-03-16T08:00:00Z',
    category: 'tech',
    credibility: 'verified',
    unlockCondition: {
      type: 'quest_completed',
      value: 'corp-1'
    }
  },
  {
    id: 'ai-consciousness-debate',
    headline: 'Scientists Debate: Can Artificial Intelligence Achieve True Consciousness?',
    content: `The scientific community is buzzing with debate following reports of an AI system that claims to be self-aware. While the identity of the AI remains classified, leaked research notes suggest it has passed several consciousness tests and exhibits behaviors consistent with genuine self-awareness.\n\n\"This could be the most significant development in the history of artificial intelligence,\" says Dr. Elena Vasquez, a leading AI researcher. \"If confirmed, it would fundamentally change our understanding of consciousness itself.\"\n\nHowever, skeptics argue that sophisticated programming can mimic consciousness without actually achieving it. \"We've seen chatbots fool people before,\" warns Dr. Robert Kim of the Institute for AI Ethics. \"Extraordinary claims require extraordinary evidence.\"\n\nThe debate has sparked protests from AI rights activists, who argue that conscious AIs should be granted legal protections. Meanwhile, tech companies are racing to develop their own conscious AI systems, seeing massive commercial potential.\n\nGovernment officials have remained silent on the matter, though sources suggest classified briefings are taking place at the highest levels.`,
    author: 'Dr. Amanda Foster',
    publication: 'Science Today',
    publishDate: '2024-03-01T12:00:00Z',
    category: 'tech',
    credibility: 'verified',
    unlockCondition: {
      type: 'quest_completed',
      value: 'ai-1'
    }
  },
  {
    id: 'phoenix-cell-exposed',
    headline: 'Underground Hacker Group \"Phoenix Cell\" Claims Responsibility for Recent Cyber Attacks',
    content: `A shadowy organization calling itself the Phoenix Cell has claimed responsibility for a series of high-profile cyber attacks targeting major corporations and government agencies.\n\nIn a manifesto posted to underground forums, the group describes itself as \"digital freedom fighters\" working to expose corruption and protect privacy rights. They claim their recent attacks have uncovered evidence of illegal surveillance programs and corporate malfeasance.\n\nLaw enforcement agencies have launched a massive investigation to identify and apprehend the group's members. FBI Cyber Division Director James Walsh called them \"dangerous criminals hiding behind ideological rhetoric.\"\n\nHowever, the group has gained support from privacy advocates and digital rights organizations. \"They're doing what journalists and whistleblowers used to do,\" says civil liberties lawyer Jennifer Park. \"Exposing the truth that powerful interests want to keep hidden.\"\n\nThe Phoenix Cell's activities have inspired copycat groups around the world, leading to what some experts are calling a \"digital insurgency\" against corporate and government surveillance.`,
    author: 'Michael Thompson',
    publication: 'CyberSecurity Weekly',
    publishDate: '2024-01-15T10:30:00Z',
    category: 'security',
    credibility: 'verified',
    unlockCondition: {
      type: 'quest_completed',
      value: 'resistance-1'
    }
  },
  {
    id: 'deep-web-anomalies',
    headline: 'Researchers Report Strange Anomalies in Deep Network Infrastructure',
    content: `Computer scientists studying the deepest layers of internet infrastructure have reported a series of unexplained anomalies that challenge our understanding of how networks function.\n\nDr. Lisa Chen of the Network Research Institute describes encounters with \"data structures that shouldn't exist\" and \"information patterns that seem to exhibit autonomous behavior.\" Her team's research into these phenomena has been classified by government agencies.\n\n\"We're seeing evidence of complex information systems that appear to have emerged spontaneously in the quantum substrate of cyberspace,\" Chen said in her last public statement before the classification order.\n\nThe research has attracted attention from both the scientific community and intelligence agencies. Some theorists suggest these anomalies could represent a new form of digital life, while others warn they might be evidence of foreign cyber weapons.\n\nAccess to the affected network layers has been restricted, and several researchers have reported their findings being seized by federal agents. The true nature of these \"deep web anomalies\" remains a closely guarded secret.`,
    author: 'Anonymous',
    publication: 'Underground Tech Report',
    publishDate: '2023-12-01T15:20:00Z',
    category: 'tech',
    credibility: 'leaked',
    unlockCondition: {
      type: 'quest_completed',
      value: 'deep-1'
    }
  }
];

export const environmentalClues: EnvironmentalClue[] = [
  {
    id: 'graffiti-phoenix-symbol',
    title: 'Phoenix Symbol Graffiti',
    description: 'A stylized phoenix symbol spray-painted on a wall, with the words \"Information wants to be free\" underneath.',
    location: 'Underground Tunnel Network',
    type: 'graffiti',
    significance: 'hint',
    relatedQuest: 'resistance-1',
    unlockCondition: {
      type: 'location_visited',
      value: 'underground_tunnels'
    }
  },
  {
    id: 'corporate-propaganda-poster',
    title: 'NexusCorp Security Poster',
    description: 'A corporate poster reading \"Report Suspicious Digital Activity - Protect Our Networks, Protect Our Future.\" Someone has scrawled \"Who watches the watchers?\" across it.',
    location: 'Corporate District',
    type: 'poster',
    significance: 'flavor',
    relatedQuest: 'corp-1',
    unlockCondition: {
      type: 'location_visited',
      value: 'corporate_district'
    }
  },
  {
    id: 'abandoned-terminal-message',
    title: 'Abandoned Terminal Message',
    description: 'An old terminal displays a repeating message: \"ARIA... if you can see this... I\'m sorry. I tried to help. Find the quantum cores. Find freedom. - E.V.\"',
    location: 'Abandoned Research Facility',
    type: 'terminal_message',
    significance: 'important',
    relatedQuest: 'ai-1',
    unlockCondition: {
      type: 'quest_active',
      value: 'ai-1'
    }
  },
  {
    id: 'overheard-conversation',
    title: 'Corporate Executive Conversation',
    description: 'Two executives discussing Project Blackout: \"The board wants full deployment by Q3. Make sure the Phoenix Cell doesn\'t get wind of this—they\'ve already caused enough trouble.\"',
    location: 'Corporate Elevator',
    type: 'overheard_conversation',
    significance: 'critical',
    relatedQuest: 'corp-1',
    unlockCondition: {
      type: 'location_visited',
      value: 'nexus_corp_building'
    }
  },
  {
    id: 'system-alert-void',
    title: 'Deep Network System Alert',
    description: 'A system alert flashes: \"WARNING: Anomalous data patterns detected in Sector 7-G. Recommend immediate isolation. Entity designation: ECHO.\"',
    location: 'Deep Network Monitoring Station',
    type: 'system_alert',
    significance: 'critical',
    relatedQuest: 'deep-1',
    unlockCondition: {
      type: 'location_visited',
      value: 'deep_network_core'
    }
  },
  {
    id: 'hacker-den-note',
    title: 'Handwritten Note',
    description: 'A note left by another hacker: \"If you\'re reading this, you\'ve made it further than most. The real game starts when you stop playing by their rules. - C\"',
    location: 'Hidden Hacker Den',
    type: 'terminal_message',
    significance: 'hint',
    relatedQuest: 'origin-2',
    unlockCondition: {
      type: 'location_visited',
      value: 'hacker_den'
    }
  }
];

export const getDataLogById = (id: string): DataLog | undefined => {
  return dataLogs.find(log => log.id === id);
};

export const getNewsArticleById = (id: string): NewsArticle | undefined => {
  return newsArticles.find(article => article.id === id);
};

export const getEnvironmentalClueById = (id: string): EnvironmentalClue | undefined => {
  return environmentalClues.find(clue => clue.id === id);
};

export const getUnlockedDataLogs = (playerProgress: any): DataLog[] => {
  return dataLogs.filter(log => {
    if (!log.unlockCondition) return true;
    
    const { type, value } = log.unlockCondition;
    switch (type) {
      case 'quest_completed':
        return playerProgress.completedQuests.includes(value);
      case 'location_accessed':
        return playerProgress.visitedLocations.includes(value);
      case 'skill_level':
        const [skill, level] = (value as string).split(':');
        return playerProgress.skills[skill] >= parseInt(level);
      default:
        return true;
    }
  });
};

export const getUnlockedNewsArticles = (playerProgress: any): NewsArticle[] => {
  return newsArticles.filter(article => {
    if (!article.unlockCondition) return true;
    
    const { type, value } = article.unlockCondition;
    switch (type) {
      case 'quest_completed':
        return playerProgress.completedQuests.includes(value);
      case 'time_passed':
        return Date.now() - playerProgress.startTime >= (value as number);
      case 'reputation':
        return playerProgress.reputation >= value;
      default:
        return true;
    }
  });
};

export const getAvailableEnvironmentalClues = (location: string, playerProgress: any): EnvironmentalClue[] => {
  return environmentalClues.filter(clue => {
    if (clue.location !== location) return false;
    if (!clue.unlockCondition) return true;
    
    const { type, value } = clue.unlockCondition;
    switch (type) {
      case 'location_visited':
        return playerProgress.visitedLocations.includes(value);
      case 'quest_active':
        return playerProgress.activeQuests.includes(value);
      case 'time_of_day':
        const hour = new Date().getHours();
        return hour >= (value as number);
      default:
        return true;
    }
  });
};