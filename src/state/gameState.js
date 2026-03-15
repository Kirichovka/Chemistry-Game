import { baseWorldParameters, defaultSettings, gameVersion } from '../utils/constants.js';
import { buildInventoryMap, getNowIso, unique } from '../utils/helpers.js';

function getUnlockedIds(items) {
  return items
    .filter(
      (item) =>
        item.gameplay?.unlockedByDefault ||
        (item.autoUnlock && item.requirements?.technologies?.length === 0),
    )
    .map((item) => item.id);
}

function getDiscoveredCardIds(data, unlockedEntityIds) {
  return data.cards
    .filter(
      (card) =>
        !card.visibility.hiddenUntilUnlocked || unlockedEntityIds.includes(card.entityId),
    )
    .map((card) => card.entityId);
}

function getInitialEncyclopediaEntries(data, discoveredCardIds, unlockedTechnologyIds) {
  return data.encyclopedia
    .filter((entry) => {
      const unlock = entry.unlock ?? {};
      return (
        (unlock.cards ?? []).some((id) => discoveredCardIds.includes(id)) ||
        (unlock.technologies ?? []).some((id) => unlockedTechnologyIds.includes(id))
      );
    })
    .map((entry) => entry.id);
}

export function createInitialState(data) {
  const unlockedElementIds = getUnlockedIds(data.elements);
  const unlockedCompoundIds = getUnlockedIds(data.compounds);
  const unlockedProcessIds = getUnlockedIds(data.processes);
  const unlockedConditionIds = getUnlockedIds(data.conditions);
  const unlockedTechnologyIds = getUnlockedIds(data.technologies);
  const unlockedTestIds = getUnlockedIds(data.tests);

  const unlockedEntityIds = unique([
    ...unlockedElementIds,
    ...unlockedCompoundIds,
    ...unlockedProcessIds,
    ...unlockedConditionIds,
  ]);

  const discoveredCardIds = getDiscoveredCardIds(data, unlockedEntityIds);
  const unlockedEntryIds = getInitialEncyclopediaEntries(
    data,
    discoveredCardIds,
    unlockedTechnologyIds,
  );

  return {
    meta: {
      version: gameVersion,
      startedAt: getNowIso(),
      updatedAt: getNowIso(),
      lastSavedAt: null,
    },
    player: {
      knowledgePoints: 0,
      rank: 'Planetary Apprentice',
    },
    progress: {
      route: 'home',
      lastAction: 'new-game',
    },
    discoveries: {
      cardIds: discoveredCardIds,
      reactionIds: [],
      worldStageIds: ['dead_planet'],
      encyclopediaEntryIds: unlockedEntryIds,
    },
    inventory: {
      ...buildInventoryMap(data.elements),
      ...buildInventoryMap(data.compounds),
    },
    technologies: {
      unlockedIds: unlockedTechnologyIds,
      availableIds: [],
      lastUnlockedId: unlockedTechnologyIds.at(-1) ?? null,
    },
    world: {
      currentStageId: 'dead_planet',
      activeEffectIds: [],
      flags: [],
      parameters: { ...baseWorldParameters },
      history: [],
    },
    laboratory: {
      selectedSubstances: [],
      selectedProcesses: [],
      selectedConditions: [],
      lastReactionId: null,
      history: [],
      lastResult: null,
    },
    tests: {
      unlockedIds: unlockedTestIds,
      completedIds: [],
      attemptCounts: {},
      lastCompletedId: null,
    },
    encyclopedia: {
      unlockedEntryIds,
      viewedEntryIds: [],
      selectedEntryId: unlockedEntryIds[0] ?? null,
    },
    uiState: {
      route: 'home',
      notifications: [
        {
          id: 'welcome',
          tone: 'info',
          title: 'Welcome to Chemistry World',
          detail:
            'Start in the laboratory to synthesize water and begin planetary development.',
        },
      ],
      modal: null,
    },
    settings: { ...defaultSettings },
    stats: {
      reactionsCompleted: 0,
      technologiesUnlocked: unlockedTechnologyIds.length,
      discoveriesMade: discoveredCardIds.length,
      testsCompleted: 0,
      saves: 0,
    },
  };
}

export function createGameState(initialState) {
  let state = structuredClone(initialState);
  const listeners = new Set();

  function notify() {
    listeners.forEach((listener) => listener(state));
  }

  function getState() {
    return state;
  }

  function update(recipe) {
    const draft = structuredClone(state);

    if (typeof recipe === 'function') {
      recipe(draft);
    } else {
      Object.assign(draft, recipe);
    }

    draft.meta.updatedAt = getNowIso();
    state = draft;
    notify();
    return state;
  }

  function replace(nextState) {
    state = structuredClone(nextState);
    notify();
  }

  function subscribe(listener) {
    listeners.add(listener);
    return () => listeners.delete(listener);
  }

  return {
    getState,
    update,
    replace,
    subscribe,
  };
}
