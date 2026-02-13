/**
 * Emergency Consultation Page
 * Main page for emergency video consultations
 */

import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useSocket } from '../../context/SocketContext';
import emergencyService from '../../services/emergencyService';
import EmergencyCallInterface from '../../components/emergency/EmergencyCallInterface';
import toast from 'react-hot-toast';
import {
  ExclamationTriangleIcon,
  ClockIcon,
  UserIcon,
  CheckCircleIcon,
  XCircleIcon
} from '@heroicons/react/24/outline';

const EmergencyConsultation = () => {
  const { callId } = useParams();
  const navigate = useNavigate();
  const { socket } = useSocket();
  
  const [call, setCall] = useState(null);
  const [loading, setLoading] = useState(true);
  const [waitingTime, setWaitingTime] = useState(0);
  const [showCallInterface, setShowCallInterface] = useState(false);

  const fetchCallDetails = useCallback(async () => {
    try {
      const response = await emergencyService.getEmergencyCall(callId);
      if (response.data?.success) {
        setCall(response.data.data.call);
        
        // If call is active or connecting, show call interface
        if (['connecting', 'active'].includes(response.data.data.call.status)) {
          setShowCallInterface(true);
        }
      }
    } catch (error) {
      console.error('Error fetching call details:', error);
      toast.error('Failed to load emergency call');
      navigate('/dashboard/patient');
    } finally {
      setLoading(false);
    }
  }, [callId, navigate]);

  useEffect(() => {
    if (callId) {
      fetchCallDetails();
    }
  }, [callId, fetchCallDetails]);

  const handleCallAccepted = useCallback((data) => {
    if (data.callId === callId) {
      setCall(data.call);
      toast.success(`Dr. ${data.doctor.name} accepted your emergency call!`);
    }
  }, [callId]);

  const handleCallTaken = useCallback((data) => {
    if (data.callId === callId && call?.status === 'pending') {
      toast.error('This emergency call was accepted by another doctor');
      navigate('/dashboard/patient');
    }
  }, [callId, call?.status, navigate]);

  const handleVideoCallStarted = useCallback((data) => {
    if (data.callId === callId) {
      setShowCallInterface(true);
    }
  }, [callId]);

  const handleCallEnded = useCallback((data) => {
    if (data.callId === callId) {
      setCall(data.call);
      setShowCallInterface(false);
      toast.success('Emergency call completed');
      
      // Show call summary or redirect
      setTimeout(() => {
        navigate('/dashboard/patient');
      }, 3000);
    }
  }, [callId, navigate]);

  useEffect(() => {
    if (socket && callId) {
      socket.emit('join-emergency-call', callId);
      
      socket.on('emergency-call-accepted', handleCallAccepted);
      socket.on('emergency-call-taken', handleCallTaken);
      socket.on('video-call-started', handleVideoCallStarted);
      socket.on('emergency-call-ended', handleCallEnded);

      return () => {
        socket.off('emergency-call-accepted');
        socket.off('emergency-call-taken');
        socket.off('video-call-started');
        socket.off('emergency-call-ended');
        socket.emit('leave-emergency-call', callId);
      };
    }
  }, [socket, callId, handleCallAccepted, handleCallTaken, handleVideoCallStarted, handleCallEnded]);

  // Waiting time counter
  useEffect(() => {
    let interval;
    if (call?.status === 'pending') {
      interval = setInterval(() => {
        const now = new Date();
        const created = new Date(call.createdAt);
        const diff = Math.floor((now - created) / 1000);
        setWaitingTime(diff);
      }, 1000);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [call?.status, call?.createdAt]);



  const cancelEmergencyCall = async () => {
    try {
      await emergencyService.endEmergencyCall(callId, {});
      toast.success('Emergency call cancelled');
      navigate('/dashboard/patient');
    } catch (error) {
      console.error('Error cancelling call:', error);
      toast.error('Failed to cancel emergency call');
    }
  };

  const formatWaitingTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getUrgencyColor = (level) => {
    switch (level) {
      case 'critical': return 'text-red-600 bg-red-100';
      case 'high': return 'text-orange-600 bg-orange-100';
      case 'medium': return 'text-yellow-600 bg-yellow-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600 mx-auto mb-4"></div>
          <p>Loading emergency consultation...</p>
        </div>
      </div>
    );
  }

  if (!call) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <XCircleIcon className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Emergency Call Not Found</h2>
          <p className="text-gray-600 mb-4">The emergency call you're looking for doesn't exist or has been removed.</p>
          <button
            onClick={() => navigate('/dashboard/patient')}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  // Show call interface if call is active
  if (showCallInterface && ['connecting', 'active'].includes(call.status)) {
    return (
      <EmergencyCallInterface
        callId={callId}
        onCallEnd={() => {
          setShowCallInterface(false);
          fetchCallDetails();
        }}
      />
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto py-8 px-4">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
                <ExclamationTriangleIcon className="w-6 h-6 text-red-600" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Emergency Consultation</h1>
                <p className="text-gray-600">Call ID: {call.callId}</p>
              </div>
            </div>
            <div className="text-right">
              <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                call.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                call.status === 'connecting' ? 'bg-blue-100 text-blue-800' :
                call.status === 'active' ? 'bg-green-100 text-green-800' :
                call.status === 'completed' ? 'bg-gray-100 text-gray-800' :
                'bg-red-100 text-red-800'
              }`}>
                {call.status.charAt(0).toUpperCase() + call.status.slice(1)}
              </span>
            </div>
          </div>
        </div>

        {/* Call Status */}
        {call.status === 'pending' && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 mb-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="animate-pulse">
                  <ClockIcon className="w-8 h-8 text-yellow-600" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-yellow-800">Searching for Available Doctors</h3>
                  <p className="text-yellow-700">
                    We're connecting you with the nearest available emergency doctor...
                  </p>
                  <p className="text-sm text-yellow-600 mt-1">
                    Waiting time: {formatWaitingTime(waitingTime)}
                  </p>
                </div>
              </div>
              <button
                onClick={cancelEmergencyCall}
                className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
              >
                Cancel Request
              </button>
            </div>
          </div>
        )}

        {call.status === 'connecting' && call.doctorId && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-6">
            <div className="flex items-center space-x-4">
              <CheckCircleIcon className="w-8 h-8 text-blue-600" />
              <div>
                <h3 className="text-lg font-semibold text-blue-800">Doctor Found!</h3>
                <p className="text-blue-700">
                  Dr. {call.doctorId.firstName} {call.doctorId.lastName} is connecting to your call...
                </p>
                <p className="text-sm text-blue-600">
                  Specialization: {call.doctorId.doctorInfo?.specialization}
                </p>
              </div>
            </div>
          </div>
        )}

        {call.status === 'completed' && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-6 mb-6">
            <div className="flex items-center space-x-4">
              <CheckCircleIcon className="w-8 h-8 text-green-600" />
              <div>
                <h3 className="text-lg font-semibold text-green-800">Consultation Completed</h3>
                <p className="text-green-700">
                  Your emergency consultation has been completed successfully.
                </p>
                {call.callDuration && (
                  <p className="text-sm text-green-600">
                    Duration: {call.callDuration} minutes
                  </p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Call Details */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Patient Information */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Emergency Details</h3>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-600">Urgency Level</label>
                <span className={`ml-2 px-2 py-1 rounded-full text-xs font-medium ${getUrgencyColor(call.urgencyLevel)}`}>
                  {call.urgencyLevel.charAt(0).toUpperCase() + call.urgencyLevel.slice(1)}
                </span>
              </div>
              
              <div>
                <label className="text-sm font-medium text-gray-600">Symptoms</label>
                <p className="mt-1 text-gray-900">{call.symptoms}</p>
              </div>
              
              {call.patientLocation?.address && (
                <div>
                  <label className="text-sm font-medium text-gray-600">Location</label>
                  <p className="mt-1 text-gray-900">{call.patientLocation.address}</p>
                </div>
              )}
              
              <div>
                <label className="text-sm font-medium text-gray-600">Consultation Fee</label>
                <p className="mt-1 text-gray-900">₹{call.consultationFee}</p>
              </div>
            </div>
          </div>

          {/* Doctor Information */}
          {call.doctorId && (
            <div className="bg-white rounded-lg shadow-md p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Assigned Doctor</h3>
              <div className="flex items-center space-x-4 mb-4">
                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                  <UserIcon className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <h4 className="font-medium text-gray-900">
                    Dr. {call.doctorId.firstName} {call.doctorId.lastName}
                  </h4>
                  <p className="text-sm text-gray-600">
                    {call.doctorId.doctorInfo?.specialization}
                  </p>
                </div>
              </div>
              
              {call.hospitalId && (
                <div className="mb-4">
                  <label className="text-sm font-medium text-gray-600">Hospital</label>
                  <p className="mt-1 text-gray-900">{call.hospitalId.name}</p>
                  <p className="text-sm text-gray-600">
                    {call.hospitalId.address?.city}, {call.hospitalId.address?.state}
                  </p>
                </div>
              )}

              {call.doctorNotes && (
                <div>
                  <label className="text-sm font-medium text-gray-600">Doctor's Notes</label>
                  <p className="mt-1 text-gray-900">{call.doctorNotes}</p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* First Aid Instructions */}
        {call.firstAidInstructions && call.firstAidInstructions.length > 0 && (
          <div className="bg-white rounded-lg shadow-md p-6 mt-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">First Aid Instructions</h3>
            <div className="space-y-3">
              {call.firstAidInstructions.map((instruction, index) => (
                <div key={index} className="flex items-start space-x-3 p-3 bg-blue-50 rounded-lg">
                  <span className="flex-shrink-0 w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-medium">
                    {index + 1}
                  </span>
                  <p className="text-gray-900">{instruction.instruction}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Follow-up Information */}
        {call.followUpRequired && (
          <div className="bg-orange-50 border border-orange-200 rounded-lg p-6 mt-6">
            <h3 className="text-lg font-semibold text-orange-800 mb-2">Follow-up Required</h3>
            <p className="text-orange-700 mb-4">
              The doctor recommends scheduling a follow-up appointment.
            </p>
            {call.followUpNotes && (
              <p className="text-orange-700">{call.followUpNotes}</p>
            )}
            <button
              onClick={() => navigate('/hospitals')}
              className="mt-4 px-4 py-2 bg-orange-600 text-white rounded-md hover:bg-orange-700"
            >
              Book Follow-up Appointment
            </button>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex justify-center space-x-4 mt-8">
          <button
            onClick={() => navigate('/dashboard/patient')}
            className="px-6 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700"
          >
            Back to Dashboard
          </button>
          
          {call.status === 'completed' && (
            <button
              onClick={() => navigate('/emergency/history')}
              className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              View Emergency History
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default EmergencyConsultation;