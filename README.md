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


// Encrypt all documents
myDB.encryptDocs()


// Decrypt all documents
myDB.unencryptDocs()
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

## encryptDocs

- Encrypts database completely, useful for changing from decrypted database to encrypted

## unencryptDocs

- Completely decrypts database, useful for viewing encrypted data (use at your own risk)

# Speeds

- 166 Kilobytes
  - (Compressed) 24.475886998698115 milliseconds
  - (Compressed + encrypted) --- milliseconds
- 332 Kilobytes
  - (Compressed) 28.68665700033307 milliseconds
  - (Compressed + encrypted) 884.8475460037589 milliseconds
- 829 Kilobytes
  - (Compressed) 47.736504999920726 milliseconds
  - (Compressed + encrypted) 966.7856909930706 milliseconds
- Sample 1 (Small sample data)
  - (Compressed + encrypted) 17.297598004341125 milliseconds