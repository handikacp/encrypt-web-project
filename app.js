//Initaite
require('dotenv').config();
const express = require('express');
const ejs = require('ejs');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const session = require('express-session');
const passport = require('passport');
const passportLocalMongoose = require('passport-local-mongoose');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const FacebookStrategy = require('passport-facebook').Strategy;
const findOrCreate = require('mongoose-findorcreate');

const app = express();

app.use(express.static("public"));
app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded ({
  extended: true
}));

// -- Passport Login Setup
app.use(session({
  secret: "Our Little Secrets.",
  resave: false,
  saveUninitialized: false
}));

app.use(passport.initialize());
app.use(passport.session());


//DB Section
mongoose.connect('mongodb://localhost:27017/userDB', {
  useNewUrlParser: true,
  useUnifiedTopology: true
});

mongoose.set("useCreateIndex", true);

const userSchema = new mongoose.Schema ({
  email: String,
  password: String,
  googleId: String,
  facebookId: String
});

// -- Passport Login Setup
userSchema.plugin(passportLocalMongoose);
userSchema.plugin(findOrCreate);

const User = new mongoose.model("User", userSchema);

passport.use(User.createStrategy());

passport.serializeUser((user, done) => {
  done(null, user.id);
});

passport.deserializeUser((id, done) => {
  User.findById(id, (err, user) => {
    done(err, user);
  });
});

// -- OAuth Google Setup
passport.use(new GoogleStrategy ({
  clientID: process.env.CLIENT_ID,
  clientSecret: process.env.CLIENT_SECRET,
  callbackURL: "http://localhost:3000/auth/google/secrets",
  userProfileURL: "https://www.googleapis.com/oauth2/v3/userinfo"
},
(accessToken, refreshToken, profile, cb) => {
  User.findOrCreate({googleId: profile.id}, (err, user) => {
    return cb(err, user);
  });
}
));

// -- OAuth Facebook Setup
passport.use(new FacebookStrategy({
    clientID: process.env.FB_ID,
    clientSecret: process.env.FB_SECRET,
    callbackURL: "http://localhost:3000/auth/facebook/secrets"
  },
  (accessToken, refreshToken, profile, done) => {
    User.findOrCreate({facebookId: profile.id}, (err, user) => {
      if (err) { return done(err); }
      done(null, user);
    });
  }
));


//GET Section
app.get('/', (req, res) => {
  res.render("home");
});

app.get('/auth/google',
passport.authenticate("google", {scope: ["profile"]})
);

app.get('/auth/google/secrets',
passport.authenticate("google", {failureRedirect: '/login'}),
(req, res) => {
  res.redirect('/secrets');
}
);

app.get('/auth/facebook',
passport.authenticate("facebook")
);

app.get('/auth/facebook/secrets',
passport.authenticate("facebook", {failureRedirect: '/login'}),
(req, res) => {
  res.redirect('/secrets');
}
);

app.get('/login', (req, res) => {
  res.render("login");
});

app.get('/register', (req, res) => {
  res.render("register");
});

app.get('/secrets', (req, res) => {
  if (req.isAuthenticated()) {
    res.render("secrets");
  } else {
    res.redirect('/login');
  }
});

app.get('/logout', (req, res) => {
  req.logout();
  res.redirect('/');
});


//POST Section
app.post('/register', (req, res) => {
  User.register({username: req.body.username}, req.body.password, (err, user) => {
    if (err) {
      console.log(err);
      res.redirect('/register');
    } else {
      passport.authenticate("local")(req, res, () => {
        res.redirect('/secrets');
      })
    }
  })
});

app.post('/login', (req, res) => {
  const user = new User({
    username: req.body.username,
    password: req.body.password
  });

  req.login(user, (err) => {
    if (err) {
      console.log(err);
    } else {
      passport.authenticate("local")(req, res, () => {
        res.redirect('/secrets');
      })
    }
  })
});


//Listen Port
app.listen(3000, () => {
  console.log("Server started on port 3000");
});
