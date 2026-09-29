// Фото специалиста в форме записи задаётся в админке.
// Здесь ответ админки имитирует data/specialist.json: { photo, alt }.
// Ожидается PNG/WebP с прозрачным фоном, кадр по пояс.
// Если запрос не удался, остаётся фото по умолчанию из разметки.

(function () {
  const photo = document.querySelector('[data-specialist-photo]');
  if (!photo) return;

  const ENDPOINT = 'data/specialist.json';

  fetch(ENDPOINT)
    .then((response) => {
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      return response.json();
    })
    .then(({ photo: src, alt }) => {
      if (!src || src === photo.getAttribute('src')) return;
      photo.src = src;
      photo.alt = alt || '';
    })
    .catch((error) => {
      console.warn('Не удалось загрузить фото специалиста:', error);
    });
})();
