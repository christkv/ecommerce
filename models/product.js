var ObjectID = require('mongodb').ObjectID
  , f = require('util').format
  , Inventory = require('./inventory')()
  , Category = require('./category')();

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

  /**
   * Create all needed indexes
   */
  Product.init = function(callback) {
    // Ensure index on product id and salesrank
    db.collection(collectionName).ensureIndex({category: 1, 'salesrank': -1}, {background:true}, function(err) {
      if(err) return callback(err);

      // Ensure index category and sales rank
      db.collection(collectionName).ensureIndex({product_id: 1, 'salesrank': -1}, {background:true}, function(err) {
        if(err) return callback(err);

        // Ensure meta data index
        db.collection(collectionName).ensureIndex({"metadata.key":1,"metadata.value":1}, function(err) {
          if(err) return callback(err);
          callback(null, null);    
        });
      });
    });
  }

  /**
   * Create a product entry
   */
  Product.create = function(fields, callback) {
    var errors = {};
    // Fields cannot be empty
    if(fields.title.length == 0) errors.title = 'Product title must be filled in';
    if(fields.description.length == 0) errors.description = 'Description must be filled in';
    if(fields.author.length == 0) errors.author = 'Author must be filled in';
    if(fields.category.length == 0) errors.category = 'Category must be filled in';
    if(fields.price.length == 0) errors.price = 'Price must be filled in';
    if(fields.inventory.length == 0) errors.inventory = 'Inventory must be filled in';
    if(fields.format.length == 0) errors.format = 'Format must be filled in';
    if(fields.numberofpages.length == 0) errors.numberofpages = 'Number of Pages must be filled in';
    if(fields.large_url.length == 0) errors.large_url = 'Large image URL must be filled in';
    if(fields.medium_url.length == 0) errors.medium_url = 'Medium image URL must be filled in';
    if(Object.keys(errors).length > 0) return callback(errors, null);
    
    // Validate if path already exists
    Category.findByCategory(fields.category, function(err, result) {
      if(result == null) {
        errors.category = f("category %s does not exist", fields.path);
      }

      // if we have fields
      if(Object.keys(errors).length > 0) return callback(errors, null);

      // Create a new product and update the parent categories list of children
      db.collection(collectionName).insert({
          title: fields.title, description: fields.description
        , author: fields.author, category: fields.category
        , price: parseInt(fields.price, 10), currency: 'USD'
        , format: fields.format, numberofpages: parseInt(fields.numberofpages, 10)
        , images: {
            medium: {
                url: fields.medium_url
              , width: 124
              , height: 160
            }
          , large: {
              url: fields.large_url
            , width: 124
            , height: 160
          }
        }
      }, {w:1}, function(err, result) {
        if(err) throw err;
        // Create an inventory entry for the new product
        Inventory.create({product_id: result.ops[0]._id, available: parseInt(fields.inventory, 10)}, function(err, result) {
          if(err) throw err;
          callback(null, null);
        });
      });
    });
  }

  /**
   * Find a Product by object id
   */
  Product.findOneById = function(id, callback) {
    id = typeof id == 'string' ? new ObjectID(id) : id;

    try {
      db.collection(collectionName).findOne(id, function(err, p) {
        if(err) return callback(err, null);
        callback(null, new Product(p));
      });
    } catch(err) {
      return callback(err, null);
    }
  }

  /**
   * Find all products allow for skipping and limiting
   */
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

  /**
   * Find the top Products (sorted by salesrank) and allow limiting of results
   */
  Product.topProducts = function(options, callback) {
    // Basic query
    var query = {};
    // Limit
    var limit = options.limit || 10;
    if(options.category && options.category != '/') {
      query.category = new RegExp(f("^%s", options.category));
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

  /**
   * Remove a product using the id
   */
  Product.remove = function(id, callback) {
    var _id = null;

    // Try to create an ObjectId instance
    try {
      _id = new ObjectID(id);      
    } catch(err) {
      return callback(err);
    }

    // Get the 10 most popular products
    db.collection(collectionName)
      .remove({_id: _id}, function(err) {
        if(err) return callback(err);
        callback(null, null);
    });    
  }

  return Product;
}

module.exports = init;