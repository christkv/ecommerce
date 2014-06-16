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

  /**
   * Initialize all the indexes needed
   */
  Inventory.init = function(callback) {
    // Ensure index on sales rank
    db.collection(collectionName).ensureIndex({product_id: 1}, {background:true}, function(err) {
      if(err) return callback(err);

      // Ensure index on sales rank
      db.collection(collectionName).ensureIndex({'reserved.cart_id': 1}, {background:true}, function(err) {
        if(err) return callback(err);
        callback(null, null);
      });
    });
  }  

  /**
   * Create a new inventory entry
   */
  Inventory.create = function(fields, callback) {
    db.collection(collectionName).insert(fields, {w:1}, function(err, r) {
      if(err) return callback(err);
      callback(null, new Inventory(r[0]));
    });
  }

  /**
   * Find a product by the object id
   */
  Inventory.findByProductId = function(id, callback) {
    db.collection(collectionName).findOne({product_id: id}, function(err, r) {
      if(err) return callback(err);
      callback(null, new Inventory(r));
    });    
  }

  /**
   * Commit a card to the inventory, cleaning out the
   * reserved items
   */
  Inventory.commit = function(cartId, callback) {
    // TODO
  }

  /**
   * Release a reservation for a product stored in a specific cart
   */
  Inventory.release = function(productId, cartId, callback) {
    // TODO
  }

  /**
   * Update the quantity of a product in a cart
   */
  Inventory.update = function(productId, cartId, quantity, delta, callback) {
    // TODO
  }

  /**
   * Reserve a specific amount of a product for a specific cart
   */
  Inventory.reserve = function(productId, cartId, quantity, callback) {
    // TODO
  }

  return Inventory;
}

module.exports = init;