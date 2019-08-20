//const Listener = require('./Listener')
const WebSocket = require('ws')
const Channels = require('../routing/Channels')
const Message = require('../routing/Message')
const sleep = require('./sleep')
const fs = require('fs')

/*
#define CHRONICLE_MSGTYPE_FORK          1001
#define CHRONICLE_MSGTYPE_BLOCK         1002
#define CHRONICLE_MSGTYPE_TX_TRACE      1003
#define CHRONICLE_MSGTYPE_ABI_UPD       1004
#define CHRONICLE_MSGTYPE_ABI_REM       1005
#define CHRONICLE_MSGTYPE_ABI_ERR       1006
#define CHRONICLE_MSGTYPE_TBL_ROW       1007
#define CHRONICLE_MSGTYPE_ENCODER_ERR   1008
#define CHRONICLE_MSGTYPE_RCVR_PAUSE    1009
#define CHRONICLE_MSGTYPE_BLOCK_COMPLETED 1010  
https://github.com/cc32d9/eosio_light_api/blob/v2/scripts/lightapi_dbwrite.pl#L215
*/

class ChronicleListener {

    constructor(messageRouter, port = 8800, ackInterval = 100) {
        if (!port)
            throw Error("Port not defined")

        this.port = port
        this.fileCount = 0;
        this.messageRouter = messageRouter
        this.ackInterval = ackInterval
        this.lastAck = 0
        this.lastBlock = 0
    }

    async start() {
        console.log("Starting ChronicleListener")
        this.websocket = new WebSocket.Server({ port: this.port })
        this.websocket.on('connection', this.onConnection.bind(this))
        console.log("Started ChronicleListener, sleeping 1 sec...")
        await sleep(1000)
        console.log("Done sleeping!")
    }

    stop() {
        console.log("Stopping ChronicleListener")
        this.websocket.close()
    }

    onConnection(ws) {
        let _this = this
        this.chronicleConnection = ws
        ws.on('message', function (data) {
            let code = data.readInt32LE(0)
            let msgType = data.readInt32LE(1)
            let msg = data.utf8Slice(2, data.length)
            let msgSubstringed = msg.substring(msg.indexOf("{"), msg.length)
            let msgObj

            switch (code) {
                case 1001:
                    msgObj = JSON.parse(msgSubstringed)
                    _this.lastBlock = msgObj.block_num
                    _this._fork(msgSubstringed)
                    break
                case 1002:
                    _this._block(msgSubstringed)
                    break
                case 1003:
                    _this._txTrace(msgSubstringed)
                    break
                case 1004:
                    _this._abiUpdated(msgSubstringed)
                    break
                case 1005:
                    _this._abiRemoved(msgSubstringed)
                    break
                case 1006:
                    _this._abiError(msgSubstringed)
                    break
                case 1007:
                    _this._row(msgSubstringed)
                    break
                case 1008:
                    _this._encoderError(msgSubstringed)
                    break
                case 1009:
                    _this._receiverPause(msgSubstringed)
                    break
                case 1010:
                    msgObj = JSON.parse(msgSubstringed)
                    _this.lastBlock = msgObj.block_num
                    _this._blockCompleted(msgSubstringed)
                    break
                default:
                    console.error("Unknown code: " + code);
            }

            if (_this.lastBlock - _this.lastAck >= _this.ackInterval)
                _this._ack()

        }.bind(this))
    }

    _ack() {
        console.log(`Acknowledging ${this.lastBlock}`)
        this.lastAck = this.lastBlock
        this.chronicleConnection.send(this.lastBlock)
    }

    _fork(msgSubstringed) {
        let msgObj = JSON.parse(msgSubstringed)
        let block_num = msgObj.block_num
        this.lastBlock = block_num - 1
        this._ack()

        if (!this.messageRouter)
            return

        this.messageRouter.handleMessage(new Message(Channels.FORK, "fork", msgObj))
    }

    _block(msgSubstringed) {
        //console.log(`BLOCK:\n\n${JSON.stringify(msgObj, null, 4)}\n\n`)
    }

    _txTrace(msgSubstringed) {
        if (!this.messageRouter)
            return

        let msgObj = JSON.parse(msgSubstringed)
        if (!msgObj.trace.status == 'executed')
            return

        let block_num = msgObj.block_num
        let block_time = msgObj.block_time
        let trx_id = msgObj.trace.id
        for (var i = 0; i < msgObj.trace.action_traces.length; i++) {
            let trace = msgObj.trace.action_traces[i]
            let account = trace.act.account
            let name = trace.act.name
            // TODO: Is this the right way to avoid inline notifications but not skip inline actions?
            if (trace.receiver != account)
                continue

            let topic = `${account}::${name}`
            this.messageRouter.handleMessage(new Message(Channels.ACTION, topic, {
                block_num, block_time, trace, trx_id
            }))

            if (account == 'eosio.token' && name == 'transfer') {
                let from = trace.act.data.from
                let to = trace.act.data.to
                let quantity = trace.act.data.quantity
                let memo = trace.act.data.memo
                let data = { from, to, quantity, memo, block_num, block_time, trace, trx_id }
                this.messageRouter.handleMessage(new Message(Channels.TRANSFER, from, data))
                this.messageRouter.handleMessage(new Message(Channels.TRANSFER, to, data))
            }
        }
    }

    _abiUpdated(msgSubstringed) {

    }

    _abiRemoved(msgSubstringed) {

    }

    _abiError(msgSubstringed) {

    }

    _row(msgSubstringed) {
        let msgObj = JSON.parse(msgSubstringed)
        // TODO: Figure out a way to not send 2 messages and still support the wildcard on scope... 
        // maybe this is the most efficient way to do it but should double check
        this.messageRouter.handleMessage(new Message(Channels.ROW, `${msgObj.kvo.code}::${msgObj.kvo.scope}::${msgObj.kvo.table}`, msgObj))
        this.messageRouter.handleMessage(new Message(Channels.ROW, `${msgObj.kvo.code}::*::${msgObj.kvo.table}`, msgObj))
    }

    _encoderError(msgSubstringed) {

    }

    _receiverPause(msgSubstringed) {

    }

    _blockCompleted(msgSubstringed) {
        //console.log(`BLOCK COMPLETED:\n\n${JSON.stringify(msgObj, null, 4)}\n\n`)
    }

}

module.exports = ChronicleListener
