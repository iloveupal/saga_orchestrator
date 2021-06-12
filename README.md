# saga_orchestrator

The api and examples are not finalized, nor it's not ready to be imported, this is just WIP

## The purpose

Managing complex backend flows that depend on async actions from multiple actors can be challenging.
This library is an experiment to try and solve this problem.

Imagine that you're designing an app, similar to Uber, with sort of a bargain matching mechanism, e.g.,

1. Client creates an order
2. EITHER A batch of drivers nearby can accept or offer a price OR no action from any driver happens until a timeout and we need to notify the next batch
3. When the driver offers a price, EITHER the client can accept OR wait until someone else offers a lower price OR the client times out on their decision and the order gets cancelled

At any moment of time, anyone can cancel and the order must go to one of the appropriate states

## The approach

Represent the flow as a graph, where the nodes can represent either: awaiting for an input or some execution. Once the flow starts, it continues to be executed synchronously as long as possible.
Once there's an asynchronous node, such as awaiting for input, the process gets saved to the backend of choice, like redis, and then is frozen until the next event comes in.

```javascript
import { saga, exec, get, oneOf, timeOut, createRedisBackend } from 'saga_orchestrator'

const root = saga()
root.setBackend(createRedisBackend(...))

// create nodes for the flow
const orderCreatedInputNode = get('create_order')
const dispatchToNearbyDriversNode = exec(dispatchTheOrderToNearbyDrivers)
const oneOfNode = oneOf()
const orderAcceptedInputNode = get('accept_order')
const alternativePriceOfferedInputNode = get('alternative_price_offered')
const timeOutNode = timeOut(30 * 1000)
// ...

// link them together
orderCreatedInputNode.addNext(dispatchToNearbyDriversNode)
dispatchToNearbyDriversNode.addNext(oneOfNode)
oneOfNode.addOption(orderAcceptedInputNode)
oneOfNode.addOption(alternativePriceOfferedInputNode)
oneOfNode.addOption(timeOutNode)
orderAcceptedInputNode.addNext(...) // add other nodes to each other until you get the whole flow

// feed your events into the saga which you receive from e.g., Kafka or HTTP
root.feed({ name: 'create_order', args: [{ userId: 'abc', from: Location, to: Location, suggestedPrice: 300 }] })
```

## Todo

1. Finalize the persistence protocol and serialization
2. Create more node types, like `map`, `oneOf` and `timeOut`
3. Add serialization to the graph configuration so that it can be restarted or dynamically obtained
4. See if this approach even makes sense in real life :D
5. Implement failure logic for async actions
6. Enqueue events instead of launching a separate execution context for each one of them
