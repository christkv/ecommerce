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

  return Invoice;
}

module.exports = init;