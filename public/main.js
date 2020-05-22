const Peer = require('simple-peer');
const socket = require('socket.io-client')();
const video = document.querySelector('video');
const client = {};

// Get stream
navigator.mediaDevices
  .getUserMedia({
    video: true,
    audio: true,
  })
  .then((stream) => {
    console.log('newClient...');

    socket.emit('NewClient');
    video.srcObject = stream;
    video.play();

    // Initialize a new Peer
    function initPeer(isInit) {
      console.log('initPeer | isInit:', isInit);

      const peer = new Peer({
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
      console.log('makePeer');

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
      console.log('frontAnswer | offer below');
      console.log(offer);

      const peer = initPeer(false);
      peer.on('signal', (data) => {
        socket.emit('Answer', data);
      });
      peer.signal(offer);

      client.peer = peer;
    }

    function signalAnswer(answer) {
      console.log('signalAnswer | answer below');
      console.log(answer);

      client.gotAnswer = true;
      let peer = client.peer;
      peer.signal(answer);
    }

    function createVideo(stream) {
      console.log('createVideo | stream below');
      console.log(stream);

      const peerId = 1;
      configureMuteToggleElement(peerId);

      let videoEl = document.createElement('video');
      videoEl.id = `peerVideo${peerId}`;
      videoEl.srcObject = stream;
      document.querySelector(`#peer${peerId}`).appendChild(videoEl);

      videoEl.play();

      videoEl.addEventListener('click', () => {
        videoEl.volume = Number(!videoEl.volume); // toggle volume 0 <=> 1
        console.log(`Change volume to ${videoEl.volume}`);
      });
    }

    function sessionActive() {
      document.write('Session is already full.');
    }

    function removePeer(peerId) {
      console.log('removePeer | peerId:', peerId);

      document.getElementById(`peerVideo${peerId}`).remove();
      document.getElementById(`muteText${peerId}`).remove();
      if (client.peer) {
        client.peer.destroy();
      }
    }

    // Socket events
    socket.on('BackOffer', frontAnswer);
    socket.on('BackAnswer', signalAnswer);
    socket.on('SessionActive', sessionActive);
    socket.on('CreatePeer', makePeer);
    socket.on('RemovePeer', removePeer);
  })
  .catch((err) => document.write(err));

function configureMuteToggleElement(peerId) {
  const muteToggle = document.createElement('div');
  muteToggle.id = `muteText${peerId}`;
  muteToggle.innerHTML = 'Click to Mute/Unmute';
  document.getElementById(`peer${peerId}`).appendChild(muteToggle);
}
