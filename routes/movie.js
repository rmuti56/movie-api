var express = require('express')
var router = express.Router();
var members = require('../validation/usersModel');
var movies = require('../validation/movie.Modal');
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

//อัพโหลดไฟล์
function gUpload(stream, filename, mimeType) {
  var fileMetadata = {
    'name': filename,
    'parents': ['11Nv0jlg-vpzbfwA3pWT_1SJcW-k39Fo1']
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

//แก้ไขไฟล์
function updateFile(stream, id, mimeType, filename) {
  console.log(id)
  var media = {
    mimeType,
    body: stream
  }
  var fileMetadata = {
    'name': filename,
  };

  return new Promise((resolve, reject) => {
    drive.files.update({
      fileId: id,
      media: media,
      resource: fileMetadata,
    }, (err, file) => {
      if (err) {
        reject(err)
      } else {
        resolve(file);
      }
    })
  })
}

//ลบไฟล์
function deleteFile(idImage, idVideo) {
  return new Promise((resolve, reject) => {
    drive.files.delete({
      fileId: idImage
    }, (err, result) => {
      if (err) {
        reject(err)
      } else {
        drive.files.delete({
          fileId: idVideo
        }, (err, result) => {
          if (err) {
            reject(err)
          } else {
            resolve(result)
          }
        })
      }
    })
  })
}

//อัพโหลดภาพ
router.post('/upload', upload.array('uploads[]'), (req, res) => {
  let id = req.query.id;
  let fileObject = req.files[0];
  if (id && fileObject) {
    console.log('เข้านี้')
    let bufferStream = new stream.PassThrough();
    bufferStream.end(fileObject.buffer);
    updateFile(bufferStream, id, fileObject.mimetype, Date.now().toString() + '_' + fileObject.originalname).then((result) => {
      console.log(result.data)
      console.log('result', result)
      res.send(JSON.stringify({
        data: result.data
      }))
    }).catch(err => {
      console.log(err);
      res.status(500);
      res.send({
        status: 500,
        error: err
      })
    })
  } else {
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
  }

});

//แสดงหนังโดยรวม
router.get('/loadmovies', (req, res) => {
  var id = req.query.id

  if (id != null) {
    movies.findById(id, (err, dbMovies) => {
      err ? res.json(err) : res.json(dbMovies);
    })
  } else {
    var q = movies.find({}).sort({
      updated: -1
    });
    q.exec((err, dbMovies) => {
      err ? res.json(err) : res.json(dbMovies)
    })
  }
})

//แสดงหนังตามหมวดหมู่
router.get('/searchmovie', (req, res) => {
  var group = req.query.item;
  movies.find({
    group
  }).sort({
    updated: -1
  }).exec((err, dbMovies) => {
    err ? res.json(err) : res.json(dbMovies);
  })
})

//แสดงหนังตามประเภท
router.get('/searchtypemovie', (req, res) => {
  var type = req.query.item;
  movies.find({
    type
  }).sort({
    updated: -1
  }).exec((err, dbMovies) => {
    err ? res.json(err) : res.json(dbMovies);
  })
})


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

//อัพโหลดหนัง
router.post('/addmovie', (req, res) => {
  var id = req.query.id
  var nameMovie = req.body.nameMovie;
  var linkPreview = req.body.linkPreview;
  var soundTrack = req.body.soundTrack;
  var resolution = req.body.resolution;
  var group = req.body.group;
  var type = req.body.type;
  var summary = req.body.summary;
  var idImageUpload = req.body.idImageUpload;
  var idVideoUpload = req.body.idVideoUpload;
  var rating = req.body.rating
  var created = Date.now();
  var updated = Date.now();
  if (id != null) {
    if (!idImageUpload && !idVideoUpload) {
      movies.findByIdAndUpdate(id, {
        $set: {
          nameMovie,
          linkPreview,
          soundTrack,
          resolution,
          group,
          type,
          rating,
          summary,
          updated
        }
      }, (err, dbMovies) => {
        err ? res.json(err) : res.json('แก้ไขสำเร็จ')
      })
    } else if (!idImageUpload) {
      movies.findByIdAndUpdate(id, {
        $set: {
          nameMovie,
          linkPreview,
          soundTrack,
          resolution,
          group,
          type,
          rating,
          summary,
          updated,
          idVideoUpload
        }
      }, (err, dbMovies) => {
        err ? res.json(err) : res.json('แก้ไขสำเร็จ')
      })
    } else {
      movies.findByIdAndUpdate(id, {
        $set: {
          nameMovie,
          linkPreview,
          soundTrack,
          resolution,
          group,
          type,
          rating,
          summary,
          updated,
          idImageUpload
        }
      }, (err, dbMovies) => {
        err ? res.json(err) : res.json('แก้ไขสำเร็จ')
      })
    }
  } else {
    new movies({
      nameMovie,
      linkPreview,
      soundTrack,
      resolution,
      group,
      type,
      rating,
      summary,
      idImageUpload,
      idVideoUpload,
      created,
      updated
    }).save((err, result) => {
      if (err) {
        console.log(err)
        res.json(err)
      } else {
        console.log('สำเร็จ')
        res.json('เพิ่มข้อมูลสำเร็จ')
      }
    })
  }
})

//ลบหนัง
router.delete('/deletemovie', (req, res) => {
  let id = req.query.id
  let idImageUpload = req.query.idImage;
  let idVideoUpload = req.query.idVideo;
  console.log(id, idImageUpload, idVideoUpload);
  deleteFile(idImageUpload, idVideoUpload).then((result) => {
    console.log(result)
    movies.findByIdAndRemove(id, (err, result) => {
      err ? res.json(err) : res.json(result);
    })
  }).catch(err => {
    res.json(err)
  })
})


module.exports = router;