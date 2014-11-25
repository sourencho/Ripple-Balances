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
    remote.requestServerInfo(function(error, info) {
        var request = remote.requestAccountInfo(options, function(error, info) {
                if (error) console.log(error);
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

function get_accounts_info(account_addresses) {
    accounts = {}
    async.each(account_addresses, get_account_info.bind(null, accounts), function(error) {
            if(error) callback(error);
            else callback(null, accounts);
    });
}

function get_account_info(accounts, curr_account, cb_acc_info) {
    accounts[curr_account] = {};
    async.parallel([
        // Get account XRP balance
        function(callback) {
            get_acc_bal(curr_account, assign_acc_bal.bind(null, accounts, curr_account, callback));
        }//,
        // Get account lines
        //function(callback) {
        //    get_acc_lines(curr_account, assign_acc_lines.bind(null, accounts, curr_account, callback));
        //}
    ], function (error) {
        if(error) cb_acc_info(error);
        else cb_acc_info();
    });
}