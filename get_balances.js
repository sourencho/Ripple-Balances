var async = require('async');
var args = process.argv.slice(2);

/* Loading ripple-lib with Node.js */
var Remote = require('ripple-lib').Remote;

var remote = new Remote({
    // see the API Reference for available options
    servers: [ 'wss://s1.ripple.com:443' ]
});

var options = {
    account: 'rBTC1BgnrukYh9gfE8uL5dqnPCfZXUxiho',
    ledger: 'validated'
};

remote.connect(function() {
    /* remote connected */
    remote.requestServerInfo(function(err, info) {
        var request = remote.requestAccountInfo(options, function(err, info) {
                if (err) console.log(err);
                else main(args);
        });
    });
});

function main(account_addresses) {
    async.waterfall([
        function(callback) {
            get_accounts_info(account_addresses, callback);
        },
        function(accounts, callback) {
            calculate_totals(accounts, callback)
        }
    ], function (err, result) {
        if (err) console.log(err);
        else console.log(result);
    });
    
    //total_sums = calculate_totals(accounts);

    //print_accounts_info(accounts);
    //print_totals(total_sums);
}

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

// Retunrs on array of currencies each with an aggregate sum
function calculate_totals(accounts, callback)
{
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