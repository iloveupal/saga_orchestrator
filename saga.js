const { v4: uuid } = require('uuid');

const ACTION_CONTINUE = 'continue';
const ACTION_STOP = 'stop';
const ACTION_ASYNC = 'async';

const executionContext = (saga, id, { name, args, context = {} }, fetchCurrentState, onDone) => {
  const ref = {};

  let devSafeWhile = 100;

  ref.execute = async () => {
    let {
      currentNode, currentArgs, currentName, currentContext,
    } = await fetchCurrentState(id, {
      currentNode: saga,
      currentArgs: args,
      currentName: name,
      currentContext: context,
    });

    while (devSafeWhile) {
      devSafeWhile -= 1;
      const {
        action,
        args: newArgs,
        name: newName,
        context: newContext,
        promise: fnPromise,
      } = currentNode.op({ name: currentName, args: currentArgs, context: currentContext });

      if (action === ACTION_CONTINUE) {
        [currentNode] = currentNode.getNext();
        currentArgs = newArgs;
        currentName = newName || currentName;
        currentContext = newContext || currentContext;
        if (!currentNode) {
          onDone(id, {
            currentName,
            currentArgs,
            currentNode,
            currentContext,
          });
          return;
        }
      } else if (action === ACTION_STOP) {
        onDone(id, {
          currentName,
          currentArgs,
          currentNode,
          currentContext,
        });
        return;
      } else if (action === ACTION_ASYNC) {
        currentContext = newContext || currentContext;
        onDone(id, {
          currentName,
          currentArgs,
          currentNode,
          currentContext,
        });

        try {
          // eslint-disable-next-line no-await-in-loop
          await fnPromise;
          [currentNode] = currentNode.getNext();
          currentArgs = newArgs;
          currentName = newName || currentName;

          onDone(id, {
            currentName,
            currentArgs,
            currentNode,
            currentContext,
          });

          if (!currentNode) {
            return;
          }
        } catch (e) {
          throw new Error(e);
        }
      } else {
        throw new Error('missed use case');
      }
    }
  };

  return ref;
};

const saga = () => {
  const ref = {
    next: [],
    backend: {
      onDone: () => {},
      fetch: (id, or) => or,
    },
    id: uuid(),
  };

  ref.add = (child) => {
    ref.next.push(child);
  };
  ref.getNext = () => ref.next;
  ref.op = ({ args }) => ({
    action: ACTION_CONTINUE,
    args,
  });
  ref.isAsync = false;
  ref.setBackend = (sagaBackend) => {
    ref.backend = sagaBackend;
  };

  ref.feed = (id, event) => {
    // todo: persist current state
    const ec = executionContext(ref, id, event, ref.backend.fetch, ref.backend.onDone);

    ec.execute();
  };

  return ref;
};

module.exports = {
  saga,
  ACTION_CONTINUE,
  ACTION_STOP,
  ACTION_ASYNC,
};
