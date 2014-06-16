var MongoClient = require('mongodb').MongoClient
  , f = require('util').format;

// Connection url
var url = 'mongodb://localhost:27017/ecommerce';
// Expire delta from current time in seconds
var expiryDelta = 1;
// Calculate cutoff date
var cutOffDate = new Date(); 
cutOffDate.setMinutes(cutOffDate.getMinutes() - expiryDelta);

//
// Connect to the server
MongoClient.connect(url, function(err, db) {
  if(err) throw err;

  // inventory collection
  var inventoryCollection = db.collection('inventories');
  var cartsCollection = db.collection('carts');

  // TODO
});