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

opHelper.execute('ItemSearch', {
  'SearchIndex': 'Books',
  'Keywords': 'scifi',
  'ResponseGroup': 'Images,Large'
}, function(results) { // you can add a second parameter here to examine the raw xml response
    // console.log(JSON.stringify(results, null, 2));
    fs.writeFileSync(__dirname + "/../data.json", JSON.stringify(results, null, 2), 'utf8');
});