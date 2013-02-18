//Javascript for Products Page

var ProductsPage = function(){
    this.div = $('#productsPage');
    this.kmThreshold = 50;
    this.load();
    this.sortFilter = "recommended";
}

ProductsPage.prototype.load = function() {
    var btnSearchObj = $(document.getElementById("btnRight"));
    btnSearchObj.on(window.util.eventstr, search.bind(this));
    $("#searchterm").keyup(function(e) {
        if (e.which === 13) {
            search.bind(this)(e);
        }
    }.bind(this));

    $(".sortOption").on(window.util.eventstr, function(e) {
        $(".sortOption.selected").removeClass("selected");
        $(e.target).closest(".sortOption").addClass("selected");
        $(e.target).closest(".sortOption").children("input:radio[name=sort]").attr('checked', true);
    });
    
    var btnLeftObj = $(document.getElementById("btnLeft"));
    btnLeftObj.on(window.util.eventstr, function() {
    
        var filterContObj = $("#filterContent");
        var productContObj = $("#productContent");
        //If on results page, Go to filter page
        if(productContObj.css('display') === 'block') {            
            filterContObj.css('display', 'block');
            productContObj.css('display', 'none');
            btnLeftObj.html('Back');
            document.getElementById("btnRight").innerHTML = "Apply";
        }
        //If on filter page, Go back to results page, no effect
        else if(filterContObj.css('display') === 'block') { 
            productContObj.css('display', 'block');           
            filterContObj.css('display', 'none');
            btnLeftObj.html('Filter');
            document.getElementById("btnRight").innerHTML = "Search";
            
            //TODO: restore filter page to last saved selections
        }
    
    });
    /* .itemBlock.itemDetails on 'click':
     * Go to productpage
     * .itemBlock.rating on 'click':
     * Go to productpage#reviews
     */
}

function search(e){
    $("#productsPage #productContent").html("");
    var term = $("#searchterm").val();
    $.ajax({
        url: '/getProducts',
        data: {term: term, th: this.kmThreshold,
            latNow:this.appDOM.lat, lngNow:this.appDOM.lng},
        type: 'POST',
        success: gotProducts
    });
}

function gotProducts(data){
    if(data.results === undefined){
        console.log("no results");
        return;
    }
    if(data.results.length === 0){
        console.log("empty");
    }
    var container,  h1, p, farmDist,
        rating, itemAmount, input, select, options, j, itemId;
    var priceVal, priceBlock, addBtn, finalizeBlock;
    var itemBlock = [];
    var itemDetails = [];
    var itemImg = [];
    
    console.log(data);
    for(var i = 0; i < data.results.length; i++){
        container = $("#productContent");
        itemBlock.push($(document.createElement("div")).addClass("itemBlock"));
        itemImg.push($(document.createElement("img")).addClass("itemImg"));
        itemDetails.push($(document.createElement("div")).addClass("itemDetails"));
        h1 = $(document.createElement("h1"));
        p = $(document.createElement("p")).html(data.farmData[i].name);
        farmDist = $(document.createElement("span")).addClass("farmDist").html(data.farmDistance[i] + " km");
        rating = $(document.createElement("div")).addClass("rating");
        itemAmount = $(document.createElement("div")).addClass("itemAmount");
        input = $(document.createElement("input")).attr("type", "number").attr("value", "0").attr("min", "0").addClass("amountNumber"); 
        select = $(document.createElement("select")).addClass("amountUnit");
        itemId = $(document.createElement("div")).addClass("itemId");
        options = [];
        options[0] = $(document.createElement("option")).attr("value", "none").html("--select--");
        select.append(options[0]);
        for(var j = 0; j < data.results[i].units.length; j++){
            options[j] = $(document.createElement("option")).attr("value",
                        data.results[i].units[j]).html(data.results[i].units[j]);
            select.append(options[j]);
        }
        priceVal = $(document.createElement("span")).addClass("itemPrice");
        priceBlock = $(document.createElement("div")).addClass("itemPriceLabel").html("Price: ").append(priceVal);
        addBtn = $(document.createElement("div")).addClass("addBtn").html("Add");
        finalizeBlock = $(document.createElement("div")).addClass("itemFinalize");

        p.append(farmDist);
        h1.html(data.results[i].name);
        itemDetails[i].append(h1).append(p);
        itemAmount.append(input).append(select);

        itemId.attr("id", data.results[i]._id);
        finalizeBlock.append(priceBlock).append(addBtn);
        itemBlock[i].append(itemDetails[i]).append(rating).append(itemAmount).append(finalizeBlock).append(itemId);

        container.append(itemBlock[i]);
        itemImg[i][0].src = data.results[i].image;
        itemImg[i][0].onload = function(){
            itemBlock[this][0].insertBefore(itemImg[this][0], itemDetails[this][0]);
        }.bind(i);
        /*Make price appear on change of input if applicable*/
        input.change(updatePrice.bind({amt: input, unit: select, i:i}, data));
        select.change(updatePrice.bind({amt: input, unit: select, i:i}, data));
    }
    /*Add to cart on click*/
    $(".addBtn").on(window.util.eventstr, addToCart);
}

function updatePrice(data) {
    if(this.amt.val() <= 0 || this.unit.val() === "none")
        return;
    
    var priceObj = this.amt.closest(".itemAmount").next(".itemFinalize").find(".itemPrice");

    var unitInd = data.results[this.i].units.indexOf(this.unit.val());
    var pricePerUnit = data.results[this.i].prices[unitInd];
    var totalPrice = (this.amt.val() * pricePerUnit).toFixed(2);
    priceObj.text("$" + totalPrice);
}

function addToCart(event){
    var targ = $(event.target).closest(".itemBlock");
    var amount = parseInt(targ.find(".amountNumber").val());
    var options = targ.find(".amountUnit").children();
    var id = targ.find(".itemId").attr("id");
    
    var unit;
    for(var i = 0; i < options.length; i++){
        if(options[i].selected === true){
            unit = options[i].value;
            break;
        }
    }
    if(!window.util.hasCookies("customer")) {
        alert("Please login before adding things to cart");
        return;
    }

    if(amount === 0 || unit === "none"){
        alert("error, make sure you select a unit and an amount");
        return;
    }
    $.ajax({
        url: '/addToCart',
        type: 'POST',
        data: {product: id, amount: amount, unit: unit},
        success:function(){
            alert("Successfully added " +amount+ " " +unit +" of "+targ.find(".itemDetails h1").html()+ " to your cart");
            targ.find(".amountNumber").val("0");
        },
        error: function(){console.log("need to login");}
    });
     
}








