/**
 * Module dependencies.
 */

var express = require('express')
  , routes = require('./routes')
  , user = require('./routes/user')
  , products = require('./routes/products')
  , http = require('https')
  , fs = require('fs')
  , path = require('path')
  , mongoose = require('mongoose')
  , passport = require('passport')
  , LocalStrategy = require('passport-local').Strategy
  , Farmer = require('./models/Farmer')
  , Customer = require('./models/Customer')
  , Farm = require('./models/Farm')
  , stripe = require('stripe')("sk_test_QkRJtqt6wauRuJ1naiKqWo3s")
  , Product = require('./models/Product');
  
var app = express();

//configuring middleware
app.configure(function(){
  app.set('port', process.env.PORT || 3000);
  app.set('views', __dirname + '/views');
  app.set('view engine', 'jade');
  app.use(express.favicon());
  app.use(express.logger('dev'));
  app.use(express.bodyParser());
  app.use(express.methodOverride());

  app.use(express.cookieParser());
  app.use(express.session({secret: "cheecks"}));

  app.use(express.static(path.join(__dirname ,'/javascript')));
  app.use("/css", express.static(path.join(__dirname ,'/html/customer/css')));
  app.use("/img", express.static(path.join(__dirname ,'/html/customer/images')));

  app.use(passport.initialize());
  app.use(passport.session());

  app.use(app.router);
});

initPassport();

app.configure('development', function(){
  app.use(express.errorHandler());
});

//routes
app.get('/', customerGet); //route to customer get?

app.get('/farmer', farmGet);
app.get('/customer', customerGet);

app.post('/loginFarm', passport.authenticate('local'), farmerLogin);
app.post('/loginCustomer', passport.authenticate('local'), customerLogin);
app.post('/signout', signOut);
app.post('/registerFarm', registerFarm);
app.post('/registerCustomer', registerCustomer);

app.all('/addFarm', addFarm);
app.all('/hasFarm', hasFarm);
app.all('/getProducts', getProducts);
app.all('/addProduct', addProduct);
app.post('/checkoutPay', checkoutPay);
app.all("/addToCart", addToCart);
app.all("/getCart", getCart);
app.all("/removeFromCart", removeFromCart);
app.all("/emptyCart", emptyCart);
app.all("/confirmOrder", confirmOrder);
app.all("/changePassword", changePassword);

fs.writeFile(__dirname+"/orders.txt", "Product ID\tAmount\tUnit\tCustomer ID\tCustomer Name\tAddress 1\tAddress2\tEmail\tPhone\tComments\n");


/*
 * Routing handlers.
 */
function farmGet(req, res){
    console.log("farmget", req.user);
    if(req.user!= undefined){
        Farmer.findById(req.user.id, function(err, farmer){
            if(farmer){
                console.log("farmer cookie: " + req.user.id);
                res.cookie("farmer", req.user.id);
            }
            else{
                console.log("farmer cookie none");
                res.cookie("farmer", "none");
            }
                res.sendfile('html/farmerpage.html');
        });
    }
    else{
        console.log("farmer req.farmer == undefined");
        res.cookie("farmer", "none");
        res.sendfile('html/farmerpage.html');
    }
}

function farmerLogin(req, res){
    res.status(200);
    req.farmer = req.user;
    console.log("logigng in ", req.farmer);
    res.cookie("farmer", req.user.id);
    Farm.findOne({farmer: req.user.id}, function(err, farm){ 
        console.log(farm);
        if(farm){
            console.log('found something');
            res.send(farm);
        }else{
            console.log('found nothing ;(');
            res.send(false);
        }
    });
}

function customerGet(req, res){
    console.log("customereget: " + req.user)
    if(req.user != undefined){
        Customer.findById(req.user.id, function(err, customer){
            if(err){
                console.log("customerget error: " + err);
                return;
            }
            if(customer){
                console.log(req.user);
                res.cookie("customer", req.user.id);
            }else{
                console.log("undef?" +req.user);
                res.cookie("customer", "none");
            }
            res.sendfile('html/customer/index.html');
        });
    }
    else{
        console.log("undef?" +req.user);
        res.cookie("customer", "none");
        res.sendfile('html/customer/index.html');
    }
    
}

