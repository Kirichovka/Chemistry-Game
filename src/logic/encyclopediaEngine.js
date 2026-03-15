import { unique } from '../utils/helpers.js';

function entryIsUnlocked(entry, state) {
  const unlock = entry.unlock ?? {};

  return (
    (unlock.cards ?? []).some((id) => state.discoveries.cardIds.includes(id)) ||
    (unlock.technologies ?? []).some((id) =>
      state.technologies.unlockedIds.includes(id),
    ) ||
    (unlock.worldStages ?? []).some((id) =>
      state.discoveries.worldStageIds.includes(id),
    ) ||
    (unlock.reactions ?? []).some((id) => state.discoveries.reactionIds.includes(id))
  );
}

export function createEncyclopediaEngine({ data, store }) {
  function syncEntries() {
    const state = store.getState();
    const unlockedEntryIds = data.encyclopedia
      .filter((entry) => entryIsUnlocked(entry, state))
      .map((entry) => entry.id);

    store.update((draft) => {
      draft.encyclopedia.unlockedEntryIds = unique([
        ...draft.encyclopedia.unlockedEntryIds,
        ...unlockedEntryIds,
      ]);
      draft.discoveries.encyclopediaEntryIds = draft.encyclopedia.unlockedEntryIds;

      if (
        !draft.encyclopedia.selectedEntryId &&
        draft.encyclopedia.unlockedEntryIds.length
      ) {
        draft.encyclopedia.selectedEntryId = draft.encyclopedia.unlockedEntryIds[0];
      }
    });
  }

  function selectEntry(entryId) {
    store.update((draft) => {
      draft.encyclopedia.selectedEntryId = entryId;
      draft.encyclopedia.viewedEntryIds = unique([
        ...draft.encyclopedia.viewedEntryIds,
        entryId,
      ]);
    });
  }

  return {
    syncEntries,
    selectEntry,
  };
}
