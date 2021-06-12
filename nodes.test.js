const {
    exec,
    get,
} = require('./nodes')

const {
    saga,
} = require('./saga')

const {
    createTestBackend,
} = require('./backend')

test('should not throw', () => {
    const s = saga()

    const f1 = get('test_event')
    const f2 = exec(() => console.log('test'))

    s.add(f1)
    f1.add(f2)
})
test('should create an execution graph', () => {
    const s = saga()

    const f1 = get('test_event')
    const f2 = exec(() => console.log('test'))

    s.add(f1)
    f1.add(f2)

    expect(s.getNext()[0]).toBe(f1)
    expect(f1.getNext()[0]).toBe(f2)
    expect(f2.getNext().length).toBe(0)
})
test('should continue down the graph if the event is matching', () => {
    const s = saga()
    const b = createTestBackend()
    
    s.setBackend(b)

    const execFn = jest.fn()

    const f1 = get('test_event')
    const f2 = exec(execFn)

    s.add(f1)
    f1.add(f2)

    s.feed('123', {
        name: 'test_event',
        args: ['test']
    })

    return b.getPromise().then(() => {
        expect(execFn).toHaveBeenCalledWith('test')
    })
})
test('should NOT continue down the graph if the event is NOT matching', () => {
    const s = saga()
    const b = createTestBackend()
    
    s.setBackend(b)

    const execFn = jest.fn()

    const f1 = get('foo')
    const f2 = exec(execFn)

    s.add(f1)
    f1.add(f2)

    s.feed('123', {
        name: 'test_event',
        args: ['test']
    })

    return b.getPromise().then(() => {
        expect(execFn).toHaveBeenCalledTimes(0)
    })
})