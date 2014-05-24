var f = require('util').format
  , ObjectID = require('mongodb').ObjectID;

// Store the db instance
var db = null;
var collectionName = 'inventories';

//
// Initialize the type
var init = function(_db) {
  if(_db) db = _db;
  
  var Inventory = function(product) {
    for(var name in product) {
      this[name] = product[name];
    } 
  }

  Inventory.create = function(fields, callback) {
    db.collection(collectionName).insert(fields, {w:1}, function(err, r) {
      if(err) return callback(err);
      callback(null, new Inventory(r[0]));
    });
  }

  Inventory.findByProductId = function(id, callback) {
    db.collection(collectionName).findOne({product_id: id}, function(err, r) {
      if(err) return callback(err);
      callback(null, new Inventory(r));
    });    
  }

  Inventory.init = function(callback) {
    callback(null, null);    
  }

  Inventory.update = function(productId, cartId, quantity, delta, callback) {
    // Ensure we have correct types
    productId = typeof productId == 'string' ? new ObjectID(productId) : productId;
    cartId = typeof cartId == 'string' ? new ObjectID(cartId) : cartId;
    quantity = typeof quantity == 'string' ? parseInt(quantity, 10) : quantity;
    delta = typeof delta == 'string' ? parseInt(delta, 10) : delta;

    // Attempt to reserve the quantity
    db.collection(collectionName).update({
        product_id: productId
      , "reserved.cart_id": cartId
      , available: { $gte: delta }
    }, {
        $inc: { available: -delta }
      , $set: {
        "reserved.$.quantity": quantity + delta, modified_on: new Date()
      }
    }, function(err, n) {
      if(err) return callback(err);
      if(n == 0) 
        return callback(new Error(f("no inventory available for product %s", productId.toString())));
      // Success, items are reserved
      callback(null, null);
    });
  }

  Inventory.reserve = function(productId, cartId, quantity, callback) {
    productId = typeof productId == 'string' ? new ObjectID(productId) : productId;
    cartId = typeof cartId == 'string' ? new ObjectID(cartId) : cartId;
    quantity = typeof quantity == 'string' ? parseInt(quantity, 10) : quantity;

    // Attempt to reserve the quantity
    db.collection(collectionName).update({
        product_id: productId
      , available: { $gte: quantity }
    }, {
        $inc: { available: -quantity }
      , $push: {
        reserved: {
          quantity: quantity, cart_id: cartId, created_on: new Date()
        }
      }
    }, function(err, n) {
      if(err) return callback(err);
      if(n == 0) 
        return callback(new Error(f("no inventory available for product %s", productId.toString())));
      // Success, items are reserved
      callback(null, null);
    });
  }

  return Inventory;
}

module.exports = init;