# SoDB
A part of the So Ecosystem.

The worlds simplest filesystem database with support for data encryption.

SoDB uses a document based system.
Each database or `table` can store infite `documents`

`Documents` are just sets of attributes linked to one key.

For example, a key of `post_1` could reference a document that has a couple attributes, such as `timestamp`, or `author`.

The JSON would look like the following:
```json
"post_1": {
  "timestamp":986754153,
  "author":"SoJS",
  "content":"A test document",
  etc...
}
```

## Docs:

## Installation

```
npm install @sojs_coder/sodb
```
```js
const so_db = require("@sojs_coder/sodb");
```

## Usage

```js
const {Database} = require('@sojs_coder/sodb');

// Create a new database
const myDB = new Database('myTable', true);

// Add a new document
myDB.addDoc('document1', {property1: 'value1', property2: 'value2'})
    .then((document) => console.log(document))
    .catch((err) => console.error(err));

// Update an existing document
myDB.updateDoc('document1', {property1: 'newValue1'})
    .then(() => console.log('Document updated'))
    .catch((err) => console.error(err));

// Get a document
myDB.getDoc('document1')
    .then((document) => console.log(document))
    .catch((err) => console.error(err));

// Delete a document
myDB.deleteDoc('document1')
    .then(() => console.log('Document deleted'))
    .catch((err) => console.error(err));

// Dump all documents
myDB.dump()
    .then((documents) => console.log(documents))
    .catch((err) => console.error(err));
```

# Class `Database`
## new Database(table_name, encrypt = false)

Creates a new Database instance.

- `table_name`: the name of the table for the database. This will be used as the name of the directory in which the documents will be stored.
- `encrypt`: a boolean value indicating whether the documents should be encrypted or not. If set to true, the documents will be encrypted using AES encryption with a key specified in the `SO_DB_KEY` environment variable.

## addDoc(id, obj)

Adds a new document to the database.

- `id`: the unique identifier for the document to be updated.
- `obj`: the updated content of the document, in the form of a JavaScript object.

## updateDoc(id, obj)

Updates an existing document in the database.

- `id`: the unique identifier for the document to be updated.
- `obj`: the updated content of the document, in the form of a JavaScript object.

## deleteDoc(id)

Deletes a document from the database.

- `id`: the unique identifier for the document to be deleted.

## dump()

- Retrieves all documents from the database.
