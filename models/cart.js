// Store the db instance
var db = null;
var collectionName = 'carts';

//
// Initialize the type
var init = function(_db) {
  if(_db) db = _db;
  
  var Cart = function(product) {
    for(var name in product) {
      this[name] = product[name];
    } 
  }

  Cart.init = function(callback) {
    callback(null, null);    
  }

  return Cart;
}

module.exports = init;