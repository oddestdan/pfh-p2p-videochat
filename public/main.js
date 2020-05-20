const Peer = require('simple-peer');
const socket = io();
const video = document.querySelector('video');
const client = {};

// Get stream
navigator.mediaDevices
  .getUserMedia({
    video: true,
    audio: true,
  })
  .then((stream) => {
    socket.emit('NewClient');
    video.srcObject = stream;
    video.play();

    // Initialize a new Peer
    function initPeer(type) {
      let peer = new Peer({
        initiator: type === 'init',
        stream,
        trickle: false,
      });
      peer.on('stream', (stream) => {
        createVideo(stream);
      });
      peer.on('close', () => {
        document.getElementById('peerVideo').remove();
        peer.destroy();
      });
      return peer;
    }

    // Peer of type 'init'
    function makePeer() {
      client.gotAnswer = false;
      const peer = initPeer('init');

      peer.on('signal', (data) => {
        if (!client.gotAnswer) {
          socket.emit('Offer', data);
        }
      });

      client.peer = peer;
    }

    // When we receive an offer and have to send an answer,
    // Peer NOT of type 'init'
    function frontAnswer(offer) {
      const peer = initPeer('notInit');
      peer.on('signal', (data) => {
        socket.emit('Answer', data);
      });
      peer.signal(offer);
    }

    function signalAnswer(answer) {
      client.gotAnswer = true;
      let peer = client.peer;
      peer.signal(answer);
    }

    function createVideo(stream) {
      let videoEl = document.createElement('video');
      videoEl.id = 'peervideo';
      videoEl.srcObject = stream;
      document.querySelector('#peerContainer').appendChild(videoEl);
    }

    function sessionActive() {
      document.write('Session active. Please come back later');
    }

    // Socket events
    socket.on('BackOffer', frontAnswer);
    socket.on('BackAnswer', signalAnswer);
    socket.on('SessionActive', sessionActive);
    socket.on('CreatePeer', makePeer);
  })
  .catch((err) => document.write(err));
