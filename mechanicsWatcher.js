(async () => {
    const IrisClient = require('@caleos/iris-client')
    let iris = new IrisClient('wss://testnet.telos.caleos.io/iris-head')
    await iris.connect()
    iris.subscribeAction('eosmechanics::cpu', (message) => console.log(JSON.stringify(message, null, 4)))
})()