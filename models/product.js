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
    // TODO
    callback();
  }

  /**
   * Create a product entry
   */
  Product.create = function(fields, callback) {
    var errors = {};
    console.dir(fields)
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

      // TODO
      callback(null, null);
    });
  }

  /**
   * Find a Product by object id
   */
  Product.findOneById = function(id, callback) {
    try {
      db.collection(collectionName).findOne(new ObjectID(id), function(err, p) {
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
    // TODO
  }  

  return Product;
}

module.exports = init;