import { createCardGrid, createGameCard } from '../components/cards.js';
import { createPanel } from '../components/panels.js';
import { createElement, titleCase } from '../utils/helpers.js';

export function createTestsPage({ data, actions, previewReaction }) {
  const element = createElement('div', { className: 'page page--tests' });
  const hero = createElement('section', { className: 'hero hero--tests' });
  const title = createElement('h1', { className: 'hero__title', text: 'Tests' });
  const description = createElement('p', {
    className: 'hero__description',
    text: 'Educational tests reward knowledge points and reinforce reaction logic, chains and conditions.',
  });
  const layout = createElement('div', { className: 'split-layout split-layout--wide' });
  const listPanel = createPanel({
    title: 'Challenges',
    subtitle: 'Unlocked test content',
  });
  const workspacePanel = createPanel({
    title: 'Test Workspace',
    subtitle: 'Build the answer and submit it for validation.',
  });
  const testList = createElement('div', { className: 'list-stack' });
  const testTitle = createElement('h2', { className: 'entry-title' });
  const testDescription = createElement('p', { className: 'entry-summary' });
  const testGoal = createElement('p', { className: 'formula-preview' });
  const substancesGrid = createCardGrid();
  const processesGrid = createCardGrid();
  const conditionsGrid = createCardGrid();
  const preview = createElement('p', { className: 'entry-summary' });
  const submitButton = createElement('button', {
    className: 'button button--primary',
    text: 'Submit Test',
    attrs: { type: 'button' },
  });
  const clearButton = createElement('button', {
    className: 'button button--ghost',
    text: 'Clear',
    attrs: { type: 'button' },
  });
  const buttonRow = createElement('div', {
    className: 'button-row',
    children: [submitButton, clearButton],
  });

  let lastState = null;
  let selectedTestId = null;
  let selection = {
    substanceIds: [],
    processIds: [],
    conditionIds: [],
  };

  listPanel.element.append(testList);
  workspacePanel.element.append(
    testTitle,
    testDescription,
    testGoal,
    createSection('Substances', substancesGrid),
    createSection('Processes', processesGrid),
    createSection('Conditions', conditionsGrid),
    preview,
    buttonRow,
  );
  layout.append(listPanel.element, workspacePanel.element);
  hero.append(title, description);
  element.append(hero, layout);

  clearButton.addEventListener('click', () => {
    selection = {
      substanceIds: [],
      processIds: [],
      conditionIds: [],
    };
    if (lastState) {
      update(lastState);
    }
  });

  submitButton.addEventListener('click', () => {
    if (!selectedTestId) {
      return;
    }

    const passed = actions.submitTest({
      testId: selectedTestId,
      selection,
    });

    if (passed) {
      selection = {
        substanceIds: [],
        processIds: [],
        conditionIds: [],
      };
    }
  });

  function setSelectedTest(testId) {
    selectedTestId = testId;
    selection = {
      substanceIds: [],
      processIds: [],
      conditionIds: [],
    };
  }

  function update(state) {
    lastState = state;
    const unlockedTests = data.tests.filter((test) =>
      state.tests.unlockedIds.includes(test.id),
    );
    const selectedTest =
      unlockedTests.find((test) => test.id === selectedTestId) ??
      unlockedTests[0] ??
      null;

    if (selectedTest && selectedTest.id !== selectedTestId) {
      setSelectedTest(selectedTest.id);
    }

    testList.replaceChildren(
      ...unlockedTests.map((test) =>
        createElement('button', {
          className: `list-item list-item--button${selectedTest?.id === test.id ? ' is-active' : ''}`,
          attrs: { type: 'button' },
          events: {
            click: () => {
              setSelectedTest(test.id);
              update(state);
            },
          },
          children: [
            createElement('h3', { className: 'list-item__title', text: test.title }),
            createElement('p', {
              className: 'list-item__detail',
              text: state.tests.completedIds.includes(test.id)
                ? 'Completed'
                : `${titleCase(test.difficulty)} - ${titleCase(test.taskType)}`,
            }),
          ],
        }),
      ),
    );

    if (!selectedTest) {
      testTitle.textContent = 'No tests unlocked';
      testDescription.textContent =
        'Keep progressing through the technology tree to unlock more assessments.';
      testGoal.textContent = '';
      substancesGrid.replaceChildren();
      processesGrid.replaceChildren();
      conditionsGrid.replaceChildren();
      preview.textContent = '';
      return;
    }

    testTitle.textContent = selectedTest.title;
    testDescription.textContent = selectedTest.description;
    testGoal.textContent = `Goal: ${titleCase(selectedTest.taskType)}${selectedTest.goal.targetCardId ? ` -> ${titleCase(selectedTest.goal.targetCardId)}` : ''}`;

    const availableCards = selectedTest.availableCards
      .map((entityId) => data.cardsByEntityId[entityId])
      .filter(Boolean);
    const availableProcesses = selectedTest.availableProcesses
      .map((entityId) => data.cardsByEntityId[entityId])
      .filter(Boolean);
    const availableConditions = selectedTest.allowedConditions
      .map((entityId) => data.cardsByEntityId[entityId])
      .filter(Boolean);

    substancesGrid.replaceChildren(
      ...availableCards
        .filter((card) => ['element', 'compound'].includes(card.cardType))
        .map((card) =>
          createGameCard({
            title: card.name,
            label: card.shortLabel,
            description: card.description,
            accent: card.appearance.color,
            tone: card.cardType,
            compact: state.settings.compactCards,
            selected: selection.substanceIds.includes(card.entityId),
            onClick: () => {
              selection.substanceIds.push(card.entityId);
              update(state);
            },
          }),
        ),
    );

    processesGrid.replaceChildren(
      ...availableProcesses.map((card) =>
        createGameCard({
          title: card.name,
          label: card.shortLabel,
          description: card.description,
          accent: card.appearance.color,
          tone: card.cardType,
          compact: state.settings.compactCards,
          selected: selection.processIds.includes(card.entityId),
          onClick: () => {
            toggleSingle(selection.processIds, card.entityId);
            update(state);
          },
        }),
      ),
    );

    conditionsGrid.replaceChildren(
      ...availableConditions.map((card) =>
        createGameCard({
          title: card.name,
          label: card.shortLabel,
          description: card.description,
          accent: card.appearance.color,
          tone: card.cardType,
          compact: state.settings.compactCards,
          selected: selection.conditionIds.includes(card.entityId),
          onClick: () => {
            toggleSingle(selection.conditionIds, card.entityId);
            update(state);
          },
        }),
      ),
    );

    const reaction = previewReaction(selection);
    preview.textContent = reaction
      ? `Preview: ${reaction.name}`
      : 'Preview: no known reaction for the current answer';
  }

  return {
    element,
    update,
  };
}

function toggleSingle(collection, entityId) {
  const index = collection.indexOf(entityId);
  if (index >= 0) {
    collection.splice(index, 1);
    return;
  }

  collection.push(entityId);
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
