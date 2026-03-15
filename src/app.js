import '../styles/main.scss';

import { createEventBus } from './core/eventBus.js';
import { createGameLoop } from './core/gameLoop.js';
import { loadGameData } from './data/dataLoader.js';
import { createEncyclopediaEngine } from './logic/encyclopediaEngine.js';
import { createReactionEngine } from './logic/reactionEngine.js';
import { createTechnologyEngine } from './logic/technologyEngine.js';
import { createTestEngine } from './logic/testEngine.js';
import { createWorldEngine } from './logic/worldEngine.js';
import { createRouter } from './router.js';
import { createGameState, createInitialState } from './state/gameState.js';
import { createSaveManager } from './storage/saveManager.js';
import { createModal } from './components/modal.js';
import { createNavbar } from './components/navbar.js';
import { createEncyclopediaPage } from './ui/encyclopediaPage.js';
import { createHomePage } from './ui/homePage.js';
import { createLaboratoryPage } from './ui/laboratoryPage.js';
import { createSettingsPage } from './ui/settingsPage.js';
import { createTechTreePage } from './ui/techTreePage.js';
import { createTestsPage } from './ui/testsPage.js';
import { createWorldPage } from './ui/worldPage.js';
import { appTitle, events, pageTitles, routes } from './utils/constants.js';
import { createElement } from './utils/helpers.js';

