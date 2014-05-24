var f = require('util').format
  , ObjectID = require('mongodb').ObjectID;

// Store the db instance
var db = null;
var collectionName = 'carts';

//
// Initialize the type
var init = function(_db) {
  if(_db) db = _db;

  var Cart = function(object) {
    for(var name in object) {
      this[name] = object[name];
    }
  }

  Cart.init = function(callback) {
    callback();
  }

  return Cart;
}

module.exports = init;