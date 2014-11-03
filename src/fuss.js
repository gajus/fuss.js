(function ($) {
    var fuss;

    window.gajus = window.gajus || {};
    fuss = window.gajus.fuss = {};

    /**
     * Scrolls to a specific location of your canvas page.
     * 
     * @param {Number} x
     * @param {Number} y
     */
    fuss.scrollTo = function (x, y) {
        var stepsLength = 2,
            stepsUpdate = 0,
            steps = {};

        x = x || 0;
        y = y || 0;

        if (!fuss.isInCanvas()) {
            $('body')
                .animate({
                    scrollLeft: x,
                    scrollTop: y
                }, {
                    duration: 500
                });
            
        } else {
            // @todo Document magic constant.
            y += 25;
            
            FB.Canvas.getPageInfo(function(pageInfo){
                $({
                    x: pageInfo.scrollLeft,
                    y: pageInfo.scrollTop
                }).animate(
                    {
                        x: x,
                        y: y
                    },
                    {
                        duration: 500,
                        step: function (now, fx) {
                            steps[fx.prop] = now;

                            if (++stepsUpdate == stepsLength) {
                                stepsUpdate = 0;

                                FB.Canvas.scrollTo(steps.x, steps.y);
                            }
                        }
                    }
                );
            });
        }
    };

    /**
     * Returns true if script is loaded inside Facebook canvas.
     *
     * @return {Boolean}
     */
    fuss.isInCanvas = function () {
        return top !== self;
    };
} (jQuery));