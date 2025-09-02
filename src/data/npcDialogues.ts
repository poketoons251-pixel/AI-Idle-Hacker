export interface Dialog {
  id: string;
  npcId: string;
  text: string;
  options?: DialogOption[];
}

export interface DialogOption {
  id: string;
  text: string;
  nextDialogId?: string;
}

export interface NPC {
  id: string;
  name: string;
  description: string;
  location: string;
  personality: string;
  initialDialogId: string;
}

export const npcs: NPC[] = [
  {
    id: 'ghost-protocol',
    name: 'Ghost Protocol',
    description: 'A mysterious figure in the digital realm',
    location: 'darkweb-hub',
    personality: 'mysterious',
    initialDialogId: 'ghost-intro'
  }
];

export const dialogues: Dialog[] = [
  {
    id: 'ghost-intro',
    npcId: 'ghost-protocol',
    text: 'Welcome to the digital underground. What brings you here?',
    options: [
      {
        id: 'ghost-option-1',
        text: 'I seek knowledge.',
        nextDialogId: 'ghost-knowledge'
      }
    ]
  },
  {
    id: 'ghost-knowledge',
    npcId: 'ghost-protocol',
    text: 'Knowledge is power in our world. What do you wish to learn?',
    options: [
      {
        id: 'ghost-knowledge-1',
        text: 'Teach me about hacking.',
        nextDialogId: 'ghost-hacking'
      },
      {
        id: 'ghost-knowledge-2',
        text: 'Tell me about the underground.',
        nextDialogId: 'ghost-underground'
      }
    ]
  }
];

// Utility functions
export const getAvailableDialogues = (npcId: string): Dialog[] => {
  return dialogues.filter(dialog => dialog.npcId === npcId);
};

export const getDialogById = (dialogId: string): Dialog | undefined => {
  return dialogues.find(dialog => dialog.id === dialogId);
};

export const getNPCById = (npcId: string): NPC | undefined => {
  return npcs.find(npc => npc.id === npcId);
};

export const getAllNPCs = (): NPC[] => {
  return npcs;
};

export const getDialogueOptions = (dialogId: string): DialogOption[] => {
  const dialog = getDialogById(dialogId);
  return dialog?.options || [];
};

export const getNPCsByStoryLine = (storyLineId: string): NPC[] => {
  // For now, return all NPCs. In a full implementation, NPCs would have storyLine associations
  return npcs;
};