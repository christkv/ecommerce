var f = require('util').format
  , ObjectID = require('mongodb').ObjectID;

// Store the db instance
var db = null;
var collectionName = 'categories';

//
// Initialize the type
var init = function(_db) {
  if(_db) db = _db;
  
  var Category = function(object) {
    for(var name in object) {
      this[name] = object[name];
    } 
  }

  /**
   * Add all needed indexes
   */
  Category.init = function(callback) {
    db.collection(collectionName).ensureIndex({
      category: 1
    }, function(err, result) {
      if(err) throw err;

      db.collection(collectionName).ensureIndex({
        name: 1, category: 1
      }, function(err, result) {
        if(err) throw err;

        db.collection(collectionName).ensureIndex({
          parent:1, category: 1, name: 1, text: 1
        }, function(err, result) {
          if(err) throw err;
    
          callback();
        });
      });
    });
  }  

  Category.prototype.split = function() {
    var parts = this.category.split("/");
    parts.shift();
    return parts;
  }

  /**
   * Create a category entry
   */
  Category.create = function(fields, callback) {
    var errors = {};
    // Fields cannot be empty
    if(fields.name.length == 0) errors.name = 'Category name must be filled in';
    if(fields.text.length == 0) errors.text = 'Description must be filled in';
    if(fields.category.length == 0) errors.category = 'Category must be filled in';
    if(Object.keys(errors).length > 0) return callback(errors, null);
    
    // Split the category and validate if the parent exists
    var categoryFields = fields.category.split('/');
    // Remove the last part of the category to find the parent
    categoryFields.pop();
    // Create the parent path
    var parent = categoryFields.join('/');
    parent = parent.length == 0 ? '/' : parent;

    // Validate if parent exists
    Category.findByParent(parent, function(err, result) {
      if(result == null) {
        errors.category = f("parent path %s does not exist", parent);
      }

      if(Object.keys(errors).length > 0) return callback(errors, null);
      // Validate if path already exists
      Category.findByCategory(fields.category, function(err, result) {
        if(result != null) {
          errors.category = f("category %s already exists", fields.path);
        }

        // if we have fields
        if(Object.keys(errors).length > 0) return callback(errors, null);

        // Create a new category and update the parent categories list of children
        db.collection(collectionName).insert({
            name: fields.name, text: fields.text
          , parent: parent, category: fields.category
          , children: []
        }, {w:1}, function(err, result) {
          if(err) throw err;

          // Split category
          var child = fields.category.split('/').pop();

          // Saved the new category push the new name on the parent
          db.collection(collectionName).update({category: fields.path}, {
            $push: {children: child}
          }, {w:1}, function(err, r) {
            if(err) throw err;
            callback(null, null);
          });
        });
      });
    })
  }

  /**
   * Remove a category
   */
  Category.remove = function(id, callback) {
    db.collection(collectionName).remove({
      _id: new ObjectID(id)
    }, callback);
  }

  /**
   * Get all categories
   */
  Category.all = function(callback) {
    db.collection(collectionName).find().toArray(function(err, categories) {
      if(err) return callback(err);
      callback(null, categories.map(function(cat) { return new Category(cat); }));
    });
  }

  /**
   * Find category by parent
   */
  Category.findByParent= function(path, callback) {
    db.collection(collectionName).findOne({parent: path}, function(err, doc) {
      if(err) return callback(err, null);
      if(doc == null) return callback(null, null);
      return callback(null, new Category(doc));
    });
  }

  /**
   * Find category instance by category path
   */
  Category.findByCategory= function(path, callback) {
    db.collection(collectionName).findOne({category: path}, function(err, doc) {
      if(err) return callback(err, null);
      if(doc == null) return callback(null, null);
      return callback(null, new Category(doc));
    });
  }

  /**
   * Find all children of a specific category
   */
  Category.findChildrenOf = function(root, options, callback) {
    if(typeof options == 'function') {
      callback = options;
      options = {};
    }

    // Locate the category
    var coll = db.collection(collectionName);
    // Get the category, using covered index
    coll.findOne({category: root}, {fields:{_id: 0, category:1, text: 1}}, function(err, cat) {
      if(err) return callback(err);
      if(cat == null) return callback(new Error(f("category %s does not exist", root)));
      
      // Get the categories directly under the root using only the covered index   
      coll.find({parent: cat.category}
        , {fields: {_id: 0, category: 1, name: 1, text: 1}}).toArray(function(err, docs) {
          if(err) return callback(err);

          // Map the results
          var results = {
              root: new Category(cat)
            , categories: docs.map(function(p) {
              return new Category(p);
            })
          }

          // Return the products but map them to our type first
          callback(null, results);
      });
    });
  }

  return Category;
}

module.exports = init;