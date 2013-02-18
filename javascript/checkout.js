//Javascript for Checkout Page


var CheckoutPage = function(){;
    this.div = $('#checkoutPage');
    this.currentTabInd = 0;
    this.navStrArr = ["cart", "delivery", "payment", "confirm"];
    this.itemCount = 0;
    this.itemIDs = [];
    this.amount = 0;
    this.isRegistered = false;
    this.load();
}

CheckoutPage.prototype.reload = function() {
    addCart();
    if(window.util.hasCookies("customer")) {
        $("#cartContinueBtn").text("Checkout");
        this.isRegistered = true;
    }
    else {
        $("#cartContinueBtn").text("Register Before Checkout");
        this.isRegistered = false;
    }
    console.log("reloading checkout page. Signed In: " + this.isRegistered);

    //Reload cart and checkout info. Called if signout/signin etc.

    //reset buttons and input values
    $('#checkoutPage .invalidNote').addClass('hidden');
    $("#confirmContinueBtn").html('Confirm');
    $(".disabled").removeClass('disabled');
    $("#checkoutPage #payment input").val("");   //clear all the filled in values
}


CheckoutPage.prototype.paymentComplete = function () {
    //empty cart
    //this.itemCount = 0;
    switchTab.bind(this)($("#checkoutPage .activeTab"), $("#checkoutPage #cartLink"));
    this.reload();
}

CheckoutPage.prototype.updateAmountInCents = function() {
    this.amount = 2050;
    $(".priceDollars").html(Math.floor(this.amount/100));
    $(".priceCents").html(this.amount%100);
}

CheckoutPage.prototype.load = function() {
    addCart()
    var thisPage = this;
    if(window.util.hasCookies("customer")) {
        $("#cartContinueBtn").text("Checkout");
        this.isRegistered = true;
    }
    else {
        $("#cartContinueBtn").text("Register Before Checkout");
        this.isRegistered = false;
    }


    $('.invalidNote').addClass('hidden');

    $("#checkoutPage .leftNav a#cartLink").on(window.util.eventstr, function(e) {
        switchTab.bind(thisPage)($("#checkoutPage .activeTab"), $(e.target));
    });
    
    $(".continueBtn").on(window.util.eventstr, function(e) {
        if($(e.target).attr('id') === "paymentContinueBtn") {

            $("#paymentContinueBtn").addClass('disabled');
            $("#paymentBackBtn").addClass('disabled');
            Stripe.createToken({
                number: $('#card-number').val(),
                cvc: $('#card-cvc').val(),
                exp_month: $('#card-expiry-month').val(),
                exp_year: $('#card-expiry-year').val()
            }, stripeResponseHandler.bind(this));

            //don't switch tab if error occurred
            return;
        }
        else if ($(e.target).attr("id")==="deliveryContinueBtn"){
            if(deliveryValidate()){
                var nextTabName = this.navStrArr[this.currentTabInd + 1];
                switchTab.bind(this)($("#checkoutPage .activeTab"),
                    $("#" + nextTabName + "Link"));
            }
            return;
        }

        else if($(e.target).attr('id') === "confirmContinueBtn") {
            /*Change button to text of confirmation of payment*/
            postToChargeCard.bind(this)();
            confirmOrder();
            return;
        }

        else if($(e.target).attr('id') === "cartContinueBtn") {
            //force signin before checking out
            if(this.isRegistered === false) {
                this.appDOM.signInBeforeCheckout();
                return;
            }


            if($("#itemCount").html() == "0") {
                alert("No items added to cart");
                return;
            }
            /*TODO: Check user authentication/login/register...*/
        }
        
        var nextTabName = thisPage.navStrArr[thisPage.currentTabInd + 1];
        switchTab.bind(thisPage)($("#checkoutPage .activeTab"),
                                $("#" + nextTabName + "Link"));
    }.bind(this));


    $(".goBackBtn").on(window.util.eventstr, function(e) {

        $(".disabled").removeClass('disabled');

        var prevTabName = thisPage.navStrArr[thisPage.currentTabInd - 1];
        switchTab.bind(thisPage)($("#checkoutPage .activeTab"),
                                $("#" + prevTabName + "Link"));
    });
}

function stripeResponseHandler (status, response) {
    var errorDiv = $('#payment #invalidPaymentInfo')
    if (response.error) {
        errorDiv.text(response.error.message);
        errorDiv.removeClass("hidden");    
        errorDiv.slideDown(300);
        console.log("stripeResponseHandler: response.error");
            $("#paymentContinueBtn").removeClass('disabled');
            $("#paymentBackeBtn").removeClass('disabled');
        return;
    }

    var form = $("#paymentForm");
    $("input[name='stripeToken']").remove();
    $("input[name='stripePrice']").remove();
    form.append("<input type='hidden' name='stripeToken' value='" + response.id + "'/>");
    form.append("<input type='hidden' name='stripePrice' value='" + Math.round(parseFloat($("#cartPrice").html())*100) + "'/>");
    form.append("<input type='hidden' name='stripeUser' value='TODO: checkout.js:119'/>");
    console.log("About to post token to server");

    //change tab to Confirm page
    errorDiv.addClass("hidden");
    var nextTabName = this.navStrArr[this.currentTabInd + 1];
    switchTab.bind(this)($("#checkoutPage .activeTab"),
        $("#" + nextTabName + "Link"));

}

