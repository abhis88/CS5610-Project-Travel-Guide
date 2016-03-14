
var express = require('express');
var app = express();
var bodyParser = require('body-parser');
var multer = require('multer');
var passport = require('passport');
var LocalStrategy = require('passport-local').Strategy;
var cookieParser = require('cookie-parser');
var session = require('express-session');

var mongoose = require('mongoose');

var connectionString = process.env.OPENSHIFT_MONGODB_DB_URL || 'mongodb://localhost/test'
mongoose.connect(connectionString);

app.use(bodyParser.json()); // for parsing application/json
app.use(bodyParser.urlencoded({ extended: true })); // for parsing application/x-www-form-urlencoded
app.use(multer()); // for parsing multipart/form-data
app.use(session({ secret: 'this is the secret' }));
app.use(cookieParser())
app.use(passport.initialize());
app.use(passport.session());

//GET /style.css etc
app.use(express.static(__dirname + '/public'));

// Schema creation
var UserSchema = new mongoose.Schema({
    firstname: String,
    lastname: String,
    username: String,
    email: String,
    password: String,
    about: String,
    roles: [String],
    favplaces: [{ bookmark: String }],
    favweather: [{ bookmark: String }],
    favuser: [String]
});

var UserModel = mongoose.model("UserModel", UserSchema);

var CommentSchema = new mongoose.Schema({
    firstname: String,
    comment: String,
    date: { type: Date, default: Date.now }
});

var CommentModel = mongoose.model("CommentModel", CommentSchema);

//-----------------------------------------------------------------------//

// add new comment
app.post("/addcomment", function (req, res) {
    var newUser = new CommentModel(req.body);
    newUser.save(function (err, doc) {
        CommentModel.find(function (err, comments) {
            res.json(comments);
        });
    });
});

// get all the comments
app.get("/getallcomments", function (req, res) {
    CommentModel.find(function (err, doc) {
        res.json(doc);
    })
});


app.get('/', function (req, res) {
    res.send('hello world');
});

// check if username exists
passport.use(new LocalStrategy(
    function (username, password, done) {
        UserModel.findOne({ username: username, password: password }, function (err, user) {
            if (user) {
                return done(null, user);
            }
            return done(null, false);
        });
    }));

passport.serializeUser(function (user, done) {
    done(null, user);
});

passport.deserializeUser(function (user, done) {
    done(null, user);
});

// login module
app.post("/login", passport.authenticate('local'), function (req, res) {
    var user = req.user;
    res.json(user);
});

// logout module
app.post("/logout", function (req, res) {
    req.logout();
    res.send(200);
});

app.get("/loggedin", function (req, res) {
    res.send(req.isAuthenticated() ? req.user : '0');
});

//register module
app.post("/register", function (req, res) {
    var newUser = req.body;
    newUser.roles = ['student'];
    UserModel.findOne({ username: newUser.username }, function (err, user) {
        if (err) { return next(err); }
        console.log(user);
        if (user) {
            res.json(null);
            return;
        }
        else {
            var newUser = new UserModel(req.body);
            newUser.save(function (err, user) {
                req.login(user, function (err) {
                    if (err) { return next(err); }
                    console.log(user);
                    res.json(user);
                });
            });
        }
    });
});

//Duplicate username prevention
app.get("/duplicateusername/:username", function (req, res) {
    UserModel.find({ username: { "$in": [req.params.username] } }, function (err, data) {
        res.json(data);
    });
});

// update user detail
app.put("/updateuser", function (req, res) {
    UserModel.where('_id', req.body._id).update({ $set: { firstname: req.body.firstname, lastname: req.body.lastname, email: req.body.email, about: req.body.about } }, function (err, count) {
        res.json(req.body);
    });
});

// fetch all user info
app.get("/fetchalluserinfo/:id", function (req, res) {
    UserModel.findById(req.params.id, function (err, data) {
        res.json(data);
    });
});

// delete bookmark
app.delete("/deletebookmark/:favid/:id", function (req, res) {
    var result = null;
    UserModel.findOne({ _id: req.params.id }, function (err, res) {
        UserModel.update({ _id: res._id },
            { $pull: { favplaces: { _id: req.params.favid } } }, function (err, result) {
                if (err) throw err;
                result = result;
            });
    });
});

// get favourite places
app.put("/favplaces", function (req, res) {
    var result = null;
    UserModel.findOne({ _id: req.body._id }, function (err, res) {
        UserModel.update({ _id: res._id },
            { $push: { favplaces: { $each: [{ bookmark: req.body.favplaces }] } } }, function (err, result) {
                if (err) throw err;
                result = result;
            });
    });
    res.json(req.body);
});

// get weather information
app.put("/weatherplaces", function (req, res) {
    var result = null;
    UserModel.findOne({ _id: req.body._id }, function (err, res) {
        UserModel.update({ _id: res._id },
            { $push: { favweather: { $each: [{ bookmark: req.body.favweather }] } } }, function (err, result) {
                if (err) throw err;
                result = result;
            });
    });
    res.json(req.body);
});

// delete weather bookmark
app.delete("/deleteweatherbookmark/:favid/:id", function (req, res) {
    var result = null;
    UserModel.findOne({ _id: req.params.id }, function (err, res) {
        UserModel.update({ _id: res._id },
            { $pull: { favweather: { _id: req.params.favid } } }, function (err, result) {
                if (err) throw err;
                result = result;
            });
    });
});

// SERACH USER
app.get("/searchuser/:search", function (req, res) {
    var regexp = new RegExp(req.params.search, "i");
    UserModel.find({
        $or: [{ firstname: regexp },
              { lastname: regexp },
              { favplaces: { $elemMatch: { bookmark: regexp } } },
              { favweather: { $elemMatch: { bookmark: regexp } } }]
    }, function (err, data) {
        res.json(data);
    })
});

// like user
app.put("/likeduser", function (req, res) {
    var result = null;
    UserModel.findOne({ _id: req.body._id }, function (err, res) {
        UserModel.update({ _id: res._id },
            { $push: { favuser: req.body.favuser } }, function (err, result) {
                if (err) throw err;
                result = result;
            });
    });
    res.json(req.body);
});

app.delete("/unlikeuser/:userid/:id", function (req, res) {

    //console.log(req.params.userid);
    //console.log(req.params.id);

    UserModel.update({ _id: req.params.id },
         { $pull: { favuser: req.params.userid } }, { upset: true }, function (err, result) {
             UserModel.find({ _id: req.params.id }, function (err, doc) {
                 console.log(doc);
                 res.json(doc);
             })
         });
});

app.get("/getalluser", function (req, res) {
    UserModel.find(function (err, doc) {
        res.json(doc);
    });
});

/* CONNECTION STRING */

var ip = process.env.OPENSHIFT_NODEJS_IP || '127.0.0.1';
var port = process.env.OPENSHIFT_NODEJS_PORT || 3000;

app.listen(port, ip);
