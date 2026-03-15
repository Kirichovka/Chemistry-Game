import { createPanel } from '../components/panels.js';
import { createElement, formatPercent, titleCase } from '../utils/helpers.js';

function createParameterMeter(label) {
  const row = createElement('div', { className: 'meter' });
  const name = createElement('span', { className: 'meter__label', text: label });
  const value = createElement('strong', { className: 'meter__value' });
  const track = createElement('div', { className: 'meter__track' });
  const fill = createElement('span', { className: 'meter__fill' });

  track.append(fill);
  row.append(name, value, track);

  return {
    row,
    update(nextValue) {
      value.textContent = formatPercent(nextValue);
      fill.style.width = `${Math.max(4, Math.min(100, nextValue))}%`;
    },
  };
}

export function createWorldPage({ data }) {
  const element = createElement('div', { className: 'page page--world' });
  const hero = createElement('section', { className: 'hero hero--world' });
  const title = createElement('h1', { className: 'hero__title' });
  const description = createElement('p', { className: 'hero__description' });
  const summary = createElement('div', { className: 'hero__metrics' });
  const parameterPanel = createPanel({
    title: 'World Parameters',
    subtitle: 'Simulation values that determine stage progression.',
  });
  const worldPanel = createPanel({
    title: 'Effects and History',
    subtitle: 'See which discoveries are actively shaping the planet.',
  });
  const parameterList = createElement('div', { className: 'meter-list' });
  const effectsList = createElement('div', { className: 'list-stack' });
  const historyList = createElement('div', { className: 'list-stack' });

  const meters = {
    atmosphere: createParameterMeter('Atmosphere'),
    oxygen: createParameterMeter('Oxygen'),
    water: createParameterMeter('Water'),
    temperature: createParameterMeter('Temperature'),
    lifeComplexity: createParameterMeter('Life Complexity'),
    civilization: createParameterMeter('Civilization'),
  };

  Object.values(meters).forEach((meter) => parameterList.append(meter.row));
  parameterPanel.element.append(parameterList);
  worldPanel.element.append(
    createSection('Active Effects', effectsList),
    createSection('Recent History', historyList),
  );
  hero.append(title, description, summary);
  element.append(hero, parameterPanel.element, worldPanel.element);

  function update(state) {
    const stage = data.maps.worldStages[state.world.currentStageId];
    title.textContent = stage.name;
    description.textContent = stage.description;
    summary.replaceChildren(
      createSummaryCard('Flags', String(state.world.flags.length)),
      createSummaryCard('Effects', String(state.world.activeEffectIds.length)),
      createSummaryCard('Stage Count', String(state.discoveries.worldStageIds.length)),
    );

    meters.atmosphere.update(state.world.parameters.atmosphere);
    meters.oxygen.update(state.world.parameters.oxygen);
    meters.water.update(state.world.parameters.water);
    meters.temperature.update(Math.max(0, 100 - state.world.parameters.temperature / 3));
    meters.lifeComplexity.update(state.world.parameters.lifeComplexity);
    meters.civilization.update(state.world.parameters.civilization);

    effectsList.replaceChildren(
      ...state.world.activeEffectIds.map((effectId) =>
        createElement('article', {
          className: 'list-item',
          children: [
            createElement('h3', {
              className: 'list-item__title',
              text: data.maps.worldEffects[effectId]?.name ?? titleCase(effectId),
            }),
            createElement('p', {
              className: 'list-item__detail',
              text: data.maps.worldEffects[effectId]?.description ?? '',
            }),
          ],
        }),
      ),
    );

    historyList.replaceChildren(
      ...state.world.history.map((entry) =>
        createElement('article', {
          className: 'list-item',
          children: [
            createElement('h3', {
              className: 'list-item__title',
              text:
                data.maps.worldStages[entry.stageId]?.name ?? titleCase(entry.stageId),
            }),
            createElement('p', {
              className: 'list-item__detail',
              text: `Triggered by ${titleCase(entry.source)} with ${entry.flags.length} world flags active.`,
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

function createSummaryCard(label, value) {
  return createElement('div', {
    className: 'metric',
    children: [
      createElement('span', { className: 'metric__label', text: label }),
      createElement('strong', { className: 'metric__value', text: value }),
    ],
  });
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
