const ClientConnection = require('./ClientConnection')
const WebSocket = require('ws')
const sleep = require('./sleep')

class ClientListener {

    constructor(messageRouter, port = 8080) {
        this.messageRouter = messageRouter
        this.port = port
        this.clientConnections = {}
    }

    async start() {
        console.log("Starting ClientListener")
        this.websocket = new WebSocket.Server({ port: this.port })
        this.websocket.on('connection', this.onConnection.bind(this))
        console.log("Started ClientListener, sleeping 1 sec...")
        await sleep(1000)
        console.log("Done sleeping!")
    }

    stop() {
        console.log("Stopping ClientListener")
        this.websocket.close()
    }

    subscribe(messageSubscription) {
        this.messageRouter.subscribe(messageSubscription)
    }

    unsubscribe(messageSubscription) {
        this.messageRouter.unsubscribe(messageSubscription)
    }

    onConnection(ws) {
        let connection = new ClientConnection(ws, this)
        this.clientConnections[connection.getId()] = connection
    }

    connectionClosed(connectionId) {
        let clientConnection = this.clientConnections[connectionId]
        if (!clientConnection)
            return

        let subscriptions = clientConnection.getSubscriptions()
        for (let i = 0; i < subscriptions.length; i++)
            this.unsubscribe(subscriptions[i])

        delete this.clientConnections[connectionId]    
    }

}

module.exports = ClientListener