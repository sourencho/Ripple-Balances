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
    async.series([
        function(callback) {
            get_accounts_info(account_addresses, callback);
        },
        function(callback) {
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
    async.each(account_addresses, get_account_info.bind(null, accounts), 
        function(err) {
            if(err) callback(err);
            else callback(null, accounts);
    });
}

function get_account_info(accounts, curr_account, cb_acc_info) {
    accounts[curr_account] = {};
    accounts[curr_account].balances = [];
    async.parallel([
        // Get account XRP balance
        function(callback) {
            get_acc_bal(curr_account, assign_acc_bal.bind(null, accounts, curr_account, callback));
        },
        // Get account lines
        function(callback) {
            get_acc_lines(curr_account, assign_acc_lines.bind(null, accounts, curr_account, callback));
        }
    ], function (err) {
        if(err) cb_acc_info(err);
        else cb_acc_info();
    });
}

// Returns account balance object
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
            callback(null, balance);      
        }
    });
}

// Returns account line balances array
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
            blanaces = []
            for (var curr_bal in info.lines)
            {
                balance = {};
                balance.currency = curr_bal.currency;
                balance.value = curr_bal.balance;
                balance.counterparty = curr_bal.account;
                blanaces.push(balance)
            }
            callback(null, blanaces);
        }
    });
}

// Assigns balance to account in accounts
function assign_acc_bal(accounts, curr_account, callback, error, balance) {
    if (error) console.log(error);
    else {
        accounts[curr_account].balances.push(balance)
        callback(null, accounts);  
    }
}

// Assigns balances to account in accounts
function assign_acc_lines(accounts, curr_account, callback, error, balances) {
    if (error) console.log(error);
    else {
        for (var i = 0; i < balances.length; i++) {
            accounts[curr_account].balances.push(balances[i])
        }
        callback(null, accounts);
    }
}

// Retunrs on array of currencies each with an aggregate sum
function calculate_totals(accounts, callback)
{
    var total_sums = {};
    for (var i = 0; i < accounts[account].balances.length; i++) {
        // Keep track of aggregated value
        if (curr_currency in total_sums){
            total_sums[curr_currency] += parseFloat(curr_value);
        }
        else {
            total_sums[curr_currency] = parseFloat(curr_value);
        }
    }
    callback(null, total_sums)
}