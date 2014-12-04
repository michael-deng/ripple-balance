var Remote = require('ripple-lib').Remote;

var options = {
  trace :         false,
  trusted:        true,
  local_signing:  true,
  servers: [
    { host: 's-west.ripple.com', port: 443, secure: true }
  ]
};

var remote = new Remote(options);

remote.connect(function(err, res) {
  /* remote connected, use some remote functions here */
});


var totalXRP = 0;
var totalIOU = new Object();

var requestsCompleted = 0;


/**
*  Prints the XRP balance of a certain account given the request options as the parameter
*/
var printXRPBalance = function(options, callback) {
	var request = remote.requestAccountInfo(options, function(err, info) {
		requestsCompleted += 1;
		if (err) return console.log(err);
		balance = info.account_data.Balance;
		console.log('Balance Information for Account ' + options.account + ':\n');
		logBalance(balance, 'XRP');
		callback(balance);
	});
};

/**
*  Prints the IOU balance of a certain account given the request options as the parameter
*/
var printIOUBalance = function(options, callback) {
	remote.requestAccountLines(options, function(err, info) {
		requestsCompleted += 1;
		if (err) return console.log(err);
		var trustlines = info.lines;
		var totalBalance = new Object();

		// Iterate through the trustlines and aggregates the balances and currency types
		for (var index = 0; index < trustlines.length; index++) {
			balance = trustlines[index].balance;
			currency = trustlines[index].currency;
			if (totalBalance[currency]) {
				totalBalance[currency] += balance;
			} else {
				totalBalance[currency] = balance;
			}
		}
		for (currency in totalBalance) {
			logBalance(totalBalance[currency], currency);
		}
		console.log('\n');
		callback(totalBalance);
	});
}

/**
*  Iterates through the accounts and prints their balances
*/
var accountBalances = function(args) {
	flag = 2 * (args.length - 2);
	for (var index = 2; index < args.length; index++) {
		var accountName = args[index];
		var options = { account: accountName };
		printXRPBalance(options, sumXRP);
		printIOUBalance(options, sumIOU);
	}
}

/**
*  Sums up the total XRP balance and prints the final balance once all requests are complete
*/
var sumXRP = function(balance) {
	totalXRP += balance;
	if (requestsCompleted == flag) {
		logEndBalance(totalXRP, totalIOU);
	}
}

/**
*  Sums up the total IOU balances and prints the final balance once all requests are complete
*/
var sumIOU = function(balance) {
	for (currency in balance) {
		if (totalIOU[currency]) {
			totalIOU[currency] += balance[currency];
		} else {
			totalIOU[currency] = balance[currency];
		}
	}
	if (requestsCompleted == flag) {
		logEndBalance(totalXRP, totalIOU);
	}
}

/**
*  Prints balance information in a readable format
*/
var logBalance = function(balance, currencyType) {
	console.log(balance + ' ' + currencyType);
}

/**
*  Prints final balance information in a readable format
*/
var logEndBalance = function(endXRP, endIOU) {
	console.log('TotalBalanceInformation:');
	logBalance(endXRP, 'XRP');
	for (currency in endIOU) {
		logBalance(endIOU[currency], currency);
	}
}

accountBalances(process.argv);


