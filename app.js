//Initaite
require('dotenv').config();
const express = require('express');
const ejs = require('ejs');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
// const encrypt = require('mongoose-encryption'); // <-- Security level 2 (encryption)
const md5 = require('md5'); //<-- Security level 3 (Hash)
const app = express();

app.use(express.static("public"));
app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded ({
  extended: true
}));


//DB Section
mongoose.connect('mongodb://localhost:27017/userDB', {
  useNewUrlParser: true,
  useUnifiedTopology: true
});

const userSchema = new mongoose.Schema ({
  email: String,
  password: String
});

// userSchema.plugin(encrypt, {
//   secret: process.env.SECRET_KEY,
//   encryptedFields: ['password']
// }); // <-- Security level 2 (encryption)

const User = new mongoose.model("User", userSchema);


//GET Section
app.get('/', (req, res) => {
  res.render("home");
});

app.get('/login', (req, res) => {
  res.render("login");
});

app.get('/register', (req, res) => {
  res.render("register");
});


//POST Section
app.post('/register', (req, res) => {
  const newUser = new User({
    email: req.body.username,
    password: md5(req.body.password) //<-- Security level 3 (Hash)
  });

  newUser.save((err) => {
    if (!err) {
      res.render("secrets");
    } else {
      res.send("Error happen, try again !");
    }
  });
});

app.post('/login', (req, res) => {
  const username = req.body.username;
  const password = md5(req.body.password); //<-- Security level 3 (Hash)

  User.findOne({email: username}, (err, foundUser) => {
    if (!err) {
      if (foundUser) {
        if (foundUser.password === password) {
          res.render("secrets");
        }
      }
    } else {
      console.log(err);
    }
  });
});


//Listen Port
app.listen(3000, () => {
  console.log("Server started on port 3000");
});
