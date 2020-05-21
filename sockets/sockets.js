module.exports = function (socketIO) {
  const MAX_PEER_AMOUNT = 2;

  let globalClients = 0;

  socketIO.on('connection', function (socket) {
    socket.on('NewClient', function () {
      if (globalClients < MAX_PEER_AMOUNT) {
        if (globalClients === 1) {
          this.emit('CreatePeer');
        }
      } else {
        this.emit('SessionActive');
      }

      globalClients++;
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
    if (globalClients > 0) {
      if (globalClients <= MAX_PEER_AMOUNT) {
        this.broadcast.emit('Disconnect');
      }
      globalClients--;
    }
  }
};
