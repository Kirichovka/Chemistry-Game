import { createGameCard } from '../components/cards.js';
import { createPanel } from '../components/panels.js';
import { formatNumber, createElement } from '../utils/helpers.js';

export function createHomePage({ data, actions }) {
  const element = createElement('div', { className: 'page page--home' });
  const hero = createElement('section', { className: 'hero hero--home' });
  const eyebrow = createElement('p', { className: 'hero__eyebrow' });
  const title = createElement('h1', { className: 'hero__title' });
  const description = createElement('p', { className: 'hero__description' });
  const metrics = createElement('div', { className: 'hero__metrics' });
  const quickActions = createElement('div', { className: 'quick-actions' });
  const statusPanel = createPanel({
    title: 'Planet Summary',
    subtitle: 'Track the chemistry-to-civilization progression at a glance.',
  });
  const goalsPanel = createPanel({
    title: 'Next Steps',
    subtitle: 'The shortest path forward based on your current discoveries.',
  });
  const statusGrid = createElement('div', { className: 'stats-grid' });
  const goalsList = createElement('div', { className: 'list-stack' });

  hero.append(eyebrow, title, description, metrics, quickActions);
  statusPanel.element.append(statusGrid);
  goalsPanel.element.append(goalsList);
  element.append(hero, statusPanel.element, goalsPanel.element);

  const actionCards = [
    {
      id: 'laboratory',
      title: 'Run a reaction',
      label: 'Lab',
      description: 'Combine element, compound, process and condition cards.',
      accent: '#36c2ff',
    },
    {
      id: 'techTree',
      title: 'Spend knowledge',
      label: 'Tech',
      description: 'Unlock chemistry, life and civilization branches.',
      accent: '#ff9c54',
    },
    {
      id: 'world',
      title: 'Check the planet',
      label: 'World',
      description: 'Review stage changes, world effects and simulation parameters.',
      accent: '#72d384',
    },
  ];

  actionCards.forEach((card) => {
    quickActions.append(
      createGameCard({
        title: card.title,
        label: card.label,
        description: card.description,
        accent: card.accent,
        compact: true,
        onClick: () => actions.navigate(card.id),
      }),
    );
  });

  function update(state) {
    const stage = data.maps.worldStages[state.world.currentStageId];
    const availableTechnologies = data.technologies.filter((technology) =>
      state.technologies.availableIds.includes(technology.id),
    );
    const availableTests = data.tests.filter((test) =>
      state.tests.unlockedIds.includes(test.id),
    );

    eyebrow.textContent = `Current Stage: ${stage.name}`;
    title.textContent = 'Discover chemistry, then shape an entire world.';
    description.textContent =
      'Every successful reaction can unlock technology, transform the planet and reveal new educational tests.';

    metrics.replaceChildren(
      createMetric('Knowledge', formatNumber(state.player.knowledgePoints)),
      createMetric('Reactions', formatNumber(state.stats.reactionsCompleted)),
      createMetric('Discoveries', formatNumber(state.stats.discoveriesMade)),
      createMetric('Technologies', formatNumber(state.technologies.unlockedIds.length)),
    );

    statusGrid.replaceChildren(
      createStatusCard('Atmosphere', `${state.world.parameters.atmosphere}%`),
      createStatusCard('Water', `${state.world.parameters.water}%`),
      createStatusCard('Life', `${state.world.parameters.lifeComplexity}%`),
      createStatusCard('Civilization', `${state.world.parameters.civilization}%`),
    );

    goalsList.replaceChildren(
      createGoal(
        availableTechnologies[0]?.name ?? 'Run more reactions',
        availableTechnologies[0]
          ? `Visit the technology tree to unlock ${availableTechnologies[0].name}.`
          : 'The laboratory is the best place to find your next breakthrough.',
      ),
      createGoal(
        availableTests[0]?.title ?? 'Complete your first test',
        availableTests[0]
          ? `Open Tests and complete ${availableTests[0].title} for more knowledge points.`
          : 'New tests unlock as your world evolves.',
      ),
      createGoal('Push the world forward', stage.description),
    );
  }

  return {
    element,
    update,
  };
}

function createMetric(label, value) {
  return createElement('div', {
    className: 'metric',
    children: [
      createElement('span', { className: 'metric__label', text: label }),
      createElement('strong', { className: 'metric__value', text: value }),
    ],
  });
}

function createStatusCard(label, value) {
  return createElement('div', {
    className: 'status-card',
    children: [
      createElement('span', { className: 'status-card__label', text: label }),
      createElement('strong', { className: 'status-card__value', text: value }),
    ],
  });
}

function createGoal(title, detail) {
  return createElement('article', {
    className: 'list-item',
    children: [
      createElement('h3', { className: 'list-item__title', text: title }),
      createElement('p', { className: 'list-item__detail', text: detail }),
    ],
  });
}
