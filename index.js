const fs = require("fs");
const CryptoJS = require("crypto-js");
const path = require("path");
const zlib = require("zlib");

const enc = (data) => {
	return CryptoJS.AES.encrypt(data, process.env.SO_DB_KEY).toString();
}
const dec = (data) => {
	return CryptoJS.AES.decrypt(data, process.env.SO_DB_KEY).toString(CryptoJS.enc.Utf8);
}
class Database {
	constructor(table_name, options = { encrypt: false, timeToCompress: 24,logs:true }) {
		this.table_name = table_name;
		this.dir = './SoDB/' + this.table_name;
		this.encrypt = options.encrypt || false;
    this.timeToCompress = options.timeToCompress * 60 * 60 * 1000 || 24 * 60 * 60 *1000;
    this.logs = options.logs || true
		if (!fs.existsSync('./SoDB')) {
			fs.mkdirSync('./SoDB');
		}
		if (!fs.existsSync(this.dir)) {
			fs.mkdirSync(this.dir);
		}
		if (this.encrypt && !process.env.SO_DB_KEY) {
			throw new Error('SO_DB_KEY is not defined');
		}
    
		setInterval(() => {
			this.checkForCompression();
		}, this.timeToCompress);
	}
  encryptDocs(){
    return new Promise((resolve,reject)=>{
      fs.readdir(this.dir, (err,files)=>{
        if(err){
          reject(err);
          return
        }
        files.forEach(file =>{
          const filePath = path.join(this.dir, file);
          const parsedPath = path.parse(filePath);

          const fileName = parsedPath.name;    
          this.isCompressed(fileName).then(iscomp=>{
            if(iscomp){
              this.decompressDoc(fileName).then(data=>{
                if(typeof data !== "string"){
                  data = JSON.stringify(data)
                }
                data = enc(data);
                fs.writeFile(filePath,data,(err)=>{
                  if(err) reject(err)
                })
              })
            }else{
              fs.readFile(filePath,'utf-8',(err,data)=>{
                data = enc(data);
                fs.writeFile(filePath,data,(err)=>{
                  if(err){
                    reject(err)
                  }
                })
              })
            }
          })
        });
        resolve();
      });
    })
  }
  unencryptDocs(){
    return new Promise((resolve,reject)=>{
      fs.readdir(this.dir, (err,files)=>{
        if(err){
          reject(err);
          return
        }
        files.forEach(file =>{
          const filePath = path.join(this.dir, file);
          const parsedPath = path.parse(filePath);

          const fileName = parsedPath.name;    
          this.isCompressed(fileName).then(iscomp=>{
            if(iscomp){
              this.decompressDoc(fileName).then(data=>{
                if(typeof data !== "string"){
                  data = JSON.stringify(data)
                }
                data = dec(data);
                fs.writeFile(filePath,data,(err)=>{
                  if(err) reject(err)
                })
              })
            }else{
              fs.readFile(filePath,'utf-8',(err,data)=>{
                data = dec(data);
                fs.writeFile(filePath,data,(err)=>{
                  if(err){
                    reject(err)
                  }
                })
              })
            }
          })
        });
        resolve();
      });
    })
  }
  async checkForCompression() {
    try {
      fs.readdir(this.dir, (err, files) => {
        if (err) {
          if(this.logs) console.error(err);
          return;
        }

        files.forEach(file => {
          if (path.extname(file) !== '.json') return;
          
          const filePath = path.join(this.dir, file);
          fs.stat(filePath, (err, stat) => {
            if (err) {
              if (this.logs) console.error(err);
              return;
            }

            if (stat.isFile() && (Date.now() - stat.mtime.getTime() > this.timeToCompress) && (Date.now() - stat.atime.getTime() > this.timeToCompress)) {
              this.compress(filePath,(err,file)=>{
                if(err && this.logs) console.error(err)
                if(this.logs) console.log(filePath + " Compressed")
              });
            }
          });
        });
      });
    } catch (error) {
      if(this.logs) console.error(`Error checking file compression: ${error}`);
      return false;
    }
  }
  compress(filePath, callback) {
        fs.readFile(filePath, (err, data) => {
            if (err) {
                callback(err);
                return;
            }

            zlib.gzip(data, (err, compressed) => {
                if (err) {
                    callback(err);
                    return;
                }

                const compressedFilePath = filePath + ".gz";
                fs.writeFile(compressedFilePath, compressed, (err) => {
                    if (err) {
                        callback(err);
                        return;
                    }
                    fs.unlink(filePath, (err) => {
              				if (err) {
              					 callback(err)
              				} else {
              					callback(null, compressedFilePath);
              				}
              			});
                });
            });
        });
    }
  decompressDoc(id) {
    return new Promise((resolve,reject)=>{
      let file = path.join(this.dir, id + '.json.gz');
      fs.readFile(file, (err, data) => {
        if (err) {
          return reject(err);
        }
        zlib.gunzip(data, (err, result) => {
          if (err) {
            return reject(err);
          }
          result = result.toString();
          fs.unlink(file, (err) => {
    				if (err) {
    					 reject(err)
    				} else {
              if (this.encrypt) {
                result = dec(result);
              }
              this.addDoc(id,JSON.parse(result)).then(()=>{
                result = JSON.parse(result);
                
                resolve(result);
              }).catch(reject)
    				}
    			});
        });
      });
    })
  }
  isCompressed(id) {
    let file = path.join(this.dir, id + '.json.gz');
    return new Promise((resolve, reject) => {
      fs.access(file, (err) => {
        if (err) {
          resolve(false);
        } else {
          resolve(true);
        }
      });
    });
  }
	addDoc(id, obj) {
		return new Promise((resolve, reject) => {
      this.checkForCompression(id).then(comp=>{
        if(comp){
          this.decompressDoc(id).then(data=>{
            if(typeof data !== "object"){
              data = JSON.parse(data)
            }
            
          })
        }
      })
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
      this.isCompressed(id).then((isCompressed)=>{
        if(isCompressed){
          this.decompressDoc(id).then((result)=>{
            if(typeof result !== "string"){
              result = JSON.stringify(result)
            }
            if(this.encrypt){
              result =dec(result);
            }
            result = JSON.parse(result);
            Object.assign(result,obj);
            result = JSON.stringify(result);
            if (this.encrypt) {
  						result = enc(result);
  					}
  					fs.writeFile(file, result, (err) => {
  						if (err) {
  							reject(err);
  						} else {
  							resolve();
  						}
  					});
          }).catch(err=>{
            reject(err)
          })
        }else{
          this.getDoc(id).then(docData=>{
            Object.assign(docData,obj);
            docData = JSON.stringify(docData);
            if(this.encrypt){
              docData = enc(docData);
            }
            fs.writeFile(file,docData,(err)=>{
              if(err){
                reject(err)
              }else{
                resolve();
              }
            })
          })
        }
      })
		});
	}

