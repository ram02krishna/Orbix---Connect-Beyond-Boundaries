import { create } from "zustand";
import { useSocketStore } from "./useSocketStore";
import { useChatStore } from "./useChatStore";
import { useAuthStore } from "./useAuthStore";
import { toast } from "sonner";

interface CallPartner {
  id: string;
  name: string;
  avatarUrl: string | null;
}

export type CallState = "idle" | "incoming" | "outgoing" | "connected";

interface CallStoreState {
  callState: CallState;
  callType: "audio" | "video";
  partner: CallPartner | null;
  localStream: MediaStream | null;
  remoteStream: MediaStream | null;
  isMuted: boolean;
  isCameraOff: boolean;
  peerConnection: RTCPeerConnection | null;
  
  // Actions
  initiateCall: (targetUserId: string, targetName: string, targetAvatar: string | null, type: "audio" | "video") => Promise<void>;
  receiveCall: (payload: { fromUserId: string; fromUserName: string; fromUserAvatar: string | null; sdp: any; callType: "audio" | "video" }) => void;
  acceptCall: () => Promise<void>;
  declineCall: () => void;
  endCall: () => void;
  toggleMute: () => void;
  toggleCamera: () => void;
  handleIceCandidate: (candidate: any) => void;
  handleAnswer: (sdp: any) => void;
  resetCallStore: () => void;
}

// Audio synth context for sound synthesis
let audioCtx: AudioContext | null = null;
let ringOsc1: OscillatorNode | null = null;
let ringOsc2: OscillatorNode | null = null;
let ringGain: GainNode | null = null;
let ringInterval: any = null;

