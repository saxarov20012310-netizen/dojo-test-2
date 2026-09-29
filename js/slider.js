// Слайдер услуг — бесконечная лента, которая медленно едет влево.
//
// Лента двигается через transform, а не через scrollLeft: прокрутка
// округляется до целых пикселей и на малой скорости идёт рывками,
// а transform понимает дробные значения — движение получается плавным.
//
// При наведении лента плавно тормозит и так же плавно разгоняется.
// Её можно тянуть мышью и пальцем (с инерцией) и листать тачпадом.
// При prefers-reduced-motion автопрокрутка выключена.

(function () {
  const slider = document.querySelector('[data-slider]');
  if (!slider) return;
  const track = slider.querySelector('.services__list');

  const SPEED = 30;           // px/с — скорость автопрокрутки
  const EASE = 6;             // как быстро лента тормозит и разгоняется
  const FRICTION = 3;         // затухание инерции после перетаскивания
  const MAX_FLING = 3000;     // px/с — ограничение скорости броска
  const RESUME_DELAY = 2500;  // пауза после ручного управления, мс
  const DRAG_THRESHOLD = 5;

  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const items = Array.from(track.children);

  // Для бесконечной ленты добавляем копию карточек. Копия скрыта
  // от скринридеров и клавиатуры — для них остаётся один набор.
  items.forEach((item) => {
    const clone = item.cloneNode(true);
    clone.setAttribute('aria-hidden', 'true');
    clone.querySelectorAll('a').forEach((link) => link.setAttribute('tabindex', '-1'));
    track.append(clone);
  });

  let loopWidth = 0;
  let inset = 0;      // отступ ленты слева — до края контента
  let position = 0;   // насколько лента уехала влево, px
  let speed = 0;      // текущая скорость автопрокрутки
  let velocity = 0;   // инерция после броска
  let resumeAt = 0;
  let isHovered = false;
  let hasFocus = false;

  function measure() {
    // getBoundingClientRect, а не offsetLeft: на мобильном ширина круга
    // дробная (1472.6 px), и округление давало микрорывок на стыке
    loopWidth = track.children[items.length].getBoundingClientRect().left - items[0].getBoundingClientRect().left;
    inset = parseFloat(getComputedStyle(track).paddingLeft) || 0;
  }

  // Перескок на круг назад делаем, только когда лента уехала дальше
  // левого отступа: иначе слева от первой карточки на мгновение
  // оказывается пустое поле и уезжающая карточка «пропадает».
  function wrap(value) {
    if (loopWidth <= 0) return value;
    while (value >= loopWidth + inset) value -= loopWidth;
    while (value < 0) value += loopWidth;
    return value;
  }

  function canAutoplay(now) {
    return !reducedMotion.matches && !isHovered && !hasFocus && !drag.active && now >= resumeAt;
  }

  let lastTime = performance.now();

  function tick(now) {
    const dt = Math.min(now - lastTime, 100) / 1000;
    lastTime = now;

    if (!drag.active) {
      if (velocity !== 0) {
        position += velocity * dt;
        velocity *= Math.exp(-FRICTION * dt);
        if (Math.abs(velocity) < 5) velocity = 0;
      }

      const target = canAutoplay(now) ? SPEED : 0;
      speed += (target - speed) * Math.min(1, EASE * dt);
      position += speed * dt;
    }

    position = wrap(position);
    track.style.transform = `translate3d(${-position}px, 0, 0)`;
    requestAnimationFrame(tick);
  }

  function holdAutoplay() {
    resumeAt = performance.now() + RESUME_DELAY;
  }

  // Перетаскивание мышью и пальцем
  const drag = { pending: false, active: false, startX: 0, startPosition: 0, lastX: 0, lastTime: 0 };
  let suppressClick = false;

  slider.addEventListener('pointerdown', (event) => {
    if (event.pointerType === 'mouse' && event.button !== 0) return;
    drag.pending = true;
    drag.startX = drag.lastX = event.clientX;
    drag.startPosition = position;
    drag.lastTime = event.timeStamp;
    suppressClick = false;
  });

  slider.addEventListener('pointermove', (event) => {
    if (!drag.pending) return;
    const delta = event.clientX - drag.startX;

    if (!drag.active && Math.abs(delta) > DRAG_THRESHOLD) {
      drag.active = true;
      suppressClick = true;
      speed = 0;
      velocity = 0;
      slider.classList.add('is-dragging');
      slider.setPointerCapture(event.pointerId);
    }
    if (!drag.active) return;

    position = drag.startPosition - delta;

    const dt = (event.timeStamp - drag.lastTime) / 1000;
    if (dt > 0) {
      const instant = -(event.clientX - drag.lastX) / dt;
      velocity = velocity * 0.2 + instant * 0.8;
    }
    drag.lastX = event.clientX;
    drag.lastTime = event.timeStamp;
  });

  function endDrag(event) {
    if (!drag.pending) return;
    drag.pending = false;
    if (!drag.active) return;

    drag.active = false;
    slider.classList.remove('is-dragging');
    // если палец остановился перед отпусканием — без броска
    const idle = event.timeStamp - drag.lastTime > 80;
    velocity = idle ? 0 : Math.max(-MAX_FLING, Math.min(MAX_FLING, velocity));
    holdAutoplay();
  }

  slider.addEventListener('pointerup', endDrag);
  slider.addEventListener('pointercancel', endDrag);

  // после перетаскивания клик по ссылке внутри карточки не должен срабатывать
  slider.addEventListener('click', (event) => {
    if (suppressClick) {
      event.preventDefault();
      suppressClick = false;
    }
  }, true);

  // ссылки и картинки не должны «перетаскиваться» браузером
  slider.addEventListener('dragstart', (event) => event.preventDefault());

  // Горизонтальная прокрутка тачпадом или колесом с Shift
  slider.addEventListener('wheel', (event) => {
    const horizontal = Math.abs(event.deltaX) > Math.abs(event.deltaY);
    if (!horizontal && !event.shiftKey) return;
    event.preventDefault();

    const delta = horizontal ? event.deltaX : event.deltaY;
    position += event.deltaMode === 1 ? delta * 16 : delta;
    speed = 0;
    velocity = 0;
    holdAutoplay();
  }, { passive: false });

  // Наведение мышью — плавная остановка
  slider.addEventListener('pointerenter', (event) => {
    if (event.pointerType === 'mouse') isHovered = true;
  });
  slider.addEventListener('pointerleave', (event) => {
    if (event.pointerType === 'mouse') isHovered = false;
  });

  // Клавиатура: карточка с фокусом выезжает в начало ленты
  slider.addEventListener('focusin', (event) => {
    hasFocus = true;
    const item = event.target.closest('.services__item');
    if (!item) return;
    position = item.offsetLeft - items[0].offsetLeft;
    speed = 0;
    velocity = 0;
  });
  slider.addEventListener('focusout', (event) => {
    hasFocus = slider.contains(event.relatedTarget);
  });

  measure();
  new ResizeObserver(() => {
    measure();
    position = wrap(position);
  }).observe(track);
  requestAnimationFrame(tick);
})();
