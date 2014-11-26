Ripple-Balances
===============

###Dependencies:

  Run: `npm install`
  
  Uses: async and ripple-lib
  
  
###Run:

  `node get_balances.js [ACCOUNT_ADDRESS...]`
  
  note: you can input several account addresses
  
###Description:

  Given account addresses, the program will output each accounts balances and also an aggregate sum for each currency present in these accounts.
  
  Balances of zero will not be outputted as to make the output less cluttered.
  
###Implementation:

  I used async to deal with the various callbacks. It prevented nested (pyramid) callbacks.
  The code is fairly simple, it makes parallel requests to the ripple server and collects the information about the accounts inputed.
  After storing the data collected, the total sum is calculated and all the data is outputted.
  
  
  This took me about 4 hours, most of which was spent on figuring out how node and callbacks work because I had very little experience beforehand.
  
