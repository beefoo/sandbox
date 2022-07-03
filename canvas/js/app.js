function loadCanvas(id, w, h) {
  let $canvas = $(id);
  let isNew = false;

  if (!$canvas.length) {
    $canvas = $('<canvas class="visually-hidden"></canvas>');
    isNew = true;
  }
  
  const canvas = $canvas[0];
  if (isNew) {
    canvas.id = id;
    canvas.width = w;
    canvas.height = h;
    $('body').append(canvas);

  } else if (w !== undefined && h !== undefined) {
    canvas.width = w;
    canvas.height = h;

  } else if (w === 'auto') {
    const cw = Math.round($canvas.width());
    const ch = Math.round($canvas.height());
    canvas.width = cw;
    canvas.height = ch;
  }

  return canvas;
}

function loadImage(url) {
  return new Promise((resolve, reject) => {
    const image = new Image;
    image.onload = () => resolve(image);
    image.onerror = reject;
    image.crossOrigin = "anonymous";
    image.src = url;
  });
}

class App {
  constructor(options = {}) {
    const defaults = {};
    this.options = _.extend({}, defaults, options);
  }

  init() {
    const mainCanvas = loadCanvas('#app', 'auto');
    const spriteCanvas = loadCanvas('#sprite', 256, 256);

    this.mainCtx = mainCanvas.getContext('2d');
    this.spriteCtx = spriteCanvas.getContext('2d');

    this.mainCtx.shadowColor = 'rgba(0, 0, 0, .667)';
    this.mainCtx.shadowBlur = 8;
    this.mainCtx.shadowOffsetX = 1;
    this.mainCtx.shadowOffsetY = 1;

    const imageLoaded = loadImage('img/17.jpg');
    imageLoaded
      .then((image) => {
        this.textureImage = image;
        this.loadListeners();
      })
      .catch(() => console.log('Failed to load image'))
  }

  loadListeners() {
    $('#app').on('click', (e) => {
      this.addSprite(e);
    });
  }

  addSprite(e) {
    const userX = e.clientX;
    const userY = e.clientY;

    const { mainCtx, spriteCtx, textureImage } = this;
    const canvasW = mainCtx.canvas.width;
    const canvasH = mainCtx.canvas.height;
    const spriteW = spriteCtx.canvas.width;
    const spriteH = spriteCtx.canvas.height;
    const spriteHW = spriteW / 2;
    const spriteHH = spriteH / 2;
    const textureW = textureImage.width;
    const textureH = textureImage.height;
    const sampleW = spriteW / 2;
    const sampleH = spriteH / 2;

    if (sampleW > textureW || sampleH > textureH) {
      console.log('Texture image not large enough');
      return;
    }

    const sx = _.random(textureW - sampleW);
    const sy = _.random(textureH - sampleH);
    const dx = Math.round((spriteW - sampleW) / 2);
    const dy = Math.round((spriteH - sampleH) / 2);
    const degrees = Math.random() * 360;
    spriteCtx.restore();
    spriteCtx.clearRect(0, 0, spriteW, spriteH);
    spriteCtx.save();

    spriteCtx.translate(spriteHW, spriteHH);
    spriteCtx.rotate(degrees * Math.PI / 180);
    spriteCtx.translate(-spriteHW, -spriteHH);

    const mx1 = spriteW / 2;
    const my1 = dy;
    const mx2 = dx + sampleW;
    const my2 = dy + sampleH;
    const mx3 = dx;
    const my3 = dy + sampleH;
    const mx4 = dx;
    const my4 = dy;
    const mx5 = mx4 + sampleW / 4;
    const my5 = dy;
    const mx6 = dx;
    const my6 = dy + sampleH / 4;
    const mask = new Path2D();
    mask.moveTo(mx1, my1);
    mask.lineTo(mx2, my2);
    mask.lineTo(mx3, my3);
    mask.lineTo(mx1, my1);
    mask.moveTo(mx4, my4);
    mask.lineTo(mx5, my5);
    mask.lineTo(mx6, my6);
    mask.lineTo(mx4, my4);
    spriteCtx.clip(mask);
    spriteCtx.drawImage(textureImage, sx, sy, sampleW, sampleH, dx, dy, sampleW, sampleH);
    
    const x = userX - spriteW / 2;
    const y = userY - spriteH / 2;
    mainCtx.drawImage(spriteCtx.canvas, x, y, spriteW, spriteH);
  }
}

(function initApp() {
  const app = new App({});
  app.init();
}());
