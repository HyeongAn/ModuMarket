const mongoose = require('mongoose');
require("dotenv").config({path: ".env"});


module.exports = () => {
  function connect() {
    mongoose.connect(process.env.MONGOB_URL, function(err) {
        if (err) {
          console.error('mongodb connection error', err);
        }
        console.log('mongodb connected');
      });
  }
  connect();
  mongoose.connection.on('disconnected', connect);
  //require('./user.js'); // user.js는 나중에 만듭니다.
};
