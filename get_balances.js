var async = require('async');
var args = process.argv.slice(2);

/* Loading ripple-lib with Node.js */
var Remote = require('ripple-lib').Remote;

var remote = new Remote({
    // see the API Reference for available options
    servers: [ 'wss://s1.ripple.com:443' ]
});

remote.connect(function() {
    /* remote connected */
    remote.requestServerInfo(function(err, info) {
        if (err) console.log(err);
        else main(args, remote);
    });
});

// Main function that get's account info and prints it out
function main(account_addresses, remote) {
    async.waterfall([
        function(callback) {
            get_accounts_info(account_addresses, callback);
        },
        function(accounts, callback) {
            calculate_totals(accounts, callback)
        }
    ], function (err, result) {
        if (err) callback(err);
        else {
            output_results(result);
            remote.disconnect();
        }
    });
}

// Returns accounts object of this form: 
//  { acc_addr1: [balance1, balance2, ... ], acc_addr2: [balance1, balance2, ... ], ... }
function get_accounts_info(account_addresses, callback) {
    accounts = {}
    async.map(account_addresses, get_account_info, function(err, account_array) {
            if(err) callback(err);
            else {
                for (var i = 0; i < account_array.length; i++) {
                    accounts[account_array[i][0]] = account_array[i][1]
                }
                callback(null, accounts);
            }
    });
}

// Returns an array in this form: [account_address, balances]
function get_account_info(curr_account, cb_acc_info) {
    async.parallel([
        // Get account XRP balance
        function(callback) {
            get_acc_bal(curr_account, callback);
        },
        // Get account balances from lines
        function(callback) {
            get_acc_lines(curr_account, callback);
        }
    ], function (err, balances) {
        if(err) cb_acc_info(err);
        else {
            total_balances = balances[0].concat(balances[1])
            cb_acc_info(null, [curr_account, total_balances]);
        }
    });
}

// Returns array of account balance
function get_acc_bal(acc_address, callback) {
    var options = {
        account: acc_address,
        ledger: 'validated'
    };
    var request = remote.requestAccountInfo(options, function(err, info) {
        if (err) {
            callback(err);
        }
        else {
            balance = {};
            balance.currency = "XRP"
            balance.value = info.account_data.Balance/1000000.0
            balance.counterparty = ""
            callback(null, [balance]);      
        }
    });
}

// Returns array of line balances
function get_acc_lines(acc_address, callback) {
    var options = {
        account: acc_address,
        ledger: 'validated'
    };
    var request = remote.requestAccountLines(options, function(err, info) {
        if (err) {
            callback(err);
        }
        else {
            balances = []
            for (var i = 0; i < info.lines.length; i++)
            {
                curr_bal = info.lines[i];
                balance = {};
                balance.currency = curr_bal.currency;
                balance.value = curr_bal.balance;
                balance.counterparty = curr_bal.account;
                balances.push(balance)
            }
            callback(null, balances);
        }
    });
}

// Returns an array in this form: [accounts, total_sums]
function calculate_totals(accounts, callback){
    var total_sums = {};
    for (var account in accounts)
        for (var i = 0; i < accounts[account].length; i++) {
            curr_currency = accounts[account][i].currency
            curr_value = accounts[account][i].value
            // Keep track of aggregated value
            if (curr_currency in total_sums){
                total_sums[curr_currency] += parseFloat(curr_value);
            }
            else {
                total_sums[curr_currency] = parseFloat(curr_value);
            }
        }
    callback(null, [accounts, total_sums])
}

// Outputs results
function output_results(results) {
    accounts = results[0];
    total_sums = results[1];

    // Output accounts
    for (var account in accounts) {
        // Print out current account
        console.log("Account: " + account);
        for (var i = 0; i < accounts[account].length; i++) {
            // Print out current balance
            curr_counterp = accounts[account][i].counterparty
            curr_currency = accounts[account][i].currency
            curr_value = accounts[account][i].value
            console.log("\tCounterparty: " + curr_counterp);
            console.log("\tCurrency: " + curr_currency);
            console.log("\tValue: " + curr_value);
            console.log();
        }
    }

    // Output total sums
    console.log("Aggregated sums:");
    for (var currency in total_sums) {
        console.log("\t" + currency + ": " + total_sums[currency]);
    }
}