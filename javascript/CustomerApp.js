window.onload = function() {
    window.util = new Util();
    window.util.patchFnBind();
    window.util.transitioner = new Transitioner();
    window.util.eventstr = ('ontouchstart' in document.documentElement) ? 'touchstart' : 'click';
    var customerApp = new CustomerApp();
}

var CustomerApp = function() {
    this.pages = [];
    this.setup();
}

CustomerApp.prototype.setup = function() {
    this.stripePKey = "pk_test_3jjgaV1kKUgzIgV9UJHEAR1b";

    Stripe.setPublishableKey(this.stripePKey);

    this.addPage(HomePage, "HomePageBtn");
    this.addPage(AboutPage, "AboutPageBtn");
    this.addPage(ProductsPage, "ProductsPageBtn");
    this.addPage(AccountPage, "AccountPageBtn");
    this.addPage(CheckoutPage, "CheckoutPageBtn");
    
    this.currentPage = this.pages[0];    //set current view to Home Page
    
}

CustomerApp.prototype.addPage = function(Constructor, buttonSelector) {
    var page = new Constructor();
    page.index = this.pages.length;     //0 through 4
    page.appDOM = this;
    this.pages.push(page);
    
    var btn = $(document.getElementById(buttonSelector));
    btn.on(window.util.eventstr, function(e) {
        $('.iconBlock').removeClass("active");
        $(e.target).closest('.iconBlock').addClass("active");
        this.switchTo(page);
        
    }.bind(this));
}

CustomerApp.prototype.signInBeforeCheckout = function() {
    var accountPage = this.pages[3];
    accountPage.returnToCheckout = true;
    $('.iconBlock').removeClass("active");
    $("#AccountPageBtn").closest('.iconBlock').addClass("active");
    this.switchTo(accountPage);
}

CustomerApp.prototype.returnToCheckoutAfterSignin = function() {
    var checkoutPage = this.pages[4];
    $('.iconBlock').removeClass("active");
    $("#CheckoutPageBtn").closest('.iconBlock').addClass("active");
    checkoutPage.reload();
    this.switchTo(checkoutPage);
}

/*Used by CheckoutPage and AccountPage for navigation switching between tabs*/
function switchTab(oldTabObj, newTabObj) {
    oldTabObj.removeClass("activeTab");
    newTabObj.addClass("activeTab");
    var pageID = newTabObj.attr('name');
    $("#" + this.navStrArr[this.currentTabInd]).removeClass("activePage");
    $("#" + pageID).addClass("activePage");
    this.currentTabInd = this.navStrArr.indexOf(newTabObj.attr('name'));
}


CustomerApp.prototype.switchTo = function(newView){
    var oldInd = this.currentPage.index;
    var newInd = newView.index;
    
    if(oldInd === newInd) return;
    
    this.currentPage.div.addClass("hidden");
    newView.div.removeClass("hidden");
    
    //Handle transitions between pages
    if(oldInd < newInd) {
        window.util.transitioner.slideFromRight(this.currentPage.div, newView.div);
        for(oldInd += 1; oldInd < newInd; oldInd++) {
            //update left vs. right pages
            this.pages[oldInd].div.removeClass("right").addClass("left");
        }

        //update checkout page (recheck for cookies)
        if(newInd === 4)
            this.pages[newInd].reload();

    }
    else {
        window.util.transitioner.slideFromLeft(newView.div, this.currentPage.div)
        for(oldInd -= 1; oldInd > newInd; oldInd--) {
            //update left vs. right pages
            this.pages[oldInd].div.removeClass("left").addClass("right");
        }
    }
    this.currentPage = newView;
}

CustomerApp.prototype.switchBack = function(){
    if (this.currentView === undefined){
        navigator.app.exitApp();
        return;
    }
    window.util.transitioner.fadeOut(this.backButton);
    window.util.transitioner.slideFromLeft(this.list, this.currentView.div, function(){
        this.currentView.stop();
        this.currentView = undefined;
    }.bind(this));
}