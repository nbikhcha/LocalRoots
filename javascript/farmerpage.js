window.onload = function(){
    if(hasSessionCookie()) console.log("have cookies");

    var imageLoader = document.getElementById('imageLoader');
    imageLoader.addEventListener('change', handleImage, false);
    var canvas = document.getElementById('imageCanvas');
    var ctx = canvas.getContext('2d');
    var imgsrc;

    var button = $("#submit_login"); 
    button.on('click', logIn);
    var reg = $("#submit_register")
    reg.on('click', register);
    var ap = $("#addprice"); ap.on('click', addprice);
    var submit = $("#submitbutton");
    submit.on('click', submitProducts);
    var farm = $("#addfarmbutton");
    farm.on('click', addFarm);
    var signoutbutton = $("#signout");
    signoutbutton.on("click", signOut);


    function handleImage(e){
        var reader = new FileReader();
        reader.onload = function(event){
            imgsrc = event.target.result;
            if(imgsrc.length > 20480 ){
                alert("Image is too large, must be less than 20KB")
                imgsrc = "";
                return;
            }
            submit.off('click');
            submit.on('click', submitProducts.bind({imgsrc: imgsrc, canvas: canvas, ctx:ctx}));
            var img = new Image();
            img.src = imgsrc;
            img.onload = function(){
                canvas.width = 80;
                canvas.height = 80;
                ctx.drawImage(img, 0, 0, 80, 80);
            }
        }
        reader.readAsDataURL(e.target.files[0]);
    }

   if(!hasSessionCookie()){
        document.getElementById('addproductpage').style.display = 'none';
        document.getElementById('addfarmpage').style.display = 'none';
        document.getElementById('signout').style.display = 'none';
   }else{
        document.getElementById('loginpage').style.display = 'none';
        document.getElementById('signout').style.display = 'block';
        $.ajax({
            url: '/hasFarm',
            type: 'POST',
            success: function(hasFarm){
                console.log("hasfarm?: ", hasFarm);
                if(hasFarm){
                    document.getElementById('addfarmpage').style.display = 'none';
                    document.getElementById('addproductpage').style.display = 'block';
                }else{
                    console.log("false");
                    document.getElementById('addfarmpage').style.display = 'block';
                    document.getElementById('addproductpage').style.display = 'none';
                }
            }
        });
        //TODO: fix this bug
   }
    
    
}
var register = function(){
    var username = $("#username_register").val();
    var password = $("#password_register").val();
    var check = $("#password_check").val();
    if(check != password){
        $("#nomatch").html("your passwords did not match!").css("color", "red");
        return;
    }
    $.ajax({
        url: "/registerFarm",
        type: "POST",
        data: {username: username, password: password, type : "farmer"},
        success: successRegister,
        error: errorRegister
    });
}
var logIn = function(){
    var username = $("#username").val();
    var password = $("#password").val();
    $.ajax({
        url: "/loginFarm",
        type: "POST",
        data: {username: username, password:password, type:"farmer"},
        success: successLogIn,
        error: errorLogIn
    });
    
}
function successRegister(){
    document.getElementById('addfarmpage').style.display = 'block';
    document.getElementById('addproductpage').style.display = 'none';
    document.getElementById('loginpage').style.display = 'none';
    document.getElementById('signout').style.display = 'block';
}
function successAddFarm(){
    document.getElementById('addfarmpage').style.display = 'none';
    document.getElementById('addproductpage').style.display = 'block';
    document.getElementById('loginpage').style.display = 'none';
    document.getElementById('signout').style.display = 'block';
}
function errorRegister(err){
    document.write("err: " + err);
}
function successLogIn(data){
    if(!hasSessionCookie()) return errorLogIn();
    if(data){
        document.getElementById('addproductpage').style.display = 'block';
        document.getElementById('addfarmpage').style.display = 'none';
        $("#addpproductpage").children("h1").html("Add Product to "+data.name);
    }else{
        document.getElementById('addproductpage').style.display = 'none';
        document.getElementById('addfarmpage').style.display = 'block';
    }
    document.getElementById('loginpage').style.display = 'none';
    document.getElementById('signout').style.display = 'block';
}

