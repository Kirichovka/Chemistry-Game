import { events, notificationLimit } from '../utils/constants.js';
import { createNotification, pushLimited, unique } from '../utils/helpers.js';
import { canAffordTechnology, meetsStateRequirements } from '../utils/validators.js';

function getRewardEntity(data, entityId) {
  return (
    data.maps.elements[entityId] ||
    data.maps.compounds[entityId] ||
    data.maps.processes[entityId] ||
    data.maps.conditions[entityId] ||
    null
  );
}

export function createTechnologyEngine({ data, store, bus }) {
  function syncAvailableTechnologies() {
    const state = store.getState();
    const availableIds = data.technologies
      .filter((technology) => {
        if (state.technologies.unlockedIds.includes(technology.id)) {
          return false;
        }

        return meetsStateRequirements(technology.requirements, state);
      })
      .map((technology) => technology.id);

    store.update((draft) => {
      draft.technologies.availableIds = availableIds;
    });
  }

  function unlockTechnology(technologyId, options = {}) {
    const technology = data.maps.technologies[technologyId];
    const state = store.getState();

    if (!technology || state.technologies.unlockedIds.includes(technologyId)) {
      return false;
    }

    if (!meetsStateRequirements(technology.requirements, state)) {
      return false;
    }

    if (!options.skipCost && !canAffordTechnology(technology, state)) {
      return false;
    }

    const rewardedCards = technology.rewards?.unlockedCards ?? [];

    store.update((draft) => {
      if (!options.skipCost) {
        draft.player.knowledgePoints -= technology.costKnowledge ?? 0;
      }

      draft.technologies.unlockedIds = unique([
        ...draft.technologies.unlockedIds,
        technology.id,
      ]);
      draft.technologies.lastUnlockedId = technology.id;
      draft.discoveries.cardIds = unique([
        ...draft.discoveries.cardIds,
        ...rewardedCards,
      ]);

      rewardedCards.forEach((entityId) => {
        const entity = getRewardEntity(data, entityId);
        if (!entity || draft.inventory[entityId] !== undefined) {
          return;
        }

        draft.inventory[entityId] = entity.gameplay?.startingQuantity ?? 0;
      });

      draft.tests.unlockedIds = unique([
        ...draft.tests.unlockedIds,
        ...(technology.rewards?.unlockedTests ?? []),
      ]);
      draft.stats.technologiesUnlocked = draft.technologies.unlockedIds.length;
      draft.stats.discoveriesMade = draft.discoveries.cardIds.length;
      draft.progress.lastAction = `technology:${technology.id}`;
      draft.uiState.notifications = pushLimited(
        draft.uiState.notifications,
        createNotification({
          tone: 'success',
          title: `${technology.name} unlocked`,
          detail: options.auto
            ? 'The discovery automatically opened a new branch of progress.'
            : `Spent ${technology.costKnowledge ?? 0} knowledge to unlock a new advancement.`,
        }),
        notificationLimit,
      );
    });

    bus.emit(events.technologyUnlocked, {
      technologyId: technology.id,
      effectIds: technology.rewards?.worldEffects ?? [],
      encyclopediaEntryIds: technology.rewards?.encyclopediaEntries ?? [],
    });

    return true;
  }

  function unlockTriggeredTechnologies(trigger) {
    const state = store.getState();
    const autoTechnologyIds = data.technologies
      .filter((technology) => {
        if (
          !technology.autoUnlock ||
          state.technologies.unlockedIds.includes(technology.id)
        ) {
          return false;
        }

        const reactionMatch = trigger.reactionId
          ? technology.triggers?.reactions?.includes(trigger.reactionId)
          : false;
        const testMatch = trigger.testId
          ? technology.triggers?.tests?.includes(trigger.testId)
          : false;

        return (
          (reactionMatch || testMatch) &&
          meetsStateRequirements(technology.requirements, state)
        );
      })
      .map((technology) => technology.id);

    autoTechnologyIds.forEach((technologyId) => {
      unlockTechnology(technologyId, { auto: true, skipCost: true });
    });

    syncAvailableTechnologies();
  }

  return {
    syncAvailableTechnologies,
    unlockTechnology,
    unlockTriggeredTechnologies,
  };
}
