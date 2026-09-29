// Контур формы записи. Если просто растянуть SVG, скосы и скругления
// поплывут вместе с шириной. Поэтому путь строится заново под фактический
// размер блока: каждая точка привязана к своему краю, и геометрия углов
// остаётся как в макете на любой ширине.

(function () {
  const consult = document.querySelector('.consult');
  if (!consult) return;

  const columnLayout = window.matchMedia('(max-width: 1023px)');

  // Десктоп: контур 1199×323 из макета. Точки, привязанные к правому
  // краю, записаны как w - n, к нижнему — как h - n.
  // В макете фигура отражена по горизонтали, это делается в конце.
  function desktopPoints(w, h) {
    return [
      ['M', 53.6979, 14.6296],
      ['L', 14.6597, 53.6346],
      ['C', 5.27368, 63.0127, 0, 75.7368, 0, 89.005],
      ['L', 0, h - 30],
      ['C', 0, h - 13.4314, 13.4314, h, 30, h],
      ['L', w - 127.38, h],
      ['C', w - 114.12, h, w - 101.41, h - 5.262, w - 92.04, h - 14.63],
      ['L', w - 53, h - 53.635],
      ['C', w - 43.61, h - 63.013, w - 38.34, h - 75.737, w - 38.34, h - 89.005],
      ['L', w - 38.34, 182.378],
      ['C', w - 38.34, 169.117, w - 33.07, 156.4, w - 23.7, 147.023],
      ['L', w - 14.64, 137.972],
      ['C', w - 5.27, 128.595, w, 115.878, w, 102.617],
      ['L', w, 30],
      ['C', w, 13.4315, w - 13.43, 0, w - 30, 0],
      ['L', 89.0382, 0],
      ['C', 75.7848, 0, 63.0735, 5.26202, 53.6979, 14.6296],
    ];
  }

  // Мобильная версия: контур 789×350, повёрнутый на 90° с отражением —
  // в итоге x и y просто меняются местами. Поэтому здесь «ширина» исходника —
  // это высота блока, а «высота» — ширина.
  function columnPoints(w, h) {
    const W = h;
    const H = w;
    return [
      ['M', 59.5548, 8.77779],
      ['L', 8.79583, 59.4935],
      ['C', 3.16421, 65.1203, 0, 72.7548, 0, 80.7158],
      ['L', 0, H - 15],
      ['C', 0, H - 6.7157, 6.71572, H, 15, H],
      ['L', W - 119.099, H],
      ['C', W - 111.147, H, W - 103.52, H - 3.157, W - 97.895, H - 8.778],
      ['L', W - 47.136, H - 59.494],
      ['C', W - 41.504, H - 65.12, W - 38.34, H - 72.755, W - 38.34, H - 80.716],
      ['L', W - 38.34, 174.094],
      ['C', W - 38.34, 166.137, W - 35.179, 158.507, W - 29.553, 152.881],
      ['L', W - 5.858, 129.185],
      ['C', W - 2.107, 125.435, W, 120.347, W, 115.043],
      ['L', W, 15],
      ['C', W, 6.71573, W - 6.716, 0, W - 15, 0],
      ['L', 80.7589, 0],
      ['C', 72.8069, 0, 65.1801, 3.15722, 59.5548, 8.77779],
    ];
  }

  function toPath(points, mapPoint) {
    const parts = points.map(([command, ...coords]) => {
      const mapped = [];
      for (let i = 0; i < coords.length; i += 2) {
        const [x, y] = mapPoint(coords[i], coords[i + 1]);
        mapped.push(round(x), round(y));
      }
      return command + mapped.join(' ');
    });
    return parts.join(' ') + 'Z';
  }

  function round(value) {
    return Math.round(value * 100) / 100;
  }

  // На десктопе фото обрезано той же фигурой, только поднятой на 31 px
  // (голова выходит за верх формы). Путь строится в координатах блока фото.
  const PHOTO_RISE = 31;
  const photo = consult.querySelector('.consult__photo');

  function update() {
    const box = consult.getBoundingClientRect();
    const { width, height } = box;

    if (columnLayout.matches) {
      const path = toPath(columnPoints(width, height), (x, y) => [y, x]);
      consult.style.setProperty('--consult-shape', `path("${path}")`);
      consult.style.removeProperty('--consult-photo-shape');
      return;
    }

    const photoBox = photo.getBoundingClientRect();
    const dx = photoBox.left - box.left;
    const dy = photoBox.top - box.top;

    const shape = toPath(desktopPoints(width, height), (x, y) => [width - x, y]);
    const photoShape = toPath(
      desktopPoints(width, height + PHOTO_RISE),
      (x, y) => [width - x - dx, y - PHOTO_RISE - dy],
    );
    consult.style.setProperty('--consult-shape', `path("${shape}")`);
    consult.style.setProperty('--consult-photo-shape', `path("${photoShape}")`);
  }

  new ResizeObserver(update).observe(consult);
  columnLayout.addEventListener('change', update);
})();