function customerLogin(req, res){
    res.status(200);
    req.customer = req.user;
    res.cookie("customer", req.customer.id);
    res.send(req.user);
}

function checkoutPay(req, res){
    res.status(200);
    var charge = stripe.charges.create({
        amount : req.body.stripePrice,
        currency : "usd",
        card : req.body.stripeToken,
        description : req.body.stripeUser
        }, function(payErr, charge) {
            if(payErr) {
                console.log("In error of checkoutPay (app.js)");
                console.log("Card Token: " + req.body.stripeToken);
                console.log("Amount: " + req.body.stripePrice);
                console.log("Description: " + req.body.stripeUser);
                var msg = charge.failure_response || "unknown";
                res.send("Error processing payment: " + msg );
            }

            else {
                console.log('Success! Fake charged a card for $$$$! : ' + req.body.stripePrice);
                // save this customer to your database here!
                res.send('ok');
            }
        }
    );
}

function changePassword(req, res){
    if(req.user === undefined){
        res.status(401);
        res.end();
        return;
    }

    Customer.findById(req.user.id, function(err, customer){
        if(!customer){
            res.status(401);
            res.end();
            return;
        }
        if(customer.password === req.body.old){
            customer.password = req.body.new;
            customer.save();
            res.status(200);
            res.end();
        }
        else{
            res.status(401);
            res.end();
        }
    
    });
}

function signOut(req, res){
    res.cookie(req.body.cookieType, "none");
    console.log("signing out " + req.body.cookieType);
    req.logout();
    res.end();
}

function registerFarm(req, res){
    var username = req.body.username;

    Farmer.findOne({username: username}, function(err, existingUser){
        if(err){
            return res.send({ 'err' : err});
        }
        if(existingUser){
            res.send('user exists');
        }

        var user = new Farmer({username : req.body.username});
        user.password = req.body.password;
        user.save();
    });
}

function registerCustomer(req, res){
    var username = req.body.username;

    Customer.findOne({username: username}, function(err, existingUser){
        if(err){
            return res.send({ 'err' : err});
        }
        if(existingUser){
            res.send('user exists');
        }
        else{
            var user = new Customer({username : req.body.username});
            user.password = req.body.password;
            user.save();
            res.cookie('customer', user.id);
            res.end();
        }
    });
}

function hasFarm(req, res){
    Farmer.findById(req.user.id, function(err, farmer){
        res.status(200);
        var hasfarm = farmer.farm != undefined;
        console.log("farmer.farm: ", farmer.farm);
        console.log("hasfarm: ", hasfarm);
        res.send(hasfarm);
    });
}

function addProduct(req, res){
    if(req.user === undefined){
        console.log("undefined req");
        res.status(401)
        res.end();
        return;
    }
    var p = new Product();
    p.name = req.body.name;
    p.category = req.body.category;
    p.description = req.body.description;
    p.prices = req.body.prices;
    p.units = req.body.units;
    p.image = req.body.imgsrc;

    Farmer.findById(req.user.id, function(err, farmer){
        p.farm = farmer.farm;
        p.save();
        res.status(200);
        console.log("product added");
        res.end();
    });
}

