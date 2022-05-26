class Textures {
  constructor(options = {}) {
    const defaults = {};
    this.options = _.extend({}, defaults, options);
  }

  init() {
    const $el = $('#app');
    const app = new PIXI.Application({ antialias: true });
    const margin = 50;
    const unitWidth = 100;
    const unitHeight = 200;

    $el.append(app.view);
    app.loader.add([
      { name: 'letters', url: 'img/17.jpg' },
      { name: 'window', url: 'img/198.jpg' },
    ]);

    app.loader.load((loader, resources) => {

      const x1 = margin;
      const y1 = margin;
      const cx1 = x1 + unitWidth * 0.5;
      const cy1 = y1 + unitHeight * 0.5;
      const shape1 = new PIXI.Container();
      const sprite1 = PIXI.TilingSprite.from(resources.letters.texture, { width: 100, height: 200 });
      const mask1 = new PIXI.Graphics();
      // sprite1.position.set(x1, y1);
      mask1.beginFill(0xffffff);
      mask1.drawEllipse(unitWidth * 0.5, unitHeight * 0.5, unitWidth * 0.5, unitHeight * 0.5);
      mask1.endFill();
      shape1.addChild(sprite1, mask1);
      shape1.mask = mask1;
      shape1.pivot.set(unitWidth * 0.5, unitHeight * 0.5);
      shape1.position.set(cx1, cy1);
      app.stage.addChild(shape1);

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
      app.stage.addChild(shape2);
    });


  }
}

(function initApp() {
  const app = new Textures({});
  app.init();
}());