function postToChargeCard() {
    var errorDiv = $('#payment #invalidPaymentInfo')
    //charge credit card for money
    var thisPage = this;
    var form = $("#paymentForm");
    $.post(
        form.attr('action'),
        form.serialize(),
        function (status) {
            if (status != 'ok') {
                errorDiv.text(status);
                errorDiv.slideDown(300);
                alert("Could not process payment information.")
                $("#paymentContinueBtn").removeClass('disabled');
                $("#paymentBackBtn").removeClass('disabled');
            }
            else {
                $("#confirmContinueBtn").html('Checkout Complete');
                $("#confirmContinueBtn").addClass('disabled');
                thisPage.paymentComplete();
            }
        }
    );


}

function deliveryValidate(){
    var name = $("#checkoutContent #name").val();
    var addr1 = $("#checkoutContent #address1").val();
    var addr2 = $("#checkoutContent #address2").val();
    var email = $("#checkoutContent #email").val();
    var phone = $("#checkoutContent #number").val();
    var comments = $("#checkoutContent #comments").val();

    if(name === "" || addr1 === "" || email === "" || phone === ""){
        alert("You have not yet filled out the necessary information");
        return false;
    }

    if(email.indexOf(".") < 0 || email.indexOf("@") < 0 || email.indexOf(".") < email.indexOf("@")){
        alert("Enter a valid email address");
        return false;
    }

    return true;
}


function addCart(){
    console.log("adding to caert");
    $.ajax({
        url: '/getCart',
        type: 'POST',
        success: addCartSuccess,
        error: function(){console.log("error adding cart");}
    });
}

function removeFromCart(e){
    var id = $(e.target).closest(".itemBlock").find(".itemId").attr("id"); 
    console.log("remove from cart");
    $.ajax({
        url: '/removeFromCart',
        type: 'POST',
        data: {id:id},
        success: addCart,
        error: function(){console.log("error removing from cart");}
    });
}

function addCartSuccess(data){
    console.log("adding cart succcesss");
    $("#productList").html("");
    if(data.products === undefined){
        console.log("empty cart");
        $("#itemCount").html("0");
        $("#cartPrice").html("0.00");
        return;
    }
    if(data.products.length === 0){
        console.log("empty");
        $("#itemCount").html(data.products.length);
        $("#cartPrice").html("0.00");
    }
    var container, itemBlock, itemDetails, h1, h2, itemAmount, x, itemId, itemAmount, itemUnit;
    $("#itemCount").html(data.products.length);
    console.log(data);
    var totalCost = 0;
    for(var i = 0; i < data.products.length; i++){
        container = $("#productList");
        itemBlock = $(document.createElement("div")).addClass("itemBlock");
        itemDetails = $(document.createElement("div")).addClass("itemDetails");
        h1 = $(document.createElement("h1"));
        h2 = $(document.createElement("h2"));
        farmDist = $(document.createElement("span"));
        x = $(document.createElement("span")).addClass("X");
        itemId = $(document.createElement("div")).addClass("itemId");
        itemAmount = $(document.createElement("div")).addClass("itemAmount");
        itemUnit = $(document.createElement("div")).addClass("itemUnit");
        h1.html(data.products[i].name);
        h2.html(data.amounts[i]+" "+data.units[i]+", at $"+data.products[i].prices[data.products[i].units.indexOf(data.units[i])].toFixed(2)+" each");
        x.html("X"); 
        x.on(window.util.eventstr, removeFromCart);
        itemId.attr("id", data.products[i]._id);
        itemAmount.attr("id", data.amounts[i]);
        itemUnit.attr("id", data.units[i]);
        itemDetails.append(h1).append(x).append(h2);
        itemBlock.append(itemDetails).append(itemAmount).append(itemId).append(itemUnit);
        container.append(itemBlock);

        totalCost += data.products[i].prices[data.products[i].units.indexOf(data.units[i])] * data.amounts[i];
    }
    $("#cartPrice").html(totalCost.toFixed(2));
    $("#confirmPrice").html($("#cartPrice").html());

    
}

function confirmOrder(){
    var name = $("#checkoutContent #deliveryForm #name").val();
    var addr1 = $("#checkoutContent #deliveryForm #address1").val();
    var addr2 = $("#checkoutContent #deliveryForm #address2").val();
    var email = $("#checkoutContent #deliveryForm #email").val();
    var phone = $("#checkoutContent #deliveryForm #number").val();
    var comments = $("#checkoutContent #deliveryForm #comments").val();
    var products = [];
    var amounts = [];
    var units = [];

    var itemBlocks = $("#checkoutPage .itemBlock");
    for(var i = 0; i < itemBlocks.length; i++){
        products.push($(itemBlocks[i]).find(".itemId").attr("id"));
        units.push($(itemBlocks[i]).find(".itemUnit").attr("id"));
        amounts.push($(itemBlocks[i]).find(".itemAmount").attr("id"));
    }

    $.ajax({
        url: '/confirmOrder',
        type: 'POST',
        data: {products: products, amounts: amounts, units:units, name: name, addr1: addr1, addr2: addr2, email: email, phone: phone, comments: comments},
        success: emptyCart
    });
}

function emptyCart(){
    $("#checkoutContent #name").val("");
    $("#checkoutContent #address1").val("");
    $("#checkoutContent #address2").val("");
    $("#checkoutContent #email").val("");
    $("#checkoutContent #number").val("");
    $("#checkoutContent #comments").val("");
    $.ajax({
        url: '/emptyCart',
        type: 'POST',
        success: addCartSuccess
    });
}
