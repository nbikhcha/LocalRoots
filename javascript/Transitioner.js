var Transitioner = function(){
    
}

Transitioner.prototype.slideFromLeft = function(oldLeft, oldCenter, cb){
        oldLeft.removeClass('transition');
        oldLeft.addClass('left');
        setTimeout(function(){
            oldCenter.addClass('transition');
            oldCenter.removeClass('center');
            oldCenter.addClass('right');

            oldLeft.addClass('transition');
            oldLeft.removeClass('left');
            oldLeft.addClass('center');
            oldLeft.one('webkitTransitionEnd', function(){
                if (cb !== undefined)
                    cb();
            });
        }, 0);
}

Transitioner.prototype.slideFromRight = function(oldCenter, oldRight, cb){
        oldRight.removeClass('transition');
        oldRight.addClass('right');
        setTimeout(function(){
            oldCenter.addClass('transition');
            oldCenter.removeClass('center');
            oldCenter.addClass('left');

            oldRight.addClass('transition');
            oldRight.removeClass('right');
            oldRight.addClass('center');
            oldRight.one('webkitTransitionEnd', function(){
                if (cb !== undefined)
                    cb();
            });
        }, 0);
}

Transitioner.prototype.fadeOut = function(elem, cb){
    elem.addClass('transition');
    elem.addClass('faded');
    elem.one('webkitTransitionEnd', function(){
        elem.removeClass('transition');
        elem.hide();
        if (cb !== undefined)
            cb();
    });
}

Transitioner.prototype.fadeIn = function(elem, cb){
    elem.show();
    elem.addClass('faded');
    setTimeout(function(){
        elem.addClass('transition');
        elem.removeClass('faded');
        elem.one('webkitTransitionEnd', function(){
            elem.removeClass('transition');
            if (cb !== undefined)
                cb();
        });
    }, 0);
}
