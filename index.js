const fs = require("fs");
const CryptoJS = require("crypto-js");

const enc = (data)=>{
  return CryptoJS.AES.encrypt(data,process.env.SO_DB_KEY).toString();
}
const dec = (data)=>{
  return CryptoJS.AES.decrypt(data,process.env.SO_DB_KEY).toString(CryptoJS.enc.Utf8);
}
class Database{
  constructor(table_name,encrypt = false){
    this.table_name = table_name;
    this.dir = './SoDB/'+this.table_name;
    this.path = this.dir + '/index.json';
    
    this.encrypt = encrypt;

    if(!fs.existsSync('./SoDB')){
      fs.mkdirSync('./SoDB')
    }
    if (!fs.existsSync(this.dir)){
      fs.mkdirSync(this.dir);
      if(this.encrypt){
        fs.writeFile(this.path,enc("{}"),(err)=>{
          if (err) throw err;
        })
      }else{
        fs.writeFile(this.path,"{}",(err)=>{
          if (err) throw err;
        })
      }
    }
  }
  __initCrypto(){
    fs.writeFileSync(this.path,enc('{}'),(err)=>{
      if(err) throw err;
    })
  }
  addDoc(id,obj){
    return new Promise((r,rr)=>{
      fs.readFile(this.path,'utf-8',(err,data)=>{
        if(err) throw err;
        if(this.encrypt){
          data = dec(data);
        }
        data = JSON.parse(data);
        data[id] = obj;
        data = JSON.stringify(data);
        if(this.encrypt){
          fs.writeFile(this.path,enc(data),(err)=>{
            if(err) throw err;
            r(obj)
            
          })
        }else{
          fs.writeFile(this.path,data,(err)=>{
            if(err) throw err;
            r(obj)
            
          })
        }
      })
    })
    
  }
  deleteDoc(id){
    return new Promise((r,rr)=>{
      fs.readFile(this.path,'utf-8',(err,data)=>{
        if(err) throw err;
        if(this.encrypt){
          data = dec(data);
        }
        data = JSON.parse(data);
        var tempData = data[id];
        delete data[id];
        data = JSON.stringify(data);
        console.log(data);
        if(this.encrypt){
          fs.writeFile(this.path,enc(data),(err)=>{
            if(err) throw err;
            r(tempData);
            
          })
        }else{
          fs.writeFile(this.path,data,(err)=>{
            if(err) throw err;
            r(tempData);
            
          })
        }
      })
    })
  }
  getDoc(id){
    return new Promise((r,rr)=>{
        fs.readFile(this.path,'utf-8',(err,data)=>{
          if(err) throw err;
          if(this.encrypt){
            data = dec(data);
            
          }
          data = JSON.parse(data);
          r(data[id]);
        });
      });
  }
  dump(){
    return new Promise((r,rr)=>{
      fs.readFile(this.path,'utf-8',(err,data)=>{
          if(err) throw err;
          if(this.encrypt){
            data = dec(data);
          }
          data = JSON.parse(data);
          r(data);
        })
    })
  }
}

module.exports = {
  Database,
}