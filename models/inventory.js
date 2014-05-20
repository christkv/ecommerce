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

  Inventory.init = function(callback) {
    callback(null, null);    
  }

  return Inventory;
}

module.exports = init;