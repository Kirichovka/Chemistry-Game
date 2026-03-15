import { createElement } from '../utils/helpers.js';

export function createPanel({ title, subtitle = '', className = '' }) {
  const element = createElement('section', {
    className: `panel ${className}`.trim(),
  });
  const header = createElement('div', { className: 'panel__header' });
  const titleElement = createElement('h2', {
    className: 'panel__title',
    text: title,
  });

  header.append(titleElement);

  if (subtitle) {
    header.append(
      createElement('p', {
        className: 'panel__subtitle',
        text: subtitle,
      }),
    );
  }

  element.append(header);

  return {
    element,
    body: element,
  };
}
