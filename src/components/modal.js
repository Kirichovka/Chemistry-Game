import { createElement } from '../utils/helpers.js';

export function createModal({ onConfirm, onClose }) {
  const element = createElement('div', {
    className: 'modal hidden',
    attrs: { 'aria-hidden': 'true' },
  });
  const backdrop = createElement('button', {
    className: 'modal__backdrop',
    attrs: { type: 'button', 'aria-label': 'Close dialog' },
    events: {
      click: () => onClose(),
    },
  });
  const card = createElement('div', { className: 'modal__card' });
  const title = createElement('h3', { className: 'modal__title' });
  const description = createElement('p', { className: 'modal__description' });
  const cancelButton = createElement('button', {
    className: 'button button--ghost',
    text: 'Cancel',
    attrs: { type: 'button' },
    events: {
      click: () => onClose(),
    },
  });
  const confirmButton = createElement('button', {
    className: 'button button--danger',
    text: 'Confirm',
    attrs: { type: 'button' },
  });

  let modalState = null;

  confirmButton.addEventListener('click', () => {
    if (modalState) {
      onConfirm(modalState);
    }
  });

  const actions = createElement('div', {
    className: 'modal__actions',
    children: [cancelButton, confirmButton],
  });

  card.append(title, description, actions);
  element.append(backdrop, card);

  function update(nextModalState) {
    modalState = nextModalState;
    const isVisible = Boolean(nextModalState);

    element.classList.toggle('hidden', !isVisible);
    element.setAttribute('aria-hidden', String(!isVisible));

    if (!isVisible) {
      return;
    }

    title.textContent = nextModalState.title;
    description.textContent = nextModalState.description;
    confirmButton.textContent = nextModalState.confirmLabel ?? 'Confirm';
    confirmButton.className = `button ${nextModalState.confirmTone === 'danger' ? 'button--danger' : 'button--primary'}`;
  }

  return {
    element,
    update,
  };
}
