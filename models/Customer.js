var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var customersdb = mongoose.createConnection('mongodb://localhost/customers');
var Customer = new Schema({
    username: String,
    password: String,
    products: [{type: Schema.ObjectId, ref: 'Product'}],
    amounts: [Number],
    units: [String]
});

Customer.methods.validPassword = function(pwd){
    return this.password===pwd;
}

customersdb.on('error', console.error.bind(console, 'connection error:'));
customersdb.once('open', function(){console.log("customersdb ready!");});

module.exports = customersdb.model('Customer', Customer);
