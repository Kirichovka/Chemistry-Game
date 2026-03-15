import { createElement } from '../utils/helpers.js';

export function createGameCard({
  title,
  label,
  description,
  accent,
  meta = '',
  badge = '',
  tone = 'default',
  selected = false,
  disabled = false,
  compact = false,
  onClick,
}) {
  const card = createElement('button', {
    className: `game-card game-card--${tone}${selected ? ' is-selected' : ''}${compact ? ' game-card--compact' : ''}`,
    attrs: {
      type: 'button',
      style: accent ? `--card-accent:${accent}` : null,
      disabled: disabled || null,
    },
    events: onClick
      ? {
          click: onClick,
        }
      : undefined,
  });

  const header = createElement('div', { className: 'game-card__header' });
  const labelElement = createElement('span', {
    className: 'game-card__label',
    text: label,
  });
  const badgeElement = createElement('span', {
    className: 'game-card__badge',
    text: badge,
  });
  const titleElement = createElement('h3', {
    className: 'game-card__title',
    text: title,
  });
  const descriptionElement = createElement('p', {
    className: 'game-card__description',
    text: description,
  });
  const metaElement = createElement('div', {
    className: 'game-card__meta',
    text: meta,
  });

  header.append(labelElement);
  if (badge) {
    header.append(badgeElement);
  }

  card.append(header, titleElement, descriptionElement);

  if (meta) {
    card.append(metaElement);
  }

  return card;
}

export function createCardGrid() {
  return createElement('div', { className: 'card-grid' });
}
