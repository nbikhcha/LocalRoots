var Util = function(){ }

Util.prototype.isIOS = function(){
    return  !!(navigator.userAgent.match(/iPhone/i) ||
            navigator.userAgent.match(/iPod/i) ||
            navigator.userAgent.match(/iPad/i));
}

Util.prototype.isFirefox = function(){
    return !!(navigator.userAgent.match(/Firefox/i));
}

Util.prototype.isAndroid = function(){
    return !!(navigator.userAgent.match(/Android/));
}

// adds bind to Function's prototype if it doesn't exist (aka iOS <=5)
Util.prototype.patchFnBind = function(){
    if (!Util.prototype.exists(Function.prototype.bind)){
       Function.prototype.bind = function (bind) {
            var self = this;
            return function () {
                var args = Array.prototype.slice.call(arguments);
                return self.apply(bind || null, args);
            };
        };
    }
}

Util.prototype.exists = function(obj){
    return obj !== undefined && obj !== null;
}


// Works because setTimeout always loads the callback on the event queue when the timer runs out
//
// Generally bad, necessary in some cases
// For example: Applying CSS for transitions
Util.prototype.putOnEventQueue = function(fn){
    window.setTimeout(fn, 0);
}

Util.prototype.hasCookies = function(){
    console.log("checking session cookie\n");
    var cookieArray = document.cookie.split(';');
    var cookies = {};
    for (var i = 0; i < cookieArray.length; i++){
        var parts = cookieArray[i].split('=');
        var key = parts[0].trim();
        var value = parts[1];
        cookies[key] = value;
    }
    //user will be an id if they're logged in
    console.log(cookies['user']);
    return cookies['user'] !== 'none';
}
