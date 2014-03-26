var ObjectID = require('mongodb').ObjectID;

// Store the db instance
var db = null;
var collectionName = 'carts';

//
// Initialize the type
var init = function(_db) {
  if(_db) db = _db;
  // products
  var products = [];
  
  var Cart = function(product) {
    for(var name in product) {
      this[name] = product[name];
    } 
  }

  Cart.prototype.add = function(id, quantity) {
    products.push({id: id, quantity: quantity});
  }

  Cart.prototype.save = function(callback) {
    // If we have no _id save the cart
    if(this._id == null) {
      db.collection(collectionName).insert(this, function(err, items) {
        if(err) return callback(err, null);
        callback(null, items.pop());
      });
    } else {
      callback(null, this);
    }
  }  

  Cart.find = function(id, callback) {
    if(id == null) return callback(null, null);
    try {
      var id = new ObjectID(id);      
      db.collection(collectionName).findOne({_id: id}, function(err, c) {
        if(err) return callback(err, null);
        if(c == null) return callback(null, null);
        callback(null, new Cart(c));
      });
    } catch(err) {
      callback(err, null);
    }
  }

  Cart.init = function(callback) {
    callback(null, null);    
  }

  return Cart;
}

module.exports = init;