import { createPanel } from '../components/panels.js';
import { createElement } from '../utils/helpers.js';

function createToggle(label, description, settingKey, onChange) {
  const checkbox = createElement('input', {
    attrs: { type: 'checkbox' },
    events: {
      change: (event) => onChange(settingKey, event.currentTarget.checked),
    },
  });
  const labelElement = createElement('label', {
    className: 'toggle',
    children: [
      createElement('div', {
        className: 'toggle__text',
        children: [
          createElement('span', { className: 'toggle__label', text: label }),
          createElement('span', { className: 'toggle__description', text: description }),
        ],
      }),
      checkbox,
    ],
  });

  return {
    element: labelElement,
    checkbox,
  };
}

export function createSettingsPage({ actions }) {
  const element = createElement('div', { className: 'page page--settings' });
  const hero = createElement('section', { className: 'hero hero--settings' });
  const title = createElement('h1', { className: 'hero__title', text: 'Settings' });
  const description = createElement('p', {
    className: 'hero__description',
    text: 'Adjust presentation, persistence and convenience options without touching the underlying game data.',
  });
  const panel = createPanel({
    title: 'Preferences',
    subtitle: 'These options are stored in local save data.',
  });
  const toggleList = createElement('div', { className: 'toggle-list' });
  const actionRow = createElement('div', { className: 'button-row' });

  const soundToggle = createToggle(
    'Sound Enabled',
    'Reserve this for future effects and ambient feedback.',
    'soundEnabled',
    actions.updateSetting,
  );
  const animationsToggle = createToggle(
    'Animations Enabled',
    'Toggle the ambient canvas animation loop.',
    'animationsEnabled',
    actions.updateSetting,
  );
  const autoSaveToggle = createToggle(
    'Auto Save',
    'Write progress to localStorage after important changes.',
    'autoSave',
    actions.updateSetting,
  );
  const compactCardsToggle = createToggle(
    'Compact Cards',
    'Use denser card layouts on small screens or faster scans.',
    'compactCards',
    actions.updateSetting,
  );

  const saveButton = createElement('button', {
    className: 'button button--primary',
    text: 'Save Now',
    attrs: { type: 'button' },
    events: {
      click: () => actions.saveNow(),
    },
  });
  const resetButton = createElement('button', {
    className: 'button button--danger',
    text: 'Reset Progress',
    attrs: { type: 'button' },
    events: {
      click: () => {
        actions.openResetModal();
      },
    },
  });

  toggleList.append(
    soundToggle.element,
    animationsToggle.element,
    autoSaveToggle.element,
    compactCardsToggle.element,
  );
  actionRow.append(saveButton, resetButton);
  panel.element.append(toggleList, actionRow);
  hero.append(title, description);
  element.append(hero, panel.element);

  function update(state) {
    soundToggle.checkbox.checked = state.settings.soundEnabled;
    animationsToggle.checkbox.checked = state.settings.animationsEnabled;
    autoSaveToggle.checkbox.checked = state.settings.autoSave;
    compactCardsToggle.checkbox.checked = state.settings.compactCards;
  }

  return {
    element,
    update,
  };
}
