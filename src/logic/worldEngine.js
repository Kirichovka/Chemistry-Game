import {
  baseWorldParameters,
  events,
  notificationLimit,
  worldParameterKeys,
} from '../utils/constants.js';
import { createNotification, pushLimited, unique } from '../utils/helpers.js';
import { meetsWorldStageRequirements } from '../utils/validators.js';

export function createWorldEngine({ data, store, bus }) {
  function determineStage(worldState) {
    return [...data.worldStages]
      .sort((left, right) => left.order - right.order)
      .reduce((currentStage, stage) => {
        if (meetsWorldStageRequirements(stage.requirements, worldState)) {
          return stage;
        }

        return currentStage;
      }, data.maps.worldStages.dead_planet);
  }

  function refreshWorld(source = 'sync') {
    const state = store.getState();
    const effects = state.world.activeEffectIds
      .map((effectId) => data.maps.worldEffects[effectId])
      .filter(Boolean);

    const nextParameters = { ...baseWorldParameters };
    const nextFlags = unique(effects.flatMap((effect) => effect.grantedFlags ?? []));

    effects.forEach((effect) => {
      worldParameterKeys.forEach((key) => {
        nextParameters[key] += effect.parameterDeltas?.[key] ?? 0;
      });
    });

    const projectedState = {
      ...state,
      world: {
        ...state.world,
        parameters: nextParameters,
        flags: nextFlags,
      },
    };
    const nextStage = determineStage(projectedState);
    const stageChanged = nextStage.id !== state.world.currentStageId;

    store.update((draft) => {
      draft.world.parameters = nextParameters;
      draft.world.flags = nextFlags;

      if (stageChanged) {
        draft.world.currentStageId = nextStage.id;
        draft.discoveries.worldStageIds = unique([
          ...draft.discoveries.worldStageIds,
          nextStage.id,
        ]);
        draft.tests.unlockedIds = unique([
          ...draft.tests.unlockedIds,
          ...(nextStage.rewards?.unlockedTests ?? []),
        ]);
        draft.progress.lastAction = `world:${nextStage.id}`;
        draft.uiState.notifications = pushLimited(
          draft.uiState.notifications,
          createNotification({
            tone: 'success',
            title: `World stage: ${nextStage.name}`,
            detail: `Your planet has advanced because ${source.replace(/_/g, ' ')} reshaped the world.`,
          }),
          notificationLimit,
        );
      }

      draft.world.history = pushLimited(
        draft.world.history,
        {
          source,
          stageId: nextStage.id,
          parameters: nextParameters,
          flags: nextFlags,
          createdAt: new Date().toISOString(),
        },
        10,
      );
    });

    bus.emit(events.worldUpdated, {
      stageId: nextStage.id,
      effectIds: state.world.activeEffectIds,
    });

    return nextStage;
  }

  function applyEffects(effectIds = [], source = 'effect') {
    if (!effectIds.length) {
      return refreshWorld(source);
    }

    store.update((draft) => {
      draft.world.activeEffectIds = unique([
        ...draft.world.activeEffectIds,
        ...effectIds,
      ]);
    });

    return refreshWorld(source);
  }

  return {
    applyEffects,
    refreshWorld,
  };
}
