var f = require('util').format
  , ObjectID = require('mongodb').ObjectID;

// Store the db instance
var db = null;
var collectionName = 'invoices';

//
// Initialize the type
var init = function(_db) {
  if(_db) db = _db;

  var Invoice = function(object) {
    for(var name in object) {
      this[name] = object[name];
    } 
  }

  /**
   * Initialize the model at application startup
   */
  Invoice.init = function(callback) {
    callback();
  }

  /**
   * Fetch an invoice by id
   */
  Invoice.fetchOneById = function(id, callback) {
    id = typeof id == 'string' ? new ObjectID(id) : id;

    db.collection(collectionName).findOne({_id: id}, function(err, doc) {
      if(err) return callback(err);
      if(doc == null) return callback(new Error(f("could not locate invoice with id %s", id)));
      callback(null, new Invoice(doc));
    });
  }

  /**
   * Create an Invoice
   */
  Invoice.create = function(fields, callback) {
    // TODO
  }

  return Invoice;
}

module.exports = init;