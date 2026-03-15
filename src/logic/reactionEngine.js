import { events, notificationLimit } from '../utils/constants.js';
import {
  countsFromSelection,
  createNotification,
  matchesCounts,
  pushLimited,
  unique,
} from '../utils/helpers.js';
import { hasAll } from '../utils/validators.js';

export function createReactionEngine({ data, store, bus }) {
  function findMatchingReaction(selection, state = store.getState()) {
    const selectedCounts = countsFromSelection(selection.substanceIds ?? []);

    return data.reactions.find((reaction) => {
      const inputCounts = countsFromSelection(
        reaction.inputs.flatMap((entry) =>
          Array.from({ length: entry.count }, () => entry.id),
        ),
      );

      return (
        matchesCounts(selectedCounts, inputCounts) &&
        hasAll(reaction.processIds, selection.processIds ?? []) &&
        hasAll(reaction.conditionIds, selection.conditionIds ?? []) &&
        hasAll(reaction.requirements?.technologies, state.technologies.unlockedIds) &&
        hasAll(reaction.requirements?.worldFlags, state.world.flags)
      );
    });
  }

  function hasInventoryForReaction(reaction, state) {
    return reaction.inputs.every(({ id, count }) => (state.inventory[id] ?? 0) >= count);
  }

  function submitReaction(selection) {
    const state = store.getState();
    const reaction = findMatchingReaction(selection, state);

    if (!reaction) {
      store.update((draft) => {
        draft.laboratory.lastResult = {
          success: false,
          message: 'No valid reaction matched that combination.',
        };
        draft.uiState.notifications = pushLimited(
          draft.uiState.notifications,
          createNotification({
            tone: 'warning',
            title: 'Reaction failed',
            detail: 'That card combination does not form a known reaction yet.',
          }),
          notificationLimit,
        );
      });
      return null;
    }

    if (!hasInventoryForReaction(reaction, state)) {
      store.update((draft) => {
        draft.laboratory.lastResult = {
          success: false,
          message: 'You do not have enough inventory for that reaction.',
        };
        draft.uiState.notifications = pushLimited(
          draft.uiState.notifications,
          createNotification({
            tone: 'warning',
            title: 'Insufficient inventory',
            detail: 'Gather or preserve more reagents before trying that reaction again.',
          }),
          notificationLimit,
        );
      });
      return null;
    }

    const outputIds = reaction.outputs.map((entry) => entry.id);

    store.update((draft) => {
      reaction.inputs.forEach(({ id, count }) => {
        draft.inventory[id] -= count;
      });

      reaction.outputs.forEach(({ id, count }) => {
        draft.inventory[id] = (draft.inventory[id] ?? 0) + count;
      });

      draft.player.knowledgePoints += reaction.rewards?.knowledgePoints ?? 0;
      draft.discoveries.reactionIds = unique([
        ...draft.discoveries.reactionIds,
        reaction.id,
      ]);
      draft.discoveries.cardIds = unique([...draft.discoveries.cardIds, ...outputIds]);
      draft.stats.reactionsCompleted += 1;
      draft.stats.discoveriesMade = draft.discoveries.cardIds.length;
      draft.laboratory.lastReactionId = reaction.id;
      draft.laboratory.lastResult = {
        success: true,
        reactionId: reaction.id,
      };
      draft.laboratory.history = pushLimited(
        draft.laboratory.history,
        {
          reactionId: reaction.id,
          createdAt: new Date().toISOString(),
          outputs: reaction.outputs,
        },
        8,
      );
      draft.progress.lastAction = `reaction:${reaction.id}`;
      draft.uiState.notifications = pushLimited(
        draft.uiState.notifications,
        createNotification({
          tone: 'success',
          title: reaction.name,
          detail: `You synthesized ${reaction.outputs.map(({ id }) => id).join(', ')} and gained ${reaction.rewards?.knowledgePoints ?? 0} knowledge.`,
        }),
        notificationLimit,
      );
    });

    bus.emit(events.reactionSuccess, {
      reactionId: reaction.id,
      effectIds: reaction.rewards?.worldEffects ?? [],
      encyclopediaEntryIds: reaction.rewards?.encyclopediaEntries ?? [],
    });

    return reaction;
  }

  return {
    findMatchingReaction,
    submitReaction,
  };
}
