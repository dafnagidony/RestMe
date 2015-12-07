var express = require("express");
var passport = require('passport');
var flash    = require('connect-flash');
var morgan       = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser   = require('body-parser');
var session      = require('express-session');
var mongojs = require('mongojs');
var mongoose = require('mongoose');
var request = require('request');
var sassMiddleware = require('node-sass-middleware');
var app = express();
var users_db = mongojs('dafnagidony:12345@ec2-54-208-46-213.compute-1.amazonaws.com:27017/users', ['users','gurus'])
var configDB = require('./config/database.js');
mongoose.connect(configDB.url); // connect to our database
var yelp = require("yelp").createClient({
  consumer_key: "ZNZfhTxqwE3l5n3AmIYa8w", 
  consumer_secret: "1E4s-m1A8p2L2oVE_KpJOQBk-nY",
  token: "oaqOh2RS92CvBA74b30TLwILgDsn0GCQ",
  token_secret: "1i1cOR-u8L5MB34CIFtR4uhIG10"
});

var port = 8080;
app.set('view engine', 'ejs'); // set up ejs for templating
app.set('views', __dirname + '/public/views');
app.set("view options", {layout: false});
app.use(express.static(__dirname + '/public'));
app.use(morgan('dev')); // log every request to the console
app.use(cookieParser()); // read cookies (needed for auth)
app.use(bodyParser()); // get information from html forms
app.use(
   sassMiddleware({
    src: __dirname + '/public/sass', 
    dest: __dirname + '/public/stylesheets',
    prefix:  '/stylesheets',
    debug: true,         
  })
); 


// required for passport
app.use(session({ secret: 'thisismysecretsecretsecretkey'})); // session secret
app.use(passport.initialize());
app.use(passport.session()); // persistent login sessions
app.use(flash()); // use connect-flash for flash messages stored in session
require('./config/passport')(passport);



app.get('/',function(req,res){
  res.render('main.ejs');  
});


app.get('/userslist', function(req,res) {
	users_db.gurus.find(function(err, docs) {
		if (err) { console.log(err);} 
		res.json(docs);
	});    
});

app.get('/modalUrl', function(req,res) { 
  
  if (req.query.url.indexOf('?') == -1) {
    req.session.url = req.query.url + '?';
  }
  else {
    req.session.url = req.query.url + '&';
  }
  res.end();
});

app.get('/get_user',function(req,res){
  set_user(req, function(req, display_profile, user_image, user_name) {
    res.json({ message_sighup: req.flash('signupMessage'), message_login: req.flash('loginMessage') ,user_name: user_name , user_image: user_image, display_profile: display_profile}); 
  });
});

app.get('/users/:name/yelp', function(req,res) {
  users_db.gurus.find({"name" : req.params.name}, function(err,userdocs) {
    userdocs[0].yelp_arr = [];
    for (var i=0; i< userdocs[0].ref.length; i++) {
      var review = userdocs[0].ref[i].review;
      yelp.search({term: userdocs[0].ref[i].name, location: "New York, NY", limit: 1}, function(error, data) {
        userdocs[0].yelp_arr.push(data);
        if (userdocs[0].yelp_arr.length == userdocs[0].ref.length) {
          res.json(userdocs[0]);        
        }
      });
    } 
  });
});


app.post('/login',isNotLoggedIn, function(req, res, next) { 
  passport.authenticate('local-login',  {
    successRedirect : req.session.url,
    failureRedirect : req.session.url+'login_fail=true'
  })(req, res, next);
});

app.post('/signup',isNotLoggedIn, function(req, res, next) { 
  passport.authenticate('local-signup',  {
    successRedirect : req.session.url,
    failureRedirect : req.session.url+'signup_fail=true'
  })(req, res, next);
});


app.get('/profile', isLoggedIn, function(req, res) {
  res.render('profile.ejs', {
    user : req.user // get the user out of session and pass to template
  });
});

