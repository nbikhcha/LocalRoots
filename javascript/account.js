
var AccountPage = function(){
    this.div = $('#accountPage');
    this.currentContent = $("#loginPage");
    this.currentTabInd = 0;
    this.navStrArr = ["loginInfo", "signout"];
    this.returnToCheckout = false;
    this.load();
}

AccountPage.prototype.load = function(reload) {
    $("#registerPage").addClass("hidden");
    $("#editAccountPage").addClass("hidden");
    $("#accountPage .invalidNote").addClass("hidden");
    $("#loginInfoContinueBtn").on(window.util.eventstr, changePassword);
    
    //check if already logged in
    if(window.util.hasCookies("customer")){
        console.log("has cookies");
        loginSuccess.bind(this)();
    }

    //Submit login on press of enter in password field
    $("#loginPage #loginPassword").keyup(function(e) {
        if (e.which === 13) {
            handleLogin.bind(this)();
        }
    }.bind(this));

    /*Event handlers on loginPage*/
    $("#loginBtn").on(window.util.eventstr, handleLogin.bind(this));

    $("#registerBtn").on(window.util.eventstr, function() {
        this.currentContent = $("#registerPage");
        this.currentContent.removeClass("hidden");
        $("#loginPage").addClass("hidden");
    }.bind(this));

    
    //back to login page event handler
    $(".backToLoginBtn").on(window.util.eventstr, function() {
        this.currentContent.addClass("hidden");
        if(this.currentContent.attr('id') === "editAccountPage") {
            startTabOver.bind(this)();

            $.ajax({
                url: '/signout',
                data: {cookieType:'customer'},
                type: 'POST',
                success: function(req, res){
                    $("#registerPage").addClass("hidden");
                    $("#editAccountPage").addClass("hidden");
                    $(".invalidNote").addClass("hidden");
                    $("#loginPage").addClass("visible");
                }
            });
        }
        
        this.currentContent = $("#loginPage");
        this.currentContent.removeClass("hidden");
        $(".invalidNote").addClass("hidden");
    }.bind(this));
    

    /*Event handlers on registerPage*/

    //Submit login on press of enter in password field
    $("#registerPage #regPassword2").keyup(function(e) {
        if (e.which === 13) {
            handleRegister.bind(this)();
        }
    }.bind(this));
    $("#registerSubmitBtn").on(window.util.eventstr,
                            handleRegister.bind(this));
    
    
    /*Event handlers in editAccountPage*/
    $("#accountPage .leftNav a").on(window.util.eventstr, function(e) {
        switchTab.bind(this)($("#accountPage .activeTab"), $(e.target));
    }.bind(this));
    
    
}

function handleLogin() {
    //Handle authentication jazz
    var loginEmail = $("#loginPage #loginEmail").val();
    var loginPw = $("#loginPage #loginPassword").val();
    console.log("logging in :"+loginEmail+" "+loginPw);
    $.ajax({
        url: "/loginCustomer",
        type: "POST",
        data: {username: loginEmail, password: loginPw,
            type: "customer"},
        success: loginSuccess.bind(this),
        error: loginFail.bind(this)
    });
}
function handleRegister() {
    //Passwords don't match
    var pw1 = $("#regPassword1");
    var em =  $("#registerEmail");
    
    var verifyRegForm = verifyRegisterForm();
    
    if(verifyRegForm === false)
        return;

    //Create a new account!
    console.log("registering...");
    $.ajax.bind(this)({
        url: "/registerCustomer",
        type: "POST",
        data: {username: em.val(), password: pw1.val(),
            type: "customer"},
        success: registerSuccess.bind(this),
        error: registerFail.bind(this)
    });
}

function startTabOver() {
    switchTab.bind(this)($("#"+this.navStrArr[this.currentTabInd]+"Link"),
                        $("#"+this.navStrArr[0]+"Link"));
}

function loginSuccess() {
    this.currentContent = $("#editAccountPage");
    this.currentContent.removeClass("hidden");
    $("#invalidLogin").addClass("hidden");
    $("#loginPage").addClass("hidden");
    $("#loginPage input[type=password]").val("");


    //check if need to return to checkout page
    if(this.returnToCheckout) {
        this.returnToCheckout = false;
        this.appDOM.returnToCheckoutAfterSignin.bind(this.appDOM)();
        return;
    }
}

function loginFail() {
    $("#invalidLogin").removeClass("hidden");
    $("#loginPassword").val("");
}


function changePassword(email, newPw) {
    alert("Going to change the password of this email's account!");
}


function registerSuccess() {
    console.log("register success: ", this);
    this.currentContent = $("#loginPage");
    this.currentContent.removeClass("hidden");
    $("#registerPage").addClass("hidden");
    $("#invalidRegisterEmailError").addClass("hidden");
    $("#registerPage input").val("");

    //check if need to return to checkout page
    if(this.returnToCheckout) {
        this.returnToCheckout = false;
        this.appDOM.returnToCheckoutAfterSignin.bind(this.appDOM)();
        return;
    }
}

function registerFail() {
    $("#invalidRegisterEmailError").removeClass("hidden");
    $("#loginPassword").val("");
}

function changePassword(){
    var oldPassword = $("#oldPassword").val();
    var newPassword = $("#chPassword1").val();
    var checkPassword = $("#chPassword1").val();
    if(checkPassword !== newPassword){
        alert("Password do not match");
        return;
    }
    $.ajax({
        url: '/changePassword',
        type: 'POST',
        data: {old:oldPassword, new:newPassword},
        success: function(){
            alert("Password changed");
        },
        error: function(){
            alert("error: Unauthorized");
        }

    });
}


/*Returns true if email and password fields are valid.
 *Displays needed notifications.
 */
function verifyRegisterForm() {
    var validReg = true;
    var pw1 = $("#regPassword1");
    var pw2 = $("#regPassword2");
    var em =  $("#registerEmail");
    
    var invRegEmail = $("#invalidRegisterEmail");
    var invRegMatch = $("#invalidRegisterPwMatch");
    var invRegCond = $("#invalidRegisterPwCond");
    
    //check for basic validity of email
    var emailVal = em.val();
    var atInd = emailVal.indexOf("@");
    var perInd = emailVal.indexOf(".");
    if(atInd >= perInd || atInd < 0) {
        em.select();
        invRegEmail.removeClass("hidden");
        validReg = false;
    }
    else {
        invRegEmail.addClass("hidden");
    }
    
    
    //check passwords match
    if(pw1.val() !== pw2.val()) {
        pw1.val("");
        pw2.val("");
        invRegMatch.removeClass("hidden");
        validReg = false;
    }
    else {
        invRegMatch.addClass("hidden");
    }
    
    return validReg;

}
