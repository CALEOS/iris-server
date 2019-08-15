const { MessageRouter, MessageSubscription } = require('./index')

let mr = new MessageRouter()

let testSubscription = MessageSubscription.actionSubscription('eosio.token', 'issue', function (message) {
    console.log(`ACTION - eosio.token::issue message - ${JSON.stringify(message, null, 4)}`)
})

let testSubscriptionNewAccount = MessageSubscription.actionSubscription('eosio', 'newaccount', function (message) {
    console.log(`ACTION - eosio.token::newaccount message - ${message.trace.act.data.name}`)
})

let testSubscriptionTransfer = MessageSubscription.transferSubscription('tf', function (message) {
    console.log(`TRANSFER - message - ${JSON.stringify(message)}`)
})

mr.subscribe(testSubscription)
//mr.subscribe(testSubscriptionNewAccount)
mr.subscribe(testSubscriptionTransfer)

mr.start()