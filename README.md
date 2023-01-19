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
### Install
```
npm install @sojs_coder/sodb
```
```js
const so_db = require("@sojs_coder/sodb");
```

### Create Database

The very first step is to initialize your database. 

The following line will create a table.

```js
const myDB = new so_db.Database("Table Name");
```

If you want to use encryption on your table, set the second parameter to `true` and initialize it.

To use encyption, also create an enviroment variable called `SO_DB_KEY` and set it to a private encyption key. Use this if you ever want to decrypt the JSON file. (It is an AES algorithm)


```js
const myDB = new so_db.Database("Table Name", true);
```

**Remember- only run the `__initCrypto` function once, when you first create the database**
*`__initCrypto()` is now depacated*

### Adding/Updating a document

The following code will give a document with a key of `Document_key` an attribute of `hello` and a value of `world`
```js
myDB.addDoc("Document_key",{
  "hello":"world" //just standard JSON data
});
```
This also works to update a document.

### Getting a Document's Content

```js
myDB.getDoc("Document_key").then((data)=>{
  console.log(data);
  // logs {"hello":"world"}
})
```

### Getting the entire DB conetent

```js
myDB.dump().then((data)=>{
  console.log(data);
  //logs { 
  //  "Document_key": { 
  //    "hello":"world" 
  //  }
  //}
})
```