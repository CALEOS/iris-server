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

### IrisServer

There are many ways to run IrisServer, a future goal is to use `pm2` to manage both chronicle and iris-server since chronicle will shutdown if the iris port becomes unavailable.

For now, the easiest way to run it is via nohup, change `LOG_FILE` to suit your needs:

```
LOG_FILE="/var/log/iris-server.log"
nohup node iris/IrisServer.js >> "$LOG_FILE" 2>&1 &
```

NOTE: You can pass arguments to `IrisServer`:

```
$node iris/IrisServer.js --help

Iris Server

  A web socket EOSIO streaming service

Options

  -h, --help                    Display this usage guide.
  -c, --chronicle-port number   The port to listen on for incoming connection from chronicle, this is the
                                exp-ws-port value from chronicle's config.ini (default 8800).
  -w, --web-port number         The port that will be exposed to the web for incoming websocket clients
                                (default 8880).

  Project home: https://github.com/CALEOS/iris-server
```