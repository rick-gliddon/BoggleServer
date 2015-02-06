var express = require('express');
var router = express.Router();
var jwt = require('jsonwebtoken');
var Player = require('../models/player');

router.post('/create', function(req, res) {
    console.log('Creating user: ' + req.body.user);
    
    if (req.body.user.match("[^0-9 a-zA-Z\.@]")) {
        res.status(400).send("Username may only contain characters 'A'..'Z', 'a'..'z', '0'..'9', ' ' and '.'");
        return;
    }
    
    Player.findOne({'username':req.body.user.toLowerCase()})
          .select('username')
          .exec(function handleUserSearch(err, existingUser) {
              if (err) {
                  console.log('Error retreiving user: ' + err);
                  res.status(500).send(err);
                  return;
              }
              if (existingUser) {
                  res.status(400).send('User already exists');
              } else {
                  createUserAndRespond(
                          req.body.user.toLowerCase(), req.body.password, res);
              }
          });
});

function createUserAndRespond(username, password, res) {
    var player = new Player();
    player.username = username;
    player.password = password;
    player.save(function(err) {
        if (err) {
            console.log('Error saving player: ' + err);
            res.status(500).send(err);
            return;
        }
        respondSuccess(username, res);
    });
}

router.post('/login', function(req, res) {
    
    Player.findOne({'username':req.body.user.toLowerCase(),
                    'password':req.body.password})
          .select('username')
          .exec(function handleUserSearch(err, existingUser) {
              if (err) {
                  console.log('Error validating user: ' + err);
                  res.status(500).send(err);
                  return;
              }
              if (existingUser) {
                  respondSuccess(existingUser.username, res);
              } else {
                  res.status(401).send("Incorrect username or password");
              }
          });
});

function respondSuccess(username, res) {
    
    var profile = {
        name: username
    };

    // We are sending the profile inside the token
    var token = jwt.sign(profile, "bogglesecret", { expiresInMinutes: 60*5 });

    res.json({ token: token });
}
  
module.exports = router;