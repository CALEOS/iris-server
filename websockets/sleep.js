module.exports = async function (msToSleep) {
    return new Promise(resolve => setTimeout(resolve, msToSleep));
}