/*app.post('/search', function(req,res) { 
  req.session.address =  req.body.address;
  req.session.find = req.body.find;
  set_user(req, function(req, display_profile, user_image, user_name) {
    res.render('search.ejs', {  message_sighup: req.flash('signupMessage'), 
      message_login: req.flash('loginMessage') ,user_name: user_name , 
      user_image: user_image, display_profile: display_profile,
      address: req.body.address.split(",").slice(0,3).join(","), find : req.body.find
    }); 
  });
});
*/

app.get('/yelp_search',function(req,res) {
  var offset = (Number(req.query.page_num) -1)*5;
  var find = req.query.find;
  var address = req.query.address;
  console.log(offset);
  yelp.search({term: find, location: address, limit:5, offset:offset}, function(error, data) {
    if (error) {
      request('https://maps.googleapis.com/maps/api/geocode/json?address='+req.session.address+'&key=AIzaSyAWwKDRBWvR3zuln0On8ZTCoX7jeCcgi8Y', function (error, response, body) {
        if (!error && response.statusCode == 200) {
          var location = JSON.parse(body).results[0].geometry.location;
          data = {region: {center:{latitude: location.lat, longitude: location.lng}},businesses:[],total:0};
          res.json(data);
        }
      })
      
    }
    else { 
      res.json(data);
    }  
  }); 
});

app.post('/save_business', function(req,res) {
  var User = require('./models/user');
  if (req.isAuthenticated()) {
    User.findById(req.user._id, 'favorites', function (err, user) {
      var temp = {};
      temp.category = req.body.categories;
      temp.note = req.body.note;
      temp.yelp_id = req.body.id;
      user.favorites.push(temp);
      user.save(function(err) {
        if (err) {
          console.log("error saving favorites");
        }
        console.log("save");
      });                    
    });
  }
  else {
    console.log("need to log in");
  }
});

// =====================================
// FACEBOOK ROUTES =====================
// =====================================
// route for facebook authentication and login
app.get('/auth/facebook',isNotLoggedIn, passport.authenticate('facebook', { scope : 'email'}));

app.get('/auth/facebook/callback',isNotLoggedIn, function(req, res, next) { 
  passport.authenticate('facebook',  {
    successRedirect : req.session.url,
    failureRedirect : req.session.url+'login_fail=true'
  })(req, res, next);
});

app.get('/logout', function(req, res) {
  console.log(req.query.url)
  req.logout();
  res.redirect(req.query.url);
});


// =====================================
// GOOGLE ROUTES =======================
// =====================================
// send to google to do the authentication
// profile gets us their basic information including their name
// email gets their emails
app.get('/auth/google',isNotLoggedIn, passport.authenticate('google', { scope : ['profile', 'email'] }));

// the callback after google has authenticated the user

app.get('/auth/google/callback',isNotLoggedIn, function(req, res, next) { 
  passport.authenticate('google',  {
    successRedirect : req.session.url,
    failureRedirect : req.session.url+'login_fail=true'
  })(req, res, next);
});
//*Run the server.*/
app.listen(port,function(){
    console.log('Listening on ' + port);
});

function isLoggedIn(req, res, next) {
  // if user is authenticated in the session, carry on 
  if (req.isAuthenticated())
    return next();
    // if they aren't redirect them to the home page
  res.redirect('/#');
}

function isNotLoggedIn(req, res, next) {
  // if user is authenticated in the session, carry on 
  if (!req.isAuthenticated())
    return next();
    // if they aren't redirect them to the home page
  res.redirect('/#');
}
function set_user(req, callback) {
  var display_profile = false;
  var user_image = '../images/Unknown-person.gif';
  var user_name = "";
  if (req.user) {
    user_image = req.user.facebook.picture || req.user.google.picture || '../images/Unknown-person.gif';
    user_name = req.user.local.username || req.user.google.name || "";
    user_name += "!"
    display_profile = true;
  }
  callback(req, display_profile, user_image, user_name);
}