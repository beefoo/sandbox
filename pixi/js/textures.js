class Textures {
  constructor(options = {}) {
    const defaults = {};
    this.options = _.extend({}, defaults, options);
  }

  init() {
    const $el = $('#app');
    const w = $el.width();
    const h = $el.height();
    const app = new PIXI.Application({
      // antialias: true,
      backgroundAlpha: 0,
      width: w,
      height: h,
      resizeTo: $el[0]
    });
    const margin = 50;
    const unitWidth = 100;
    const unitHeight = 200;
    const refCanvas = $('#reference')[0];
    refCanvas.width = w;
    refCanvas.height = h;
    const refCtx = refCanvas.getContext('2d');
    const refImageData = refCtx.getImageData(0, 0, w, h);
    const refPixels = refImageData.data;

    $el.on('click', (e) => {
      $el.toggleClass('hidden');
    });

    $el.append(app.view);
    app.loader.add([
      { name: 'letters', url: 'img/17.jpg' },
      { name: 'window', url: 'img/198.jpg' },
    ]);

    const parent = new PIXI.Container();

    app.loader.load((loader, resources) => {

      const x1 = margin;
      const y1 = margin;
      const cx1 = x1 + unitWidth * 0.5;
      const cy1 = y1 + unitHeight * 0.5;
      const shape1 = new PIXI.Container();
      const sprite1 = PIXI.TilingSprite.from(resources.letters.texture, { width: 100, height: 200 });
      const mask1 = new PIXI.Graphics();
      mask1.beginFill(0xffffff);
      mask1.drawEllipse(unitWidth * 0.5, unitHeight * 0.5, unitWidth * 0.5, unitHeight * 0.5);
      mask1.endFill();
      shape1.addChild(sprite1, mask1);
      shape1.mask = mask1;
      shape1.pivot.set(unitWidth * 0.5, unitHeight * 0.5);
      // shape1.rotation = Math.PI / 4;
      shape1.position.set(cx1, cy1);
      parent.addChild(shape1);

      const x2 = x1 + unitWidth - margin * 0.5;
      const y2 = margin;
      const cx2 = x2 + unitWidth * 0.5;
      const cy2 = y2 + unitHeight * 0.5;
      const shape2 = new PIXI.Container();
      const sprite2 = PIXI.TilingSprite.from(resources.letters.texture, { width: 100, height: 200 });
      const mask2 = new PIXI.Graphics();
      sprite2.tileTransform.position.set(-512 + 50, -512 + 100);
      mask2.beginFill(0xffffff);
      mask2.drawEllipse(unitWidth * 0.5, unitHeight * 0.5, unitWidth * 0.5, unitHeight * 0.5);
      mask2.endFill();
      shape2.addChild(sprite2, mask2);
      shape2.mask = mask2;
      shape2.pivot.set(unitWidth * 0.5, unitHeight * 0.5);
      shape2.rotation = Math.PI / 4;
      shape2.position.set(cx2, cy2);
      parent.addChild(shape2);

      app.stage.addChild(parent);
      const image = app.renderer.plugins.extract.image(parent);
      document.body.appendChild(image);

      const px = x1;
      const py = y1;
      const pWidth = Math.round(parent.width);
      const pHeight = Math.round(parent.height);
      const pixels = app.renderer.plugins.extract.pixels(parent);
      const deltaY = -Math.round((parent.height - unitHeight) * 0.5);
      _.times(pHeight, (row) => {
        _.times(pWidth, (col) => {
          const index = row * pWidth * 4 + col * 4;
          const r = pixels[index];
          const g = pixels[index + 1];
          const b = pixels[index + 2];
          const a = pixels[index + 3];
          if (a > 0) {
            const targetIndex = (py + row + deltaY) * w * 4 + (px + col) * 4;
            refPixels[targetIndex] = r;
            refPixels[targetIndex + 1] = g;
            refPixels[targetIndex + 2] = b;
            refPixels[targetIndex + 3] = a;
          }
        });
      });
      console.log(`${(pWidth * pHeight * 4)} = ${pixels.length}`);
      $('.guide2').css({
        'width': pWidth + 'px',
        'height': pHeight + 'px'
      })
      refCtx.putImageData( refImageData, 0, 0 );
    });


  }
}

(function initApp() {
  const app = new Textures({});
  app.init();
}());
