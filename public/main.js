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
      console.log('initPeer...');
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
      console.log('makePeer...');
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
      console.log('frontAnswer...');
      const peer = initPeer(false);
      peer.on('signal', (data) => {
        socket.emit('Answer', data);
      });
      peer.signal(offer);

      client.peer = peer;
    }

    function signalAnswer(answer) {
      console.log('signalAnswer...');
      client.gotAnswer = true;
      let peer = client.peer;
      peer.signal(answer);
    }

    function createVideo(stream) {
      console.log('createVideo...');
      configureMuteToggleElement();

      let videoEl = document.createElement('video');
      videoEl.id = 'peerVideo';
      videoEl.srcObject = stream;
      document.querySelector('#peerContainer').appendChild(videoEl);

      videoEl.play();

      videoEl.addEventListener('click', () => {
        console.log(`Volume: ${videoEl.volume}`);
        videoEl.volume = Number(!videoEl.volume); // toggle volume 0 <=> 1
      });
    }

    function sessionActive() {
      document.write('Session is already full.');
    }

    function removePeer() {
      console.log('removePeer...');
      console.log(client);
      console.log(client.peer);
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

function configureMuteToggleElement() {
  const muteToggle = document.createElement('div');
  muteToggle.id = 'muteText';
  muteToggle.innerHTML = 'Click to Mute/Unmute';
  document.querySelector('#peerContainer').appendChild(muteToggle);
}
