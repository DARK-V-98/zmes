
import { db } from '@/lib/firebase';
import { User } from './data';
import {
  collection,
  doc,
  addDoc,
  onSnapshot,
  updateDoc,
  deleteDoc,
  getDoc,
  setDoc
} from 'firebase/firestore';

const servers = {
  iceServers: [
    {
      urls: ['stun:stun1.l.google.com:19302', 'stun:stun2.l.google.com:19302'],
    },
  ],
  iceCandidatePoolSize: 10,
};

type PeerConnectionCallback = (
  pc: RTCPeerConnection,
  localStream: MediaStream,
  remoteStream: MediaStream
) => void;


export const createPeerConnection = (
    onRemoteStream: (stream: MediaStream) => void
): RTCPeerConnection => {
    const pc = new RTCPeerConnection(servers);
    pc.ontrack = (event) => {
        event.streams[0].getTracks().forEach((track) => {
            onRemoteStream(event.streams[0]);
        });
    };
    return pc;
};


export const startCall = async (
    caller: User,
    callee: User,
    type: 'audio' | 'video',
    onPeerConnection: PeerConnectionCallback
): Promise<string | null> => {
    try {
        const mediaConstraints = type === 'video' 
            ? { video: true, audio: true } 
            : { video: false, audio: true };
            
        const localStream = await navigator.mediaDevices.getUserMedia(mediaConstraints);
        const remoteStream = new MediaStream();

        const pc = createPeerConnection((stream) => {
            stream.getTracks().forEach(track => remoteStream.addTrack(track));
        });

        localStream.getTracks().forEach((track) => {
            pc.addTrack(track, localStream);
        });

        onPeerConnection(pc, localStream, remoteStream);

        const callDocRef = doc(collection(db, 'calls'));
        const offerCandidates = collection(callDocRef, 'offerCandidates');
        const answerCandidates = collection(callDocRef, 'answerCandidates');

        pc.onicecandidate = (event) => {
            event.candidate && addDoc(offerCandidates, event.candidate.toJSON());
        };

        const offerDescription = await pc.createOffer();
        await pc.setLocalDescription(offerDescription);

        const offer = {
            sdp: offerDescription.sdp,
            type: offerDescription.type,
        };

        await setDoc(callDocRef, { offer, callerId: caller.id, calleeId: callee.id, type });

        onSnapshot(callDocRef, (snapshot) => {
            const data = snapshot.data();
            if (!pc.currentRemoteDescription && data?.answer) {
                const answerDescription = new RTCSessionDescription(data.answer);
                pc.setRemoteDescription(answerDescription);
            }
        });

        onSnapshot(answerCandidates, (snapshot) => {
            snapshot.docChanges().forEach((change) => {
                if (change.type === 'added') {
                    const candidate = new RTCIceCandidate(change.doc.data());
                    pc.addIceCandidate(candidate);
                }
            });
        });

        return callDocRef.id;

    } catch (error) {
        console.error("Error starting call:", error);
        return null;
    }
};

export const answerCall = async (
  callId: string,
  onPeerConnection: PeerConnectionCallback
) => {
  try {
    const callDocRef = doc(db, 'calls', callId);
    const callDocSnapshot = await getDoc(callDocRef);
    const callData = callDocSnapshot.data();
    
    if (!callData) throw new Error("Call not found");
    
    const mediaConstraints = callData.type === 'video'
        ? { video: true, audio: true }
        : { video: false, audio: true };

    const localStream = await navigator.mediaDevices.getUserMedia(mediaConstraints);
    const remoteStream = new MediaStream();
    
    const pc = createPeerConnection((stream) => {
        stream.getTracks().forEach(track => remoteStream.addTrack(track));
    });

    localStream.getTracks().forEach((track) => {
      pc.addTrack(track, localStream);
    });
    
    onPeerConnection(pc, localStream, remoteStream);

    const offerCandidates = collection(callDocRef, 'offerCandidates');
    const answerCandidates = collection(callDocRef, 'answerCandidates');

    pc.onicecandidate = (event) => {
      event.candidate && addDoc(answerCandidates, event.candidate.toJSON());
    };
    
    if (callData?.offer) {
        await pc.setRemoteDescription(new RTCSessionDescription(callData.offer));
    }

    const answerDescription = await pc.createAnswer();
    await pc.setLocalDescription(answerDescription);

    const answer = {
      type: answerDescription.type,
      sdp: answerDescription.sdp,
    };
    await updateDoc(callDocRef, { answer });

    onSnapshot(offerCandidates, (snapshot) => {
      snapshot.docChanges().forEach((change) => {
        if (change.type === 'added') {
          let data = change.doc.data();
          pc.addIceCandidate(new RTCIceCandidate(data));
        }
      });
    });

  } catch (error) {
    console.error("Error answering call:", error);
  }
};


export const hangUp = async (
    callId: string,
    pcRef: React.MutableRefObject<RTCPeerConnection | null>,
    localStreamRef: React.MutableRefObject<MediaStream | null>,
    remoteStreamRef: React.MutableRefObject<MediaStream | null>
) => {
    try {
        if (pcRef.current) {
            pcRef.current.close();
        }
        if (localStreamRef.current) {
            localStreamRef.current.getTracks().forEach(track => track.stop());
        }
        if (remoteStreamRef.current) {
            remoteStreamRef.current.getTracks().forEach(track => track.stop());
        }

        if (callId) {
            const callDocRef = doc(db, 'calls', callId);
            const callDocSnapshot = await getDoc(callDocRef);
            if (callDocSnapshot.exists()) {
               await deleteDoc(callDocRef);
            }
        }
    } catch (error) {
        console.error("Error during hangup:", error);
    } finally {
        pcRef.current = null;
        localStreamRef.current = null;
        remoteStreamRef.current = null;
    }
};
