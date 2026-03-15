export function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

export function unique(items) {
  return [...new Set(items)];
}

export function toIdMap(items) {
  return Object.fromEntries(items.map((item) => [item.id, item]));
}

export function createElement(tagName, options = {}) {
  const element = document.createElement(tagName);
  const { className, text, html, attrs, dataset, children, events } = options;

  if (className) {
    element.className = className;
  }

  if (text !== undefined) {
    element.textContent = text;
  }

  if (html !== undefined) {
    element.innerHTML = html;
  }

  if (attrs) {
    Object.entries(attrs).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        element.setAttribute(key, String(value));
      }
    });
  }

  if (dataset) {
    Object.entries(dataset).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        element.dataset[key] = String(value);
      }
    });
  }

  if (events) {
    Object.entries(events).forEach(([eventName, handler]) => {
      element.addEventListener(eventName, handler);
    });
  }

  if (children?.length) {
    element.append(...children);
  }

  return element;
}

export function clearElement(element) {
  element.replaceChildren();
}

export function formatNumber(value) {
  return new Intl.NumberFormat('en-US', { maximumFractionDigits: 0 }).format(value);
}

export function formatPercent(value) {
  return `${Math.round(value)}%`;
}

export function titleCase(value) {
  return value
    .replace(/([A-Z])/g, ' $1')
    .replace(/[_-]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/\b\w/g, (character) => character.toUpperCase());
}

export function countsFromSelection(selection) {
  return selection.reduce((counts, id) => {
    counts[id] = (counts[id] ?? 0) + 1;
    return counts;
  }, {});
}

export function countsToEntries(counts) {
  return Object.entries(counts).map(([id, count]) => ({ id, count }));
}

export function matchesCounts(leftCounts, rightCounts) {
  const leftEntries = Object.entries(leftCounts);
  const rightEntries = Object.entries(rightCounts);

  if (leftEntries.length !== rightEntries.length) {
    return false;
  }

  return leftEntries.every(([id, count]) => rightCounts[id] === count);
}

export function sumBy(items, getValue) {
  return items.reduce((total, item) => total + getValue(item), 0);
}

export function asSorted(items, getSortValue) {
  return [...items].sort((left, right) => getSortValue(left) - getSortValue(right));
}

export function pushLimited(items, value, limit) {
  return [value, ...items].slice(0, limit);
}

export function isUnlocked(collection, id) {
  return collection.includes(id);
}

export function buildInventoryMap(items) {
  return Object.fromEntries(
    items.map((item) => [item.id, item.gameplay?.startingQuantity ?? 0]),
  );
}

export function getNowIso() {
  return new Date().toISOString();
}

export function makeId(prefix) {
  return `${prefix}-${Math.random().toString(36).slice(2, 10)}`;
}

export function createNotification({ title, detail, tone = 'info' }) {
  return {
    id: makeId('notice'),
    title,
    detail,
    tone,
  };
}
