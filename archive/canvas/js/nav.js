 class App {
    constructor(options = {}) {
        const defaults = {};
        this.options = _.extend({}, defaults, options);
    }

    init() {
        $(document).on('click', (e) => this.shift());
    }

    shift() {
        const $firstItem = $('.item-menu').find('li:first');
        const $clonedItem = $firstItem.clone();
        $clonedItem.addClass('just-added');
        $('.item-menu').append($clonedItem);
        setTimeout(() => {
            $clonedItem.removeClass('just-added');
            $firstItem.remove();
        }, 1)
    }
}

(function initApp() {
    const app = new App({});
    app.init();
}());
  