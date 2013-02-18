var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var farmersdb = mongoose.createConnection('mongodb://localhost/farmers');
var Farmer = new Schema({
    username: String,
    password: String,
    farm: {type: Schema.ObjectId, ref: "Farm"}
});
Farmer.methods.validPassword = function(pwd){
    return this.password===pwd;
}
farmersdb.on('error', console.error.bind(console, 'connection error:'));
farmersdb.once('open', function(){console.log("farmersdb ready!");});

module.exports = farmersdb.model('Farmer', Farmer);