	deleteDoc(id) {
		return new Promise((resolve, reject) => {
			let file = path.join(this.dir, id + '.json');
      this.isCompressed(id).then(comp=>{
        if(comp){
          file = path.join(this.dir, id + '.json.gz');
        }
        fs.unlink(file, (err) => {
  				if (err) {
  					 reject(err)
  				} else {
  					resolve();
  				}
  			});
      }).catch(reject)
		});
	}

	getDoc(id) {
    return new Promise((resolve, reject) => {
      let file = path.join(this.dir, id + '.json');
      this.isCompressed(id).then((isCompressed) => {
        if (isCompressed) {
          this.decompressDoc(id).then((result) => {
            if(typeof result !== "string"){
              result = JSON.stringify(result)
            }
            if(this.encrypt){
              result = dec(result)
            }
            result = JSON.parse(result);
            resolve(result);
          }).catch((err) => {
            reject(err);
          });
        } else {
          fs.readFile(file, 'utf-8', (err, data) => {
            if(typeof data !== "string"){
              data = JSON.stringify(data)
            }
            if (err) {
              reject(err);
            } else {
              if (this.encrypt) {
                data = dec(data);
              }
              data = JSON.parse(data);
              resolve(data);
            }
          });
        }
      }).catch((err) => {
        reject(err);
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