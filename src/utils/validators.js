import { worldParameterKeys } from './constants.js';

export function validateDataset(dataset, fileName) {
  if (!dataset || !Array.isArray(dataset.items)) {
    throw new Error(`Invalid dataset loaded from ${fileName}`);
  }
}

export function hasAll(requiredIds = [], availableIds = []) {
  return requiredIds.every((id) => availableIds.includes(id));
}

export function matchesWorldParameters(requiredParameters = {}, actualParameters = {}) {
  return Object.entries(requiredParameters).every(([key, value]) => {
    if (!worldParameterKeys.includes(key)) {
      return true;
    }

    return (actualParameters[key] ?? 0) >= value;
  });
}

export function meetsStateRequirements(requirements = {}, state) {
  const unlockedTechIds = state.technologies.unlockedIds;
  const discoveredCardIds = state.discoveries.cardIds;
  const discoveredStageIds = state.discoveries.worldStageIds;

  return (
    hasAll(requirements.technologies, unlockedTechIds) &&
    hasAll(requirements.cards, discoveredCardIds) &&
    (requirements.knowledgePoints ?? 0) <= state.player.knowledgePoints &&
    (!requirements.worldStageId || discoveredStageIds.includes(requirements.worldStageId))
  );
}

export function meetsWorldStageRequirements(requirements = {}, state) {
  return (
    hasAll(requirements.worldFlags, state.world.flags) &&
    hasAll(requirements.technologies, state.technologies.unlockedIds) &&
    matchesWorldParameters(requirements.minimumParameters, state.world.parameters)
  );
}

export function canAffordTechnology(technology, state) {
  return state.player.knowledgePoints >= (technology.costKnowledge ?? 0);
}
