// Слайдер услуг: горизонтальная прокрутка со scroll-snap плюс
// автопрокрутка — лента медленно и бесконечно едет влево.
// Автопрокрутка останавливается, пока пользователь смотрит на ленту
// или листает её сам, и выключена при prefers-reduced-motion.

(function () {
  const slider = document.querySelector('[data-slider]');
  if (!slider) return;

  const SPEED = 30;          // px в секунду
  const RESUME_DELAY = 3000; // пауза после ручной прокрутки, мс
  const DRAG_THRESHOLD = 5;

  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const items = Array.from(slider.children);

  // Для бесконечной ленты добавляем копию карточек. Копия скрыта
  // от скринридеров и клавиатуры — для них остаётся один набор.
  items.forEach((item) => {
    const clone = item.cloneNode(true);
    clone.setAttribute('aria-hidden', 'true');
    clone.querySelectorAll('a').forEach((link) => link.setAttribute('tabindex', '-1'));
    slider.append(clone);
  });

  let loopWidth = 0;
  let position = 0;
  let lastTime = 0;
  let isHovered = false;
  let hasFocus = false;
  let resumeTimer = null;
  let userActive = false;

  function measure() {
    loopWidth = slider.children[items.length].offsetLeft - items[0].offsetLeft;
  }

  function isRunning() {
    return !reducedMotion.matches && !isHovered && !hasFocus && !userActive;
  }

  function tick(time) {
    const dt = Math.min(time - lastTime, 100) / 1000;
    lastTime = time;

    if (isRunning() && loopWidth > 0) {
      position += SPEED * dt;
      if (position >= loopWidth) position -= loopWidth;
      slider.scrollLeft = position;
    }
    requestAnimationFrame(tick);
  }

  // Пользователь листает сам: включаем snap и ждём, пока он закончит
  function pauseForUser() {
    userActive = true;
    slider.classList.remove('is-autoplay');
    clearTimeout(resumeTimer);
    resumeTimer = setTimeout(() => {
      userActive = false;
      position = slider.scrollLeft;
      slider.classList.add('is-autoplay');
    }, RESUME_DELAY);
  }

  // Ручная прокрутка дошла до копии — незаметно перескакиваем на оригинал
  slider.addEventListener('scroll', () => {
    if (isRunning()) return;
    if (loopWidth > 0 && slider.scrollLeft >= loopWidth) {
      slider.scrollLeft -= loopWidth;
    }
    position = slider.scrollLeft;
  }, { passive: true });

  slider.addEventListener('wheel', pauseForUser, { passive: true });
  slider.addEventListener('touchstart', pauseForUser, { passive: true });
  slider.addEventListener('pointerenter', (event) => {
    if (event.pointerType === 'mouse') isHovered = true;
  });
  slider.addEventListener('pointerleave', () => {
    isHovered = false;
    position = slider.scrollLeft;
  });
  slider.addEventListener('focusin', () => {
    hasFocus = true;
    slider.classList.remove('is-autoplay');
  });
  slider.addEventListener('focusout', () => {
    hasFocus = false;
    position = slider.scrollLeft;
    slider.classList.add('is-autoplay');
  });

  // Перетаскивание мышью
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
    pauseForUser();
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
    pauseForUser();
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

  measure();
  new ResizeObserver(measure).observe(slider);
  slider.classList.add('is-autoplay');
  requestAnimationFrame((time) => {
    lastTime = time;
    requestAnimationFrame(tick);
  });
})();
