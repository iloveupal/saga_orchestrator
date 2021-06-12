const isPromise = require('is-promise');
const {
  saga, ACTION_CONTINUE, ACTION_STOP, ACTION_ASYNC,
} = require('./saga');

const exec = (fn) => {
  const ref = saga();

  ref.op = ({ args, context }) => {
    const fnReturn = fn(...args);

    if (isPromise(fnReturn)) {
      return {
        action: ACTION_ASYNC,
        promise: fnReturn,
        args,
        context: {
          ...context,
          continueFrom: ref,
        },
      };
    }

    return {
      action: ACTION_CONTINUE,
      args,
      context,
    };
  };

  return ref;
};

const get = (listenToEventName) => {
  const ref = saga();

  ref.op = ({ name, args, context }) => ({
    action: name === listenToEventName ? ACTION_CONTINUE : ACTION_STOP,
    args,
    context,
  });

  return ref;
};

module.exports = {
  exec,
  get,
};
