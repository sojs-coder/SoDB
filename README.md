# SoDB

Support for database encryption and automatic compression.
The most cost effective database solution. 
Free to use, and simple to set up.

Data is stored as `documents`. Documents are sets of attributes linked under one `key`.
Documents are stored in individual JSON files for maximum read speeds.

After a set time of no interaction with a document, it is compressed for more efficient storage. Once it is read or edited again, the timer resets.

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
const { Database } = require('@sojs_coder/sodb');

// Create a new database
const myDB = new Database('myTable',{
  encrypt: true
});

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
## new Database(table_name, options)

Creates a new Database instance.

- `table_name`: the name of the table for the database. This will be used as the name of the directory in which the documents will be stored.
- `options`: JSON object to improve database performance and optimize for your use case.
  - `encrypt`: defualt `false`. If true, data in the data base will be encypted using AES encrytion. Set an enviroment variable called `SO_DB_KEY` for this to work (do not share this with anyone, it will allow them to decrypt your database)
  - `timeToCompress`: defualt `24`. The quantity of time (in hours) that an untouched document takes to compress. A document is considered touched when it is created, modified, or read from.


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
