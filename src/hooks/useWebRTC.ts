import { useState, useEffect, useRef, useCallback } from 'react';
import { supabase } from '../services/supabaseClient';

export interface UseWebRTCOptions {
  roomId: string;
  userId?: string;
  userName?: string;
  userAvatar?: string;
}

export type ConnectionStatus = 'idle' | 'connecting' | 'connected' | 'disconnected' | 'failed';

const ICE_SERVERS: RTCConfiguration = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
    { urls: 'stun:stun2.l.google.com:19302' },
    { urls: 'stun:stun3.l.google.com:19302' },
    { urls: 'stun:stun4.l.google.com:19302' },
  ],
  iceCandidatePoolSize: 10,
};

interface SignalingMessage {
  id: string;
  senderId: string;
  targetId?: string;
  type: 'peer-join' | 'peer-ready' | 'offer' | 'answer' | 'ice-candidate' | 'peer-media-state' | 'peer-leave';
  userName?: string;
  userAvatar?: string;
  sdp?: RTCSessionDescriptionInit;
  candidate?: RTCIceCandidateInit;
  isCameraOn?: boolean;
  isMicOn?: boolean;
  isScreenSharing?: boolean;
}

export function useWebRTC({
  roomId,
  userId,
  userName = 'Peer',
  userAvatar = '',
}: UseWebRTCOptions) {
  // Streams & elements
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
  const localVideoRef = useRef<HTMLVideoElement | null>(null);
  const remoteVideoRef = useRef<HTMLVideoElement | null>(null);
  const remoteAudioRef = useRef<HTMLAudioElement | null>(null);

  // States
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>('idle');
  const [isCameraOn, setIsCameraOn] = useState<boolean>(true);
  const [isMicOn, setIsMicOn] = useState<boolean>(true);
  const [isScreenSharing, setIsScreenSharing] = useState<boolean>(false);

  // Remote peer state
  const [remotePeerId, setRemotePeerId] = useState<string | null>(null);
  const [remotePeerName, setRemotePeerName] = useState<string | null>(null);
  const [remotePeerAvatar, setRemotePeerAvatar] = useState<string | null>(null);
  const [isRemoteCameraOn, setIsRemoteCameraOn] = useState<boolean>(true);
  const [isRemoteMicOn, setIsRemoteMicOn] = useState<boolean>(true);
  const [isPeerPresent, setIsPeerPresent] = useState<boolean>(false);

  // Errors & alerts
  const [mediaError, setMediaError] = useState<string | null>(null);

  // References for mutable state without triggering effect rebuilds
  const pcRef = useRef<RTCPeerConnection | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const remoteStreamRef = useRef<MediaStream | null>(null);
  const screenStreamRef = useRef<MediaStream | null>(null);
  const pendingCandidatesRef = useRef<RTCIceCandidateInit[]>([]);
  const seenMessageIdsRef = useRef<Set<string>>(new Set());
  const [peerId] = useState(() => `${userId || 'anon'}-${Math.random().toString(36).substring(2, 8)}`);
  const peerIdRef = useRef<string>(peerId);
  const remotePeerIdRef = useRef<string | null>(null);

  // Sync state refs for stable listeners & signaling
  const isCameraOnRef = useRef(isCameraOn);
  const isMicOnRef = useRef(isMicOn);
  const isScreenSharingRef = useRef(isScreenSharing);
  const userNameRef = useRef(userName);
  const userAvatarRef = useRef(userAvatar);

  useEffect(() => {
    isCameraOnRef.current = isCameraOn;
  }, [isCameraOn]);

  useEffect(() => {
    isMicOnRef.current = isMicOn;
  }, [isMicOn]);

  useEffect(() => {
    isScreenSharingRef.current = isScreenSharing;
  }, [isScreenSharing]);

  useEffect(() => {
    userNameRef.current = userName;
  }, [userName]);

  useEffect(() => {
    userAvatarRef.current = userAvatar;
  }, [userAvatar]);

  useEffect(() => {
    peerIdRef.current = peerId;
  }, [peerId]);

  // Send a signal via Supabase Realtime channel and local BroadcastChannel
  const sendSignalRef = useRef<(msg: Omit<SignalingMessage, 'id' | 'senderId'>) => void>(() => {});

  // Broadcast media toggle state (camera / mic / screen) to remote peer
  const broadcastMediaState = useCallback((camera: boolean, mic: boolean, screen: boolean) => {
    sendSignalRef.current({
      type: 'peer-media-state',
      isCameraOn: camera,
      isMicOn: mic,
      isScreenSharing: screen,
    });
  }, []);

  // Helper to bind video/audio elements whenever streams change
  const bindLocalVideo = useCallback((el: HTMLVideoElement | null) => {
    localVideoRef.current = el;
    if (el && localStreamRef.current) {
      if (el.srcObject !== localStreamRef.current) {
        el.srcObject = localStreamRef.current;
      }
    }
  }, []);

  const bindRemoteVideo = useCallback((el: HTMLVideoElement | null) => {
    remoteVideoRef.current = el;
    if (el && remoteStreamRef.current) {
      if (el.srcObject !== remoteStreamRef.current) {
        el.srcObject = remoteStreamRef.current;
        el.play().catch((e) => console.log('Remote video autoplay waiting:', e));
      }
    }
  }, []);

  const bindRemoteAudio = useCallback((el: HTMLAudioElement | null) => {
    remoteAudioRef.current = el;
    if (el && remoteStreamRef.current) {
      if (el.srcObject !== remoteStreamRef.current) {
        el.srcObject = remoteStreamRef.current;
        el.play().catch((e) => console.log('Remote audio autoplay waiting:', e));
      }
    }
  }, []);

  // Helper to safely flush queued ICE candidates
  const flushPendingCandidates = useCallback(async (pc: RTCPeerConnection) => {
    while (pendingCandidatesRef.current.length > 0) {
      const candidateInit = pendingCandidatesRef.current.shift();
      if (candidateInit && candidateInit.candidate) {
        try {
          await pc.addIceCandidate(new RTCIceCandidate(candidateInit));
        } catch (e) {
          console.warn('Failed to add queued candidate:', e);
        }
      }
    }
  }, []);

  // Initialize or reset RTCPeerConnection
  const createPeerConnection = useCallback((currentRemotePeerId?: string): RTCPeerConnection => {
    if (currentRemotePeerId) {
      remotePeerIdRef.current = currentRemotePeerId;
      setRemotePeerId(currentRemotePeerId);
    }

    if (pcRef.current) {
      pcRef.current.ontrack = null;
      pcRef.current.onicecandidate = null;
      pcRef.current.onconnectionstatechange = null;
      pcRef.current.oniceconnectionstatechange = null;
      pcRef.current.close();
      pcRef.current = null;
    }

    const pc = new RTCPeerConnection(ICE_SERVERS);
    pcRef.current = pc;

    // Attach local tracks if available, otherwise configure transceivers for two-way media
    const audioTrack = localStreamRef.current?.getAudioTracks()[0];
    const videoTrack = localStreamRef.current?.getVideoTracks()[0];

    if (audioTrack) {
      pc.addTrack(audioTrack, localStreamRef.current!);
    } else {
      try {
        pc.addTransceiver('audio', { direction: 'sendrecv' });
      } catch (err) {
        console.warn('Could not add audio transceiver:', err);
      }
    }

    if (videoTrack) {
      pc.addTrack(videoTrack, localStreamRef.current!);
    } else {
      try {
        pc.addTransceiver('video', { direction: 'sendrecv' });
      } catch (err) {
        console.warn('Could not add video transceiver:', err);
      }
    }

    // Remote track listener: append tracks into a single unified MediaStream so audio is never lost
    pc.ontrack = (event) => {
      let unifiedStream = remoteStreamRef.current;
      if (!unifiedStream) {
        unifiedStream = event.streams[0] || new MediaStream();
        remoteStreamRef.current = unifiedStream;
      }

      if (!unifiedStream.getTracks().some((t) => t.id === event.track.id)) {
        unifiedStream.addTrack(event.track);
      }

      // Create a fresh wrapper stream reference so React triggers re-render
      const newStream = new MediaStream(unifiedStream.getTracks());
      setRemoteStream(newStream);

      // Attach to remote video element
      if (remoteVideoRef.current) {
        remoteVideoRef.current.srcObject = newStream;
        remoteVideoRef.current.play().catch((e) => {
          console.log('Remote video autoplay waiting for user interaction:', e);
        });
      }

      // Attach to remote audio element for guaranteed sound output
      if (remoteAudioRef.current) {
        remoteAudioRef.current.srcObject = newStream;
        remoteAudioRef.current.play().catch((e) => {
          console.log('Remote audio autoplay waiting for user interaction:', e);
        });
      }

      setIsPeerPresent(true);
      setConnectionStatus('connected');
    };

    // ICE candidate generation
    pc.onicecandidate = (event) => {
      if (event.candidate && event.candidate.candidate) {
        sendSignalRef.current({
          type: 'ice-candidate',
          targetId: remotePeerIdRef.current || currentRemotePeerId,
          candidate: event.candidate.toJSON(),
        });
      }
    };

    // Connection state listeners
    pc.onconnectionstatechange = () => {
      switch (pc.connectionState) {
        case 'connected':
          setConnectionStatus('connected');
          setIsPeerPresent(true);
          break;
        case 'connecting':
          setConnectionStatus('connecting');
          break;
        case 'disconnected':
          setConnectionStatus('disconnected');
          break;
        case 'failed':
          setConnectionStatus('failed');
          break;
        case 'closed':
          setConnectionStatus('idle');
          break;
      }
    };

    pc.oniceconnectionstatechange = () => {
      if (pc.iceConnectionState === 'connected' || pc.iceConnectionState === 'completed') {
        setConnectionStatus('connected');
        setIsPeerPresent(true);
      } else if (pc.iceConnectionState === 'failed') {
        console.warn('ICE connection failed. Trying ICE restart...');
        try {
          pc.restartIce();
        } catch (e) {
          console.warn('restartIce failed:', e);
        }
      }
    };

    return pc;
  }, []);

  // Initiate call offer
  const initiateOffer = useCallback(async (targetId: string) => {
    try {
      setConnectionStatus('connecting');
      remotePeerIdRef.current = targetId;
      setRemotePeerId(targetId);

      const pc = pcRef.current || createPeerConnection(targetId);

      const offer = await pc.createOffer({
        offerToReceiveAudio: true,
        offerToReceiveVideo: true,
      });
      await pc.setLocalDescription(offer);

      sendSignalRef.current({
        type: 'offer',
        targetId,
        sdp: pc.localDescription ? pc.localDescription.toJSON() : offer,
      });
    } catch (err) {
      console.error('Error creating WebRTC offer:', err);
      setConnectionStatus('failed');
    }
  }, [createPeerConnection]);

  // Handle incoming signaling message - implementation stored in ref to guarantee stability
  const handleSignalingMessageRef = useRef<((msg: SignalingMessage) => Promise<void>) | null>(null);

  const handleSignalingMessage = useCallback(async (msg: SignalingMessage) => {
    // Ignore messages from self
    if (msg.senderId === peerIdRef.current) return;

    // Ignore messages targeted at a different peer
    if (msg.targetId && msg.targetId !== peerIdRef.current) return;

    switch (msg.type) {
      case 'peer-join': {
        remotePeerIdRef.current = msg.senderId;
        setRemotePeerId(msg.senderId);
        if (msg.userName) setRemotePeerName(msg.userName);
        if (msg.userAvatar) setRemotePeerAvatar(msg.userAvatar);
        setIsPeerPresent(true);

        // Announce our presence back
        sendSignalRef.current({
          type: 'peer-ready',
          targetId: msg.senderId,
          userName: userNameRef.current,
          userAvatar: userAvatarRef.current,
          isCameraOn: isCameraOnRef.current,
          isMicOn: isMicOnRef.current,
          isScreenSharing: isScreenSharingRef.current,
        });

        // Deterministic role: Peer with higher ID initiates the offer
        if (peerIdRef.current > msg.senderId) {
          await initiateOffer(msg.senderId);
        }
        break;
      }

      case 'peer-ready': {
        remotePeerIdRef.current = msg.senderId;
        setRemotePeerId(msg.senderId);
        if (msg.userName) setRemotePeerName(msg.userName);
        if (msg.userAvatar) setRemotePeerAvatar(msg.userAvatar);
        if (msg.isCameraOn !== undefined) setIsRemoteCameraOn(msg.isCameraOn);
        if (msg.isMicOn !== undefined) setIsRemoteMicOn(msg.isMicOn);
        setIsPeerPresent(true);

        // Deterministic role: Peer with higher ID initiates the offer
        if (peerIdRef.current > msg.senderId) {
          await initiateOffer(msg.senderId);
        }
        break;
      }

      case 'offer': {
        if (!msg.sdp) return;
        remotePeerIdRef.current = msg.senderId;
        setRemotePeerId(msg.senderId);
        setIsPeerPresent(true);
        setConnectionStatus('connecting');

        const pc = pcRef.current || createPeerConnection(msg.senderId);

        try {
          // If collision or non-stable state, perform sequential rollback if in have-local-offer
          if (pc.signalingState !== 'stable') {
            if (pc.signalingState === 'have-local-offer') {
              await pc.setLocalDescription({ type: 'rollback' });
            } else {
              console.warn('Signaling state is non-stable during offer:', pc.signalingState);
            }
          }
          await pc.setRemoteDescription(new RTCSessionDescription(msg.sdp));

          // Flush queued ICE candidates
          await flushPendingCandidates(pc);

          const answer = await pc.createAnswer();
          await pc.setLocalDescription(answer);

          sendSignalRef.current({
            type: 'answer',
            targetId: msg.senderId,
            sdp: pc.localDescription ? pc.localDescription.toJSON() : answer,
          });
        } catch (err) {
          console.error('Error handling offer:', err);
        }
        break;
      }

      case 'answer': {
        if (!msg.sdp) return;
        const pc = pcRef.current;
        if (!pc) return;

        try {
          if (pc.signalingState === 'have-local-offer') {
            await pc.setRemoteDescription(new RTCSessionDescription(msg.sdp));
            // Flush queued ICE candidates
            await flushPendingCandidates(pc);
          }
        } catch (err) {
          console.error('Error handling answer:', err);
        }
        break;
      }

      case 'ice-candidate': {
        if (!msg.candidate || !msg.candidate.candidate) return;
        const pc = pcRef.current;
        const candidate = new RTCIceCandidate(msg.candidate);

        if (pc && pc.remoteDescription && pc.remoteDescription.type) {
          try {
            await pc.addIceCandidate(candidate);
          } catch (err) {
            console.warn('Error adding ICE candidate:', err);
          }
        } else {
          pendingCandidatesRef.current.push(msg.candidate);
        }
        break;
      }

      case 'peer-media-state': {
        if (msg.isCameraOn !== undefined) setIsRemoteCameraOn(msg.isCameraOn);
        if (msg.isMicOn !== undefined) setIsRemoteMicOn(msg.isMicOn);
        break;
      }

      case 'peer-leave': {
        setIsPeerPresent(false);
        setRemoteStream(null);
        remoteStreamRef.current = null;
        if (remoteVideoRef.current) {
          remoteVideoRef.current.srcObject = null;
        }
        if (remoteAudioRef.current) {
          remoteAudioRef.current.srcObject = null;
        }
        if (pcRef.current) {
          pcRef.current.close();
          pcRef.current = null;
        }
        setConnectionStatus('disconnected');
        break;
      }
    }
  }, [createPeerConnection, initiateOffer, flushPendingCandidates]);

  useEffect(() => {
    handleSignalingMessageRef.current = handleSignalingMessage;
  }, [handleSignalingMessage]);

  // Start local media (camera and microphone) with defensive fallbacks
  const startLocalMedia = useCallback(async () => {
    setMediaError(null);

    if (typeof navigator === 'undefined' || !navigator.mediaDevices) {
      setMediaError('Media devices API not available in this environment.');
      return null;
    }

    let stream: MediaStream | null = null;

    // 1. Try audio + video
    try {
      stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 1280 },
          height: { ideal: 720 },
          facingMode: 'user',
        },
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      });
      setIsCameraOn(true);
      setIsMicOn(true);
    } catch (bothErr: any) {
      console.warn('Could not get audio+video:', bothErr);

      // 2. Try audio-only fallback
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          audio: {
            echoCancellation: true,
            noiseSuppression: true,
          },
        });
        setIsCameraOn(false);
        setIsMicOn(true);
        setMediaError('Camera unavailable or permission denied. Joined with microphone only.');
      } catch (audioErr: any) {
        console.warn('Could not get audio-only:', audioErr);

        // 3. Try video-only fallback
        try {
          stream = await navigator.mediaDevices.getUserMedia({ video: true });
          setIsCameraOn(true);
          setIsMicOn(false);
          setMediaError('Microphone unavailable or permission denied. Joined with camera only.');
        } catch (videoErr: any) {
          console.warn('No media permissions granted:', videoErr);
          setIsCameraOn(false);
          setIsMicOn(false);
          setMediaError('Camera & microphone access denied or not found. You can still view peers and use chat.');
          return null;
        }
      }
    }

    localStreamRef.current = stream;
    setLocalStream(stream);

    if (localVideoRef.current) {
      localVideoRef.current.srcObject = stream;
    }

    // Attach or update tracks on active RTCPeerConnection
    if (pcRef.current) {
      const existingSenders = pcRef.current.getSenders();
      stream.getTracks().forEach((track) => {
        const sender = existingSenders.find((s) => s.track?.kind === track.kind || (s as any).kind === track.kind);
        if (sender) {
          sender.replaceTrack(track).catch((e) => console.warn('replaceTrack err:', e));
        } else {
          try {
            pcRef.current?.addTrack(track, stream!);
          } catch (e) {
            console.warn('addTrack err:', e);
          }
        }
      });
    }

    return stream;
  }, []);

  // Camera toggle
  const toggleCamera = useCallback(async () => {
    const stream = localStreamRef.current;
    if (!stream) {
      await startLocalMedia();
      return;
    }

    const videoTracks = stream.getVideoTracks();
    if (videoTracks.length === 0) {
      try {
        const newStream = await navigator.mediaDevices.getUserMedia({ video: true });
        const newTrack = newStream.getVideoTracks()[0];
        stream.addTrack(newTrack);

        if (pcRef.current) {
          const videoSender = pcRef.current.getSenders().find((s) => s.track?.kind === 'video' || (s as any).kind === 'video');
          if (videoSender) {
            await videoSender.replaceTrack(newTrack);
          } else {
            pcRef.current.addTrack(newTrack, stream);
          }
        }

        setIsCameraOn(true);
        broadcastMediaState(true, isMicOnRef.current, isScreenSharingRef.current);
      } catch {
        setMediaError('Camera access denied or device unavailable.');
      }
      return;
    }

    const nextState = !isCameraOnRef.current;
    videoTracks.forEach((track) => {
      track.enabled = nextState;
    });
    setIsCameraOn(nextState);
    broadcastMediaState(nextState, isMicOnRef.current, isScreenSharingRef.current);
  }, [startLocalMedia, broadcastMediaState]);

  // Microphone toggle
  const toggleMic = useCallback(async () => {
    const stream = localStreamRef.current;
    if (!stream) {
      await startLocalMedia();
      return;
    }

    const audioTracks = stream.getAudioTracks();
    if (audioTracks.length === 0) {
      try {
        const newStream = await navigator.mediaDevices.getUserMedia({ audio: true });
        const newTrack = newStream.getAudioTracks()[0];
        stream.addTrack(newTrack);

        if (pcRef.current) {
          const audioSender = pcRef.current.getSenders().find((s) => s.track?.kind === 'audio' || (s as any).kind === 'audio');
          if (audioSender) {
            await audioSender.replaceTrack(newTrack);
          } else {
            pcRef.current.addTrack(newTrack, stream);
          }
        }

        setIsMicOn(true);
        broadcastMediaState(isCameraOnRef.current, true, isScreenSharingRef.current);
      } catch {
        setMediaError('Microphone access denied or device unavailable.');
      }
      return;
    }

    const nextState = !isMicOnRef.current;
    audioTracks.forEach((track) => {
      track.enabled = nextState;
    });
    setIsMicOn(nextState);
    broadcastMediaState(isCameraOnRef.current, nextState, isScreenSharingRef.current);
  }, [startLocalMedia, broadcastMediaState]);

  // Screen share stop
  const stopScreenShare = useCallback(async () => {
    if (screenStreamRef.current) {
      screenStreamRef.current.getTracks().forEach((track) => track.stop());
      screenStreamRef.current = null;
    }

    // Revert sender to camera video track
    const cameraTrack = localStreamRef.current?.getVideoTracks()[0] || null;
    if (pcRef.current) {
      const videoSender = pcRef.current.getSenders().find((s) => s.track?.kind === 'video' || (s as any).kind === 'video');
      if (videoSender) {
        await videoSender.replaceTrack(cameraTrack).catch((e) => console.warn('replaceTrack err:', e));
      }
    }

    // Revert local video element
    if (localVideoRef.current && localStreamRef.current) {
      localVideoRef.current.srcObject = localStreamRef.current;
    }

    setIsScreenSharing(false);
    broadcastMediaState(isCameraOnRef.current, isMicOnRef.current, false);
  }, [broadcastMediaState]);

  // Screen share toggle
  const toggleScreenShare = useCallback(async () => {
    if (isScreenSharingRef.current) {
      await stopScreenShare();
      return;
    }

    if (typeof navigator === 'undefined' || !navigator.mediaDevices?.getDisplayMedia) {
      setMediaError('Screen sharing is not supported by your browser.');
      return;
    }

    try {
      const screenStream = await navigator.mediaDevices.getDisplayMedia({
        video: true,
        audio: true,
      });

      screenStreamRef.current = screenStream;
      const screenVideoTrack = screenStream.getVideoTracks()[0];

      // Replace outgoing video track
      if (pcRef.current) {
        const videoSender = pcRef.current.getSenders().find((s) => s.track?.kind === 'video' || (s as any).kind === 'video');
        if (videoSender) {
          await videoSender.replaceTrack(screenVideoTrack);
        } else {
          pcRef.current.addTrack(screenVideoTrack, screenStream);
        }
      }

      // Show screen stream in local preview
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = screenStream;
      }

      setIsScreenSharing(true);
      broadcastMediaState(isCameraOnRef.current, isMicOnRef.current, true);

      // Handle user ending screen share from the browser bar
      screenVideoTrack.onended = () => {
        stopScreenShare();
      };
    } catch (err: any) {
      if (err.name !== 'NotAllowedError') {
        console.error('Screen share error:', err);
        setMediaError(`Could not share screen: ${err.message}`);
      }
    }
  }, [stopScreenShare, broadcastMediaState]);

  // Setup Signaling Channels & Lifecycle - strictly dependent only on roomId
  useEffect(() => {
    if (!roomId) return;

    let isMounted = true;
    const cleanRoomId = roomId.replace(/[^a-zA-Z0-9-_]/g, '_');

    // 1. Local BroadcastChannel for instant local multi-tab P2P testing
    let bc: BroadcastChannel | null = null;
    if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
      try {
        bc = new BroadcastChannel(`webrtc_room_${cleanRoomId}`);

        bc.onmessage = (event: MessageEvent<SignalingMessage>) => {
          if (!isMounted) return;
          const msg = event.data;
          if (msg && msg.id && !seenMessageIdsRef.current.has(msg.id)) {
            seenMessageIdsRef.current.add(msg.id);
            handleSignalingMessageRef.current?.(msg);
          }
        };
      } catch (e) {
        console.warn('BroadcastChannel error:', e);
      }
    }

    // 2. Supabase Realtime broadcast channel
    let sbChannel: any = null;
    if (supabase) {
      try {
        sbChannel = supabase.channel(`call:${cleanRoomId}`, {
          config: {
            broadcast: { self: false },
          },
        });

        sbChannel
          .on('broadcast', { event: 'signal' }, ({ payload }: { payload: SignalingMessage }) => {
            if (!isMounted) return;
            if (payload && payload.id && !seenMessageIdsRef.current.has(payload.id)) {
              seenMessageIdsRef.current.add(payload.id);
              handleSignalingMessageRef.current?.(payload);
            }
          })
          .subscribe((status: string) => {
            if (status === 'SUBSCRIBED' && isMounted) {
              // If local media is already initialized, announce peer-join
              if (localStreamRef.current) {
                sendSignalRef.current({
                  type: 'peer-join',
                  userName: userNameRef.current,
                  userAvatar: userAvatarRef.current,
                  isCameraOn: isCameraOnRef.current,
                  isMicOn: isMicOnRef.current,
                  isScreenSharing: isScreenSharingRef.current,
                });
              }
            }
          });
      } catch (e) {
        console.warn('Supabase Realtime channel error:', e);
      }
    }

    // Define signal dispatch function
    sendSignalRef.current = (partialMsg) => {
      const msgId = Math.random().toString(36).substring(2, 10);
      const fullMsg: SignalingMessage = {
        ...partialMsg,
        id: msgId,
        senderId: peerIdRef.current,
      };

      seenMessageIdsRef.current.add(msgId);

      // Broadcast via Supabase
      if (sbChannel) {
        try {
          sbChannel.send({
            type: 'broadcast',
            event: 'signal',
            payload: fullMsg,
          });
        } catch (e) {
          console.warn('Failed to send Supabase signal:', e);
        }
      }

      // Broadcast via local BroadcastChannel
      if (bc) {
        try {
          bc.postMessage(fullMsg);
        } catch (e) {
          console.warn('Failed to send BroadcastChannel signal:', e);
        }
      }
    };

    // Initialize media FIRST, then announce presence once local stream/tracks are ready
    startLocalMedia().then(() => {
      if (!isMounted) return;
      sendSignalRef.current({
        type: 'peer-join',
        userName: userNameRef.current,
        userAvatar: userAvatarRef.current,
        isCameraOn: isCameraOnRef.current,
        isMicOn: isMicOnRef.current,
        isScreenSharing: isScreenSharingRef.current,
      });
    });

    // Cleanup strictly when unmounting or changing roomId
    return () => {
      isMounted = false;

      // Send leave message
      try {
        sendSignalRef.current({ type: 'peer-leave' });
      } catch {
        // ignore
      }

      // Stop all tracks
      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach((track) => track.stop());
        localStreamRef.current = null;
      }
      if (screenStreamRef.current) {
        screenStreamRef.current.getTracks().forEach((track) => track.stop());
        screenStreamRef.current = null;
      }

      // Close PC
      if (pcRef.current) {
        pcRef.current.ontrack = null;
        pcRef.current.onicecandidate = null;
        pcRef.current.close();
        pcRef.current = null;
      }

      // Close local broadcast channel
      if (bc) {
        bc.close();
      }

      // Remove Supabase channel
      if (sbChannel && supabase) {
        supabase.removeChannel(sbChannel);
      }
    };
  }, [roomId, startLocalMedia]);

  // Keep local video element attached if element or stream changes
  useEffect(() => {
    if (localVideoRef.current && localStream) {
      if (localVideoRef.current.srcObject !== localStream) {
        localVideoRef.current.srcObject = localStream;
      }
    }
  }, [localStream]);

  // Keep remote video & audio elements attached if element or stream changes
  useEffect(() => {
    if (remoteVideoRef.current && remoteStream) {
      if (remoteVideoRef.current.srcObject !== remoteStream) {
        remoteVideoRef.current.srcObject = remoteStream;
        remoteVideoRef.current.play().catch((e) => {
          console.log('Autoplay handled for remote video:', e);
        });
      }
    }
    if (remoteAudioRef.current && remoteStream) {
      if (remoteAudioRef.current.srcObject !== remoteStream) {
        remoteAudioRef.current.srcObject = remoteStream;
        remoteAudioRef.current.play().catch((e) => {
          console.log('Autoplay handled for remote audio:', e);
        });
      }
    }
  }, [remoteStream]);

  return {
    localStream,
    remoteStream,
    localVideoRef,
    remoteVideoRef,
    remoteAudioRef,
    bindLocalVideo,
    bindRemoteVideo,
    bindRemoteAudio,
    connectionStatus,
    isCameraOn,
    isMicOn,
    isScreenSharing,
    remotePeerId,
    remotePeerName,
    remotePeerAvatar,
    isRemoteCameraOn,
    isRemoteMicOn,
    isPeerPresent,
    mediaError,
    toggleCamera,
    toggleMic,
    toggleScreenShare,
    retryMedia: startLocalMedia,
  };
}
