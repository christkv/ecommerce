var ObjectID = require('mongodb').ObjectID
  , f = require('util').format;

// Store the db instance
var db = null;
var collectionName = 'products';

//
// Initialize the type
var init = function(_db) {
  if(_db) db = _db;
  
  var Product = function(object) {
    for(var name in object) {
      this[name] = object[name];
    } 
  }

  Product.findOne = function(id, callback) {
    try {
      db.collection(collectionName).findOne(new ObjectID(id), function(err, p) {
        if(err) return callback(err, null);
        callback(null, new Product(p));
      });
    } catch(err) {
      return callback(err, null);
    }
  }

  Product.all = function(options, callback) {
    if(typeof options == 'function') {
      callback = options;
      options = {};
    }

    // Unpack pagination variables
    var limit = options.limit || 25;
    var skip = options.skip || 0;

    // Query for products
    db.collection(collectionName).find({}).limit(limit).skip(skip).toArray(function(err, items) {
      if(err) return callback(err);
      return callback(null, items.map(function(i) { return new Product(i); }));
    });
  }

  Product.init = function(callback) {
    // Ensure index on sales rank
    db.collection(collectionName).ensureIndex({'salesrank': -1}, {background:true}, function(err) {
      if(err) return callback(err);

      // Ensure text index on interesting fields
      db.collection(collectionName).ensureIndex({
        "$**": "text"
      }, { background:true }, function(err) {
        if(err) return callback(err);
        callback(null, null);    
      });
    });
  }

  Product.topProducts = function(options, callback) {
    // Basic query
    var query = {};
    // Limit
    var limit = options.limit || 10;
    if(options.category && options.category != '/') {
      query.category = new RegExp(f("^%s", options.category), "i");
    }

    // Get the 10 most popular products
    db.collection(collectionName)
      .find(query).sort({salesRank:-1}).limit(limit).toArray(function(err, products) {
        if(err) return callback(err);

        // Return the products but map them to our type first
        callback(null, products.map(function(p) {
          return new Product(p);
        }));
    });
  }  

  Product.search = function(search, options, callback) {
    if(typeof options == 'function') {
      callback = options;
      options = {};
    }

    options = options || {}
    search = search || "";
    query = search == "" ? {} : {$text: {$search: search}};
    limit = options.limit || 10;
    skip = options.skip || 10;
    // skip = 10

    console.dir(options)
    console.dir(query)
    db.collection(collectionName)
      .find(query, {score: {$meta: 'textScore'}})
      .limit(limit)
      .skip(skip)
      .toArray(function(err, products) {
        if(err) return callback(err);

        callback(null, products.map(function(p) {
          return new Product(p);
        }));      
    })
  }

  return Product;
}

module.exports = init;