
var LocalStrategy   = require('passport-local').Strategy;
var FacebookStrategy = require('passport-facebook').Strategy;
var GoogleStrategy = require('passport-google-oauth').OAuth2Strategy;
// load up the user model
var User            = require('../models/user');
// load the auth variables
var configAuth = require('./auth');
// expose this function to our app using module.exports
module.exports = function(passport) {

    // =========================================================================
    // passport session setup ==================================================
    // =========================================================================
    // required for persistent login sessions
    // passport needs ability to serialize and unserialize users out of session

    // used to serialize the user for the session
    passport.serializeUser(function(user, done) {
        done(null, user.id);
    });

    // used to deserialize the user
    passport.deserializeUser(function(id, done) {
        User.findById(id, function(err, user) {
            done(err, user);
        });
    });

    // =========================================================================
    // LOCAL SIGNUP ============================================================
    // =========================================================================
    // we are using named strategies since we have one for login and one for signup
    // by default, if there was no name, it would just be called 'local'

    passport.use('local-signup', new LocalStrategy({
        // by default, local strategy uses username and password, we will override with email
        usernameField : 'email',
        passwordField : 'password',
        passReqToCallback : true // allows us to pass back the entire request to the callback
    },
    function(req, email, password, done) { 
      process.nextTick(function() {
        User.findOne({ 'local.email' :  email }, function(err, user) {
          if (err)
            return done(err);
          if (user) {
            return done(null, false, req.flash('signupMessage', 'That email is already taken.'));
          }
          else {
            User.findOne({$or:[ {'facebook.email' : email}, {'google.email' : email}]}, function(err, social_user) {  
              if (err)
                return done(err); 
              if (social_user) {
                social_user.local.username = req.body.username;
                social_user.local.email    = email;
                social_user.local.password = social_user.generateHash(password);
                // save the user
                social_user.save(function(err) {
                  if (err)
                    throw err;
                  return done(null, social_user);
                });
              }
              else {
                // if there is no user with that email
                // create the user
                var newUser            = new User();
                // set the user's local credentials
                newUser.local.username    = req.body.username;
                newUser.local.email    = email;
                newUser.local.password = newUser.generateHash(password);
                // save the user
                newUser.save(function(err) {
                  if (err)
                    throw err;
                  return done(null, newUser);
                });
              }  
            });
          }
        }); 
      });   
    }));

    // =========================================================================
    // LOCAL LOGIN =============================================================
    // =========================================================================
    // we are using named strategies since we have one for login and one for signup
    // by default, if there was no name, it would just be called 'local'

    passport.use('local-login', new LocalStrategy({
        // by default, local strategy uses username and password, we will override with email
        usernameField : 'email',
        passwordField : 'password',
        passReqToCallback : true // allows us to pass back the entire request to the callback
    },
    function(req, email, password, done) { // callback with email and password from our form

        // find a user whose email is the same as the forms email
        // we are checking to see if the user trying to login already exists
        User.findOne({ 'local.email' :  email }, function(err, user) {
            // if there are any errors, return the error before anything else
            if (err)
                return done(err);

            // if no user is found, return the message
            if (!user)
                return done(null, false, req.flash('loginMessage', 'No user found.')); // req.flash is the way to set flashdata using connect-flash

            // if the user is found but the password is wrong
            if (!user.validPassword(password))
                return done(null, false, req.flash('loginMessage', 'Oops! Wrong password.')); // create the loginMessage and save it to session as flashdata

            // all is well, return successful user
            return done(null, user);
        });

    }));


     // =========================================================================
    // FACEBOOK ================================================================
    // =========================================================================
    passport.use(new FacebookStrategy({

        // pull in our app id and secret from our auth.js file
        clientID        : configAuth.facebookAuth.clientID,
        clientSecret    : configAuth.facebookAuth.clientSecret,
        callbackURL     : configAuth.facebookAuth.callbackURL,
        passReqToCallback : true,
        profileFields: ['id', 'picture', 'emails'] 
    },

    // facebook will send back the token and profile
    function(req, token, refreshToken, profile, done) {

        // asynchronous
        process.nextTick(function() {
            User.findOne({$or:[{'local.email' : profile.emails[0].value}, {'facebook.email' : profile.emails[0].value}, {'google.email' : profile.emails[0].value}]}, function(err, user) {
              // if there is an error, stop everything and return that
              // ie an error connecting to the database
              if (err)
                  return done(err);
              if (user) {
                  // set all of the facebook information in our user model
                  user.facebook.id    = profile.id; // set the users facebook id                   
                  user.facebook.token = token; // we will save the token that facebook provides to the user                    
                  user.facebook.email = profile.emails[0].value;
                  user.facebook.picture= 'http://graph.facebook.com/' + profile.id + '/picture';
                  // save our user to the database
                  user.save(function(err) {
                      if (err)
                          throw err;

                      // if successful, return the new user
                      return done(null, user);
                  });
              }
              else {
                   var newUser            = new User();
                  // set all of the facebook information in our user model
                  newUser.facebook.id    = profile.id; // set the users facebook id                   
                  newUser.facebook.token = token; // we will save the token that facebook provides to the user                    
                  newUser.facebook.email = profile.emails[0].value;
                  newUser.facebook.picture= 'http://graph.facebook.com/' + profile.id + '/picture';
                  // save our user to the database
                  newUser.save(function(err) {
                      if (err)
                          throw err;

                      // if successful, return the new user
                      return done(null, newUser);
                  });
              }
          });
        });

    }));
    
     // =========================================================================
    // GOOGLE ==================================================================
    // =========================================================================
    passport.use(new GoogleStrategy({

        clientID        : configAuth.googleAuth.clientID,
        clientSecret    : configAuth.googleAuth.clientSecret,
        callbackURL     : configAuth.googleAuth.callbackURL,
        passReqToCallback : true

    },
    function(req,token, refreshToken, profile, done) {

        // make the code asynchronous
        // User.findOne won't fire until we have all our data back from Google
        process.nextTick(function() {
          User.findOne({$or:[{'local.email' : profile.emails[0].value}, {'facebook.email' : profile.emails[0].value}, {'google.email' : profile.emails[0].value}]}, function(err, user) {
            // if there is an error, stop everything and return that
            // ie an error connecting to the database
            if (err)
                return done(err);
            var picture = profile._json['picture'];
            if (user) {  
                user.google.id      = profile.id;                  
                user.google.token   = token;                   
                user.google.email   = profile.emails[0].value;
                user.google.picture = picture;
                user.google.name    = profile.displayName;
                // save our user to the database
                user.save(function(err) {
                    if (err)
                        throw err;

                    // if successful, return the new user
                    return done(null, user);
                });
            }
            else {
              var newUser            = new User();
              newUser.google.id      = profile.id;                  
              newUser.google.token   = token;                   
              newUser.google.email   = profile.emails[0].value;
              newUser.google.picture = picture;
              newUser.google.name    = profile.displayName;  
              newUser.save(function(err) {
                if (err)
                  throw err;
                // if successful, return the new user
                return done(null, newUser);
              });
            }
          });
        });

        

    }));

};