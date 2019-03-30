var express = require('express');
var router = express.Router();
var members = require('../validation/usersModel');
var jwt = require('jsonwebtoken');
/* GET home page. */
router.get('/', (req, res) => {
  members.find((err, dbMembers) => {
    err ? res.json(err) : res.json(dbMembers);
  })
})

//สมัครสมาชิก
router.post('/register', (req, res) => {
  let firstname = req.body.firstname;
  let lastname = req.body.lastname;
  let email = req.body.email;
  let password = req.body.password;
  let position = req.body.position || '';
  let role = req.body.role || 0;
  let image = req.body.image || null;
  let created = new Date();
  let updated = new Date();
  members.findOne({
    email: email
  }, (err, dbEmail) => {
    if (err) {
      res.json(err)
    } else {
      if (dbEmail) {
        res.status(404).send(JSON.stringify(
          'อีเมลล์นี้ถูกใช้งานแล้ว'
        ))
      } else {
        const data = new members({
          firstname,
          lastname,
          email,
          password,
          position,
          role,
          created,
          updated,
          image
        })
        data.save((err, result) => {
          err ? res.json(err) : res.json('success');
        })
      }
    }
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
          res.json({
            'message': 'success',
            accessToken: token
          })
        })
      } else {
        res.status(404).send(JSON.stringify(
          'อีเมลล์หรือรหัสผ่านไม่ถูกต้อง'
        ))
      }
    }
  })
})



//แสดงข้อมูลส่วนตัว
router.get('/data', (req, res) => {
  let token = req.headers.authoriaztion
  let email = '';
  jwt.verify(token, req.headers.secret, (err, decoded) => {
    email = decoded.email;
  });
  members.findOne({
    email: email,
  }, (err, dbMembers) => {
    if (err)
      res.json(err)
    else {
      if (dbMembers) {
        res.json(dbMembers)
      } else {
        res.status(404).send(JSON.stringify(
          'accessToken ไม่ถูกต้อง'
        ))
      }
    }
  })
})

//แก้ไขข้อมูลส่วนตัว
router.post('/profile', (req, res) => {
  let firstname = req.body.firstname;
  let lastname = req.body.lastname;
  let token = req.headers.authoriaztion
  let email = '';
  jwt.verify(token, 'members', (err, decoded) => {
    email = decoded.email;
  });
  let position = req.body.position
  let image = req.body.image;
  let updated = new Date();
  members.findOne({
    email: email
  }, (err, dbEmail) => {
    if (err) {
      res.json(err)
    } else {
      if (!dbEmail) {
        res.status(404).send(JSON.stringify(
          'ไม่มีข้อมูลในระบบ!!!'
        ))
      } else {
        members.updateOne({
          email: email
        }, {
          $set: {
            firstname,
            lastname,
            email,
            position,
            updated,
            image
          }
        }, {
          upsert: true
        }, (err, dbMembers) => {
          if (err) {
            res.json(err)
          } else {
            members.findOne({
              email: email
            }, (err, dbEmail1) => {
              err ? res.json(err) : res.json(dbEmail1)
            })
          }
        })
      }
    }
  })
})

//เปลี่ยนรหัสผ่าน
router.post('/changepassword', (req, res) => {
  let password = req.body.old_password;
  let newpassword = req.body.new_password
  let token = req.headers.authoriaztion
  var email = '';
  jwt.verify(token, 'members', (err, decoded) => {
    email = decoded.email;
  });
  members.findOne({
    email
  }, (err, dbEmail) => {
    if (dbEmail.password != password) {
      res.status(404).send(JSON.stringify('รหัสผ่านเดิมไม่ถูกต้อง'))
    } else {
      members.updateOne({
        email: email
      }, {
        $set: {
          password: newpassword
        }
      }, {
        upsert: true
      }, (err, result) => {
        err ? res.json(err) : res.json('success');
      })
    }
  })
})

//ดึงข้อมูลสมาชิก
router.get('/members', (req, res) => {
  let q = members.find({}).sort({
    updated: 0
  })
  q.exec((err, dbMembers) => {
    err ? res.json(err) : res.json(dbMembers)
  })
})

//ลบข้อมูลสมาชิก
router.delete('/deletemembers', (req, res) => {
  let email = req.query.email;
  members.deleteOne({
    email
  }, (err, result) => {
    if (err) {
      res.json(err)
    } else {
      members.find({}, (err, dbMembers) => {
        err ? res.json(err) : res.json(dbMembers)
      })
    }
  })
})

//ดึงข้อมูลสมาชิกคนเดียว
router.get('/updatemembers', (req, res) => {
  let email = req.query.email;
  members.findOne({
    email: email
  }, (err, dbMembers) => {
    if (err) {
      res.json(err)
    } else {
      if (!dbMembers) {
        res.status(404).send(JSON.stringify('ไม่มีข้อมูลในระบบ'))
      } else {
        res.json(dbMembers)
      }
    }

  })
})

//แก้ไขข้อมูลสมาชิก
router.post('/updatemembers', (req, res) => {
  let firstname = req.body.firstname;
  let lastname = req.body.lastname;
  let newEmail = req.body.email;
  let email = req.query.email;
  let position = req.body.position
  let role = req.body.role
  let image = req.body.image || null;
  let updated = new Date();
  members.findOne({
    email: email
  }, (err, dbEmail) => {
    if (err) {
      res.json(err)
    } else {
      if (!dbEmail) {
        res.status(404).send(JSON.stringify(
          'ไม่มีข้อมูลในระบบ'
        ))
      } else {
        members.findOne({
          email: newEmail
        }, (err, dbNewEmail) => {
          if (dbNewEmail != null && dbNewEmail.email != email) {
            res.status(404).send(JSON.stringify('อีเมลล์นี้ถูกใช้งานแล้ว'))
          } else {
            let password = req.body.password || dbEmail.password
            members.updateOne({
              email: email
            }, {
              $set: {
                email: newEmail,
                firstname,
                lastname,
                password,
                position,
                role,
                updated,
                image
              }
            }, {
              upsert: true
            }, err => {
              err ? res.json(err) : res.json('success')
            })
          }
        })
      }
    }
  })
})


module.exports = router;