function startRingtone(type: "dial" | "ring") {
  if (typeof window === "undefined") return;
  try {
    if (!audioCtx) {
      audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    if (audioCtx.state === "suspended") {
      void audioCtx.resume();
    }

    stopRingtone();

    ringGain = audioCtx.createGain();
    ringGain.gain.setValueAtTime(0.2, audioCtx.currentTime);
    ringGain.connect(audioCtx.destination);

    const playBeep = () => {
      if (!audioCtx || !ringGain) return;
      
      ringOsc1 = audioCtx.createOscillator();
      ringOsc2 = audioCtx.createOscillator();
      
      if (type === "dial") {
        // Standard US ringback: 440Hz + 480Hz
        ringOsc1.frequency.setValueAtTime(440, audioCtx.currentTime);
        ringOsc2.frequency.setValueAtTime(480, audioCtx.currentTime);
      } else {
        // Incoming ring: alternating 400Hz and 450Hz
        ringOsc1.frequency.setValueAtTime(400, audioCtx.currentTime);
        ringOsc2.frequency.setValueAtTime(450, audioCtx.currentTime);
      }

      ringOsc1.connect(ringGain);
      ringOsc2.connect(ringGain);
      
      ringOsc1.start();
      ringOsc2.start();

      // Stop beep after 1.5 seconds
      setTimeout(() => {
        try {
          ringOsc1?.stop();
          ringOsc2?.stop();
          ringOsc1?.disconnect();
          ringOsc2?.disconnect();
        } catch {}
      }, type === "dial" ? 1500 : 1200);
    };

    playBeep();
    ringInterval = setInterval(playBeep, type === "dial" ? 4000 : 3000);
  } catch (err) {
    console.error("Failed to start synthetic ringtone:", err);
  }
}

function stopRingtone() {
  if (ringInterval) {
    clearInterval(ringInterval);
    ringInterval = null;
  }
  try {
    ringOsc1?.stop();
    ringOsc2?.stop();
    ringOsc1?.disconnect();
    ringOsc2?.disconnect();
    ringGain?.disconnect();
  } catch {}
  ringOsc1 = null;
  ringOsc2 = null;
  ringGain = null;
}

const STUN_SERVERS: RTCConfiguration = {
  iceServers: [
    { urls: "stun:stun.l.google.com:19302" },
    { urls: "stun:stun1.l.google.com:19302" },
    { urls: "stun:stun2.l.google.com:19302" }
  ],
  bundlePolicy: "max-bundle",
  rtcpMuxPolicy: "require",
};

export const useCallStore = create<CallStoreState>((set, get) => {
  
  // Set up local/remote media helper
  const cleanMedia = () => {
    const { localStream, remoteStream, peerConnection } = get();
    if (localStream) {
      localStream.getTracks().forEach((track) => track.stop());
    }
    if (remoteStream) {
      remoteStream.getTracks().forEach((track) => track.stop());
    }
    if (peerConnection) {
      peerConnection.close();
    }
    stopRingtone();
  };

  return {
    callState: "idle",
    callType: "audio",
    partner: null,
    localStream: null,
    remoteStream: null,
    isMuted: false,
    isCameraOff: false,
    peerConnection: null,

    initiateCall: async (targetUserId, targetName, targetAvatar, type) => {
      cleanMedia();
      set({ 
        callState: "outgoing", 
        callType: type, 
        partner: { id: targetUserId, name: targetName, avatarUrl: targetAvatar },
        isMuted: false,
        isCameraOff: false
      });

      startRingtone("dial");

      try {
        // Request AV permissions
        const constraints = {
          audio: {
            echoCancellation: true,
            noiseSuppression: true,
            autoGainControl: true,
          },
          video: type === "video" ? { 
            width: { ideal: 1280, max: 1920 }, 
            height: { ideal: 720, max: 1080 },
            frameRate: { ideal: 30, max: 60 },
            facingMode: "user" 
          } : false
        };

        const stream = await navigator.mediaDevices.getUserMedia(constraints);
        set({ localStream: stream });

        // Initialize PeerConnection
        const pc = new RTCPeerConnection(STUN_SERVERS);
        
        stream.getTracks().forEach((track) => {
          pc.addTrack(track, stream);
        });

        pc.ontrack = (event) => {
          if (event.streams && event.streams[0]) {
            set({ remoteStream: event.streams[0] });
          }
        };

        pc.onicecandidate = (event) => {
          if (event.candidate) {
            const socket = useSocketStore.getState().socket;
            if (socket) {
              socket.emit("call:ice-candidate", {
                targetUserId,
                candidate: event.candidate
              });
            }
          }
        };

        const offer = await pc.createOffer();
        await pc.setLocalDescription(offer);

        const socket = useSocketStore.getState().socket;
        if (socket) {
          const user = useAuthStore.getState().user;
          socket.emit("call:initiate", {
            targetUserId,
            fromUserId: user?.id,
            fromUserName: user?.name || "Someone",
            fromUserAvatar: user?.avatarUrl || null,
            sdp: offer,
            callType: type
          });
        }

        set({ peerConnection: pc });
      } catch (err) {
        console.error("WebRTC getUserMedia error:", err);
        toast.error("Failed to access camera or microphone");
        get().declineCall();
      }
    },

    receiveCall: (payload) => {
      cleanMedia();
      set({
        callState: "incoming",
        callType: payload.callType,
        partner: {
          id: payload.fromUserId,
          name: payload.fromUserName,
          avatarUrl: payload.fromUserAvatar
        },
        isMuted: false,
        isCameraOff: false
      });

      startRingtone("ring");
      
      // Store temporary offer SDP in peerConnection ref structure
      // Wait to create PeerConnection until user answers
      const pc = new RTCPeerConnection(STUN_SERVERS);
      pc.onicecandidate = (event) => {
        if (event.candidate) {
          const socket = useSocketStore.getState().socket;
          if (socket) {
            socket.emit("call:ice-candidate", {
              targetUserId: payload.fromUserId,
              candidate: event.candidate
            });
          }
        }
      };

      pc.ontrack = (event) => {
        if (event.streams && event.streams[0]) {
          set({ remoteStream: event.streams[0] });
        }
      };

      // Set remote offer immediately
      void pc.setRemoteDescription(new RTCSessionDescription(payload.sdp))
        .then(() => {
          set({ peerConnection: pc });
        });
    },

    acceptCall: async () => {
      const { peerConnection, partner, callType } = get();
      if (!peerConnection || !partner) return;

      stopRingtone();
      set({ callState: "connected" });

      try {
        const constraints = {
          audio: {
            echoCancellation: true,
            noiseSuppression: true,
            autoGainControl: true,
          },
          video: callType === "video" ? { 
            width: { ideal: 1280, max: 1920 }, 
            height: { ideal: 720, max: 1080 },
            frameRate: { ideal: 30, max: 60 },
            facingMode: "user" 
          } : false
        };

        const stream = await navigator.mediaDevices.getUserMedia(constraints);
        set({ localStream: stream });

        stream.getTracks().forEach((track) => {
          peerConnection.addTrack(track, stream);
        });

        const answer = await peerConnection.createAnswer();
        await peerConnection.setLocalDescription(answer);

        const socket = useSocketStore.getState().socket;
        if (socket) {
          socket.emit("call:accept", {
            targetUserId: partner.id,
            sdp: answer
          });
        }
      } catch (err) {
        console.error("Error answering WebRTC call:", err);
        toast.error("Failed to answer call with camera/mic");
        get().declineCall();
      }
    },

    declineCall: () => {
      const { partner } = get();
      const socket = useSocketStore.getState().socket;
      if (socket && partner) {
        socket.emit("call:decline", { targetUserId: partner.id });
      }
      cleanMedia();
      set({ callState: "idle", partner: null, peerConnection: null, localStream: null, remoteStream: null });
    },

    endCall: () => {
      const { partner } = get();
      const socket = useSocketStore.getState().socket;
      if (socket && partner) {
        socket.emit("call:hangup", { targetUserId: partner.id });
      }
      cleanMedia();
      set({ callState: "idle", partner: null, peerConnection: null, localStream: null, remoteStream: null });
    },

    toggleMute: () => {
      const { localStream, isMuted } = get();
      if (localStream) {
        localStream.getAudioTracks().forEach((track) => {
          track.enabled = isMuted; // Toggle enablement (disabled if isMuted is currently false)
        });
        set({ isMuted: !isMuted });
      }
    },

    toggleCamera: () => {
      const { localStream, isCameraOff } = get();
      if (localStream) {
        localStream.getVideoTracks().forEach((track) => {
          track.enabled = isCameraOff; // Toggle track
        });
        set({ isCameraOff: !isCameraOff });
      }
    },

    handleIceCandidate: (candidate) => {
      const { peerConnection } = get();
      if (peerConnection) {
        void peerConnection.addIceCandidate(new RTCIceCandidate(candidate))
          .catch((err) => console.error("Error adding IceCandidate:", err));
      }
    },

    handleAnswer: (sdp) => {
      const { peerConnection } = get();
      if (peerConnection) {
        stopRingtone();
        set({ callState: "connected" });
        void peerConnection.setRemoteDescription(new RTCSessionDescription(sdp))
          .catch((err) => console.error("Error setting remote SDP answer:", err));
      }
    },

    resetCallStore: () => {
      cleanMedia();
      set({
        callState: "idle",
        partner: null,
        peerConnection: null,
        localStream: null,
        remoteStream: null
      });
    }
  };
});
