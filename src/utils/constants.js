export const appTitle = 'Chemistry World';
export const gameVersion = '1.0.0';
export const saveKey = 'chemistry-world-save';
export const notificationLimit = 5;

export const dataLoadOrder = [
  'categories.json',
  'conditions.json',
  'worldEffects.json',
  'elements.json',
  'compounds.json',
  'processes.json',
  'reactions.json',
  'technologies.json',
  'tests.json',
  'worldStages.json',
  'encyclopedia.json',
  'cards.json',
];

export const events = {
  technologyRequest: 'technology:requestUnlock',
  testSubmit: 'test:submit',
  settingsUpdate: 'settings:update',
  gameReset: 'game:reset',
  modalOpen: 'modal:open',
  modalClose: 'modal:close',
  reactionSubmit: 'reaction:submit',
  reactionSuccess: 'reaction:success',
  technologyUnlocked: 'technology:unlocked',
  worldUpdated: 'world:updated',
  testCompleted: 'test:completed',
  saveRequested: 'save:requested',
};

export const routes = [
  { id: 'home', label: 'Home' },
  { id: 'laboratory', label: 'Laboratory' },
  { id: 'techTree', label: 'Technology Tree' },
  { id: 'world', label: 'World' },
  { id: 'encyclopedia', label: 'Encyclopedia' },
  { id: 'tests', label: 'Tests' },
  { id: 'settings', label: 'Settings' },
];

export const pageTitles = Object.fromEntries(
  routes.map((route) => [route.id, route.label]),
);

export const worldParameterKeys = [
  'atmosphere',
  'oxygen',
  'water',
  'temperature',
  'lifeComplexity',
  'civilization',
];

export const baseWorldParameters = {
  atmosphere: 5,
  oxygen: 0,
  water: 0,
  temperature: 180,
  lifeComplexity: 0,
  civilization: 0,
};

export const defaultSettings = {
  soundEnabled: true,
  animationsEnabled: true,
  autoSave: true,
  compactCards: false,
};

export const themeBranches = {
  chemistry: 'branch-chemistry',
  planet: 'branch-planet',
  life: 'branch-life',
  civilization: 'branch-civilization',
};
