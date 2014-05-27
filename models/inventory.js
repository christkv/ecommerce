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
    callback(null, null);    
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

  return Inventory;
}

module.exports = init;