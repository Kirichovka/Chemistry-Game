import { dataLoadOrder } from '../utils/constants.js';
import { toIdMap } from '../utils/helpers.js';
import { validateDataset } from '../utils/validators.js';

const dataModules = import.meta.glob('./*.json', {
  eager: true,
  import: 'default',
});

export async function loadGameData() {
  const datasets = {};

  dataLoadOrder.forEach((fileName) => {
    const moduleKey = `./${fileName}`;
    const dataset = dataModules[moduleKey];

    validateDataset(dataset, fileName);
    datasets[fileName.replace('.json', '')] = dataset.items;
  });

  const maps = Object.fromEntries(
    Object.entries(datasets).map(([key, items]) => [key, toIdMap(items)]),
  );

  const cardsByEntityId = Object.fromEntries(
    datasets.cards.map((card) => [card.entityId, card]),
  );

  return {
    ...datasets,
    maps,
    cardsByEntityId,
  };
}