function getProducts(request, response){
    var term = request.body.term;
    var th = request.body.th;   //threshold in km
    var latNow = request.body.latNow;
    var lngNow = request.body.lngNow;

    if(term === "") term = new RegExp(".*");
    else term = new RegExp(term, "i");
    console.log("term: " + term);

    Product.find({name: term}, function(err, nameResults){
        /*
        Product.find({$where:"this.category.indexOf(term)!==-1"}, function(err, catResults){
            console.log(catResults);
            Farm.find({name : term}, function(err, farm){
                console.log(farm);
                var farmResults = [];
                farm.forEach(function(value){
                   farmResults = farmResults.concat(value.products); 
                });
                console.log("found farmname");
                Farm.find({city : term}, function(err, city){
                    console.log(city);
                    var cityResults = [];
                    city.forEach(function(value){
                       cityResults = cityResults.concat(value.products); 
                    });
                    console.log("found city");
                  Farm.find({state : term}, function(err, state){
                    console.log(state);
                    var stateResults = [];
                    state.forEach(function(value){
                       stateResults = stateResults.concat(value.products); 
                    });
                    console.log("found state");
                       var results = nameResults.concat(catResults).concat(farmResults).concat(cityResults).concat(stateResults);
                       response.send(results);
                       console.log(results);
                    });
                });
            });
        });
        */
        var results = nameResults;
        var farmData = [];
        var farmDistance = [];
        var counter = 0;
        var index = 0;
        var narrowedResults = [];
        for(var i = 0; i < results.length; i++){
            Farm.findById(results[i].farm, function(err, farm){
                counter++;
                if(!farm)
                    console.log("NO FARM FOUND! SHOULD NOT HAPPEN");

                var kmDist = getKmDist(latNow, lngNow, farm.lat, farm.lng);
                console.log("Distance to farm " + this + ": " + kmDist + "km");

                if(kmDist < th) {
                    farmData[index] = farm;
                    farmDistance[index] = kmDist.toFixed(2);
                    narrowedResults[index] = results[this];
                    index++;
                }

                if(counter === results.length){
                    response.status(200); 
                    response.send({results: narrowedResults, farmData: farmData,
                                    farmDistance: farmDistance});
                }
            }.bind(i));
        }
    });
}

function getKmDist(lat1deg, lng1deg, lat2deg, lng2deg) {
    var lat1, lng1, lat2, lng2;
    lat1 = lat1deg * Math.PI / 180;
    lng1 = lng1deg * Math.PI / 180;
    lat2 = lat2deg * Math.PI / 180;
    lng2 = lng2deg * Math.PI / 180;
    return Math.acos(Math.sin(lat1)*Math.sin(lat2) + 
        Math.cos(lat1)*Math.cos(lat2)*Math.cos(lng2-lng1))*6371;
}

function addFarm(req, res){
    console.log("in add farm");
    console.log(req.user);
    Farmer.findById(req.user.id, function(err, farmer){
        if(farmer){
            if(farmer.farm){
                console.log("farmer already has a farm!");
                res.status(401);
                res.end();
            }
            console.log(req.body);
            var newFarm = new Farm();
            newFarm.name =  req.body.name;
            newFarm.city = req.body.city;
            newFarm.state = req.body.state;
            newFarm.lat = req.body.lat;
            newFarm.lng = req.body.lng;
            newFarm.certifications = req.body.cert;
            newFarm.farmer = farmer.id;
            newFarm.save();
            farmer.farm = newFarm.id;
            farmer.save();
            res.status(200);
            res.end();
        }else{
            res.status(401);
            res.end();

        }
    });
    /*                          //delete this on jessica's only
    newFarm.name = request.body.name; 
    newFarm.category = request.body.category; 
    newFarm.rating = parseInt(request.body.rating);
    console.log(newFarm);
    newFarm.save(function errF(err){if(err) console.log(err);});
    */
}

function addToCart(req, res){
    if(req.user === undefined){
        res.status(401);
        res.end();
        return;
    }
    Customer.findById(req.user.id, function(err, customer){
        if(!customer){
            res.status(401);
            res.end();
            return;
        }
        var index = customer.products.indexOf(req.body.product);
        if(index === -1){
            customer.amounts.push(parseInt(req.body.amount));
            customer.units.push(req.body.unit);
            customer.products.push(req.body.product);
        }
        else{
            customer.amounts[index] = req.body.amount;
            customer.units[index] = req.body.unit;
        }
        customer.markModified('amounts');
        customer.markModified('units');
        customer.save();
        res.status(200);
        res.end();
    });
}

