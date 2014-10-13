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
    }, function(err, result) {
      if(err) return callback(err);
      callback(null, new Cart(result.ops[0]));
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
    var self = this;

    // Ensure correct types for parameters
    productId = typeof productId == 'string' ? new ObjectID(productId) : productId;
    var product = null;

    // Locate the product id
    for(var i = 0; i < this.items.length; i++) {
      if(this.items[i].product_id.equals(productId)) {
        product = this.items[i];
      }
    }

    // No product found
    if(product == null) return callback(new Error(f("no product with id %s found", productId)));

    // Release the quantity back to the inventory
    Inventory.release(productId, this._id, function(err, r) {
      if(err) return callback(err);

      // Let's remove the item from the cart
      db.collection(collectionName).update({
          _id: self._id
        , "items.product_id": productId
      }, {
          $pull: { items: { product_id: productId }}
        , $set: { modified_on: new Date() }
      }, function(err, r) {
        if(err) return callback(err);
        callback(null, null);
      });    
    });
  }


  /**
   * Update a product quantity in the cart
   */
  Cart.prototype.update = function(productId, quantity, callback) {
    var self = this;
    // Ensure correct types for parameters
    productId = typeof productId == 'string' ? new ObjectID(productId) : productId;
    quantity = typeof quantity == 'string' ? parseInt(quantity, 10) : quantity;
    
    // Old quantity
    var oldQuantity = 0;

    // Save the current quantity in the cart
    for(var i = 0; i < this.items.length; i++) {
      if(this.items[i].product_id.equals(productId)) {
        oldQuantity = this.items[i].quantity;
        break;
      }
    }

    // Calculate the new delta we are trying to reserve
    var delta = quantity - oldQuantity;

    // If we have a negative delta, we are returning items to the store
    if(quantity == 0) return self.remove(productId, callback);

    // Update the quantity in the cart
    db.collection(collectionName).update({
        _id: this._id
      , "items.product_id": productId
      , status: 'active'
    }, {
      $set: {
          modified_on: new Date()
        , "items.$.quantity": quantity
      }
    }, function(err, n) {
      if(err) return callback(err);
      if(n == 0) return callback(new Error(f("no cart found for %s", self._id)));

      // Success, time to reserve the additional product inventory for this cart
      Inventory.update(productId, self._id, oldQuantity, delta, function(err, result) {

        if(err) {
          // Inventory reservation failed, rollback the product addition to the cart
          return db.collection(collectionName).update({
              _id: self._id
            , "items.product_id": productId
            , status: 'active'
          }, {
            $set: { 
                modified_on: new Date()
              , "items.$.quantity": oldQuantity
            }
          }, function(_err) {
            if(_err) return callback(_err);
            callback(err, null);
          });
        }

        // Correctly added item to the cart
        callback(null, null);
      });
    });
  }


  /**
   * Add a product and quantity to the cart
   */
  Cart.prototype.add = function(productId, quantity, callback) {
    var self = this;

    // Create ObjectId
    productId = typeof productId == 'string' ? new ObjectID(productId) : productId;
    quantity = typeof quantity == 'string' ? parseInt(quantity, 10) : quantity;

    // Go through the items and see if we already have this product in the list
    // we need to update the quantity instead of adding a new row
    for(var i = 0; i < this.items.length; i++) {
      if(this.items[i].product_id.equals(productId)) {
        var newQuantity = this.items[i].quantity + quantity;
        return self.update(productId, newQuantity, callback);
      }
    }

    // Fetch the product information
    Product.findOneById(productId, function(err, product) {
      if(err) return callback(err);

      // First add the item to the cart
      db.collection(collectionName).update({
        _id: self._id, status: 'active'
      }, {
          $set: {modified_on: new Date()}
        , $push: {
          items: {
              product_id: productId
            , quantity: quantity
            , title: product.title
            , price: product.price
          }
        }
      }, {upsert:true}, function(err, n) {
        if(err) return callback(err);
        if(n == 0) return callback(new Error(f("no cart found for %s", self._id)));

        // We've correctly updated the cart, attempt to reserve product inventory
        Inventory.reserve(productId, self._id, quantity, function(err, result) {

          if(err) {
            // Inventory reservation failed, rollback the product addition to the cart
            return db.collection(collectionName).update({
              _id: self._id
            }, {
                $set: { modified_on: new Date() }
              , $pull: { items: { product_id: productId}}
            }, function(_err) {
              if(_err) return callback(_err);
              callback(err, null);
            });
          }

          // Correctly added item to the cart
          callback(null, null);
        });
      });      
    });
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