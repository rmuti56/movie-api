var express = require('express')
var router = express.Router();
var members = require('../validation/usersModel');
var jwt = require('jsonwebtoken');
const stream = require('stream');

const fs = require('fs');
const readline = require('readline');
const multer = require('multer');
const {
  google
} = require('googleapis');

const TOKEN_PATH = 'token.json';
const SCOPES = ['https://www.googleapis.com/auth/drive'];

var drive;
fs.readFile('./credentials.json', (err, content) => {
  if (err) return console.log('Error loading client secret file:', err);
  authorize(JSON.parse(content));
});

function authorize(credentials, callback) {
  const {
    client_secret,
    client_id,
    redirect_uris
  } = credentials.installed;
  const oAuth2Client = new google.auth.OAuth2(
    client_id, client_secret, redirect_uris[0]);

  fs.readFile(TOKEN_PATH, (err, token) => {
    if (err) return getAccessToken(oAuth2Client, callback);
    oAuth2Client.setCredentials(JSON.parse(token));
    drive = google.drive({
      version: 'v3',
      auth: oAuth2Client
    });
    //listFiles();
  });
}

function listFiles() {
  drive.files.list({
    pageSize: 10,
    fields: 'nextPageToken, files(id, name)',
  }, (err, res) => {
    if (err) return console.log('The API returned an error: ' + err);
    const files = res.data.files;
    if (files.length) {
      console.log('Files:');
      files.map((file) => {
        console.log(`${file.name} (${file.id})`);
      });
    } else {
      console.log('No files found.');
    }
  });
}

function getAccessToken(oAuth2Client, callback) {
  const authUrl = oAuth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: SCOPES,
  });
  console.log('Authorize this app by visiting this url:', authUrl);
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });
  rl.question('Enter the code from that page here: ', (code) => {
    rl.close();
    oAuth2Client.getToken(code, (err, token) => {
      if (err) return console.error('Error retrieving access token', err);
      oAuth2Client.setCredentials(token);
      // Store the token to disk for later program executions
      fs.writeFile(TOKEN_PATH, JSON.stringify(token), (err) => {
        if (err) return console.error(err);
        console.log('Token stored to', TOKEN_PATH);
      });
      callback(oAuth2Client);
    });
  });
}


var storage = multer.memoryStorage()
var upload = multer({
  storage: storage
})

// function uploadImage(file) {
//   var fileMetadata = {
//     'name': Date.now + file.originalname
//   };
//   var media = {
//     mimeType: 'image/*',
//     body: fs.createReadStream('./Video.mp4')
//   };
//   return new Promise((resolve, reject) => {
//     drive.files.create({
//       resource: fileMetadata,
//       media: media,
//       fields: 'id'
//     }, function (err, file) {
//       if (err) {
//         reject(err);
//       } else {
//         resolve(file);
//       }
//     });
//   })
// }

function gUpload(stream, filename, mimeType) {
  var fileMetadata = {
    'name': filename
  };
  var media = {
    mimeType,
    body: stream
  };
  return new Promise((resolve, reject) => {
    drive.files.create({
      resource: fileMetadata,
      media: media,
      fields: 'id'
    }, (err, file) => {
      if (err) {
        reject('error');
      } else {
        resolve(file);
      }
    })
  })
}

router.post('/upload', upload.array('uploads[]'), (req, res) => {
  let fileObject = req.files[0];
  console.log(fileObject)
  console.log('ใหม่', req.files);
  if (fileObject) {
    let bufferStream = new stream.PassThrough();
    bufferStream.end(fileObject.buffer);
    gUpload(bufferStream, Date.now().toString() + '_' + fileObject.originalname, fileObject.mimetype).then(function (result) {
      res.send(JSON.stringify({
        data: result.data
      }))
    }).catch(function (error) {
      console.log('error');
      res.status(500);
      res.send({
        status: 500,
        error: error,
      });
    });
  }
});
//ลงชื่อเข้าใช้
router.post('/login', (req, res) => {
  var email = req.body.email;
  var password = req.body.password;
  members.findOne({
    email: email,
    password: password
  }, (err, dbMembers) => {
    if (err)
      res.json(err)
    else {
      if (dbMembers) {
        let payload = {
          email: dbMembers.email
        }
        jwt.sign(payload, 'members', { //สร้าง token
          expiresIn: 86400
        }, (err, token) => {
          res.json(
            token
          )
        })
      } else {
        res.status(404).send(JSON.stringify(
          'อีเมลล์หรือรหัสผ่านไม่ถูกต้อง'
        ))
      }
    }
  })
})

module.exports = router;