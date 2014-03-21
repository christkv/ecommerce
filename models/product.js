// Store the db instance
var db = null;
var collectionName = 'products';

//
// Initialize the type
var init = function(_db) {
  if(_db) db = _db;
  
  var Product = function(product) {
    for(var name in product) {
      this[name] = product[name];
    } 
  }

  Product.init = function(callback) {
    db.collection(collectionName).ensureIndex({'salesrank': -1}, {background:true}, function(err) {
      if(err) return callback(err);
      callback(null, null);    
    });
  }

  Product.topProducts = function(options, callback) {
    // Limit
    var limit = options.limit || 10;
    // Get the 10 most popular products
    db.collection(collectionName)
      .find().sort({salesRank:-1}).limit(limit).toArray(function(err, products) {
        if(err) return callback(err);

        // Return the products but map them to our type first
        callback(null, products.map(function(p) {
          return new Product(p);
        }));
    });
  }  

  return Product;
}

module.exports = init;