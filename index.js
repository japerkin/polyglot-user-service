/* 
 * This source file contains the core of what we developed
 * at the SDHacks 2018 hackathon (PolyGlot).  It contains
 * what is essentially 2 microservices in one service.
 * 
 * The first API pertains to user related functionality.
 * 
 * The second API pertains to utilizing Authorize.net
 * in order to simulate accepting payments through their
 * sandbox mode.
 * 
 ******************************************************/
var express = require('express');
var app = express();
var bodyParser = require('body-parser');
var mysql = require('mysql');

app.use(bodyParser.json());
app.use((req, res, next) => {
res.header('Access-Control-Allow-Origin', '*');
res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
next()
});

// had to use bcryptjs because for some reason the original bcrypt module is broke af.
const bcrypt = require('bcryptjs');

function generatePassword(password) {
    let hash = bcrypt.hash(password, 10);
    return hash;
}
function comparePasswords(password1, password2) {
    bcrypt.hash(password1, 10, (err, hash) => {
        bcrypt.compare(password2, hash, (err, result) => {
            return result;
        });
    });
}

var connection = mysql.createConnection({
    host: '127.0.0.1',
    user:'jacob',
    password:'Alchamist100!',
    port: 3306,
    database:'polyglot',
    insecureAuth: true
});

// creates a new user
// beautiful, am I right?
app.post('/api/user/create', async function(req, resp) {
    let checkIfUserExistsQuery = 'SELECT * FROM user WHERE email=?';
    connection.connect( (err) => {
        connection.query(checkIfUserExistsQuery, [req.body.email], (err, result) => {
            if (result.length > 0) {
                resp.status(400).send('Error:  Email already exists.');
            } else {
                let userCreationQuery = 'INSERT INTO user (fname, lname, email, password) VALUES (?,?,?,?)';
                generatePassword(req.body.password).then( (result) => {
                
                let newUser = {
                    fname:      req.body.fname,
                    lname:      req.body.lname,
                    email:      req.body.email,
                    password:   result
                };
                console.log(newUser);
                connection.connect( (err) => {
                    connection.query(userCreationQuery, [newUser.fname, newUser.lname, newUser.email, newUser.password], (err, result) => {  
                        resp.status(200).send('User successfully created.');
                    });
                });
            }, function(err) { console.log(err); });
            }
        });
    });
});

// access a user's information
// we never used it and it's not necessary for the app, so
// i'm not sure why I created it, but hey...practice makes perfect doesn't it?
app.get('/api/user/get/:id', (req, resp) => {
    let id = req.params['id'];
    let getUserQuery = 'SELECT id, fname, lname, email FROM user WHERE id=?';
    connection.connect( (err) => {
        if (err) console.log('Unable to connect to MySQL');
        connection.query(getUserQuery, [id], (err, result) => {
            if (err)
                resp.status(500).send('Error:  Internal Server Error!\nUnable to find user.');
            else
                resp.status(200).send(result);
        });
    });
});


// retrieve all users
// yet again another useless endpoint merely used
// to practice getting used to express+mysql
app.get('/api/user/get/all', (req, resp) => {
    let getAllUsersQuery = 'SELECT * FROM user';
    connection.connect( (err) => {
        connection.query(getAllUsersQuery, (err, result) => {
            if (err)
                resp.status(500).send('Error:  Internal Server Error!\nUnable to find user.');
            else
                resp.status(200).send(result);
        });
    });
});

// Log the user in
// return http 200 status
app.post('/api/user/login', (req, resp) => {
    let userLoginPayload = {
        email:  req.body['email'],
        password: req.body['password']
    };
    console.log(userLoginPayload)
    let userLoginQuery = 'SELECT * FROM user WHERE email=?;';
    connection.connect( (err) => {
        connection.query(userLoginQuery, [userLoginPayload.email], (err, result) => {
                let pwd = result[0]['password'];
                console.log(result);
                let user = {};
                user['id'] = result[0]['id'];
                user['fname'] = result[0]['fname'];
                user['lname'] = result[0]['lname'];
                user['email'] = result[0]['email'];
                bcrypt.compare(userLoginPayload.password, pwd, (err, result) => {
                    if (result) {
                        resp.status(200).send(user);
                    } else {
                        resp.status(400).send('Error:  Unable to login.');
                    }
                });
        });
    });
});

// entry point
var server = app.listen(6969, function () {
    var host = server.address().address
    var port = server.address().port
    console.log("Example app listening at http://%s:%s", host, port)
})
server.on('close', () => {
    connection.end();
});