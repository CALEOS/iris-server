const crypto = require('crypto')
const MessageSubscription = require('../routing/MessageSubscription')
const jsonrpc = '2.0'
/*
This follows the JSON RPC 2.0 spec https://www.jsonrpc.org/specification

== JSON RPC 2.0 Error codes ==
-32700	Parse error	Invalid JSON was received by the server.
An error occurred on the server while parsing the JSON text.
-32600	Invalid Request	The JSON sent is not a valid Request object.
-32601	Method not found	The method does not exist / is not available.
-32602	Invalid params	Invalid method parameter(s).
-32603	Internal error	Internal JSON-RPC error.
-32000 to -32099	Server error	Reserved for implementation-defined server-errors.
*/
class ClientConnection {

    constructor(ws, clientListener) {
        this.debug = true
        this.websocket = ws
        this.clientListener = clientListener
        this.id = crypto.randomBytes(16).toString("hex")
        this.websocket.on('close', this.onClose.bind(this))
        this.websocket.on('message', this.onMessage.bind(this))
        this.subscriptions = {}
    }

    onClose() {
        this.clientListener.connectionClosed(this.id)
    }

    onMessage(message) {
        try {
            let messageObj = JSON.parse(message)
            if (Array.isArray(messageObj)) {
                let responses = []
                messageObj.forEach((msg) => responses.push(this.getResponseMessage(msg)))
                this.websocket.send(JSON.stringify(responses))
            } else {
                this.websocket.send(JSON.stringify(this.getResponseMessage(messageObj)))
            }
        } catch (e) {
            this.websocket.send(JSON.stringify(this.messageError(null, -32700, message, `Error parsing received message as JSON: ${e}`)))
        }
    }

    getId() {
        return this.id
    }

    getResponseMessage(messageObj) {
        if (messageObj.jsonrpc != '2.0')
            return this.messageError(null, -32600, messageObj, `JSON was not marked as "rpc: '2.0'"`)

        if (messageObj.method == 'subscribe')
            return this.handleSubscribe(messageObj)

        if (messageObj.method == 'unsubscribe')
            return this.handleUnsubscribe(messageObj)
    }

    getSubscriptions(){
        return this.subscriptions
    }

    handleSubscribe(messageObj) {
        let subscription = MessageSubscription.fromObj(messageObj.params)
        if (!subscription.isValid()) {
            return this.messageError(messageObj.id, -32602, messageObj, 'Invalid subscription')
        }

        subscription.setHandler((message) => {
            this.handler(subscription, message)
        })
        this.subscriptions[subscription.getId()] = subscription
        this.clientListener.subscribe(subscription)
        return this.responseMessage(messageObj.id, {
            subscriptionId: subscription.getId()
        })
    }

    handleUnsubscribe(messageObj) {
        let subscriptionId = messageObj.params.subscriptionId
        if (!this.subscriptions.hasOwnProperty(subscriptionId))
            return this.messageError(messageObj.id, -32602, messageObj, `Unknown subscription id ${subscriptionId}`)

        let messageSubscription = this.subscriptions[subscriptionId]
        this.clientListener.unsubscribe(messageSubscription)
        delete this.subscriptions[subscriptionId]
        return this.responseMessage(messageObj.id, {
            unsubscribed: true
        })
    }

    handler(subscription, message) {
        this.websocket.send(JSON.stringify(this.notificationMessage('subscription', {
            channel: subscription.getChannel(),
            topic: subscription.getTopic(),
            id: subscription.getId(),
            message
        })))
    }

    notificationMessage(method, params) {
        return {
            jsonrpc,
            method,
            params
        }
    }

    responseMessage(id, result) {
        return {
            jsonrpc,
            id,
            result
        }
    }

    messageError(id, code, receivedMessage, errorMessage) {
        //<-- {"jsonrpc": "2.0", "error": {"code": -32601, "message": "Method not found"}, "id": "1"}
        let errorObj = {
            id,
            jsonrpc,
            error: { code, errorMessage, receivedMessage },
        }

        if (this.debug)
            console.error(`Failue with client message:\n\n ${JSON.stringify(errorObj, null, 4)}\n\n`)

        return errorObj
    }


}

module.exports = ClientConnection