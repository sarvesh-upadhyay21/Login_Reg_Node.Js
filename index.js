const express = require('express')
const mongoose = require('mongoose')
const bodyparser = require('body-parser')
const cookieParser = require('cookie-parser')
const db = require('./config/config').get(process.env.NODE_ENV)
const User = require('./models/user')
const { auth } = require('./middlewares/auth')
const swaggerUi = require('swagger-ui-express')
swaggerDocument = require('./swagger')
swaggerJsdoc = require('swagger-jsdoc')

const app = express()
// app use 
app.use(bodyparser.urlencoded({ extended: false }))
app.use(bodyparser.json())
app.use(cookieParser())

// database connection
mongoose.Promise = global.Promise
mongoose.connect(db.DATABASE, { useNewUrlParser: true, useUnifiedTopology: true },
  function (err) {
    if (err) console.log(err)
    console.log('database is connected')
  }
)

// welcome user
app.get('/api/get', function (req, res) {
  res.status(200).send(`Welcome to login , sign-up api`)
})

// Create new user (sign-up route 
app.post('/api/register', function (req, res) {
  const newuser = new User(req.body)

  if (newuser.password != newuser.password2)
    return res.status(400).json({ message: 'password not match' })

  User.findOne({ email: newuser.email }, function (err, user) {
    if (user)
      return res.status(400).json({ auth: false, message: 'email exits' })

    newuser.save((err, doc) => {
      if (err) {
        console.log(err)
        return res.status(400).json({ success: false })
      }
      res.status(200).json({
        succes: true,
        user: doc
      })
    })
  })
})

// User login 
app.post('/api/login', function (req, res) {
  let token = req.cookies.auth
  //we check whether a user is already logged-in or not by using findByToken function, if not error will be shown to user
  User.findByToken(token, (err, user) => {
    if (err) return res(err)
    if (user)
      return res.status(400).json({
        error: true,
        message: 'Sorry you are alrady logged-in'
      })
    else {
      User.findOne(
        {
          email: req.body.email
        },
        function (err, user) {
          if (!user)
            return res.json({
              isAuth: false,
              message: ' Auth failed ,email not found'
            })
          //if user exists then we will passwords using comparepassword function 
          user.comparepassword(req.body.password, (err, isMatch) => {
            if (!isMatch)
              return res.json({
                isAuth: false,
                message: "password dosen't match"
              })
            //User will be successfully logged in using our API and a token will be generated in the database.
            user.generateToken((err, user) => {
              if (err) return res.status(400).send(err);
              res.cookie('auth', user.token).json({
                isAuth: true,
                id: user._id,
                email: user.email,
                token: user.token
              });
            });
          });
        }
      );
    };
  })
})

// Chcek for the login status of the user 
app.get("/api/profile", auth, function (req, res) {
  res.json({
    isAuth: true,
    id: req.user._id,
    email: req.user.email,
    name: req.user.firstname + req.user.lastname
  });
});

// user logout
app.get("/api/logout", auth, function (req, res) {
  req.user.deleteToken(req.token, (err, user) => {
    if (err)
      return
    res.status(400).send(err);
    res.sendStatus(200)
  })
});

app.use(express.json())
// setup swagger-ui server
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument))

// Application configurations
const PORT = process.env.PORT || 8000

app.listen(PORT, () => {
  console.log(`app is live at ${PORT}`)
})

