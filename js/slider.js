// Слайдер услуг: обычная горизонтальная прокрутка со scroll-snap
// (тачпад и палец работают из коробки), плюс перетаскивание мышью.

(function () {
  const slider = document.querySelector('[data-slider]');
  if (!slider) return;

  const DRAG_THRESHOLD = 5;
  let startX = 0;
  let startScroll = 0;
  let isPointerDown = false;
  let moved = false;

  slider.addEventListener('pointerdown', (event) => {
    if (event.pointerType !== 'mouse' || event.button !== 0) return;
    isPointerDown = true;
    moved = false;
    startX = event.clientX;
    startScroll = slider.scrollLeft;
  });

  slider.addEventListener('pointermove', (event) => {
    if (!isPointerDown) return;
    const delta = event.clientX - startX;

    if (!moved && Math.abs(delta) > DRAG_THRESHOLD) {
      moved = true;
      slider.classList.add('is-dragging');
      slider.setPointerCapture(event.pointerId);
    }
    if (moved) {
      slider.scrollLeft = startScroll - delta;
    }
  });

  function endDrag() {
    if (!isPointerDown) return;
    isPointerDown = false;
    // при возврате scroll-snap браузер сам доведёт до ближайшей карточки
    slider.classList.remove('is-dragging');
  }

  slider.addEventListener('pointerup', endDrag);
  slider.addEventListener('pointercancel', endDrag);

  // после перетаскивания клик по ссылке внутри карточки не должен срабатывать
  slider.addEventListener('click', (event) => {
    if (moved) {
      event.preventDefault();
      moved = false;
    }
  }, true);
})();
