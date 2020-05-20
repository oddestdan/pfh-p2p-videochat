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
    function initPeer(isInit) {
      let peer = new Peer({
        initiator: isInit,
        stream,
        trickle: false,
      });
      peer.on('stream', (stream) => {
        createVideo(stream);
      });
      return peer;
    }

    // Peer is an initiator
    function makePeer() {
      client.gotAnswer = false;
      const peer = initPeer(true);

      peer.on('signal', (data) => {
        if (!client.gotAnswer) {
          socket.emit('Offer', data);
        }
      });

      client.peer = peer;
    }

    // When we receive an offer and have to send an answer,
    // Peer is not an initiator
    function frontAnswer(offer) {
      const peer = initPeer(false);
      peer.on('signal', (data) => {
        socket.emit('Answer', data);
      });
      peer.signal(offer);

      client.peer = peer;
    }

    function signalAnswer(answer) {
      client.gotAnswer = true;
      let peer = client.peer;
      peer.signal(answer);
    }

    function createVideo(stream) {
      configureVideoElement();

      let videoEl = document.createElement('video');
      videoEl.id = 'peerVideo';
      videoEl.srcObject = stream;
      document.querySelector('#peerContainer').appendChild(videoEl);

      videoEl.play();

      videoEl.addEventListener('click', () => {
        console.log(videoEl.volume);
        videoEl.volume = Number(!videoEl.volume); // toggle volume 0 <=> 1
      });
    }

    function sessionActive() {
      document.write('Session is already full.');
    }

    function removePeer() {
      document.getElementById('peerVideo').remove();
      document.getElementById('muteText').remove();
      if (client.peer) {
        client.peer.destroy();
      }
    }

    // Socket events
    socket.on('BackOffer', frontAnswer);
    socket.on('BackAnswer', signalAnswer);
    socket.on('SessionActive', sessionActive);
    socket.on('CreatePeer', makePeer);
    socket.on('Disconnect', removePeer);
  })
  .catch((err) => document.write(err));

function configureVideoElement() {
  const div = document.createElement('div');
  div.id = 'muteText';
  div.innerHTML = 'Click to Mute/Unmute';
  document.querySelector('#peerContainer').appendChild(div);
}
