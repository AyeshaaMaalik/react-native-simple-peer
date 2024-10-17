import React, { useEffect, useRef, useState } from 'react';
import { SafeAreaView, Button, View, Text } from 'react-native';
import { RTCPeerConnection, RTCView, mediaDevices } from 'react-native-webrtc';

const configuration = {
  iceServers: [
    {
      urls: 'stun:stun.l.google.com:19302',
    },
  ],
};

export default function App() {
  const [localStream, setLocalStream] = useState(null);
  const [remoteStream, setRemoteStream] = useState(null);
  const peerConnectionRef = useRef(null);

  useEffect(() => {
    // Get user media (camera and microphone)
    mediaDevices.getUserMedia({
      video: true,
      audio: true,
    })
    .then(stream => {
      setLocalStream(stream);
      initializePeerConnection(stream);
    })
    .catch(error => {
      console.log('Error accessing media devices.', error);
    });
  }, []);

  const initializePeerConnection = (stream) => {
    const peerConnection = new RTCPeerConnection(configuration);

    peerConnection.onicecandidate = (event) => {
      if (event.candidate) {
        console.log('ICE Candidate', JSON.stringify(event.candidate));
        // Send ICE candidate to the remote peer (using signaling server)
      }
    };

    peerConnection.onaddstream = (event) => {
      console.log('Remote stream added');
      setRemoteStream(event.stream);
    };

    peerConnection.addStream(stream);
    peerConnectionRef.current = peerConnection;
  };

  const createOffer = async () => {
    const offer = await peerConnectionRef.current.createOffer();
    await peerConnectionRef.current.setLocalDescription(offer);
    console.log('Offer:', JSON.stringify(offer));
    // Send offer to the remote peer (using signaling server)
  };

  const handleSignal = async (signalData) => {
    const peerConnection = peerConnectionRef.current;
    if (signalData.type === 'offer') {
      await peerConnection.setRemoteDescription(new RTCSessionDescription(signalData));
      const answer = await peerConnection.createAnswer();
      await peerConnection.setLocalDescription(answer);
      console.log('Answer:', JSON.stringify(answer));
      // Send answer to the remote peer (using signaling server)
    } else if (signalData.type === 'answer') {
      await peerConnection.setRemoteDescription(new RTCSessionDescription(signalData));
    } else if (signalData.candidate) {
      await peerConnection.addIceCandidate(new RTCIceCandidate(signalData.candidate));
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
      <Text style={{ fontSize: 20, marginBottom: 20 }}>React Native Video Call</Text>

      {localStream && (
        <View style={{ width: '100%', height: 200 }}>
          <RTCView streamURL={localStream.toURL()} style={{ width: '100%', height: '100%' }} />
          <Text>Local Stream</Text>
        </View>
      )}

      {remoteStream && (
        <View style={{ width: '100%', height: 200, marginTop: 20 }}>
          <RTCView streamURL={remoteStream.toURL()} style={{ width: '100%', height: '100%' }} />
          <Text>Remote Stream</Text>
        </View>
      )}

      <Button title="Create Offer" onPress={createOffer} />
    </SafeAreaView>
  );
}
