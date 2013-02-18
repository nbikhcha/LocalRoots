var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var farmsdb = mongoose.createConnection('mongodb://localhost/farms');
var Farm = new Schema({
    name: String,
    city: String,
    state: String,
    lat: Number,
    lng: Number,
    certifications: [String],
    farmer: {type: Schema.ObjectId, ref: 'Farmer'}

});

farmsdb.on('error', console.error.bind(console, 'connection error:'));
farmsdb.once('open', function(){console.log("farmsdb ready!");});

module.exports = farmsdb.model('Farm', Farm);
