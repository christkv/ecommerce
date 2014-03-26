var util = require('util'),
    fs = require('fs'),
    OperationHelper = require('apac').OperationHelper;

var AwsDump = function(options) {
  options = options || {};
  var config = options.config || __dirname + "/../../aws-config.json"
  var out = options.out || __dirname + "/../data";
  var interval = options.interval || 100;

  // Read config
  var obj = JSON.parse(fs.readFileSync(config, 'utf8'));

  // Set up helper
  var opHelper = new OperationHelper({
      awsId:     obj.accessKeyId,
      awsSecret: obj.secretAccessKey,
      assocId:   obj.assocId
  });

  // Fetch the total number of pages
  var fetchNumberOfTotalPages = function(keyword, searchIndex, callback) {
    opHelper.execute('ItemSearch', {
      'SearchIndex': searchIndex,
      'Keywords': keyword,
      'Condition': 'All',
      'ResponseGroup': 'Images,Large'
    }, function(object) { // you can add a second parameter here to examine the raw xml response
        callback(null, parseInt(object.ItemSearchResponse.Items[0].TotalPages[0], 10));
    }); 
  }

  // Fetch pages
  var fetchPage = function(keyword, searchIndex, index, totalPages, callback) {
    // Are we done 
    if(index == totalPages) {
      return callback(null, null);
    }

    // Get the page
    opHelper.execute('ItemSearch', {
      'SearchIndex': searchIndex,
      'Keywords': keyword,
      'Condition': 'All',
      'ReviewsPage': "" + index,
      'ResponseGroup': 'Images,Large'
    }, function(results) {
        console.log("= FETCHED PAGE " + index + " for " + keyword);
        // Write the data out to disk
        fs.writeFileSync(out + "/" + keyword + "_" + index + ".json", JSON.stringify(results, null, 2), 'utf8');      
        // Fetch the next page
        setTimeout(function() {
          fetchPage(keyword, searchIndex, index + 1, totalPages, callback);
        }, interval);
    });   
  }

  // Fetch by keywords
  var fetchByKeywords = function(keywords, searchIndex, callback) {
    if(keywords.length == 0) {
      return callback(null, null);
    }
    
    // Get the keyword
    var keyword = keywords.shift();
    
    // Fetch the total number of pages
    fetchNumberOfTotalPages(keyword, searchIndex, function(err, totalPages) {
      console.log("= START FETCHING");
      totalPages = totalPages > 10 ? 10 : totalPages;

      fetchPage(keyword, searchIndex, 0, totalPages, function() {
        fetchByKeywords(keywords, searchIndex, callback)
      });
    });
  };

  //
  // Fetch data from amazon
  this.fetch = function(keywords, searchIndex, callback) {
    fetchByKeywords(keywords, searchIndex, callback);
  }
}

module.exports = AwsDump;