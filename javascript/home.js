
var HomePage = function(){
    this.div = $('#homePage');
    this.zipcodeTxt = "test";
    this.load();
}

HomePage.prototype.load = function() {
	this.geocoder = new google.maps.Geocoder();
    
    if(!navigator.geolocation) {
        navigator.geolocation = {};
    }
    if(!navigator.geolocation.getCurrentPosition) {
        navigator.geolocation.getCurrentPosition = this.handleNoGeolocation;
    }
    navigator.geolocation.getCurrentPosition(
    	this.getZipcode.bind(this), this.handleNoGeolocation.bind(this));

    //Force user to enter a zipcode/location
    $("#navFooter").addClass("hidden");

    //trigger search btn click on "enter" key
    $("#zipcodeTxt").keyup(function(e) {
        if (e.which === 13) {
            this.loadZipcodeSearch.bind(this)();
        }
    }.bind(this));

    $("#zipcodeBtn").on(window.util.eventstr, this.loadZipcodeSearch.bind(this));

}

HomePage.prototype.loadZipcodeSearch = function () {
	//Save into local storage
	this.zipcodeTxt = $("#zipcodeTxt").val();
	window.localStorage.localRootsZipcode = JSON.stringify(this.zipcodeTxt);

	//go from zipcodeText to this.appDOM.lat and this.appDOM.lng
	//update this.appDOM.latlng too
	var lat = '';
    var lng = '';
    var address = this.zipcodeTxt;
    this.geocoder.geocode( { 'address': address}, function(results, status) {
      if (status == google.maps.GeocoderStatus.OK) {
		lat = results[0].geometry.location.lat();
		lng = results[0].geometry.location.lng();

        this.appDOM.lat = lat;
        this.appDOM.lng = lng;
        this.appDOM.latlng = new google.maps.LatLng(lat, lng);
        $("#navFooter").removeClass("hidden");

        $("#HomePageBtn").closest(".iconBlock").removeClass("active");
        $("#ProductsPageBtn").closest('.iconBlock').addClass("active");
        this.appDOM.switchTo.bind(this.appDOM)(this.appDOM.pages[2]);
        $("#productsPage #btnRight").trigger(window.util.eventstr);


      	console.log("Setting lat " + lat + " and lng " + lng);
        }
    	else {
			console.log("Geocode was not successful for the following reason: " + status);
        	$("#zipcodeTxt").attr("placeholder", "Error. Try Again.").val("");
    	}
    }.bind(this));
}


HomePage.prototype.handleNoGeolocation = function() {
	console.log("no geolocation");
	//Check if anything in local storage. Else, leave blank.
	if(typeof(window.localStorage)==="undefined") {
		this.zipcodeTxt = "";
		return;
	}
	if(typeof(window.localStorage.localRootsZipcode) === "undefined") {
		this.zipcodeTxt = "";
		return;
	}

	var lastZipCode = JSON.parse(window.localStorage.localRootsZipcode);
	if (lastZipCode !== "") {
		this.zipcodeTxt = lastZipCode;
	}
    $("#zipcodeTxt").val(this.zipcodeTxt);



}

HomePage.prototype.getZipcode = function(position) {
	console.log("has geolocation, getting current location");
	var lat = position.coords.latitude;
	var lng = position.coords.longitude;

	var latlng = new google.maps.LatLng(lat, lng);

	this.geocoder.geocode({'latLng':latlng}, function(results, status) {
		if(status !== google.maps.GeocoderStatus.OK) {
			this.handleNoGeolocation();
			return;
		}

		var addrcomp = results[0].address_components;

        for(var i = 0; i < addrcomp.length; i++){
            if(addrcomp[i].types.indexOf("postal_code") > -1) {
                this.zipcodeTxt = addrcomp[i].short_name;
    			$("#zipcodeTxt").val(this.zipcodeTxt);
            	return;
            }
        }

	}.bind(this));


}


