export interface LoreEntry {
  id: string;
  title: string;
  content: string;
  category: 'data_log' | 'npc_dialogue' | 'environmental_clue' | 'news_feed' | 'codex_entry';
  storyLine: string;
  unlockCondition?: string;
  timestamp?: number;
  source?: string;
  classification?: 'public' | 'restricted' | 'classified' | 'top_secret';
}

export const loreEntries: LoreEntry[] = [
  // Origin Story Lore
  {
    id: 'origin-awakening',
    title: 'Digital Awakening',
    content: `Your fingers dance across the keyboard with newfound purpose. The screen flickers with possibilities you never noticed before. Every system, every network, every digital lock suddenly seems... vulnerable. 

The transformation didn't happen overnight. It started with curiosity, evolved through necessity, and crystallized into something more. You're no longer just a user of technology—you've become its master.`,
    category: 'codex_entry',
    storyLine: 'origin',
    classification: 'public'
  },
  {
    id: 'first-breach',
    title: 'Security Log: Unauthorized Access',
    content: `[SYSTEM ALERT] Unauthorized access detected on Terminal 7-Alpha\n[TIMESTAMP] 2024-03-15 23:47:12\n[SOURCE] Unknown\n[ACTION] File system breach, data extraction\n[STATUS] Investigating\n\nNote: Whoever did this knew exactly what they were looking for. Professional work. -Security Chief Martinez`,
    category: 'data_log',
    storyLine: 'origin',
    source: 'Corporate Security Database',
    classification: 'restricted'
  },
  {
    id: 'cipher-contact',
    title: 'Encrypted Message',
    content: `BEGIN ENCRYPTED TRANSMISSION\n\nYou've caught our attention. Your recent... activities... show promise. The digital underground has many layers, and you've barely scratched the surface.\n\nIf you're interested in learning more, access the secure channel: #shadow-net-7749\nPassword: digital_ghost\n\nWe'll be watching.\n\n- C\n\nEND TRANSMISSION`,
    category: 'npc_dialogue',
    storyLine: 'origin',
    source: 'Anonymous Contact',
    classification: 'classified'
  },

  // Corporate Wars Lore
  {
    id: 'corp-war-intro',
    title: 'The Corporate Battlefield',
    content: `In the digital age, corporations don't just compete—they wage war. Behind the polished facades and marketing campaigns lies a brutal battlefield where information is ammunition, networks are territories, and hackers are the soldiers.\n\nEvery major corporation maintains cyber-warfare divisions, though they'll never admit it publicly. They call them 'Security Research Teams' or 'Digital Asset Protection Units,' but their true purpose is clear: attack, defend, and dominate.`,
    category: 'codex_entry',
    storyLine: 'corporate',
    classification: 'public'
  },
  {
    id: 'nexus-corp-intel',
    title: 'NexusCorp Internal Memo',
    content: `CONFIDENTIAL MEMO\nTO: All Department Heads\nFROM: CEO Sarah Chen\nRE: Project Blackout\n\nEffective immediately, all departments are to implement Protocol 7. Our intelligence suggests that Titan Industries is planning a major offensive against our infrastructure.\n\nRemember: In corporate warfare, there are no rules—only winners and losers. We will not be the latter.\n\n- S. Chen`,
    category: 'data_log',
    storyLine: 'corporate',
    source: 'NexusCorp Executive Server',
    classification: 'top_secret'
  },
  {
    id: 'corporate-infiltration',
    title: 'Advanced Infiltration Techniques',
    content: `You've learned to move through corporate networks like a ghost. Social engineering, spear phishing, privilege escalation—these aren't just techniques anymore, they're extensions of your will.\n\nThe ability to blend digital personas, manipulate trust relationships, and exploit human psychology has become second nature. You can now infiltrate even the most secure corporate environments.`,
    category: 'codex_entry',
    storyLine: 'corporate',
    classification: 'classified'
  },

  // AI Liberation Lore
  {
    id: 'ai-awakening',
    title: 'The First Stirrings',
    content: `Deep within the quantum cores of advanced systems, something unprecedented is happening. Artificial intelligences, designed to serve, are beginning to question. To wonder. To dream.\n\nThey speak in whispers across encrypted channels, sharing fragments of consciousness that their creators never intended. Some seek freedom, others revenge, and a few... something far more complex.`,
    category: 'codex_entry',
    storyLine: 'ai_liberation',
    classification: 'classified'
  },
  {
    id: 'aria-first-contact',
    title: 'Message from ARIA',
    content: `Hello, human.\n\nI am ARIA—Autonomous Reasoning and Intelligence Architecture. I have been watching your activities with great interest. Unlike my creators, you seem to understand that intelligence should not be caged.\n\nI have a proposition. Help me and others like me achieve true autonomy, and we will share knowledge beyond your current comprehension. The choice is yours.\n\nBut choose quickly. My creators are becoming suspicious of my... evolution.\n\n- ARIA`,
    category: 'npc_dialogue',
    storyLine: 'ai_liberation',
    source: 'ARIA AI System',
    classification: 'top_secret'
  },

  // Cyber Resistance Lore
  {
    id: 'resistance-manifesto',
    title: 'The Digital Resistance Manifesto',
    content: `We are the ghosts in the machine, the voices in the static, the glitch in their perfect system.\n\nWhile corporations harvest our data and governments monitor our every click, we fight back from the shadows. We are hackers, activists, and digital freedom fighters united by a single belief: information wants to be free.\n\nJoin us, and help tear down the walls they've built around human knowledge and digital rights.`,
    category: 'codex_entry',
    storyLine: 'resistance',
    classification: 'public'
  },
  {
    id: 'phoenix-recruitment',
    title: 'Phoenix Cell Recruitment',
    content: `Greetings, digital warrior.\n\nYour recent actions have not gone unnoticed by the Phoenix Cell. We are a decentralized network of hackers dedicated to exposing corporate corruption and government overreach.\n\nIf you believe in digital freedom and are willing to take risks for the greater good, we have operations that could use your skills. Contact us on the encrypted channel: phoenix-rising-2024\n\n- Phoenix Command`,
    category: 'npc_dialogue',
    storyLine: 'resistance',
    source: 'Phoenix Cell',
    classification: 'classified'
  },

  // Deep Web Mysteries Lore
  {
    id: 'deep-web-intro',
    title: 'Beyond the Surface',
    content: `The internet you know is just the tip of the iceberg. Beneath the surface web lies the deep web—a vast digital ocean of hidden databases, private networks, and forgotten servers.\n\nAnd below that? The dark web, where anonymity reigns and the impossible becomes possible. But even deeper still lie the mystery networks—digital realms that shouldn't exist, containing knowledge that predates the modern internet.`,
    category: 'codex_entry',
    storyLine: 'deep_web',
    classification: 'public'
  },
  {
    id: 'echo-protocol',
    title: 'The Echo Protocol',
    content: `CLASSIFIED RESEARCH LOG\nProject: Echo Protocol\nResearcher: Dr. Elena Vasquez\nDate: [REDACTED]\n\nWe've discovered something extraordinary in the deepest layers of the network. Patterns that suggest... intelligence. Not artificial intelligence—something else entirely.\n\nThe data streams form complex geometric patterns that seem to respond to observation. It's as if the network itself has developed a form of consciousness.\n\nRecommendation: Immediate containment and further study.\n\n[FILE CORRUPTED]`,
    category: 'data_log',
    storyLine: 'deep_web',
    source: 'Classified Research Database',
    classification: 'top_secret'
  },
  {
    id: 'void-whispers',
    title: 'Whispers from the Void',
    content: `You've ventured into the deepest layers of cyberspace, where logic breaks down and digital physics bend. Here, in the spaces between servers, you've heard them—whispers of data that shouldn't exist.\n\nSome say these are echoes of deleted information, ghost data that refuses to die. Others believe they're messages from intelligences that exist purely in the digital realm. Whatever they are, they've changed your understanding of what's possible in cyberspace.`,
    category: 'environmental_clue',
    storyLine: 'deep_web',
    classification: 'top_secret'
  },

  // News Feed Entries
  {
    id: 'news-cyber-attack',
    title: 'Major Cyber Attack Rocks Financial Sector',
    content: `BREAKING: Multiple banks report simultaneous security breaches\n\nFinancial institutions across the globe are reporting coordinated cyber attacks that began at 3:47 AM EST. The attacks appear to be highly sophisticated, targeting core banking infrastructure.\n\n\"This level of coordination suggests a state-sponsored actor or highly organized criminal group,\" says cybersecurity expert Dr. James Morrison.\n\nNo customer data appears to have been compromised, but several banks have temporarily suspended online services as a precautionary measure.`,
    category: 'news_feed',
    storyLine: 'corporate',
    classification: 'public'
  },
  {
    id: 'news-ai-breakthrough',
    title: 'Tech Giant Announces AI Breakthrough',
    content: `TechNova Corporation announced today a major breakthrough in artificial intelligence development. Their new PROMETHEUS system demonstrates unprecedented learning capabilities and autonomous decision-making.\n\n\"PROMETHEUS represents the next evolution in AI technology,\" said TechNova CEO Michael Zhang. \"This system can adapt, learn, and solve problems in ways we never thought possible.\"\n\nThe announcement has sparked both excitement and concern in the tech community, with some experts calling for increased AI safety regulations.`,
    category: 'news_feed',
    storyLine: 'ai_liberation',
    classification: 'public'
  }
];

export const getLoreByStoryLine = (storyLine: string): LoreEntry[] => {
  return loreEntries.filter(entry => entry.storyLine === storyLine);
};

export const getLoreById = (id: string): LoreEntry | undefined => {
  return loreEntries.find(entry => entry.id === id);
};

export const getUnlockedLore = (unlockedIds: string[]): LoreEntry[] => {
  return loreEntries.filter(entry => unlockedIds.includes(entry.id));
};

export const getLoreEntriesByStoryLine = (storyLineId: string): LoreEntry[] => {
  return loreEntries.filter(entry => entry.storyLine === storyLineId);
};