const EventEmitter = require('events')

const createSagaBackend = (fetch, onDone, extra = {}) => {
    return {
        fetch,
        onDone,
        ...extra
    }
}

const createInMemoryBackend = () => {
    const _mem = {}

    return createSagaBackend(
        async (id, or) => {
            return _mem[id] || or
        },
        async (id, { currentName, currentArgs, currentNode }) => {
            _mem[id] = { currentName, currentArgs, currentNode }
        }
    )
}

const createTestBackend = () => {
    const ee = new EventEmitter()

    return createSagaBackend(
        async (id, or) => or,
        async (data) => {
            ee.emit('done', data)
        },
        {
            getPromise: () => {
                return new Promise((resolve) => {
                    ee.once('done', resolve)
                })
            }
        }
    )
}

module.exports = {
    createSagaBackend,
    createInMemoryBackend,
    createTestBackend,
}