function errorLogIn(){
    $("#incorrect").html("incorrect login!").css("color", "red");
}
function addFarm(){

    var name = $("#farm_name").val();
    var city = $("#city").val();
    var state = $("#state").val();
    var cert = $("#cert").val().split(" ");

    var geocoder = new google.maps.Geocoder();
    var lat = '';
    var lng = '';
    var address = city + ", " + state;
    geocoder.geocode( { 'address': address}, function(results, status) {
      if (status == google.maps.GeocoderStatus.OK) {
        lat = results[0].geometry.location.lat();
        lng = results[0].geometry.location.lng();
        console.log("Setting lat " + lat + " and lng " + lng);


        //send request to server only if valid city/state provided
        $.ajax({
            url: '/addFarm',
            type: 'POST',
            data: {name:name, city:city, state:state, lat:lat, lng:lng, cert:cert},
            success: successAddFarm
        });
        }
        else {
            console.log("Geocode was not successful for the following reason: " + status);
            $("#city").val("Error. Try Again.");
            $("#state").val("Error. Try Again.");        }
    });

}

function addprice(){
    var num = $("#pricesdiv").children("div").length;
    var lastDiv = $("#d"+num);
    var lastPrice = parseFloat(lastDiv.children("#p"+num).val());
    if(isNaN(lastPrice)){
        $("#v"+num).html("enter a valid price!").css("color", "red");
        return;
    }
    else{
        lastPrice = Math.round(lastPrice*100)/100;
        console.log(lastPrice);
        $("#p"+num).val(""+lastPrice);
        $("#v"+num).html(""); 
    }
    num++;
    var nextDiv = $(document.createElement("div")).attr("id", "d"+num);
    var lp = $(document.createElement("label")).attr("for", "p"+num).html("Price:  ");
    var ip = $(document.createElement("input")).attr("type", "text").attr("name", "p"+num).attr("id", "p"+num);
    var lu = $(document.createElement("label")).attr("for", "u"+num).html("Unit:  ");
    var iu = $(document.createElement("input")).attr("type", "text").attr("name", "u"+num).attr("id", "u"+num);
    var v = $(document.createElement("div")).attr("id", "v"+num);
    nextDiv.append(lp).append(ip).append(lu).append(iu).append(v);
    $("#pricesdiv").append(nextDiv);
}

function submitProducts(){
    console.log("submit products");
    var num = $("#pricesdiv").children("div").length;
    var lastDiv = $("#d"+num);
    var lastPrice = parseFloat(lastDiv.children("#p"+num).val());
    if(isNaN(lastPrice)){
        $("#v"+num).html("enter a valid price!").css("color", "red");
        return;
    }
    else{
        lastPrice = Math.round(lastPrice*100)/100;
        console.log(lastPrice);
        $("#p"+num).val(""+lastPrice);
        $("#v"+num).html(""); 
    }
    var name = $("#name").val();
    var category = $("#category").val().split(" ");
    var description = $("#description").val();
    var units = [];
    var prices = [];
    
    for(var i = 0; i < $("#pricesdiv").children("div").length; i++){
        var p = Number($("#p"+(i+1)).val());
        var u = $("#u"+(i+1)).val();
        units.push(u);
        prices.push(p);
    }
    var imgsrc = this.imgsrc;
    var ctx = this.ctx;
    var canvas = this.canvas;

    $.ajax({
        url: '/addProduct',
        type: 'POST',
        data: {name: name, category:category, description: description, prices:prices, units: units, imgsrc:imgsrc},
        success: function(){
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            $("#name").val("");
            $("#category").val("");
            $("#description").val("");
            $("#pricesdiv")[0].innerHtml = " <div id=\"d1\"> <label for=\"p1\">Price:  </label><input type=\"text\" name=\"p1\" id=\"p1\"> <label for=\"u1\">Unit:  </label><input type=\"text\" name=\"u1\" id=\"u1\"/> <div id=\"v1\"></div> </div>  ";
            $("#pricesdiv #p1").val("");
            $("#pricesdiv #u1").val("");

        },
        error: function(){console.log("not logged in");}
    });
    
}

function signOut(){
    $.ajax({
        url: '/signout',
        type: 'POST',
        data: {cookieType: 'farmer'},
        success: function(){
            document.getElementById('addproductpage').style.display = 'none';
            document.getElementById('addfarmpage').style.display = 'none';
            document.getElementById('loginpage').style.display = 'block';
            document.getElementById('signout').style.display = 'none';
        }
    });
}

function hasSessionCookie(){
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
    console.log(cookies['farmer']);
    return cookies['farmer'] !== 'none';
}
