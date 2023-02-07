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
    this.logs = options.logs || true;
    try{
     var data = fs.readFileSync(path.join(this.dir,".dbdata.sojs"),
            {encoding:'utf8', flag:'r'});
    data = data.split("=");
    var returnData = {
      unienc: this.encrypt,
    }
    data.forEach(line=>{
      line = line.split(":");
      returnData[line[0]] = (line[1] === "true") ? true : false
    });
      var x = returnData;
      this.universallyEnc = x.unienc;
      this.encrypt = x.unienc;
      if(this.logs){
        console.log("Found encrpyt settings in .dbdata.sojs, forcing switch to "+((this.encrypt) ? "encrypted" : "unencrypted"));
        console.log(this.encrypt);
      }
    }catch(err){
      if(err.message.indexOf("no such").indexOf != -1){
        console.error(err)
        fs.writeFileSync(path.join(this.dir,".dbdata.sojs"),"=unienc:"+this.encrypt);
        this.universallyEnc = this.encrypt;
      }else{
        console.error(err);
      }
    }
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
  getConfig(){
    var data = fs.readFileSync(path.join(this.dir,".dbdata.sojs"),
            {encoding:'utf8', flag:'r'});
    data = data.split("=");
    var returnData = {
      unienc: this.encrypt,
    }
    data.forEach(line=>{
      line = line.split(":");
      returnData[line[0]] = (line[1] === "true") ? true : false
    });
    return returnData
  }
  updateConfig(key,value){
    var data = fs.readFileSync(path.join(this.dir,".dbdata.sojs"),
            {encoding:'utf8', flag:'r'});
    data = data.split("=").map(line=>{
      line = line.split(":");
      if(line[0] == key){
        line[1] = value
      }
      return line.join(":")
    });
    data = data.map((line,i)=>{
      if(line.length >= 1){
      if(i !== 0){
        return "=" + line
      }else{
        return "\n=" + line
      }
      }else{
        return ".delete"
      }
    });
    data = data.filter(line=>{
      if (line != ".delete"){
        return true;
      }else{
        return false;
      }
    })
    data = data.join("");
    fs.writeFileSync(path.join(this.dir,".dbdata.sojs"),data);
  }
  async encryptDocs(){
    this.universallyEnc = this.getConfig().unienc
    if(this.logs){
      console.log("A lot of errors are going to happen after you run this function. They are easy to fix. Just change the \"encrypt\" option to true so that the database decrypts the files before reading them")
    }
    if(this.universallyEnc === false){
      
      fs.readdir(this.dir, (err,files)=>{
        if(err){
          console.error(err);
          return
        }
        files.forEach(file =>{
          if (path.extname(file) !== '.json' && path.extname(file) !== '.json.gz' ) return;
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
                zlib.gzip(data,(err,compressed)=>{
                  if(err) console.error(err);
                  fs.writeFile(filePath,compressed,(err)=>{
                    if(err) console.error(err);
                  })
                })
              })
            }else{
              fs.readFile(filePath,'utf-8',(err,data)=>{
                data = enc(data);
                fs.writeFile(filePath,data,(err)=>{
                  if(err){
                    console.error(err)
                  }
                })
              })
            }
          });
        });
      });
      this.universallyEnc = true;
      this.updateConfig("unienc",true)
    }else{
      if(this.logs){
        console.log("Documents are already encrypted")
      }
    }
  }
  async unencryptDocs(){
    this.universallyEnc = this.getConfig().unienc
    if(this.logs){
      console.log("A lot of errors are going to follow running this function. These can be fixed by changing the \" encrypt\" option to false, so that the database doesnt try to decrypt unencrypted data.");
    }
     if(this.universallyEnc){
      fs.readdir(this.dir, (err,files)=>{
        if(err){
          console.error(err);
          return
        }
        files.forEach(file =>{
          if (path.extname(file) !== '.json' && path.extname(file) !== '.json.gz' ) return;
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
                zlib.gzip(data,(err,compressed)=>{
                  if(err) console.error(err);
                  fs.writeFile(filePath,compressed,(err)=>{
                    if(err) console.error(err)
                  })
                })
              })
            }else{
              fs.readFile(filePath,'utf-8',(err,data)=>{
                data = dec(data);
                fs.writeFile(filePath,data,(err)=>{
                  if(err){
                    console.error(err)
                  }
                  
                })
              })
            }
          });
        });
      });
      this.universallyEnc = false;
      this.updateConfig("unienc",false)
    }else{
      if(this.logs){
        console.log("Documents are already decrypted")
      }
    }
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
                var decr = dec(result);
                this.addDoc(id,JSON.parse(decr)).then(()=>{
                  resolve(result);
                }).catch(reject)
              }else{
                this.addDoc(id,JSON.parse(result)).then(()=>{
                  resolve(result);
                }).catch(reject)
              }
              
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
			let file = path.join(this.dir, id + '.json');
      let data = obj;
      if(typeof obj !== "string"){
			 data = JSON.stringify(obj);
      }
			if (this.encrypt) {
				data = enc(data);
			}
			fs.writeFile(file, data, (err) => {
				if (err) {
          console.log(err);
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