function getCart(req, res){
    if(req.user === undefined){
        res.status(401);
        res.end();
        return;
    }

    Customer.findById(req.user.id, function(err, customer){
        if(!customer){
            res.status(401);
            res.end();
            return;
        }
        if(customer.products.length === 0){
            res.status(200);
            res.end();
            return;
        }
        var send = {};
        send.amounts = customer.amounts;
        send.units = customer.units;
        send.products = []; 
        var count = 0;
        for(var i = 0; i < customer.products.length; i++){
            Product.findById(customer.products[i], function(err, product){
                count++;
                send.products[this] = product;
                if(count === customer.products.length){
                    res.status(200);
                    res.send(send);
                }
            }.bind(i));
        }
        
    });
}

function removeFromCart(req, res){
    if(req.user === undefined){
        res.status(401);
        res.end();
        return;
    }

    Customer.findById(req.user.id, function(err, customer){
        if(!customer){
            res.status(401);
            res.end();
            return;
        }

        var index = customer.products.indexOf(req.body.id);
        customer.products.splice(index, 1);
        customer.amounts.splice(index, 1);
        customer.units.splice(index, 1);
        customer.markModified('amounts');
        customer.markModified('units');
        customer.markModified('products');
        customer.save();
        res.status(200);
        res.end();
    });
    
}

function emptyCart(req, res){
    if(req.user === undefined){
        res.status(401);
        res.end();
        return;
    }

    Customer.findById(req.user.id, function(err, customer){
        if(!customer){
            res.status(401);
            res.end();
            return;
        }

        customer.products = [];
        customer.amounts = [];
        customer.units = [];
        customer.markModified('amounts');
        customer.markModified('units');
        customer.markModified('products');
        customer.save();
        res.status(200);
        res.end();
    });
    
}

function confirmOrder(req, res){
    if(req.user === undefined){
        res.status(401);
        res.end();
        return;
    }

    Customer.findById(req.user.id, function(err, customer){
        if(!customer){
            res.status(401);
            res.end();
            return;
        }
        if(req.body.products === undefined){
            res.status(200);
            return;
        }
        var strings = "";
        for(var i = 0; i < req.body.products.length; i++){
            strings = strings+req.body.products[i]+"\t"+req.body.amounts[i]+"\t"+req.body.units[i]+"\t"+req.user.id+"\t"+req.body.name+"\t"+req.body.addr1+"\t"+req.body.addr2+"\t"+req.body.email+"\t"+req.body.phone+"\t"+req.body.comments+"\n";
        }
        fs.appendFile(__dirname + "/orders.txt", strings, function(err){
            if(err){
                console.log(err);
                res.status(500);
            }
            res.status(200);
            res.end();
        });
    });

}
/*
 * Initialize passport settings for our authentication policy
 */
function initPassport(){
    passport.use(new LocalStrategy( {passReqToCallback: true}, 
                    function(req, username, password, done){
                        console.log(req.body);
                        console.log("logging username: " + username+" password: "+password);
                        console.log("req.body.type="+req.body.type);
                        if(req.body.type === "farmer"){
                            Farmer.findOne({username: username}, function(err, user){
                                if(err){return done(err);}
                                if(!user){
                                    console.log("fail 1\n");
                                    return done(null, false);
                                }
                                if(!user.validPassword(password)){
                                console.log("fail 2\n");
                                    return done(null, false);
                                }
                                console.log("successed\n");
                                return done(null, user);
                            });
                        }else{
                            Customer.findOne({username: username}, function(err, user){
                                if(err){return done(err);}
                                if(!user){
                                    return done(null, false);
                                }
                                if(!user.validPassword(password)){
                                    return done(null, false);
                                }
                                return done(null, user);
                            });
                        }
                    })
                );

    passport.serializeUser(function(user, done){
        done(null, user.id);
    });
    passport.deserializeUser(function(id, done){
        console.log("deserializing\n");
        Customer.findById(id, function(err, user){
            if(!user){
                Farmer.findById(id, function(err2, user2){
                    done(err2, user2);
                });
            }
            else
                done(err, user);
        });
    });
}


var options = {
  key: fs.readFileSync('key.pem'),
    cert: fs.readFileSync('cert.pem')
    };

http.createServer(options, app).listen(app.get('port'), function(){
  console.log("Express server listening on port " + app.get('port'));
});



