const { runCLI } = require("@jest/core")

const ACTION_CONTINUE = 'continue'
const ACTION_STOP = 'stop'

const executionContext = (saga, id, { name, args }, fetchCurrentState, onDone) => {
    const ref = {}

    let _devSafeWhile = 100

    ref.execute = async () => {
        let { currentNode, currentArgs, currentName } = await fetchCurrentState(id, {
            currentNode: saga,
            currentArgs: args,
            currentName: name,
        })
        
        // todo replace with true
        while (_devSafeWhile--) {
            if (currentNode.isAsync) {
                throw new Error('Async nodes not implemented')
            }

            const {action, args: newArgs, name: newName} = currentNode.op({ name: currentName, args: currentArgs })

            if (action === ACTION_CONTINUE) {
                currentNode = currentNode.getNext()[0]
                currentArgs = newArgs
                currentName = newName || currentName
                if (!currentNode) {
                    onDone(id, {
                        currentName,
                        currentArgs,
                        currentNode
                    })
                    return
                }
            }
            if (action === ACTION_STOP) {
                onDone(id, {
                    currentName,
                    currentArgs,
                    currentNode
                })
                return
            }
        }
    }

    return ref
}

const saga = () => {
    const ref = {
        next: [],
        backend: {
            onDone: () => {},
            fetch: (id, or) => { return or },
        },
    }

    ref.add = (child) => {
        ref.next.push(child)
    }
    ref.getNext = () => ref.next
    ref.op = ({ name, args }) => ({
        action: ACTION_CONTINUE,
        args,
    })
    ref.isAsync = false
    ref.setBackend = (sagaBackend) => {
        ref.backend = sagaBackend
    }

    ref.feed = (id, event) => {
        // todo: persist current state
        const ec = executionContext(ref, id, event, ref.backend.fetch, ref.backend.onDone)

        ec.execute()
    }

    return ref
}

module.exports = {
    saga,
    ACTION_CONTINUE,
    ACTION_STOP,
}