Contributing to the iris-server project
===================================

Pull requests are always welcome and appreciated.

Discussion of the project currently happens in Telegram https://t.me/joinchat/Ht9Z8FDg2drodb9_r5k35Q

To run tests you'll also need to download the test data, contained in a separate repository https://github.com/CALEOS/iris-server-test-data.git


## Architecture

As a stream of events is received from chronicle, each is converted to one or more messages, each of these is compared against a collection of subscriptions to see if there is any interest for the given message. A subscription has 2 attributes, the channel and the topic. Currently there are just 2 channels, actions and rows. For each channel there is a format for the topic. For actions the format is `contractname::contractaction` for instance `eosio.token::transfer` would be a familiar one. For rows the format is `contractname::tablescope::tablename` where `eosio.token::myaccount123::accounts` would be a familiar one. The middle layer known as `MessageRouter` is what manages the `MessageSubscription` objects and calls the `handle` method when an interesting message comes along. In the case of the `ClientListener` that `handle` function sends the message out to the websocket client(s) who had subscribed, but in other implementations where this is running on a server, the `MessageSubscription.handle` method could be doing anything, such as updating a database, sending an email or sending out messages via a Telegram bot.

## Classes

### MessageRouter

The `MessageRouter` is what tracks subscriptions, receives messages from chronicle and dispatches them to the interested subscriptions

### ChronicleListener

The `ChronicleListener` receives messages from chronicle, converts the messages based on their message code into the messages that the `MessageRouter` understands, and hands them off to the `MessageRouter`. The `ChronicleListener` also handles sending acknowledgement of blocks back to chronicle

### ClientListener

The `ClientListener` is not neccessary if the implementation is as a server side subscriber and not a web facing subscription service, it's role is to receive connections, track each as a `ClientConnection`, proxy subscriptions from a given `ClientConnection` to the `MessageRouter` and to unsubscribe subscriptions when that `ClientConnection` closes.
