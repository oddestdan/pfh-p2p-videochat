const express = require('express');
const app = express();
const port = process.env.PORT || '8082';

const httpServer = require('http').Server(app);

const socketIO = require('socket.io')(httpServer);
const handleSockets = require('./sockets/sockets');
handleSockets(socketIO);

app.use(express.static(__dirname + '/public'));

httpServer.listen(port, () =>
  console.log(`HTTP Server listening to: http://localhost:${port}`)
);
