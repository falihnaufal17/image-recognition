const qrcode = require("qrcode-terminal");
const { Client, LocalAuth } = require("whatsapp-web.js");
const axios = require("axios");
// const FormData = require("form-data");
// const Blob = require("blob");
const http = require('http');
const fs = require('fs');
const ejs = require('ejs');

const client = new Client({
  authStrategy: new LocalAuth({ dataPath: "auth" }),
});

client.on("qr", (qr) => {
  qrcode.generate(qr, { small: true });
});

client.on("ready", () => {
  console.log("whatsapp bot siap");
});
  
client.initialize();

const server = http.createServer((req, res) => {
  let showImageId = null
  
  function base64ToBlob(base64String, mimeType) {
    const byteCharacters = atob(base64String);
    const byteNumbers = new Array(byteCharacters.length);
  
    for (let i = 0; i < byteCharacters.length; i++) {
      byteNumbers[i] = byteCharacters.charCodeAt(i);
    }
  
    const byteArray = new Uint8Array(byteNumbers);
    const blob = new Blob([byteArray], { type: mimeType });
  
    return blob;
  }
  
  client.on("message", async (msg) => {
    if (msg.body === "hai") {
      msg.reply("Hai ada yang bisa dibantu");
    }
    if (msg.hasMedia) {
      const media = await msg.downloadMedia();
      console.log(media.data);
      const date = new Date();
      const getYear = date.getFullYear();
      const getMonth = date.getMonth();
      const getDate = date.getDate();
      const getHours = date.getHours();
      const getMinutes = date.getMinutes();
      const getSeconds = date.getSeconds();
      const getMilliseconds = date.getMilliseconds();
      const formData = new FormData();
      const blob = base64ToBlob(media.data, media.mimetype);
      const name = media.mimetype?.split("/")[0];
      const ext = media.mimetype?.split("/")[1];
      formData.append(
        "files",
        blob,
        `${getYear}-${getMonth}-${getDate}-${getHours}-${getMinutes}-${getSeconds}-${getMilliseconds}.${ext}`
      );
  
      axios
        .post("http://127.0.0.1:1337/api/upload", formData)
        .then((res) => {
          console.log(res.data);
          msg.reply("Media berhasil diunggah ke API");
          const imageId = res.data[0].id;
          showImageId = imageId
          axios
            .post("http://127.0.0.1:1337/api/attendances", {
              data: { image: imageId, name: "Lustiyana", status: true },
            })
            .then(() => {
              msg.reply("Berhasil melakukan absen")
              
              fs.readFile('./model.ejs', 'utf8', (err, template) => {
                if (err) {
                  throw err;
                }
            
                const rendered = ejs.render(template, {name: 'World', showImageId});
            
                res.statusCode = 200;
                res.setHeader('Content-Type', 'text/html');
                res.write(rendered);
                res.end();
              });
            });
        })
        .catch((err) => {
          console.log(err?.response);
          console.log(err?.response?.data);
          msg.reply("Terjadi kesalahan saat mengunggah media ke API");
        });
    }
  });
});

const PORT = process.env.PORT || 3000;

server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});