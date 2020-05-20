const express = require('express');
const app = express();
const port = process.env.PORT || '8082';

const httpServer = require('http').Server(app);
const io = require('socket.io')(httpServer);

let clients = 0;
io.on('connection', function (socket) {
  socket.on('NewClient', function () {
    if (clients < 2) {
      if (clients === 1) {
        this.emit('CreatePeer');
      }
    } else {
      this.emit('SessionActive');
    }

    clients++;
  });

  socket.on('Offer', sendOffer);
  socket.on('Answer', sendAnswer);
  socket.on('Disconnect', disconnect);
});

function sendOffer(offer) {
  this.broadcast.emit('BackOffer', offer);
}

function sendAnswer(answer) {
  this.broadcast.emit('BackAnswer', answer);
}

function disconnect() {
  if (clients > 0) {
    if (clients <= 2) {
      this.broadcast.emit('Disconnect');
    }
    clients--;
  }
}

app.use(express.static(__dirname + '/public'));

httpServer.listen(port, () =>
  console.log(`HTTP Server listening to: http://localhost:${port}`)
);
