var express = require('express');
var router = express.Router();
var jwt = require('jsonwebtoken');
var Player = require('../models/player');

router.post('/create', function(req, res) {
    console.log('Creating user: ' + req.body.user + ", " + req.body.password);
    
    Player.findOne({'username':req.body.user})
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
                  res.status(400).send('Not implemented');
              }
    });
});

router.post('/login', function(req, res) {
//    var player = new Player();
//    player.username = 'Rick';
//    player.password = 'Password1';
//    player.save(function(err) {
//        if (err) {
//            res.send(err);
//        }
//    });
    
    //TODO validate req.body.username and req.body.password
    //if is invalid, return 401
    if (!(req.body.username === 'Rick' && req.body.password === 'Password1')) {
        res.send(401, 'Wrong user or password');
        return;
    }

    var profile = {
        first_name: 'Rick',
        last_name: 'Gliddon',
        email: 'rick.gliddon@gmail.com',
        id: 123
    };

    // We are sending the profile inside the token
    var token = jwt.sign(profile, "bogglesecret", { expiresInMinutes: 60*5 });

    res.json({ token: token });

});
  
module.exports = router;