// var AWS = require('aws-sdk');

// // Load the configuration file
// AWS.config.loadFromPath(__dirname + '/../aws-config.json');

// console.dir(AWS)

var util = require('util'),
		fs = require('fs'),
    OperationHelper = require('apac').OperationHelper;

var obj = JSON.parse(fs.readFileSync(__dirname + "/../aws-config.json", 'utf8'));

var opHelper = new OperationHelper({
    awsId:     obj.accessKeyId,
    awsSecret: obj.secretAccessKey,
    assocId:   obj.assocId
    // xml2jsOptions: an extra, optional, parameter for if you want to pass additional options for the xml2js module. (see https://github.com/Leonidas-from-XIV/node-xml2js#options)
});


// execute(operation, params, callback, onError)
// operation: select from http://docs.aws.amazon.com/AWSECommerceService/latest/DG/SummaryofA2SOperations.html
// params: parameters for operation (optional)
// callback(parsed, raw): callback function handling results. parsed = xml2js parsed response. raw = raw xml response
// onError: function handling errors, otherwise all error messages are printed with console.log()
var fetchNumberOfTotalPages = function(keyword, callback) {
	opHelper.execute('ItemSearch', {
	  'SearchIndex': 'Books',
	  'Keywords': keyword,
	  'Condition': 'All',
	  'ResponseGroup': 'Images,Large'
	}, function(object) { // you can add a second parameter here to examine the raw xml response
	    callback(null, parseInt(object.ItemSearchResponse.Items[0].TotalPages[0], 10));
	});	
}

// Fetch pages
var fetchPage = function(keyword, index, totalPages, callback) {
  // Are we done 
  if(index == totalPages) {
    return callback(null, null);
  }

  // Get the page
	opHelper.execute('ItemSearch', {
	  'SearchIndex': 'Books',
	  'Keywords': keyword,
	  'Condition': 'All',
	  'ReviewsPage': "" + index,
	  'ResponseGroup': 'Images,Large'
	}, function(results) {
			console.log("= FETCHED PAGE " + index + " for " + keyword);
			// Write the data out to disk
	    fs.writeFileSync(__dirname + "/../data/" + keyword + "_" + index + ".json", JSON.stringify(results, null, 2), 'utf8');	    
	    // Fetch the next page
	    setTimeout(function() {
		    fetchPage(keyword, index + 1, totalPages, callback);
	    }, 100);
	});		
}

// Fetch by keywords
var fetchByKeywords = function(keywords, callback) {
	if(keywords.length == 0) {
		return callback(null, null);
	}
	
	// Get the keyword
	var keyword = keywords.shift();
	
	// Fetch the total number of pages
	fetchNumberOfTotalPages(keyword, function(err, totalPages) {
		console.log("= START FETCHING");
		totalPages = totalPages > 10 ? 10 : totalPages;

		fetchPage(keyword, 0, totalPages, function() {
			fetchByKeywords(keywords, callback)
		});
	});
};

fetchByKeywords(['scifi', 'history', 'cooking', 'programming'], function() {
	console.log("= DONE");	
});

