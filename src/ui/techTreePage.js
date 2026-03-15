import { createGameCard } from '../components/cards.js';
import { createPanel } from '../components/panels.js';
import { themeBranches } from '../utils/constants.js';
import { createElement, titleCase } from '../utils/helpers.js';
import { canAffordTechnology, meetsStateRequirements } from '../utils/validators.js';

function describeRequirements(technology) {
  const requirements = [];

  if (technology.requirements.cards?.length) {
    requirements.push(
      `Cards: ${technology.requirements.cards.map(titleCase).join(', ')}`,
    );
  }

  if (technology.requirements.technologies?.length) {
    requirements.push(
      `Tech: ${technology.requirements.technologies.map(titleCase).join(', ')}`,
    );
  }

  if (technology.costKnowledge) {
    requirements.push(`Knowledge: ${technology.costKnowledge}`);
  }

  if (technology.requirements.worldStageId) {
    requirements.push(`Stage: ${titleCase(technology.requirements.worldStageId)}`);
  }

  return requirements.join(' - ');
}

export function createTechTreePage({ data, actions }) {
  const element = createElement('div', { className: 'page page--tech-tree' });
  const hero = createElement('section', { className: 'hero hero--tech' });
  const title = createElement('h1', {
    className: 'hero__title',
    text: 'Technology Tree',
  });
  const description = createElement('p', {
    className: 'hero__description',
    text: 'Spend knowledge points to turn discoveries into permanent planetary capabilities.',
  });
  const panel = createPanel({
    title: 'Branches',
    subtitle: 'Technologies unlock in chemistry, planet, life and civilization tracks.',
  });
  const branches = createElement('div', { className: 'branch-grid' });

  hero.append(title, description);
  panel.element.append(branches);
  element.append(hero, panel.element);

  function update(state) {
    branches.replaceChildren(
      ...['chemistry', 'planet', 'life', 'civilization'].map((branchId) =>
        renderBranch(branchId, state, data, actions),
      ),
    );
  }

  return {
    element,
    update,
  };
}

function renderBranch(branchId, state, data, actions) {
  const branch = createElement('section', {
    className: `branch ${themeBranches[branchId] ?? ''}`.trim(),
  });
  const heading = createElement('h2', {
    className: 'branch__title',
    text: titleCase(branchId),
  });
  const list = createElement('div', { className: 'card-grid' });

  data.technologies
    .filter((technology) => technology.ui.branch === branchId)
    .forEach((technology) => {
      const isUnlocked = state.technologies.unlockedIds.includes(technology.id);
      const isEligible = meetsStateRequirements(technology.requirements, state);
      const isAffordable = canAffordTechnology(technology, state);
      const button = createGameCard({
        title: technology.name,
        label: `Tier ${technology.ui.tier}`,
        description: technology.description,
        accent: `var(--${branchId}-accent)`,
        tone: branchId,
        badge: isUnlocked ? 'Unlocked' : isEligible ? 'Ready' : 'Locked',
        meta: describeRequirements(technology),
        disabled: isUnlocked || !isEligible || !isAffordable,
        onClick: () => actions.unlockTechnology(technology.id),
      });

      list.append(button);
    });

  branch.append(heading, list);
  return branch;
}
