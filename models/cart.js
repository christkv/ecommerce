var f = require('util').format
  , ObjectID = require('mongodb').ObjectID
  , Product = require('./product')()
  , Inventory = require('./inventory')();

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

  /**
   * Initialize the model at application startup
   */
  Cart.init = function(callback) {
    callback();
  }

  /**
   * Create a new cart object
   */
  Cart.create = function(callback) {
    db.collection(collectionName).insert({
        status: 'active'
      , items: []
      , created_on: new Date()
      , modified_on: new Date()
    }, function(err, doc) {
      if(err) return callback(err);
      callback(null, new Cart(doc[0]));
    });
  }

  /**
   * Locate a cart by it's hex id
   */
  Cart.findActiveByHexId = function(id, callback) {
    db.collection(collectionName).findOne({_id: new ObjectID(id), status: 'active'}, function(err, doc) {
      if(err) return callback(err);
      if(doc == null) return callback(null, null);
      return callback(null, new Cart(doc));
    });
  }

  /**
   * Update a list of products
   */
  Cart.prototype.updateAll = function(products, callback) {
    var self = this;
    if(products.length == 0) return callback(null, null);

    // Total number of save we must perform
    var totalProducts = products.length;
    var errors = [];

    // For each item we are going to add the new quantity and report all errors
    for(var i = 0; i < products.length; i++) {
      var newQuantity = products[i].newQuantity - products[i].quantity;
      // Attempt to change each new item
      self.add(products[i].product_id, newQuantity, function(err) {
        totalProducts = totalProducts - 1;
        if(err) errors.push(err);

        // No more products to reserve
        if(totalProducts == 0) {
          if(errors.length > 0) return callback(errors, null);
          callback(null, null);
        }
      });
    }
  }

  /**
   * Remove a product entirely or just a # number of items from the cart
   */
  Cart.prototype.remove = function(productId, callback) {
    // TODO
  }


  /**
   * Update a product quantity in the cart
   */
  Cart.prototype.update = function(productId, quantity, callback) {
    // TODO
  }


  /**
   * Add a product and quantity to the cart
   */
  Cart.prototype.add = function(productId, quantity, callback) {
    // TODO
  }

  /**
   * Commit all the changes to the inventory
   */
  Cart.prototype.commit = function(callback) {
    var self = this;
    // Set the cart to completed
    db.collection(collectionName).update({
      _id: this._id
    }, { 
      $set: { status: 'completed', modified_on: new Date() }
    }, function(err, r) {
      if(err) return callback(err);
      // Remove all the items from the inventory
      Inventory.commit(self._id, callback);
    })
  }

  return Cart;
}

module.exports = init;