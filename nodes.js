const { saga, ACTION_CONTINUE, ACTION_STOP } = require('./saga')

const exec = (fn) => {
    const ref = saga()

    ref.op = ({ name, args }) => {
        fn(...args)
        return {
            action: ACTION_CONTINUE,
            args,
        }
    }

    return ref
}

const get = (listenToEventName) => {
    const ref = saga()

    ref.op = ({ name, args }) => {
        return {
            action: name === listenToEventName ? ACTION_CONTINUE : ACTION_STOP,
            args,
        }
    }

    return ref
}

module.exports = {
    exec,
    get,
}