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
                else
                {
                        main(args);
                }
        });
    });
});

function main(account_addresses) {
    accounts = get_accounts_info(account_addresses);
    //total_sums = calculate_totals(accounts);

    //print_accounts_info(accounts);
    //print_totals(total_sums);
}

function get_accounts_info(account_addresses, callback) {
    accounts = {}
    async.each(account_addresses, get_account_info.bind(null, accounts), function(err) {
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
        }
        //,
        // Get account lines
        //function(callback) {
        //    get_acc_lines(curr_account, assign_acc_lines.bind(null, accounts, curr_account, callback));
        //}
    ], function (err) {
        if(err) cb_acc_info(err);
        else cb_acc_info();
    });
}

// Returns account balance
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

// Assigns balance to account in accounts
function assign_acc_bal(accounts, curr_account, callback, error, balance) {
    if (error) console.log(error);
    else {
        accounts[curr_account].balances.push(balance)
        callback(null);
    }
}