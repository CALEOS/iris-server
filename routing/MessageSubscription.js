const crypto = require('crypto')
const Channels = require('./Channels')

class MessageSubscription {

    constructor(channel, topic, handler, id) {
        this.channel = channel
        this.topic = topic
        this.handler = handler
        this.id = id ? id : crypto.randomBytes(16).toString("hex")
    }

    static actionSubscription(contract, action, handler) {
        return new MessageSubscription(Channels.ACTION, `${contract}::${action}`, handler)
    }

    static transferSubscription(account, handler) {
        return new MessageSubscription(Channels.TRANSFER, account, handler)
    }

    setHandler(handler) {
        this.handler = handler
    }

    getChannel() {
        return this.channel
    }

    getTopic() {
        return this.topic
    }

    handle(message) {
        this.handler(message)
    }

    getId() {
        return this.id
    }

    static fromObj(obj) {
        if (typeof obj === 'string')
            obj = JSON.parse(obj)

        return new MessageSubscription(obj.channel, obj.topic, obj.handler, obj.id)
    }

    isValid() {
        return this.channel && this.topic && this.id
    }

    toJSON() {
        return JSON.stringify({
            channel: this.channel,
            topic: this.topic,
            id: this.id
        })
    }

}

module.exports = MessageSubscription