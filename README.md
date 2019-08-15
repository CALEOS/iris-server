## Setup

### Nodeos
Setup a node with state-history enabled running `1.8.1` or newer (this assumes that with versions newer than 1.8.1 the state-history plugin's format does not change as it did with the release candidates of 1.8.x).

### Chronicle
Follow instructions to run https://github.com/EOSChronicleProject/eos-chronicle on Ubuntu 18.10, use the master branch which supports nodeos 1.8.1.  

There is a `docker` directory in this repository that contains a `Dockerfile` and `config.ini` that can be used to run chronicle in docker.

The config file as follows, note this is for running in docker, update the exp-ws-host value if running locally or on a server different than this chronicle-filter project:
```
root@56bbf7b00647:/# cat /home/eosio/chronicle-config/config.ini
# connection to nodeos state_history_plugin
host = <NODEOS_STATE_HISTORY_HOST>
port = <NODEOS_STATE_HISTORY_PORT>
mode = scan
plugin = exp_ws_plugin
exp-ws-host = <IRIS_SERVER_HOST>
exp-ws-port = <IRIS_SERVER_PORT>
exp-ws-bin-header = true
```

DOCKER NOTE: `host.docker.internal` is not supported for linux. Set `exp-ws-host = localhost` and issue the Docker `run` command with `--network=host`

### Iris Server
TODO: this

## Architecture
As a stream of events is received from chronicle, each is converted to one or more messages, each of these is compared against a collection of subscriptions to see if there is any interest for the given message.  A subscription has 2 attributes, the channel and the topic.  Currently there are just 2 channels, actions and rows.  For each channel there is a format for the topic.  For actions the format is `contractname::contractaction` for instance `eosio.token::transfer` would be a familiar one.  For rows the format is `contractname::tablescope::tablename` where `eosio.token::myaccount123::accounts` would be a familiar one.  The middle layer known as `MessageRouter` is what manages the `MessageSubscription` objects and calls the `handle` method when an interesting message comes along.  In the case of the `ClientListener` that `handle` function sends the message out to the websocket client(s) who had subscribed, but in other implementations where this is running on a server, the `MessageSubscription.handle` method could be doing anything, such as updating a database, sending an email or sending out messages via a Telegram bot.

## Classes

### MessageRouter
The `MessageRouter` is what tracks subscriptions, receives messages from chronicle and dispatches them to the interested subscriptions

### ChronicleListener
The `ChronicleListener` receives messages from chronicle, converts the messages based on their message code into the messages that the `MessageRouter` understands, and hands them off to the `MessageRouter`.  The `ChronicleListener` also handles sending acknowledgement of blocks back to chronicle

### ClientListener
The `ClientListener` is not neccessary if the implementation is as a server side subscriber and not a web facing subscription service, it's role is to receive connections, track each as a `ClientConnection`, proxy subscriptions from a given `ClientConnection` to the `MessageRouter` and to unsubscribe subscriptions when that `ClientConnection` closes.
