'use strict';

const Datastore = require('@google-cloud/datastore');
const config = require('./config');

// [START config]
const ds = Datastore({
  projectId: config.get('GCLOUD_PROJECT')
});
var kind = 'cafe770_' + (new Date()).getFullYear() + ('0' + ((new Date()).getMonth()+1)).slice(-2) + ('0' + (new Date()).getDate()).slice(-2);
// [END config]

// Translates from Datastore's entity format to
// the format expected by the application.
//
// Datastore format:
//   {
//     key: [kind, id],
//     data: {
//       property: value
//     }
//   }
//
// Application format:
//   {
//     id: id,
//     property: value
//   }
function fromDatastore (obj) {
  obj.id = obj[Datastore.KEY].id;
  return obj;
}

// Translates from the application's format to the datastore's
// extended entity property format. It also handles marking any
// specified properties as non-indexed. Does not translate the key.
//
// Application format:
//   {
//     id: id,
//     property: value,
//     unindexedProperty: value
//   }
//
// Datastore extended format:
//   [
//     {
//       name: property,
//       value: value
//     },
//     {
//       name: unindexedProperty,
//       value: value,
//       excludeFromIndexes: true
//     }
//   ]
function toDatastore (obj, nonIndexed) {
  nonIndexed = nonIndexed || [];
  const results = [];
  Object.keys(obj).forEach((k) => {
    if (obj[k] === undefined) {
      return;
    }
    results.push({
      name: k,
      value: obj[k],
      excludeFromIndexes: nonIndexed.indexOf(k) !== -1
    });
  });
  return results;
}

// Lists all books in the Datastore sorted alphabetically by title.
// The ``limit`` argument determines the maximum amount of results to
// return per page. The ``token`` argument allows requesting additional
// pages. The callback is invoked with ``(err, books, nextPageToken)``.
// [START list]
function list (cb) {
  const q = ds.createQuery([kind])
    .order('order_id', { desending: true });

  ds.runQuery(q, (err, entities, nextQuery) => {
    if (err) {
      cb(err);
      return;
    }
    cb(null, entities.map(fromDatastore));
  });
}
// [END list]

function listall (k, cb) {
  const q = ds.createQuery([k])
    .order('order_id', { desending: true });

  ds.runQuery(q, (err, entities, nextQuery) => {
    if (err) {
      cb(err);
      return;
    }
    cb(null, entities.map(fromDatastore));
  });
}


// Creates a new book or updates an existing book with new data. The provided
// data is automatically translated into Datastore format. The book will be
// queued for background processing.
// [START update]
function update (id, data, cb) {
  let key;
  if (id) {
    key = ds.key([kind, parseInt(id, 10)]);
  } else {
    key = ds.key(kind);
  }

  const entity = {
    key: key,
    data: toDatastore(data, ['hotice', 'coffee', 'options', 'quantity', 'start_timestamp', 'end_timestamp', 'mobile', 'name'])
  };

  ds.save(
    entity,
    (err) => {
      data.id = entity.key.id;
      cb(err, err ? null : data);
    }
  );
}
// [END update]

function create (data, cb) {
  ds.runQuery(ds.createQuery([kind]))
    .then(entities => {
      data.order_id = Math.max.apply(null, entities[0].map(e => e.order_id)) + 1;
      if(0 >= data.order_id)
        data.order_id = 1;
      update(null, data, cb);
    })
    .catch(err => {
      cb(err);
    });
}

function read (id, cb) {
  const key = ds.key([kind, parseInt(id, 10)]);
  ds.get(key, (err, entity) => {
    if (!err && !entity) {
      err = {
        code: 404,
        message: 'Not found'
      };
    }
    if (err) {
      cb(err);
      return;
    }
    cb(null, fromDatastore(entity));
  });
}

// [START exports]
module.exports = {
  create,
  read,
  update,
  list,
  listall
};
// [END exports]
