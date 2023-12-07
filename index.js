import express from 'express';
import debug from 'debug';
import passport from 'passport';
import session from 'express-session';
import { Strategy as LinkedInStrategy } from 'passport-linkedin-oauth2';

const debugServer = debug('app:Server');
const app = express();

//* Configure Passport
passport.use(
  new LinkedInStrategy(
    {
      clientID: process.env.LINKEDIN_CLIENT_ID,
      clientSecret: process.env.LINKEDIN_CLIENT_SECRET,
      callbackURL: process.env.LINKEDIN_CALL_BACK_URL,
      scope: ['r_emailaddress', 'r_liteprofile'],
      state: true,
    },
    function (accessToken, refreshToken, profile, done) {
      // asynchronous verification, for effect...
      process.nextTick(function () {
        // To keep the example simple, the user's LinkedIn profile is returned to
        // represent the logged-in user. In a typical application, you would want
        // to associate the LinkedIn account with a user record in your database,
        // and return that user instead.
        return done(null, profile);
      });
    }
  )
);

//* Save User into session (cookie)
passport.serializeUser((user, done) => {
  done(null, user);
});

//* Retrieve user from session (cookie)
passport.deserializeUser((user, done) => {
  done(null, user);
});

//* Setup the session middleware
app.use(
  session({
    secret: process.env.SESSION_SECRET,
    resave: true,
    saveUninitialized: true,
    cookie: { maxAge: 1000 * 60 * 60 * 24 * 360 },
  })
);

//* Setup passport middleware
app.use(passport.initialize());
app.use(passport.session());

app.get('/', (req, res) => {
  res.send(
    `<h1>Please Navigate to <a href="http://localhost:3000/auth/linkedin" target="_blank">Sign In</a> to login</h1>`
  );
});

app.get(
  '/auth/linkedin',
  passport.authenticate('linkedin', { scope: ['profile'] })
);

//* callback route for linkedin to redirect to
app.get(
  '/auth/linkedin/callback',
  passport.authenticate('linkedin', { failureRedirect: '/' }),
  (req, res) => {
    res.redirect('/profile');
  }
);

//* Display the user profile
app.get('/profile', (req, res) => {
  if (req.isAuthenticated()) {
    res.send(
      `<h1>You're logged in </h1><pre>${JSON.stringify(
        req.user,
        null,
        2
      )}</pre> `
    );
  } else {
    res.redirect('/');
  }
});

//* Logout the user
app.get('/logout', (req, res, next) => {
  req.logout((err) => {
    if (err) {
      return next(err);
    }
  });
  res.redirect('/');
});

app.listen(3000, () => {
  debugServer('http://localhost:3000');
});
