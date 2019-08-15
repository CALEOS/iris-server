class Message {

    constructor(channel, topic, message) {
        this.channel = channel
        this.topic = topic
        this.message = message
    }

    getChannel() {
        return this.channel
    }

    getTopic() {
        return this.topic
    }

    getMessage() {
        return this.message
    }
}

module.exports = Message