async function bootstrap() {
  const data = await loadGameData();
  const saveManager = createSaveManager();
  const savedState = saveManager.loadGame();
  const initialState = savedState ?? createInitialState(data);
  const store = createGameState(initialState);
  const bus = createEventBus();
  const reactionEngine = createReactionEngine({ data, store, bus });
  const technologyEngine = createTechnologyEngine({ data, store, bus });
  const worldEngine = createWorldEngine({ data, store, bus });
  const encyclopediaEngine = createEncyclopediaEngine({ data, store });
  const testEngine = createTestEngine({
    data,
    store,
    bus,
    reactionEngine,
  });

  const root = document.querySelector('#app');
  const shell = createElement('div', { className: 'app-shell' });
  const ambientCanvas = createElement('canvas', {
    className: 'ambient-canvas',
    attrs: { 'aria-hidden': 'true' },
  });
  const chrome = createElement('div', { className: 'app-chrome' });
  const topbar = createElement('header', { className: 'topbar' });
  const titleBlock = createElement('div', { className: 'topbar__title-block' });
  const title = createElement('h1', { className: 'topbar__title' });
  const subtitle = createElement('p', { className: 'topbar__subtitle' });
  const statusRow = createElement('div', { className: 'topbar__status' });
  const notifications = createElement('aside', { className: 'notification-stack' });
  const pageOutlet = createElement('main', { className: 'page-outlet' });
  const modal = createModal({
    onConfirm: (modalState) => {
      bus.emit(modalState.confirmEvent, modalState.payload ?? {});
      bus.emit(events.modalClose);
    },
    onClose: () => bus.emit(events.modalClose),
  });

  const gameLoop = createGameLoop({
    canvas: ambientCanvas,
    store,
  });

  titleBlock.append(title, subtitle);
  topbar.append(titleBlock, statusRow);

  const navbar = createNavbar({
    routes,
    onNavigate: (routeId) => router.navigate(routeId),
  });

  shell.append(ambientCanvas, chrome, modal.element);
  chrome.append(navbar.element, topbar, notifications, pageOutlet);
  root.replaceChildren(shell);

  const actions = {
    navigate(routeId) {
      router.navigate(routeId);
    },
    submitReaction(selection) {
      bus.emit(events.reactionSubmit, { selection });
    },
    unlockTechnology(technologyId) {
      bus.emit(events.technologyRequest, { technologyId });
    },
    submitTest(payload) {
      return testEngine.submitAttempt(payload);
    },
    selectEntry(entryId) {
      encyclopediaEngine.selectEntry(entryId);
    },
    updateSetting(settingKey, value) {
      bus.emit(events.settingsUpdate, { settingKey, value });
    },
    saveNow() {
      bus.emit(events.saveRequested, { reason: 'manual' });
    },
    openResetModal() {
      bus.emit(events.modalOpen, {
        title: 'Reset all progress?',
        description:
          'This clears local save data and returns the planet to the Dead Planet stage.',
        confirmLabel: 'Reset Progress',
        confirmTone: 'danger',
        confirmEvent: events.gameReset,
      });
    },
  };

  const pages = {
    home: createHomePage({ data, actions }),
    laboratory: createLaboratoryPage({
      data,
      actions,
      previewReaction: reactionEngine.findMatchingReaction,
    }),
    techTree: createTechTreePage({ data, actions }),
    world: createWorldPage({ data }),
    encyclopedia: createEncyclopediaPage({ data, actions }),
    tests: createTestsPage({
      data,
      actions,
      previewReaction: reactionEngine.findMatchingReaction,
    }),
    settings: createSettingsPage({ actions }),
  };

  let currentRoute = 'home';

  function mountRoute(routeId) {
    currentRoute = routeId;
    pageOutlet.replaceChildren(pages[routeId].element);
    navbar.update(routeId);

    store.update((draft) => {
      draft.uiState.route = routeId;
      draft.progress.route = routeId;
    });
  }

  function updateShell(state) {
    const stage = data.maps.worldStages[state.world.currentStageId];
    const currentPage = pages[currentRoute];

    title.textContent = `${appTitle} / ${pageTitles[currentRoute]}`;
    subtitle.textContent = `${stage.name} - ${state.player.knowledgePoints} knowledge points - ${state.technologies.unlockedIds.length} technologies`;
    statusRow.replaceChildren(
      createStatusPill('Atmosphere', `${state.world.parameters.atmosphere}%`),
      createStatusPill('Water', `${state.world.parameters.water}%`),
      createStatusPill('Life', `${state.world.parameters.lifeComplexity}%`),
    );
    notifications.replaceChildren(
      ...state.uiState.notifications.map((notification) =>
        createElement('article', {
          className: `notice notice--${notification.tone}`,
          children: [
            createElement('strong', { text: notification.title }),
            createElement('p', { text: notification.detail }),
          ],
        }),
      ),
    );
    modal.update(state.uiState.modal);

    if (state.settings.animationsEnabled) {
      gameLoop.start();
    } else {
      gameLoop.stop();
    }

    currentPage?.update(state);
  }

  const router = createRouter({
    onRouteChange(routeId) {
      mountRoute(routeId);
      updateShell(store.getState());
    },
  });

  store.subscribe(updateShell);

  bus.on(events.reactionSubmit, ({ selection }) => {
    reactionEngine.submitReaction({
      substanceIds: selection.substanceIds,
      processIds: selection.processIds,
      conditionIds: selection.conditionIds,
    });
  });

  bus.on(events.reactionSuccess, ({ reactionId, effectIds }) => {
    technologyEngine.unlockTriggeredTechnologies({ reactionId });
    worldEngine.applyEffects(effectIds, reactionId);
    encyclopediaEngine.syncEntries();
    technologyEngine.syncAvailableTechnologies();

    if (store.getState().settings.autoSave) {
      bus.emit(events.saveRequested, { reason: 'reaction' });
    }
  });

  bus.on(events.technologyRequest, ({ technologyId }) => {
    const unlocked = technologyEngine.unlockTechnology(technologyId);
    if (unlocked && store.getState().settings.autoSave) {
      bus.emit(events.saveRequested, { reason: 'technology-request' });
    }
  });

  bus.on(events.technologyUnlocked, ({ technologyId, effectIds }) => {
    worldEngine.applyEffects(effectIds, technologyId);
    encyclopediaEngine.syncEntries();
    technologyEngine.syncAvailableTechnologies();
  });

  bus.on(events.worldUpdated, () => {
    encyclopediaEngine.syncEntries();
    technologyEngine.syncAvailableTechnologies();
  });

  bus.on(events.testCompleted, ({ testId }) => {
    technologyEngine.unlockTriggeredTechnologies({ testId });
    encyclopediaEngine.syncEntries();

    if (store.getState().settings.autoSave) {
      bus.emit(events.saveRequested, { reason: 'test' });
    }
  });

  bus.on(events.settingsUpdate, ({ settingKey, value }) => {
    store.update((draft) => {
      draft.settings[settingKey] = value;
      draft.progress.lastAction = `settings:${settingKey}`;
    });

    if (store.getState().settings.autoSave) {
      bus.emit(events.saveRequested, { reason: 'settings' });
    }
  });

  bus.on(events.modalOpen, (modalState) => {
    store.update((draft) => {
      draft.uiState.modal = modalState;
    });
  });

  bus.on(events.modalClose, () => {
    store.update((draft) => {
      draft.uiState.modal = null;
    });
  });

  bus.on(events.gameReset, () => {
    saveManager.clearGame();
    store.replace(createInitialState(data));
    technologyEngine.syncAvailableTechnologies();
    encyclopediaEngine.syncEntries();
    worldEngine.refreshWorld('reset');
    router.navigate('home');
  });

  bus.on(events.saveRequested, ({ reason }) => {
    if (!store.getState().settings.autoSave && reason !== 'manual') {
      return;
    }

    store.update((draft) => {
      draft.meta.lastSavedAt = new Date().toISOString();
      draft.stats.saves += 1;
    });
    saveManager.saveGame(store.getState());
  });

  technologyEngine.syncAvailableTechnologies();
  encyclopediaEngine.syncEntries();
  worldEngine.refreshWorld('bootstrap');
  updateShell(store.getState());
  router.start();
}

bootstrap();

function createStatusPill(label, value) {
  return createElement('div', {
    className: 'status-pill',
    children: [
      createElement('span', { className: 'status-pill__label', text: label }),
      createElement('strong', { className: 'status-pill__value', text: value }),
    ],
  });
}
