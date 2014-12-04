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

var requestsCompleted = 0;  // Keeps track of the number of requests made

/**
*  Iterates through the accounts and prints their balances
*/
var accountBalances = function(args) {
	totalRequests = 2 * (args.length - 2);  // The number of total requests made
	for (var index = 2; index < args.length; index++) {
		var accountName = args[index];
		var options = { account: accountName };
		printXRPBalance(options, sumXRP);
		printIOUBalance(options, sumIOU);
	}
}

/**
*  Prints the XRP balance of a certain account given the request options as the parameter
*/
var printXRPBalance = function(options, callback) {
	var request = remote.requestAccountInfo(options, function(err, info) {
		requestsCompleted += 1;
		if (err) return console.log(err);
		balance = parseFloat(info.account_data.Balance);  // parseFloat is necessary because account_data.Balance is originally a string
		console.log('\nBalance Information for Account ' + options.account + ':\n');
		if (balance != 0) {
			logBalance(balance, 'XRP');
			return callback(balance);
		}
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
			balance = parseFloat(trustlines[index].balance);  // parseFloat is necessary because lines.balance is originally a string
			currency = trustlines[index].currency;
			if (totalBalance[currency]) {
				totalBalance[currency] += balance;
			} else {
				totalBalance[currency] = balance;
			}
		}
		for (currency in totalBalance) {
			if (totalBalance[currency] === 0) {
				delete totalBalance[currency];  // Delete zero value balances
			} else {
				logBalance(totalBalance[currency], currency);
			}
		}
		console.log();
		return callback(totalBalance);
	});
}

/**
*  Sums up the total XRP balance and prints the final balance once all requests are complete
*/
var sumXRP = function(balance) {
	totalXRP += balance;

	// Prints the final balance if all requests have been made
	if (requestsCompleted === totalRequests) {
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

	// Prints the final balance if all requests have been made
	if (requestsCompleted === totalRequests) {
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
	console.log('\nAggregated Balance Information:\n');
	logBalance(endXRP, 'XRP');
	for (currency in endIOU) {
		logBalance(endIOU[currency], currency);
	}
}


// The actual call that returns the balance informations
accountBalances(process.argv);