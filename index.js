const fs=require("fs"),CryptoJS=require("crypto-js"),path=require("path"),zlib=require("zlib"),enc=t=>CryptoJS.AES.encrypt(t,process.env.SO_DB_KEY).toString(),dec=t=>CryptoJS.AES.decrypt(t,process.env.SO_DB_KEY).toString(CryptoJS.enc.Utf8);class Database{constructor(t,e={encrypt:!1,timeToCompress:24,logs:!0}){this.table_name=t,this.dir="./SoDB/"+this.table_name,this.encrypt=e.encrypt||!1,this.timeToCompress=36e5*e.timeToCompress||864e5,this.logs=e.logs||!0,fs.existsSync("./SoDB")||fs.mkdirSync("./SoDB"),fs.existsSync(this.dir)||fs.mkdirSync(this.dir);try{var s=fs.readFileSync(path.join(this.dir,".dbdata.sojs"),{encoding:"utf8",flag:"r"});s=s.split("=");var i={unienc:this.encrypt};s.forEach(t=>{i[(t=t.split(":"))[0]]="true"===t[1]});var r=i;this.universallyEnc=r.unienc||this.encrypt,this.encrypt=r.unienc||this.encrypt,this.logs&&(console.log("Found encrpyt settings in .dbdata.sojs, forcing switch to "+(this.encrypt?"encrypted":"unencrypted")),console.log("Encrypting true|false: "+this.encrypt))}catch(n){-1!=n.message.indexOf("no such").indexOf?(fs.writeFileSync(path.join(this.dir,".dbdata.sojs"),"=unienc:"+this.encrypt),this.universallyEnc=this.encrypt,console.error(n),this.logs&&console.log(".dbdata.sojs created, encrypt settings updated: \nencrypted: "+this.encrypt)):console.error(n)}if(this.encrypt&&!process.env.SO_DB_KEY)throw Error("SO_DB_KEY is not defined");setInterval(()=>{this.checkForCompression()},this.timeToCompress)}getConfig(){var t=fs.readFileSync(path.join(this.dir,".dbdata.sojs"),{encoding:"utf8",flag:"r"});t=t.split("=");var e={unienc:this.encrypt};return t.forEach(t=>{e[(t=t.split(":"))[0]]="true"===t[1]}),e}updateConfig(t,e){var s=fs.readFileSync(path.join(this.dir,".dbdata.sojs"),{encoding:"utf8",flag:"r"});s=(s=(s=(s=s.split("=").map(s=>((s=s.split(":"))[0]==t&&(s[1]=e),s.join(":")))).map((t,e)=>t.length>=1?0!==e?"="+t:"\n="+t:".delete")).filter(t=>".delete"!=t)).join(""),fs.writeFileSync(path.join(this.dir,".dbdata.sojs"),s)}async encryptDocs(){this.universallyEnc=this.getConfig().unienc,this.logs&&console.log('A lot of errors are going to happen after you run this function. They are easy to fix. Just change the "encrypt" option to true so that the database decrypts the files before reading them'),!1===this.universallyEnc?(fs.readdir(this.dir,(t,e)=>{if(t){console.error(t);return}e.forEach(t=>{if(".json"!==path.extname(t)&&".json.gz"!==path.extname(t))return;let e=path.join(this.dir,t),s=path.parse(e),i=s.name;this.isCompressed(i).then(t=>{t?this.decompressDoc(i).then(t=>{"string"!=typeof t&&(t=JSON.stringify(t)),t=enc(t),zlib.gzip(t,(t,s)=>{t&&console.error(t),fs.writeFile(e,s,t=>{t&&console.error(t)})})}):fs.readFile(e,"utf-8",(t,s)=>{s=enc(s),fs.writeFile(e,s,t=>{t&&console.error(t)})})})})}),this.universallyEnc=!0,this.updateConfig("unienc",!0)):this.logs&&console.log("Documents are already encrypted")}async unencryptDocs(){this.universallyEnc=this.getConfig().unienc,this.logs&&console.log('A lot of errors are going to follow running this function. These can be fixed by changing the " encrypt" option to false, so that the database doesnt try to decrypt unencrypted data.'),this.universallyEnc?(fs.readdir(this.dir,(t,e)=>{if(t){console.error(t);return}e.forEach(t=>{if(".json"!==path.extname(t)&&".json.gz"!==path.extname(t))return;let e=path.join(this.dir,t),s=path.parse(e),i=s.name;this.isCompressed(i).then(t=>{t?this.decompressDoc(i).then(t=>{"string"!=typeof t&&(t=JSON.stringify(t)),t=dec(t),zlib.gzip(t,(t,s)=>{t&&console.error(t),fs.writeFile(e,s,t=>{t&&console.error(t)})})}):fs.readFile(e,"utf-8",(t,s)=>{s=dec(s),fs.writeFile(e,s,t=>{t&&console.error(t)})})})})}),this.universallyEnc=!1,this.updateConfig("unienc",!1)):this.logs&&console.log("Documents are already decrypted")}async checkForCompression(){try{fs.readdir(this.dir,(t,e)=>{if(t){this.logs&&console.error(t);return}e.forEach(t=>{if(".json"!==path.extname(t))return;let e=path.join(this.dir,t);fs.stat(e,(t,s)=>{if(t){this.logs&&console.error(t);return}s.isFile()&&Date.now()-s.mtime.getTime()>this.timeToCompress&&Date.now()-s.atime.getTime()>this.timeToCompress&&this.compress(e,(t,s)=>{t&&this.logs&&console.error(t),this.logs&&console.log(e+" Compressed")})})})})}catch(t){return this.logs&&console.error(`Error checking file compression: ${t}`),!1}}compress(t,e){fs.readFile(t,(s,i)=>{if(s){e(s);return}zlib.gzip(i,(s,i)=>{if(s){e(s);return}let r=t+".gz";fs.writeFile(r,i,s=>{if(s){e(s);return}fs.unlink(t,t=>{t?e(t):e(null,r)})})})})}decompressDoc(t){return new Promise((e,s)=>{let i=path.join(this.dir,t+".json.gz");fs.readFile(i,(r,n)=>{if(r)return s(r);zlib.gunzip(n,(r,n)=>{if(r)return s(r);n=n.toString(),fs.unlink(i,i=>{if(i)s(i);else if(this.encrypt){var r=dec(n);this.addDoc(t,JSON.parse(r)).then(()=>{e(n)}).catch(s)}else this.addDoc(t,JSON.parse(n)).then(()=>{e(n)}).catch(s)})})})})}isCompressed(t){let e=path.join(this.dir,t+".json.gz");return new Promise((t,s)=>{fs.access(e,e=>{e?t(!1):t(!0)})})}addDoc(t,e){return new Promise((s,i)=>{let r=path.join(this.dir,t+".json"),n=e;"string"!=typeof e&&(n=JSON.stringify(e)),this.encrypt&&(n=enc(n)),fs.writeFile(r,n,t=>{t?(console.log(t),i(t)):s(e)})})}updateDoc(t,e){return new Promise((s,i)=>{let r=path.join(this.dir,t+".json");this.isCompressed(t).then(n=>{n?this.decompressDoc(t).then(t=>{"string"!=typeof t&&(t=JSON.stringify(t)),this.encrypt&&(t=dec(t)),Object.assign(t=JSON.parse(t),e),t=JSON.stringify(t),this.encrypt&&(t=enc(t)),fs.writeFile(r,t,t=>{t?i(t):s()})}).catch(t=>{i(t)}):this.getDoc(t).then(t=>{Object.assign(t,e),t=JSON.stringify(t),this.encrypt&&(t=enc(t)),fs.writeFile(r,t,t=>{t?i(t):s()})})})})}deleteDoc(t){return new Promise((e,s)=>{let i=path.join(this.dir,t+".json");this.isCompressed(t).then(r=>{r&&(i=path.join(this.dir,t+".json.gz")),fs.unlink(i,t=>{t?s(t):e()})}).catch(s)})}getDoc(t){return new Promise((e,s)=>{let i=path.join(this.dir,t+".json");this.isCompressed(t).then(r=>{r?this.decompressDoc(t).then(t=>{"string"!=typeof t&&(t=JSON.stringify(t)),this.encrypt&&(t=dec(t)),e(t=JSON.parse(t))}).catch(t=>{s(t)}):fs.readFile(i,"utf-8",(t,i)=>{"string"!=typeof i&&(i=JSON.stringify(i)),t?s(t):(this.encrypt&&(i=dec(i)),e(i=JSON.parse(i)))})}).catch(t=>{s(t)})})}dump(){return new Promise((t,e)=>{let s={};fs.readdir(this.dir,(i,r)=>{if(i)e(i);else{let n=[];r.forEach(t=>{if(t.endsWith(".json")){let e=t.slice(0,-5);n.push(this.getDoc(e).then(t=>{s[e]=t}))}}),Promise.all(n).then(()=>{t(s)}).catch(t=>{e(t)})}})})}}module.exports={Database};