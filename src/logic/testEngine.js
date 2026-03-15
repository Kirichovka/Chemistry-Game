import { events, notificationLimit } from '../utils/constants.js';
import { createNotification, pushLimited, unique } from '../utils/helpers.js';
import { hasAll, meetsStateRequirements } from '../utils/validators.js';

export function createTestEngine({ data, store, bus, reactionEngine }) {
  function isUnlocked(test, state) {
    return (
      state.tests.unlockedIds.includes(test.id) ||
      (test.gameplay?.unlockedByDefault ?? false) ||
      meetsStateRequirements(test.requirements, state)
    );
  }

  function submitAttempt({ testId, selection }) {
    const test = data.maps.tests[testId];
    const state = store.getState();

    if (!test || !isUnlocked(test, state)) {
      return false;
    }

    const reaction = reactionEngine.findMatchingReaction(
      {
        substanceIds: selection.substanceIds,
        processIds: selection.processIds,
        conditionIds: selection.conditionIds,
      },
      state,
    );

    const requiredReactionMatch =
      !test.goal?.reactionId || reaction?.id === test.goal.reactionId;
    const requiredProcessMatch = hasAll(
      test.goal?.requiredProcessIds,
      selection.processIds,
    );
    const requiredConditionMatch = hasAll(
      test.goal?.requiredConditionIds,
      selection.conditionIds,
    );
    const reactionChainMatch =
      !test.goal?.reactionIds ||
      test.goal.reactionIds.every(
        (reactionId) =>
          state.discoveries.reactionIds.includes(reactionId) ||
          reaction?.id === reactionId,
      );

    const passed =
      Boolean(reaction) &&
      requiredReactionMatch &&
      requiredProcessMatch &&
      requiredConditionMatch &&
      reactionChainMatch;

    store.update((draft) => {
      draft.tests.attemptCounts[testId] = (draft.tests.attemptCounts[testId] ?? 0) + 1;

      if (!passed) {
        draft.uiState.notifications = pushLimited(
          draft.uiState.notifications,
          createNotification({
            tone: 'warning',
            title: `${test.title} failed`,
            detail:
              'Review the target reaction, required conditions and available cards, then try again.',
          }),
          notificationLimit,
        );
        return;
      }

      const alreadyCompleted = draft.tests.completedIds.includes(test.id);
      draft.tests.completedIds = unique([...draft.tests.completedIds, test.id]);
      draft.tests.lastCompletedId = test.id;
      draft.progress.lastAction = `test:${test.id}`;

      if (!alreadyCompleted) {
        draft.player.knowledgePoints += test.rewards?.knowledgePoints ?? 0;
        draft.stats.testsCompleted += 1;
      }

      draft.uiState.notifications = pushLimited(
        draft.uiState.notifications,
        createNotification({
          tone: 'success',
          title: `${test.title} completed`,
          detail: alreadyCompleted
            ? 'You repeated the test successfully.'
            : `Earned ${test.rewards?.knowledgePoints ?? 0} knowledge points.`,
        }),
        notificationLimit,
      );
    });

    if (passed) {
      bus.emit(events.testCompleted, {
        testId,
      });
    }

    return passed;
  }

  return {
    submitAttempt,
  };
}
