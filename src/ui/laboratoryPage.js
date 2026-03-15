import { createCardGrid, createGameCard } from '../components/cards.js';
import { createPanel } from '../components/panels.js';
import { countsFromSelection, createElement, titleCase } from '../utils/helpers.js';

function trimSubstanceSelection(selection, state) {
  const nextSelection = [];
  const usedCounts = {};

  selection.forEach((entityId) => {
    usedCounts[entityId] = (usedCounts[entityId] ?? 0) + 1;
    if ((state.inventory[entityId] ?? 0) >= usedCounts[entityId]) {
      nextSelection.push(entityId);
    }
  });

  return nextSelection;
}

export function createLaboratoryPage({ data, actions, previewReaction }) {
  const selection = {
    substanceIds: [],
    processIds: [],
    conditionIds: [],
  };

  const element = createElement('div', { className: 'page page--laboratory' });
  const hero = createElement('section', { className: 'hero hero--laboratory' });
  const title = createElement('h1', { className: 'hero__title', text: 'Laboratory' });
  const description = createElement('p', {
    className: 'hero__description',
    text: 'Select cards to form a reaction. Substances are consumed, while processes and conditions act as catalysts.',
  });
  const recipePanel = createPanel({
    title: 'Reaction Assembly',
    subtitle: 'Choose substances, then add optional processes and conditions.',
  });
  const previewPanel = createPanel({
    title: 'Reaction Preview',
    subtitle: 'Known reactions appear here before you submit.',
  });
  const historyPanel = createPanel({
    title: 'Recent Reactions',
    subtitle: 'A rolling log of your latest laboratory successes.',
  });

  const substancesGrid = createCardGrid();
  const processesGrid = createCardGrid();
  const conditionsGrid = createCardGrid();
  const selectedFormula = createElement('p', { className: 'formula-preview' });
  const previewTitle = createElement('h3', { className: 'reaction-preview__title' });
  const previewDetail = createElement('p', { className: 'reaction-preview__detail' });
  const submitButton = createElement('button', {
    className: 'button button--primary',
    text: 'Submit Reaction',
    attrs: { type: 'button' },
    events: {
      click: () => {
        actions.submitReaction({ ...selection });
      },
    },
  });
  const clearButton = createElement('button', {
    className: 'button button--ghost',
    text: 'Clear Selection',
    attrs: { type: 'button' },
    events: {
      click: () => {
        selection.substanceIds = [];
        selection.processIds = [];
        selection.conditionIds = [];
        lastState && update(lastState);
      },
    },
  });
  const actionRow = createElement('div', {
    className: 'button-row',
    children: [submitButton, clearButton],
  });
  const historyList = createElement('div', { className: 'list-stack' });
  const substanceSection = createSection('Substances', substancesGrid);
  const processSection = createSection('Processes', processesGrid);
  const conditionSection = createSection('Conditions', conditionsGrid);

  let lastState = null;

  hero.append(title, description);
  recipePanel.element.append(
    substanceSection,
    processSection,
    conditionSection,
    selectedFormula,
    actionRow,
  );
  previewPanel.element.append(previewTitle, previewDetail);
  historyPanel.element.append(historyList);
  element.append(hero, recipePanel.element, previewPanel.element, historyPanel.element);

  function getVisibleCards(state, types) {
    return state.discoveries.cardIds
      .map((entityId) => data.cardsByEntityId[entityId])
      .filter((card) => card && types.includes(card.cardType));
  }

  function toggleSelection(collection, entityId, multiple = false) {
    if (multiple) {
      collection.push(entityId);
      return;
    }

    const index = collection.indexOf(entityId);
    if (index >= 0) {
      collection.splice(index, 1);
      return;
    }

    collection.push(entityId);
  }

  function update(state) {
    lastState = state;
    selection.substanceIds = trimSubstanceSelection(selection.substanceIds, state);
    selection.processIds = selection.processIds.filter((id) =>
      state.discoveries.cardIds.includes(id),
    );
    selection.conditionIds = selection.conditionIds.filter((id) =>
      state.discoveries.cardIds.includes(id),
    );

    const compact = state.settings.compactCards;
    const substanceCounts = countsFromSelection(selection.substanceIds);
    const reaction = previewReaction(selection);

    substancesGrid.replaceChildren(
      ...getVisibleCards(state, ['element', 'compound']).map((card) =>
        createGameCard({
          title: card.name,
          label: card.shortLabel,
          description: card.description,
          accent: card.appearance.color,
          tone: card.cardType,
          compact,
          selected: (substanceCounts[card.entityId] ?? 0) > 0,
          disabled:
            (state.inventory[card.entityId] ?? 0) <=
            (substanceCounts[card.entityId] ?? 0),
          meta: `Available ${state.inventory[card.entityId] ?? 0} - Selected ${substanceCounts[card.entityId] ?? 0}`,
          onClick: () => {
            toggleSelection(selection.substanceIds, card.entityId, true);
            update(state);
          },
        }),
      ),
    );

    processesGrid.replaceChildren(
      ...getVisibleCards(state, ['process']).map((card) =>
        createGameCard({
          title: card.name,
          label: card.shortLabel,
          description: card.description,
          accent: card.appearance.color,
          tone: card.cardType,
          compact,
          selected: selection.processIds.includes(card.entityId),
          meta: selection.processIds.includes(card.entityId) ? 'Selected' : 'Optional',
          onClick: () => {
            toggleSelection(selection.processIds, card.entityId);
            update(state);
          },
        }),
      ),
    );

    conditionsGrid.replaceChildren(
      ...getVisibleCards(state, ['condition']).map((card) =>
        createGameCard({
          title: card.name,
          label: card.shortLabel,
          description: card.description,
          accent: card.appearance.color,
          tone: card.cardType,
          compact,
          selected: selection.conditionIds.includes(card.entityId),
          meta: selection.conditionIds.includes(card.entityId) ? 'Selected' : 'Optional',
          onClick: () => {
            toggleSelection(selection.conditionIds, card.entityId);
            update(state);
          },
        }),
      ),
    );

    selectedFormula.textContent =
      selection.substanceIds.length ||
      selection.processIds.length ||
      selection.conditionIds.length
        ? `Selected: ${[
            ...selection.substanceIds,
            ...selection.processIds,
            ...selection.conditionIds,
          ]
            .map(
              (entityId) =>
                data.cardsByEntityId[entityId]?.shortLabel ?? titleCase(entityId),
            )
            .join(' + ')}`
        : 'Selected: nothing yet';

    previewTitle.textContent = reaction ? reaction.name : 'Unknown combination';
    previewDetail.textContent = reaction
      ? `Outputs ${reaction.outputs.map(({ id }) => titleCase(id)).join(', ')}. Requires ${reaction.conditionIds.map(titleCase).join(', ') || 'no special condition'}.`
      : 'Known reactions only appear when the selected cards match the reaction database.';

    historyList.replaceChildren(
      ...state.laboratory.history.map((entry) =>
        createElement('article', {
          className: 'list-item',
          children: [
            createElement('h3', {
              className: 'list-item__title',
              text:
                data.maps.reactions[entry.reactionId]?.name ??
                titleCase(entry.reactionId),
            }),
            createElement('p', {
              className: 'list-item__detail',
              text: `Created ${entry.outputs.map(({ id }) => titleCase(id)).join(', ')}`,
            }),
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
