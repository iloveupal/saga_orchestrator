const EventEmitter = require('events');

const createSagaBackend = (fetch, onDone, extra = {}) => ({
  fetch,
  onDone,
  ...extra,
});

const createInMemoryBackend = () => {
  const _mem = {};

  return createSagaBackend(
    async (id, or) => _mem[id] || or,
    async (id, { currentName, currentArgs, currentNode }) => {
      _mem[id] = { currentName, currentArgs, currentNode };
    },
  );
};

const createTestBackend = (fromBackend) => {
  const ee = new EventEmitter();

  return createSagaBackend(
    fromBackend.fetch,
    async (id, data) => {
      fromBackend.onDone(id, data);
      ee.emit('done', data);
    },
    {
      getPromise: () => new Promise((resolve) => {
        ee.once('done', resolve);
      }),
    },
  );
};

module.exports = {
  createSagaBackend,
  createInMemoryBackend,
  createTestBackend,
};
