const fs = require("fs");
const CryptoJS = require("crypto-js");
const path = require("path");


const enc = (data)=>{
  return CryptoJS.AES.encrypt(data,process.env.SO_DB_KEY).toString();
}
const dec = (data)=>{
  return CryptoJS.AES.decrypt(data,process.env.SO_DB_KEY).toString(CryptoJS.enc.Utf8);
}
class Database {
  constructor(table_name, encrypt = false) {
    this.table_name = table_name;
    this.dir = './SoDB/' + this.table_name;
    this.encrypt = encrypt;

    if (!fs.existsSync('./SoDB')) {
      fs.mkdirSync('./SoDB')
    }
    if (!fs.existsSync(this.dir)) {
      fs.mkdirSync(this.dir);
    }
    if(this.encrypt && !process.env.SO_DB_KEY){
      throw new Error('SO_DB_KEY is not defined');
    }
  }

  addDoc(id, obj) {
    return new Promise((resolve, reject) => {
      let file = path.join(this.dir, id + '.json');
      let data = JSON.stringify(obj);
      if (this.encrypt) {
        data = enc(data);
      }
      fs.writeFile(file, data, (err) => {
        if (err) {
          reject(err);
        } else {
          resolve(obj);
        }
      });
    });
  }
  updateDoc(id, obj) {
    return new Promise((resolve, reject) => {
        let file = path.join(this.dir, id + '.json');
        fs.readFile(file, 'utf-8', (err, data) => {
            if (err) {
                reject(err);
            } else {
                if (this.encrypt) {
                    data = dec(data);
                }
                data = JSON.parse(data);
                Object.assign(data, obj);
                data = JSON.stringify(data);
                if (this.encrypt) {
                    data = enc(data);
                }
                fs.writeFile(file, data, (err) => {
                    if (err) {
                        reject(err);
                    } else {
                        resolve();
                    }
                });
            }
        });
    });
}

  deleteDoc(id) {
    return new Promise((resolve, reject) => {
      let file = path.join(this.dir, id + '.json');
      fs.unlink(file, (err) => {
        if (err) {
          reject(err);
        } else {
          resolve();
        }
      });
    });
  }

  getDoc(id) {
    return new Promise((resolve, reject) => {
      let file = path.join(this.dir, id + '.json');
      fs.readFile(file, 'utf-8', (err, data) => {
        if (err) {
          reject(err);
        } else if (!data) {
          reject(new Error('File is empty'));
        }
        else {
          if (this.encrypt) {
            data = dec(data);
          }
          data = JSON.parse(data);
          
          resolve(data);
        }
      });
    });
  }
  dump() {
    return new Promise((resolve, reject) => {
      let documents = {};
      fs.readdir(this.dir, (err, files) => {
        if (err) {
          reject(err);
        } else {
          let promises = [];
          files.forEach((file) => {
            if (file.endsWith('.json')) {
              let id = file.slice(0, -5);
              promises.push(this.getDoc(id).then((data) => {
                documents[id] = data;
              }));
            }
          });
          Promise.all(promises).then(() => {
            resolve(documents);
          }).catch((err) => {
            reject(err);
          });
        }
      });
    });
  }

}

module.exports = {
  Database,
}