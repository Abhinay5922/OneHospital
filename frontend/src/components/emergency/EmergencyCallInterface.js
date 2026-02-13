/**
 * Emergency Call Interface Component
 * Video call interface for emergency consultations with WebRTC
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useSocket } from '../../context/SocketContext';
import emergencyService from '../../services/emergencyService';
import toast from 'react-hot-toast';
import {
  VideoCameraIcon,
  VideoCameraSlashIcon,
  MicrophoneIcon,
  PhoneXMarkIcon,
  ChatBubbleLeftRightIcon,
  ExclamationTriangleIcon,
  ClockIcon,
  UserIcon
} from '@heroicons/react/24/outline';

const EmergencyCallInterface = ({ callId, onCallEnd }) => {
  const { user } = useAuth();
  const { socket } = useSocket();
  const [call, setCall] = useState(null);
  const [loading, setLoading] = useState(true);
  const [callStatus, setCallStatus] = useState('connecting');
  const [videoEnabled, setVideoEnabled] = useState(true);
  const [audioEnabled, setAudioEnabled] = useState(true);
  const [showChat, setShowChat] = useState(false);
  const [chatMessage, setChatMessage] = useState('');
  const [chatHistory, setChatHistory] = useState([]);
  const [callDuration, setCallDuration] = useState(0);
  const [firstAidInstructions, setFirstAidInstructions] = useState([]);
  const [doctorNotes, setDoctorNotes] = useState('');
  const [connectionStatus, setConnectionStatus] = useState('Connecting...');
  
  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);
  const localStreamRef = useRef(null);
  const peerConnectionRef = useRef(null);
  const callStartTimeRef = useRef(null);

  // WebRTC configuration
  const rtcConfiguration = {
    iceServers: [
      { urls: 'stun:stun.l.google.com:19302' },
      { urls: 'stun:stun1.l.google.com:19302' }
    ]
  };

  const fetchCallDetails = useCallback(async () => {
    try {
      const response = await emergencyService.getEmergencyCall(callId);
      if (response.data?.success) {
        setCall(response.data.data.call);
        setChatHistory(response.data.data.call.chatHistory || []);
        setFirstAidInstructions(response.data.data.call.firstAidInstructions || []);
        setCallStatus(response.data.data.call.status);
        
        if (response.data.data.call.callStartTime) {
          callStartTimeRef.current = new Date(response.data.data.call.callStartTime);
        }
      }
    } catch (error) {
      console.error('Error fetching call details:', error);
      toast.error('Failed to load call details');
    } finally {
      setLoading(false);
    }
  }, [callId]);

  const initializeCall = useCallback(async () => {
    try {
      setConnectionStatus('Accessing camera and microphone...');
      
      // Get user media
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: 1280, height: 720 },
        audio: { echoCancellation: true, noiseSuppression: true }
      });
      
      localStreamRef.current = stream;
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream;
      }

      setConnectionStatus('Setting up video call...');

      // Initialize peer connection
      setupPeerConnection();

      // Join emergency call room
      if (socket) {
        socket.emit('join-emergency-call', callId);
        setConnectionStatus('Joining call...');
      }

      // Start the video call
      await emergencyService.startVideoCall(callId);
      setConnectionStatus('Connected');
      
    } catch (error) {
      console.error('Error initializing call:', error);
      setConnectionStatus('Failed to connect');
      toast.error('Failed to access camera/microphone. Please check permissions.');
    }
  }, [callId, socket]);

  const cleanup = useCallback(() => {
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach(track => track.stop());
    }
    
    if (peerConnectionRef.current) {
      peerConnectionRef.current.close();
    }

    if (socket) {
      socket.emit('leave-emergency-call', callId);
    }
  }, [callId, socket]);

  useEffect(() => {
    if (callId) {
      fetchCallDetails();
      initializeCall();
    }

    return () => {
      cleanup();
    };
  }, [callId, fetchCallDetails, initializeCall, cleanup]);

  const handleCallAccepted = useCallback((data) => {
    if (data.callId === callId) {
      setCall(data.call);
      setCallStatus('connecting');
      toast.success(`Dr. ${data.doctor.name} accepted your emergency call`);
      
      // If we're the patient, create offer
      if (user.role === 'patient') {
        setTimeout(() => createOffer(), 1000);
      }
    }
  }, [callId, user?.role]);

  const handleVideoCallStarted = useCallback((data) => {
    if (data.callId === callId) {
      setCallStatus('active');
      if (!callStartTimeRef.current) {
        callStartTimeRef.current = new Date();
      }
      toast.success('Video call started');
    }
  }, [callId]);

  const handleCallEnded = useCallback((data) => {
    if (data.callId === callId) {
      setCallStatus('completed');
      cleanup();
      if (onCallEnd) {
        onCallEnd(data.call);
      }
    }
  }, [callId, cleanup, onCallEnd]);

  const handleChatMessage = useCallback((data) => {
    if (data.callId === callId) {
      setChatHistory(prev => [...prev, {
        sender: data.sender,
        message: data.message,
        timestamp: data.timestamp
      }]);
    }
  }, [callId]);

  const handleWebRTCOffer = useCallback(async (data) => {
    if (data.callId !== callId) return;
    
    try {
      const peerConnection = peerConnectionRef.current;
      if (!peerConnection) return;

      await peerConnection.setRemoteDescription(new RTCSessionDescription(data.offer));
      const answer = await peerConnection.createAnswer();
      await peerConnection.setLocalDescription(answer);
      
      socket.emit('webrtc-answer', {
        callId,
        answer: answer
      });
    } catch (error) {
      console.error('Error handling WebRTC offer:', error);
    }
  }, [callId, socket]);

  const handleWebRTCAnswer = useCallback(async (data) => {
    if (data.callId !== callId) return;
    
    try {
      const peerConnection = peerConnectionRef.current;
      if (!peerConnection) return;

      await peerConnection.setRemoteDescription(new RTCSessionDescription(data.answer));
    } catch (error) {
      console.error('Error handling WebRTC answer:', error);
    }
  }, [callId]);

  const handleICECandidate = useCallback(async (data) => {
    if (data.callId !== callId) return;
    
    try {
      const peerConnection = peerConnectionRef.current;
      if (!peerConnection) return;

      await peerConnection.addIceCandidate(new RTCIceCandidate(data.candidate));
    } catch (error) {
      console.error('Error handling ICE candidate:', error);
    }
  }, [callId]);

  useEffect(() => {
    if (socket) {
      socket.on('emergency-call-accepted', handleCallAccepted);
      socket.on('video-call-started', handleVideoCallStarted);
      socket.on('emergency-call-ended', handleCallEnded);
      socket.on('emergency-chat-message', handleChatMessage);
      
      // WebRTC signaling events
      socket.on('webrtc-offer', handleWebRTCOffer);
      socket.on('webrtc-answer', handleWebRTCAnswer);
      socket.on('webrtc-ice-candidate', handleICECandidate);

      return () => {
        socket.off('emergency-call-accepted');
        socket.off('video-call-started');
        socket.off('emergency-call-ended');
        socket.off('emergency-chat-message');
        socket.off('webrtc-offer');
        socket.off('webrtc-answer');
        socket.off('webrtc-ice-candidate');
      };
    }
  }, [socket, handleCallAccepted, handleVideoCallStarted, handleCallEnded, handleChatMessage, handleWebRTCOffer, handleWebRTCAnswer, handleICECandidate]);

  // Timer effect
  useEffect(() => {
    let interval;
    if (callStatus === 'active' && callStartTimeRef.current) {
      interval = setInterval(() => {
        const now = new Date();
        const duration = Math.floor((now - callStartTimeRef.current) / 1000);
        setCallDuration(duration);
      }, 1000);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [callStatus]);

  

  const setupPeerConnection = () => {
    try {
      const peerConnection = new RTCPeerConnection(rtcConfiguration);
      peerConnectionRef.current = peerConnection;

      // Add local stream to peer connection
      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach(track => {
          peerConnection.addTrack(track, localStreamRef.current);
        });
      }

      // Handle remote stream
      peerConnection.ontrack = (event) => {
        console.log('Received remote stream');
        if (remoteVideoRef.current && event.streams[0]) {
          remoteVideoRef.current.srcObject = event.streams[0];
        }
      };

      // Handle ICE candidates
      peerConnection.onicecandidate = (event) => {
        if (event.candidate && socket) {
          socket.emit('webrtc-ice-candidate', {
            callId,
            candidate: event.candidate
          });
        }
      };

      // Connection state monitoring
      peerConnection.onconnectionstatechange = () => {
        console.log('Connection state:', peerConnection.connectionState);
        setConnectionStatus(peerConnection.connectionState);
        
        if (peerConnection.connectionState === 'connected') {
          setCallStatus('active');
          if (!callStartTimeRef.current) {
            callStartTimeRef.current = new Date();
          }
        }
      };

    } catch (error) {
      console.error('Error setting up peer connection:', error);
      toast.error('Failed to setup video connection');
    }
  };

  

  const createOffer = async () => {
    try {
      const peerConnection = peerConnectionRef.current;
      if (!peerConnection) return;

      const offer = await peerConnection.createOffer();
      await peerConnection.setLocalDescription(offer);

      socket.emit('webrtc-offer', {
        callId,
        offer: offer
      });
    } catch (error) {
      console.error('Error creating offer:', error);
    }
  };

  

  const toggleVideo = () => {
    if (localStreamRef.current) {
      const videoTrack = localStreamRef.current.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = !videoTrack.enabled;
        setVideoEnabled(videoTrack.enabled);
        toast(videoTrack.enabled ? 'Camera enabled' : 'Camera disabled', {
          icon: videoTrack.enabled ? '📹' : '📹',
          style: {
            background: '#e0f2fe',
            color: '#0369a1',
            border: '1px solid #bae6fd'
          }
        });
      }
    }
  };

  const toggleAudio = () => {
    if (localStreamRef.current) {
      const audioTrack = localStreamRef.current.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
        setAudioEnabled(audioTrack.enabled);
        toast(audioTrack.enabled ? 'Microphone enabled' : 'Microphone muted', {
          icon: audioTrack.enabled ? '🎤' : '🔇',
          style: {
            background: '#e0f2fe',
            color: '#0369a1',
            border: '1px solid #bae6fd'
          }
        });
      }
    }
  };

  const sendChatMessage = async () => {
    if (!chatMessage.trim()) return;

    try {
      await emergencyService.sendChatMessage(callId, chatMessage);
      setChatHistory(prev => [...prev, {
        sender: user.role === 'doctor' ? 'doctor' : 'patient',
        message: chatMessage,
        timestamp: new Date()
      }]);
      setChatMessage('');
    } catch (error) {
      console.error('Error sending message:', error);
      toast.error('Failed to send message');
    }
  };

  const endCall = async () => {
    try {
      const endData = {};
      
      if (user.role === 'doctor') {
        endData.doctorNotes = doctorNotes;
        endData.firstAidInstructions = firstAidInstructions.map(item => item.instruction);
      }

      await emergencyService.endEmergencyCall(callId, endData);
      cleanup();
      
      if (onCallEnd) {
        onCallEnd();
      }
    } catch (error) {
      console.error('Error ending call:', error);
      toast.error('Failed to end call');
    }
  };

  

  const formatDuration = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  if (loading) {
    return (
      <div className="fixed inset-0 bg-gray-900 flex items-center justify-center z-50">
        <div className="text-white text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
          <p>Loading emergency call...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-gray-900 z-50">
      {/* Header */}
      <div className="bg-red-600 text-white p-4 flex justify-between items-center">
        <div className="flex items-center space-x-4">
          <ExclamationTriangleIcon className="w-6 h-6" />
          <div>
            <h2 className="text-lg font-semibold">Emergency Consultation</h2>
            <p className="text-sm opacity-90">
              {call?.doctorId ? 
                `Dr. ${call.doctorId.firstName} ${call.doctorId.lastName}` : 
                'Waiting for doctor...'
              }
            </p>
          </div>
        </div>
        <div className="flex items-center space-x-4">
          <div className="text-sm">
            <span className="opacity-75">Status: </span>
            <span>{connectionStatus}</span>
          </div>
          {callStatus === 'active' && (
            <div className="flex items-center space-x-2">
              <ClockIcon className="w-4 h-4" />
              <span className="text-sm">{formatDuration(callDuration)}</span>
            </div>
          )}
          <span className={`px-3 py-1 rounded-full text-xs font-medium ${
            callStatus === 'active' ? 'bg-green-500' :
            callStatus === 'connecting' ? 'bg-yellow-500' :
            'bg-gray-500'
          }`}>
            {callStatus.charAt(0).toUpperCase() + callStatus.slice(1)}
          </span>
        </div>
      </div>

      {/* Video Area */}
      <div className="flex-1 relative h-full">
        {/* Remote Video */}
        <video
          ref={remoteVideoRef}
          autoPlay
          playsInline
          className="w-full h-full object-cover bg-gray-800"
        />
        
        {/* Placeholder for remote video when not connected */}
        {callStatus !== 'active' && (
          <div className="absolute inset-0 bg-gray-800 flex items-center justify-center">
            <div className="text-white text-center">
              <UserIcon className="w-24 h-24 mx-auto mb-4 opacity-50" />
              <p className="text-lg">{connectionStatus}</p>
              {callStatus === 'connecting' && (
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mx-auto mt-4"></div>
              )}
            </div>
          </div>
        )}
        
        {/* Local Video */}
        <div className="absolute top-4 right-4 w-48 h-36 bg-gray-800 rounded-lg overflow-hidden border-2 border-white">
          <video
            ref={localVideoRef}
            autoPlay
            playsInline
            muted
            className="w-full h-full object-cover"
          />
          {!videoEnabled && (
            <div className="absolute inset-0 bg-gray-800 flex items-center justify-center">
              <UserIcon className="w-12 h-12 text-gray-400" />
            </div>
          )}
          <div className="absolute bottom-1 left-1 text-white text-xs bg-black bg-opacity-50 px-1 rounded">
            You
          </div>
        </div>

        {/* Chat Panel */}
        {showChat && (
          <div className="absolute left-4 top-4 bottom-20 w-80 bg-white rounded-lg shadow-lg flex flex-col">
            <div className="p-3 border-b bg-gray-50 rounded-t-lg">
              <h3 className="font-medium">Chat</h3>
            </div>
            <div className="flex-1 overflow-y-auto p-3 space-y-2">
              {chatHistory.map((msg, index) => (
                <div key={index} className={`flex ${msg.sender === (user.role === 'doctor' ? 'doctor' : 'patient') ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-xs px-3 py-2 rounded-lg text-sm ${
                    msg.sender === (user.role === 'doctor' ? 'doctor' : 'patient') 
                      ? 'bg-blue-500 text-white' 
                      : 'bg-gray-200 text-gray-800'
                  }`}>
                    {msg.message}
                  </div>
                </div>
              ))}
            </div>
            <div className="p-3 border-t flex space-x-2">
              <input
                type="text"
                value={chatMessage}
                onChange={(e) => setChatMessage(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && sendChatMessage()}
                placeholder="Type a message..."
                className="flex-1 px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <button
                onClick={sendChatMessage}
                className="px-3 py-2 bg-blue-500 text-white rounded-lg text-sm hover:bg-blue-600"
              >
                Send
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Controls */}
      <div className="bg-gray-800 p-4 flex justify-center items-center space-x-4">
        <button
          onClick={toggleVideo}
          className={`p-3 rounded-full transition-colors ${videoEnabled ? 'bg-gray-600 hover:bg-gray-700' : 'bg-red-600 hover:bg-red-700'} text-white`}
          title={videoEnabled ? 'Turn off camera' : 'Turn on camera'}
        >
          {videoEnabled ? <VideoCameraIcon className="w-6 h-6" /> : <VideoCameraSlashIcon className="w-6 h-6" />}
        </button>
        
        <button
          onClick={toggleAudio}
          className={`p-3 rounded-full transition-colors ${audioEnabled ? 'bg-gray-600 hover:bg-gray-700' : 'bg-red-600 hover:bg-red-700'} text-white relative`}
          title={audioEnabled ? 'Mute microphone' : 'Unmute microphone'}
        >
          <MicrophoneIcon className="w-6 h-6" />
          {!audioEnabled && (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-8 h-0.5 bg-white transform rotate-45"></div>
            </div>
          )}
        </button>
        
        <button
          onClick={() => setShowChat(!showChat)}
          className={`p-3 rounded-full transition-colors ${showChat ? 'bg-blue-600 hover:bg-blue-700' : 'bg-gray-600 hover:bg-gray-700'} text-white`}
          title="Toggle chat"
        >
          <ChatBubbleLeftRightIcon className="w-6 h-6" />
        </button>
        
        <button
          onClick={endCall}
          className="p-3 rounded-full bg-red-600 hover:bg-red-700 text-white transition-colors"
          title="End call"
        >
          <PhoneXMarkIcon className="w-6 h-6" />
        </button>
      </div>
    </div>
  );
};

export default EmergencyCallInterface;