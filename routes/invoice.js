var Invoice = require('../models/invoice')();

/*
 * Show Invoice
 */
exports.index = function(req, res) {
  Invoice.fetchOneById(req.params.id, function(err, invoice) {
    if(err) throw err;
    // Render the invoice list
    res.render('./invoice/index', { 
        invoice: invoice
      , error: err
    });    
  });
}