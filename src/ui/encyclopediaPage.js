import { createPanel } from '../components/panels.js';
import { createElement, titleCase } from '../utils/helpers.js';

function renderProperties(properties = {}) {
  return Object.entries(properties).map(([key, value]) =>
    createElement('div', {
      className: 'property-row',
      children: [
        createElement('span', { className: 'property-row__label', text: titleCase(key) }),
        createElement('strong', {
          className: 'property-row__value',
          text: String(value),
        }),
      ],
    }),
  );
}

export function createEncyclopediaPage({ data, actions }) {
  const element = createElement('div', { className: 'page page--encyclopedia' });
  const hero = createElement('section', { className: 'hero hero--encyclopedia' });
  const title = createElement('h1', { className: 'hero__title', text: 'Encyclopedia' });
  const description = createElement('p', {
    className: 'hero__description',
    text: 'Every discovery opens another educational reference entry with context, uses and related reactions.',
  });
  const layout = createElement('div', { className: 'split-layout' });
  const listPanel = createPanel({
    title: 'Entries',
    subtitle: 'Unlocked references',
  });
  const detailPanel = createPanel({
    title: 'Details',
    subtitle: 'Read the science behind the current discovery.',
  });
  const entryList = createElement('div', { className: 'list-stack' });
  const detailTitle = createElement('h2', { className: 'entry-title' });
  const detailSummary = createElement('p', { className: 'entry-summary' });
  const propertiesList = createElement('div', { className: 'property-list' });
  const usesList = createElement('div', { className: 'list-stack' });

  listPanel.element.append(entryList);
  detailPanel.element.append(
    detailTitle,
    detailSummary,
    propertiesList,
    createSection('Educational Uses', usesList),
  );
  layout.append(listPanel.element, detailPanel.element);
  hero.append(title, description);
  element.append(hero, layout);

  function update(state) {
    const unlockedEntries = state.encyclopedia.unlockedEntryIds
      .map((entryId) => data.maps.encyclopedia[entryId])
      .filter(Boolean);
    const selectedEntry =
      data.maps.encyclopedia[state.encyclopedia.selectedEntryId] ??
      unlockedEntries[0] ??
      null;

    entryList.replaceChildren(
      ...unlockedEntries.map((entry) =>
        createElement('button', {
          className: `list-item list-item--button${selectedEntry?.id === entry.id ? ' is-active' : ''}`,
          attrs: { type: 'button' },
          events: {
            click: () => actions.selectEntry(entry.id),
          },
          children: [
            createElement('h3', { className: 'list-item__title', text: entry.title }),
            createElement('p', {
              className: 'list-item__detail',
              text: titleCase(entry.entryCategory),
            }),
          ],
        }),
      ),
    );

    if (!selectedEntry) {
      detailTitle.textContent = 'No entry selected';
      detailSummary.textContent = 'Discover more cards to unlock encyclopedia content.';
      propertiesList.replaceChildren();
      usesList.replaceChildren();
      return;
    }

    detailTitle.textContent = selectedEntry.title;
    detailSummary.textContent = selectedEntry.summary;
    propertiesList.replaceChildren(...renderProperties(selectedEntry.properties));
    usesList.replaceChildren(
      ...(selectedEntry.education?.uses ?? []).map((use) =>
        createElement('article', {
          className: 'list-item',
          children: [
            createElement('h3', { className: 'list-item__title', text: titleCase(use) }),
          ],
        }),
      ),
    );
  }

  return {
    element,
    update,
  };
}

function createSection(title, content) {
  return createElement('section', {
    className: 'subsection',
    children: [
      createElement('h3', { className: 'subsection__title', text: title }),
      content,
    ],
  });
}
