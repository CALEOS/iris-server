const fs = require('fs')
const path = require('path')
const WebSocket = require('ws')
const sleep = require('../websockets/sleep')
const filesPerSleep = 1000;

class DataPump {
    constructor(targetChroniclePort = 8800, fileCount = 93627, path = './test/data/') {
        this.fileCount = fileCount
        this.targetChroniclePort = targetChroniclePort
        this.path = path
    }

    async connect() {
        return new Promise((resolve, reject) => {
            this.websocket = new WebSocket(`ws://localhost:${this.targetChroniclePort}`)
            this.websocket.on('open', resolve)
        })
    }

    async pump() {
        await this.connect()
        for (let i = 0; i < this.fileCount; i++) {
            let fileName = this.path + i
            let data = fs.readFileSync(fileName)
            this.websocket.send(data)
            if (i % filesPerSleep == 0) {
                process.stdout.write(`Sent ${i * filesPerSleep} files\r`)
                await sleep(10)
            }
        }
        this.stop()
    }

    stop() {
        console.log("Stopping pump")
        this.websocket.close()
    }
}

module.exports = DataPump