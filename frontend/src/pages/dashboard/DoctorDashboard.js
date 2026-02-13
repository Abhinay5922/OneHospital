/**
 * Doctor Dashboard Component
 * Comprehensive dashboard for doctor users with all features
 */

import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useSocket } from '../../context/SocketContext';
import { useQuery, useQueryClient } from 'react-query';
import emergencyService from '../../services/emergencyService';
import { appointmentService } from '../../services/appointmentService';
import ReferralForm from '../../components/referral/ReferralForm';
import toast from 'react-hot-toast';
import {
  ExclamationTriangleIcon,
  PhoneIcon,
  CheckCircleIcon,
  ClockIcon,
  CalendarDaysIcon,
  QueueListIcon,
  DocumentTextIcon,
  ArrowPathIcon,
  EyeIcon,
  CheckIcon,
  XMarkIcon,
  MapPinIcon,
  UserIcon
} from '@heroicons/react/24/outline';

const DoctorDashboard = () => {
  const { user } = useAuth();
  const { socket } = useSocket();
  const queryClient = useQueryClient();
  
  const [emergencyAvailable, setEmergencyAvailable] = useState(false);
  const [emergencyRequests, setEmergencyRequests] = useState([]);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('queue');
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [manualAppointments, setManualAppointments] = useState([]);
  const [manualLoading, setManualLoading] = useState(false);
  const [selectedAppointment, setSelectedAppointment] = useState(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showReferralForm, setShowReferralForm] = useState(false);
  const [referralAppointment, setReferralAppointment] = useState(null);

  // Fetch today's appointments with optimized caching strategy
  const { data: appointmentsData, isLoading: appointmentsLoading, refetch: refetchAppointments } = useQuery(
    ['doctor-appointments', user?._id, selectedDate],
    async () => {
      console.log('Fetching doctor appointments for date:', selectedDate, 'doctorId:', user?._id);
      
      if (!user?._id) {
        throw new Error('User not authenticated');
      }
      
      if (user.role !== 'doctor') {
        throw new Error('User is not a doctor');
      }
      
      try {
        const response = await appointmentService.getDoctorAppointments({ date: selectedDate });
        console.log('Appointments fetched successfully:', response.data?.appointments?.length || 0, 'appointments');
        return response;
      } catch (error) {
        console.error('Error fetching appointments:', error);
        throw error;
      }
    },
    {
      enabled: !!user?._id && user?.role === 'doctor',
      refetchInterval: 2000, // Refresh every 2 seconds
      refetchOnWindowFocus: true,
      refetchOnMount: true,
        refetchOnReconnect: true,
      refetchIntervalInBackground: true,
      staleTime: 0, // Always consider data stale
      cacheTime: 0, // No caching - always fresh
      retry: 3,
      retryDelay: 1000,
      onError: (error) => {
        console.error('Query error:', error);
        if (error.response?.status === 403) {
          toast.error('Authentication failed. Please login again.');
        } else if (error.message) {
          console.warn('Appointment fetch error:', error.message);
        }
      },
      onSuccess: (data) => {
        console.log('Query success, appointments count:', data.data?.appointments?.length || 0);
      }
    }
  );
  
  // Manual fetch function that bypasses React Query completely
  const fetchAppointmentsManually = useCallback(async () => {
    if (!user?._id) return;
    
    setManualLoading(true);
    try {
      console.log('🔄 Manual fetch for doctor appointments...');
      const response = await appointmentService.getDoctorAppointments({ date: selectedDate });
      if (response.data?.success) {
        setManualAppointments(response.data.data.appointments);
        console.log('✅ Manual fetch successful:', response.data.data.appointments.length, 'appointments');
      }
    } catch (error) {
      console.error('❌ Manual fetch failed:', error);
    } finally {
      setManualLoading(false);
    }
  }, [user?._id, selectedDate]);
  
  // Use React Query data first, fallback to manual fetch
  const appointments = appointmentsData?.data?.appointments || manualAppointments || [];
  
  const isActuallyLoading = appointmentsLoading || manualLoading;

  // Force refresh when date changes
  useEffect(() => {
    if (user?._id && user?.role === 'doctor') {
      refetchAppointments();
    }
  }, [selectedDate, user, refetchAppointments]);
  
  // Clear cache and fetch manually when date changes or user changes
  useEffect(() => {
    if (user?._id && user?.role === 'doctor') {
      // Clear React Query cache
      queryClient.removeQueries(['doctor-appointments']);
      // Fetch manually as backup
      fetchAppointmentsManually();
      // Also trigger React Query refetch
      setTimeout(() => refetchAppointments(), 100);
    }
  }, [selectedDate, user?._id, user?.role, queryClient, refetchAppointments, fetchAppointmentsManually]);

  useEffect(() => {
    // Set initial emergency availability from user data
    if (user?.doctorInfo?.emergencyAvailable) {
      setEmergencyAvailable(user.doctorInfo.emergencyAvailable);
    }

    // Socket event listeners for emergency calls and appointments
    if (socket && user?._id) {
      console.log('Doctor Dashboard: Setting up socket listeners for doctor', user._id);
      
      // Join doctor-specific room for real-time updates
      socket.emit('join-doctor', user._id);
      
      // Define handlers with closure to access current refetchAppointments
      const onNewAppointment = async (data) => {
        console.log('New appointment event received:', data);
        toast.success('New appointment booked!');
        
        // Force immediate refresh
        try {
          await queryClient.invalidateQueries(['doctor-appointments']);
          await refetchAppointments();
        } catch (error) {
          console.error('Failed to refresh appointments after new appointment:', error);
        }
      };

      const onAppointmentUpdated = async (data) => {
        console.log('Appointment updated event received:', data);
        toast('Appointment updated', {
          icon: 'ℹ️',
          style: {
            background: '#e0f2fe',
            color: '#0369a1',
            border: '1px solid #bae6fd'
          }
        });
        
        // Force immediate refresh
        try {
          await queryClient.invalidateQueries(['doctor-appointments']);
          await refetchAppointments();
        } catch (error) {
          console.error('Failed to refresh appointments after update:', error);
        }
      };

      const onQueueUpdated = async (data) => {
        console.log('Queue updated event received:', data);
        
        // Force immediate refresh when queue changes
        try {
          await queryClient.invalidateQueries(['doctor-appointments']);
          await refetchAppointments();
        } catch (error) {
          console.error('Failed to refresh appointments after queue update:', error);
        }
      };

      const onEmergencyCallAvailable = (data) => {
        if (emergencyAvailable) {
          toast.success(`🚨 New emergency call - ${data.call?.urgencyLevel || 'high'} urgency`, {
            duration: 15000,
            icon: '🚨',
            style: {
              background: '#fee2e2',
              color: '#dc2626',
              border: '1px solid #fecaca'
            }
          });
          
          setEmergencyRequests(prev => {
            const exists = prev.find(req => req.callId === data.callId);
            if (!exists && data.call) {
              return [...prev, data.call];
            }
            return prev;
          });
          
          try {
            const audio = new Audio('/notification.mp3');
            audio.play().catch(() => {});
          } catch (e) {
            // Notification sound not available
          }
        }
      };

      const onEmergencyCallTaken = (data) => {
        setEmergencyRequests(prev => prev.filter(req => req.callId !== data.callId));
        toast('Emergency call was accepted by another doctor', {
          icon: 'ℹ️',
          style: {
            background: '#e0f2fe',
            color: '#0369a1',
            border: '1px solid #bae6fd'
          }
        });
      };

      const onAppointmentMissed = async (data) => {
        console.log('Appointment missed event received:', data);
        toast('Appointment automatically marked as missed', {
          icon: '⏰',
          style: {
            background: '#fef3c7',
            color: '#92400e',
            border: '1px solid #fde68a'
          }
        });
        
        // Force immediate refresh when appointment is missed
        try {
          await queryClient.invalidateQueries(['doctor-appointments']);
          await refetchAppointments();
        } catch (error) {
          console.error('Failed to refresh appointments after missed appointment:', error);
        }
      };
      
      // Listen for emergency call notifications
      socket.on('emergency-call-available', onEmergencyCallAvailable);
      socket.on('emergency-call-taken', onEmergencyCallTaken);
      
      // Listen for appointment updates
      socket.on('new-appointment', onNewAppointment);
      socket.on('appointment-updated', onAppointmentUpdated);
      socket.on('appointment-status-changed', onAppointmentUpdated);
      socket.on('queue-updated', onQueueUpdated);
      socket.on('appointment-missed', onAppointmentMissed);

      return () => {
        console.log('Doctor Dashboard: Cleaning up socket listeners');
        socket.off('emergency-call-available', onEmergencyCallAvailable);
        socket.off('emergency-call-taken', onEmergencyCallTaken);
        socket.off('new-appointment', onNewAppointment);
        socket.off('appointment-updated', onAppointmentUpdated);
        socket.off('appointment-status-changed', onAppointmentUpdated);
        socket.off('queue-updated', onQueueUpdated);
        socket.off('appointment-missed', onAppointmentMissed);
        socket.emit('leave-doctor', user._id);
      };
    }
  }, [socket, user, queryClient, refetchAppointments, emergencyAvailable]);

  const toggleEmergencyAvailability = async () => {
    try {
      setLoading(true);
      const newStatus = !emergencyAvailable;
      
      const response = await emergencyService.toggleEmergencyAvailability(newStatus);
      
      if (response.data?.success) {
        setEmergencyAvailable(newStatus);
        toast.success(`Emergency availability ${newStatus ? 'enabled' : 'disabled'}`);
        
        if (newStatus) {
          toast('You will now receive emergency call notifications', {
            icon: '🔔',
            style: {
              background: '#e0f2fe',
              color: '#0369a1',
              border: '1px solid #bae6fd'
            }
          });
        }
      } else {
        throw new Error(response.data?.message || 'Failed to update emergency availability');
      }
    } catch (error) {
      // Provide specific error messages
      let errorMessage = 'Failed to update emergency availability';
      
      if (error.response?.status === 401) {
        errorMessage = 'Authentication failed. Please logout and login again.';
        toast.error('Your session may have expired. Please refresh the page and login again.', {
          duration: 8000
        });
      } else if (error.response?.status === 403) {
        errorMessage = 'Access denied. Only doctors can toggle emergency availability.';
      } else if (error.response?.status === 404) {
        errorMessage = 'Emergency service not available. Please contact support.';
      } else if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.response?.data?.errors) {
        errorMessage = error.response.data.errors.map(err => err.msg).join(', ');
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      toast.error(errorMessage);
      
      // If it's an auth error, suggest clearing storage
      if (error.response?.status === 401) {
        setTimeout(() => {
          toast('Try: 1) Refresh page 2) Logout/Login 3) Clear browser data', {
            icon: '💡',
            duration: 10000,
            style: {
              background: '#fef3c7',
              color: '#92400e',
              border: '1px solid #fde68a'
            }
          });
        }, 2000);
      }
    } finally {
      setLoading(false);
    }
  };

  const acceptEmergencyCall = async (callId) => {
    try {
      const response = await emergencyService.acceptEmergencyCall(callId);
      if (response.data?.success) {
        toast.success('Emergency call accepted! Opening video call...');
        // Remove from requests list
        setEmergencyRequests(prev => prev.filter(req => req.callId !== callId));
        // Navigate to emergency call interface
        window.open(`/emergency/${callId}`, '_blank');
      }
    } catch (error) {
      console.error('Error accepting emergency call:', error);
      toast.error('Failed to accept emergency call');
    }
  };

  const updateAppointmentStatus = async (appointmentId, status) => {
    try {
      console.log('🔄 Updating appointment status:', { appointmentId, status });
      
      const response = await appointmentService.updateAppointmentStatus(appointmentId, { status });
      console.log('✅ Status update response:', response.data);
      
      toast.success(`Appointment ${status.replace('_', ' ')}`);
      
      // Immediately invalidate cache and refetch
      queryClient.invalidateQueries(['doctor-appointments']);
      await refetchAppointments();
      
      console.log('✅ Appointments refetched after status update');
    } catch (error) {
      console.error('❌ Error updating appointment status:', error);
      console.error('Error details:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status
      });
      
      let errorMessage = 'Failed to update appointment';
      if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.response?.status === 403) {
        errorMessage = 'Access denied. Please check your permissions.';
      } else if (error.response?.status === 404) {
        errorMessage = 'Appointment not found.';
      }
      
      toast.error(errorMessage);
    }
  };

  const viewAppointmentDetails = (appointment) => {
    console.log('Opening appointment details for:', appointment);
    setSelectedAppointment(appointment);
    setShowDetailsModal(true);
  };

  const closeDetailsModal = () => {
    console.log('Closing appointment details modal');
    setSelectedAppointment(null);
    setShowDetailsModal(false);
  };

  // Referral functions
  const openReferralForm = (appointment) => {
    console.log('Opening referral form for appointment:', appointment);
    setReferralAppointment(appointment);
    setShowReferralForm(true);
  };

  const closeReferralForm = () => {
    console.log('Closing referral form');
    setReferralAppointment(null);
    setShowReferralForm(false);
  };

  const handleReferralSuccess = (referral) => {
    console.log('Referral created successfully:', referral);
    toast.success(`Referral sent to Dr. ${referral.referredToDoctorId.firstName} ${referral.referredToDoctorId.lastName}`);
    // Optionally refresh appointments or update UI
    refetchAppointments();
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'confirmed': return 'bg-blue-100 text-blue-800';
      case 'in_progress': return 'bg-yellow-100 text-yellow-800';
      case 'completed': return 'bg-green-100 text-green-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      case 'missed': return 'bg-orange-100 text-orange-800';
      case 'no_show': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getUrgencyColor = (level) => {
    switch (level) {
      case 'critical': return 'bg-red-100 text-red-800';
      case 'high': return 'bg-orange-100 text-orange-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  // Helper function to format date for comparison
  const formatDateForComparison = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toISOString().split('T')[0];
  };

  // Since backend already filters by date, we can use appointments directly
  // But let's add a safety filter in case backend doesn't filter properly
  const todayAppointments = appointments.filter(apt => {
    const appointmentDate = formatDateForComparison(apt.appointmentDate);
    return appointmentDate === selectedDate;
  });
  
  const queueAppointments = todayAppointments.filter(apt => ['confirmed', 'in_progress'].includes(apt.status));
  const completedAppointments = todayAppointments.filter(apt => apt.status === 'completed');
  const missedAppointments = todayAppointments.filter(apt => apt.status === 'missed');

  return (
    <div className="max-w-7xl mx-auto animate-slide-up space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 mb-2">
            Welcome, Dr. {user?.firstName}!
          </h1>
          <p className="text-slate-600">
            Manage your appointments, consultations, and emergency calls
          </p>
        </div>
        <div className="flex items-center gap-2 text-sm font-medium text-slate-500 bg-white px-4 py-2 rounded-xl shadow-sm border border-slate-100">
          <CalendarDaysIcon className="w-5 h-5 text-primary-500" />
          <span>{new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</span>
        </div>
      </div>

      {/* Emergency Availability & Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Emergency Toggle Card */}
        <div className={`col-span-1 rounded-2xl p-6 border transition-all duration-300 ${
          emergencyAvailable 
            ? 'bg-red-50 border-red-100 shadow-soft ring-1 ring-red-200' 
            : 'bg-white border-slate-100 shadow-soft'
        }`}>
          <div className="flex items-start justify-between mb-4">
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
              emergencyAvailable ? 'bg-red-100 text-red-600' : 'bg-slate-100 text-slate-400'
            }`}>
              <ExclamationTriangleIcon className="w-6 h-6" />
            </div>
            <div className={`px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wide ${
              emergencyAvailable ? 'bg-red-200 text-red-800' : 'bg-slate-200 text-slate-600'
            }`}>
              {emergencyAvailable ? 'Active' : 'Inactive'}
            </div>
          </div>
          
          <h3 className={`text-lg font-bold mb-1 ${emergencyAvailable ? 'text-red-900' : 'text-slate-900'}`}>
            Emergency Availability
          </h3>
          <p className={`text-sm mb-6 ${emergencyAvailable ? 'text-red-700' : 'text-slate-500'}`}>
            {emergencyAvailable 
              ? 'You are currently visible for emergency calls. Keep your device ready.' 
              : 'Enable this to receive critical emergency consultation requests.'
            }
          </p>
          
          <button
            onClick={toggleEmergencyAvailability}
            disabled={loading}
            className={`w-full py-3 rounded-xl font-semibold transition-all shadow-sm flex items-center justify-center gap-2 ${
              emergencyAvailable
                ? 'bg-white text-red-600 border border-red-200 hover:bg-red-50'
                : 'bg-slate-900 text-white hover:bg-slate-800 hover:shadow-lg hover:-translate-y-0.5'
            }`}
          >
            {loading ? (
              <div className="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin" />
            ) : (
              <>
                {emergencyAvailable ? 'Disable Availability' : 'Go Online'}
              </>
            )}
          </button>
        </div>

        {/* Quick Stats */}
        <div className="col-span-1 lg:col-span-2 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
           <StatsCard 
            icon={<QueueListIcon className="w-6 h-6 text-blue-600" />}
            value={queueAppointments.length}
            label="In Queue"
            color="primary"
          />
          <StatsCard 
            icon={<CheckCircleIcon className="w-6 h-6 text-green-600" />}
            value={completedAppointments.length}
            label="Completed"
            color="success"
          />
           <StatsCard 
            icon={<CalendarDaysIcon className="w-6 h-6 text-purple-600" />}
            value={todayAppointments.length}
            label="Total Appointments"
            color="purple"
          />
        </div>
      </div>

      {/* Emergency Call Requests */}
      {emergencyRequests.length > 0 && (
        <div className="animate-slide-up">
          <div className="flex items-center gap-2 mb-4">
            <span className="relative flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
            </span>
            <h2 className="text-lg font-bold text-red-600">Incoming Emergency Requests ({emergencyRequests.length})</h2>
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {emergencyRequests.map((request) => (
              <div key={request.callId} className="bg-white rounded-2xl p-5 border border-red-100 shadow-lg shadow-red-100/50 hover:shadow-xl transition-all duration-300 relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-24 h-24 bg-red-50 rounded-bl-full -mr-10 -mt-10 z-0 transition-transform group-hover:scale-110"></div>
                
                <div className="relative z-10">
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center text-red-600 font-bold">
                        {request.patientName?.[0] || 'P'}
                      </div>
                      <div>
                        <h3 className="font-bold text-slate-900">{request.patientName || 'Unknown Patient'}</h3>
                        <p className="text-xs text-slate-500">ID: {request.callId.slice(-6)}</p>
                      </div>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide ${getUrgencyColor(request.urgencyLevel)}`}>
                      {request.urgencyLevel}
                    </span>
                  </div>
                  
                  <div className="space-y-2 mb-6">
                    <div className="bg-red-50/50 rounded-lg p-3">
                      <p className="text-xs font-semibold text-red-400 uppercase mb-1">Symptoms</p>
                      <p className="text-sm font-medium text-slate-800">{request.symptoms}</p>
                    </div>
                    {request.patientLocation?.address && (
                      <div className="flex items-start gap-2 text-sm text-slate-600">
                        <MapPinIcon className="w-4 h-4 mt-0.5 text-slate-400" />
                        <span>{request.patientLocation.address}</span>
                      </div>
                    )}
                  </div>

                  <button
                    onClick={() => acceptEmergencyCall(request.callId)}
                    className="w-full py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-xl font-semibold shadow-md shadow-red-200 hover:shadow-lg transition-all flex items-center justify-center gap-2"
                  >
                    <PhoneIcon className="w-4 h-4 animate-pulse" />
                    Accept Emergency Call
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Main Content Tabs */}
      <div className="card overflow-hidden p-0">
        <div className="border-b border-slate-100 bg-slate-50/50 px-6 py-4 flex flex-col sm:flex-row justify-between items-center gap-4">
          <div className="flex flex-wrap gap-2">
            <TabButton 
              active={activeTab === 'queue'} 
              onClick={() => setActiveTab('queue')}
              count={queueAppointments.length}
            >
              Queue
            </TabButton>
            <TabButton 
              active={activeTab === 'appointments'} 
              onClick={() => setActiveTab('appointments')}
              count={todayAppointments.length}
            >
              All
            </TabButton>
            <TabButton 
              active={activeTab === 'completed'} 
              onClick={() => setActiveTab('completed')}
              count={completedAppointments.length}
            >
              Completed
            </TabButton>
            <TabButton 
              active={activeTab === 'missed'} 
              onClick={() => setActiveTab('missed')}
              count={missedAppointments.length}
            >
              Missed
            </TabButton>
          </div>
            
          <div className="flex items-center gap-3">
            <div className="relative">
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="pl-3 pr-8 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none transition-all"
              />
              <CalendarDaysIcon className="w-4 h-4 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
            
            <button
              onClick={() => refetchAppointments()}
              disabled={isActuallyLoading}
              className="p-2 text-slate-400 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-colors disabled:opacity-50"
              title="Refresh appointments"
            >
              <ArrowPathIcon className={`w-5 h-5 ${isActuallyLoading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>

        <div className="p-6 min-h-[400px]">
          {isActuallyLoading ? (
            <div className="flex flex-col items-center justify-center py-20 text-slate-400">
              <div className="loading-spinner mb-4"></div>
              <p>Syncing appointments...</p>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Queue Tab - Keep as Cards for focus */}
              {activeTab === 'queue' && (
                <>
                  {queueAppointments.length === 0 ? (
                    <EmptyState type="queue" date={selectedDate} />
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                      {queueAppointments.map((appointment, index) => (
                        <AppointmentCard 
                          key={appointment._id} 
                          appointment={appointment} 
                          index={index}
                          type="queue"
                          onStatusUpdate={updateAppointmentStatus}
                          onViewDetails={viewAppointmentDetails}
                          onRefer={openReferralForm}
                        />
                      ))}
                    </div>
                  )}
                </>
              )}

              {/* Other Tabs - Use Table for better scanning */}
              {activeTab === 'appointments' && (
                <>
                  {todayAppointments.length === 0 ? (
                    <EmptyState type="all" date={selectedDate} />
                  ) : (
                    <AppointmentsTable 
                      appointments={todayAppointments}
                      onStatusUpdate={updateAppointmentStatus}
                      onViewDetails={viewAppointmentDetails}
                      type="all"
                    />
                  )}
                </>
              )}

              {activeTab === 'completed' && (
                <>
                  {completedAppointments.length === 0 ? (
                    <EmptyState type="completed" date={selectedDate} />
                  ) : (
                    <AppointmentsTable 
                      appointments={completedAppointments}
                      onStatusUpdate={updateAppointmentStatus}
                      onViewDetails={viewAppointmentDetails}
                      onRefer={openReferralForm}
                      type="completed"
                    />
                  )}
                </>
              )}

              {activeTab === 'missed' && (
                <>
                  {missedAppointments.length === 0 ? (
                    <EmptyState type="missed" date={selectedDate} />
                  ) : (
                    <AppointmentsTable 
                      appointments={missedAppointments}
                      onStatusUpdate={updateAppointmentStatus}
                      onViewDetails={viewAppointmentDetails}
                      type="missed"
                    />
                  )}
                </>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Appointment Details Modal */}
      {showDetailsModal && selectedAppointment && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto animate-scale-up">
            <div className="sticky top-0 bg-white/80 backdrop-blur-md px-6 py-4 border-b border-slate-100 flex justify-between items-center z-10">
              <h2 className="text-xl font-bold text-slate-900">Appointment Details</h2>
              <button
                onClick={closeDetailsModal}
                className="p-2 hover:bg-slate-100 rounded-full text-slate-400 hover:text-slate-600 transition-colors"
              >
                <XMarkIcon className="w-6 h-6" />
              </button>
            </div>

            <div className="p-6 space-y-6">
              {/* Patient Profile Header */}
              <div className="flex items-start gap-4 p-4 bg-slate-50 rounded-xl border border-slate-100">
                <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center text-2xl font-bold text-primary-600 shadow-sm border border-slate-100">
                  {selectedAppointment.patientId?.firstName?.[0]}{selectedAppointment.patientId?.lastName?.[0]}
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-900">
                    {selectedAppointment.patientId?.firstName} {selectedAppointment.patientId?.lastName}
                  </h3>
                  <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-slate-600 mt-1">
                    <span className="flex items-center gap-1">
                      <UserIcon className="w-3 h-3" /> {selectedAppointment.patientId?.gender}, {selectedAppointment.patientId?.age || 'N/A'} yrs
                    </span>
                    <span className="flex items-center gap-1">
                      <PhoneIcon className="w-3 h-3" /> {selectedAppointment.patientId?.phone}
                    </span>
                  </div>
                </div>
              </div>

              {/* Status Bar */}
              <div className="flex items-center justify-between p-4 bg-white border border-slate-100 rounded-xl shadow-sm">
                <div>
                  <p className="text-xs text-slate-500 font-medium uppercase tracking-wider mb-1">Current Status</p>
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-sm font-bold ${getStatusColor(selectedAppointment.status)}`}>
                    {selectedAppointment.status.replace('_', ' ').toUpperCase()}
                  </span>
                </div>
                <div className="text-right">
                   <p className="text-xs text-slate-500 font-medium uppercase tracking-wider mb-1">Token Number</p>
                   <p className="text-xl font-bold text-slate-900">#{selectedAppointment.tokenNumber}</p>
                </div>
              </div>

              {/* Medical Info */}
              <div>
                <h4 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-3 flex items-center gap-2">
                  <DocumentTextIcon className="w-4 h-4 text-primary-500" />
                  Medical Information
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-4 bg-white border border-slate-100 rounded-xl">
                    <p className="text-xs text-slate-500 mb-1">Reported Symptoms</p>
                    <p className="font-medium text-slate-900">{selectedAppointment.patientDetails?.symptoms}</p>
                  </div>
                  <div className="p-4 bg-white border border-slate-100 rounded-xl">
                    <p className="text-xs text-slate-500 mb-1">Urgency Level</p>
                    <div className="flex items-center gap-2">
                      <div className={`w-2 h-2 rounded-full ${
                        selectedAppointment.patientDetails?.urgency === 'high' ? 'bg-red-500' :
                        selectedAppointment.patientDetails?.urgency === 'medium' ? 'bg-yellow-500' :
                        'bg-green-500'
                      }`} />
                      <span className="font-medium text-slate-900 capitalize">{selectedAppointment.patientDetails?.urgency}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Doctor Notes */}
              {selectedAppointment.doctorNotes && (
                 <div>
                  <h4 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-3 flex items-center gap-2">
                    <CheckCircleIcon className="w-4 h-4 text-success-500" />
                    Diagnosis & Prescription
                  </h4>
                  <div className="bg-slate-50 rounded-xl p-5 border border-slate-100 space-y-4">
                    {selectedAppointment.doctorNotes.diagnosis && (
                      <div>
                        <p className="text-xs font-bold text-slate-500 uppercase mb-1">Diagnosis</p>
                        <p className="text-slate-900">{selectedAppointment.doctorNotes.diagnosis}</p>
                      </div>
                    )}
                    
                    {selectedAppointment.doctorNotes.prescription?.length > 0 && (
                      <div>
                        <p className="text-xs font-bold text-slate-500 uppercase mb-2">Prescription</p>
                        <div className="space-y-2">
                          {selectedAppointment.doctorNotes.prescription.map((med, idx) => (
                            <div key={idx} className="bg-white p-3 rounded-lg border border-slate-200 shadow-sm text-sm">
                              <div className="font-bold text-slate-800">{med.medicine}</div>
                              <div className="text-slate-600 mt-1 flex gap-2">
                                <span className="bg-slate-100 px-2 py-0.5 rounded text-xs">{med.dosage}</span>
                                <span className="bg-slate-100 px-2 py-0.5 rounded text-xs">{med.frequency}</span>
                                <span className="bg-slate-100 px-2 py-0.5 rounded text-xs">{med.duration}</span>
                              </div>
                              {med.instructions && (
                                <p className="text-slate-500 mt-1.5 italic text-xs">"{med.instructions}"</p>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                 </div>
              )}
            </div>

            <div className="sticky bottom-0 bg-white border-t border-slate-100 p-4 flex justify-end gap-3 rounded-b-2xl">
              <button
                onClick={closeDetailsModal}
                className="px-5 py-2.5 border border-slate-200 rounded-xl text-slate-600 font-medium hover:bg-slate-50 transition-colors"
              >
                Close
              </button>
              
              {selectedAppointment.status === 'confirmed' && (
                <button
                  onClick={() => {
                    updateAppointmentStatus(selectedAppointment._id, 'in_progress');
                    closeDetailsModal();
                  }}
                  className="px-5 py-2.5 bg-yellow-500 hover:bg-yellow-600 text-white rounded-xl font-medium shadow-md shadow-yellow-200 transition-all"
                >
                  Start Consultation
                </button>
              )}
              
              {selectedAppointment.status === 'in_progress' && (
                <button
                  onClick={() => {
                    updateAppointmentStatus(selectedAppointment._id, 'completed');
                    closeDetailsModal();
                  }}
                  className="px-5 py-2.5 bg-green-600 hover:bg-green-700 text-white rounded-xl font-medium shadow-md shadow-green-200 transition-all"
                >
                  Complete Consultation
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Referral Form Modal */}
      {showReferralForm && referralAppointment && (
        <ReferralForm
          appointment={referralAppointment}
          onClose={closeReferralForm}
          onSuccess={handleReferralSuccess}
        />
      )}
    </div>
  );
};

// --- Helper Components ---

const StatsCard = ({ icon, value, label, color }) => {
  const colorStyles = {
    primary: 'bg-gradient-to-br from-primary-50 to-primary-100 text-primary-600 ring-1 ring-primary-200',
    success: 'bg-gradient-to-br from-teal-50 to-teal-100 text-teal-600 ring-1 ring-teal-200',
    warning: 'bg-gradient-to-br from-amber-50 to-amber-100 text-amber-600 ring-1 ring-amber-200',
    purple: 'bg-gradient-to-br from-indigo-50 to-indigo-100 text-indigo-600 ring-1 ring-indigo-200',
  };
  
  return (
    <div className="bg-white rounded-2xl shadow-soft p-6 border border-slate-100 hover:shadow-lg transition-all duration-300 group">
      <div className="flex items-center gap-5">
        <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shadow-sm transition-transform group-hover:scale-110 duration-300 ${colorStyles[color] || colorStyles.primary}`}>
          {React.cloneElement(icon, { className: "w-7 h-7" })}
        </div>
        <div>
          <p className="text-3xl font-bold text-slate-900 tracking-tight">{value}</p>
          <p className="text-sm font-medium text-slate-500 uppercase tracking-wide">{label}</p>
        </div>
      </div>
    </div>
  );
};

const AppointmentsTable = ({ appointments, onStatusUpdate, onViewDetails, onRefer, type }) => {
  return (
    <div className="overflow-x-auto rounded-xl border border-slate-200 shadow-sm bg-white">
      <table className="min-w-full divide-y divide-slate-200">
        <thead className="bg-slate-50">
          <tr>
            <th scope="col" className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Token</th>
            <th scope="col" className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Patient</th>
            <th scope="col" className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Time</th>
            <th scope="col" className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Status</th>
            <th scope="col" className="px-6 py-4 text-right text-xs font-bold text-slate-500 uppercase tracking-wider">Actions</th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-slate-200">
          {appointments.map((appointment) => (
            <tr key={appointment._id} className="hover:bg-slate-50/80 transition-colors">
              <td className="px-6 py-4 whitespace-nowrap">
                <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-primary-50 text-primary-700 font-bold border border-primary-100">
                  #{appointment.tokenNumber}
                </div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <div className="flex items-center">
                  <div className="h-10 w-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 font-bold text-sm mr-3">
                    {appointment.patientId?.firstName?.[0]}{appointment.patientId?.lastName?.[0]}
                  </div>
                  <div>
                    <div className="text-sm font-bold text-slate-900">
                      {appointment.patientId?.firstName} {appointment.patientId?.lastName}
                    </div>
                    <div className="text-xs text-slate-500 flex items-center gap-1">
                      {appointment.patientDetails?.age} yrs • {appointment.patientDetails?.gender}
                    </div>
                  </div>
                </div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <div className="text-sm text-slate-900 font-medium flex items-center gap-1.5">
                  <ClockIcon className="w-4 h-4 text-slate-400" />
                  {appointment.appointmentTime}
                </div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wide ${
                  appointment.status === 'confirmed' ? 'bg-blue-100 text-blue-800' :
                  appointment.status === 'in_progress' ? 'bg-yellow-100 text-yellow-800 ring-1 ring-yellow-200' :
                  appointment.status === 'completed' ? 'bg-green-100 text-green-800' :
                  appointment.status === 'cancelled' ? 'bg-red-100 text-red-800' :
                  'bg-gray-100 text-gray-800'
                }`}>
                  {appointment.status === 'in_progress' && <span className="w-1.5 h-1.5 rounded-full bg-yellow-500 mr-1.5 animate-pulse"></span>}
                  {appointment.status.replace('_', ' ')}
                </span>
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                <div className="flex items-center justify-end gap-2">
                  <button
                    onClick={() => onViewDetails(appointment)}
                    className="p-2 text-slate-400 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-all"
                    title="View Details"
                  >
                    <EyeIcon className="w-5 h-5" />
                  </button>
                  
                  {appointment.status === 'confirmed' && (
                    <button
                      onClick={() => onStatusUpdate(appointment._id, 'in_progress')}
                      className="px-3 py-1.5 bg-white border border-slate-200 text-slate-700 hover:border-yellow-400 hover:text-yellow-700 hover:bg-yellow-50 rounded-lg text-xs font-bold transition-all"
                    >
                      Start
                    </button>
                  )}
                  
                  {appointment.status === 'in_progress' && (
                    <>
                      {onRefer && (
                        <button
                          onClick={() => onRefer(appointment)}
                          className="px-3 py-1.5 bg-purple-50 text-purple-700 hover:bg-purple-100 rounded-lg text-xs font-bold transition-all"
                        >
                          Refer
                        </button>
                      )}
                      <button
                        onClick={() => onStatusUpdate(appointment._id, 'completed')}
                        className="px-3 py-1.5 bg-green-600 text-white hover:bg-green-700 shadow-sm hover:shadow-green-200 rounded-lg text-xs font-bold transition-all"
                      >
                        Complete
                      </button>
                    </>
                  )}
                  
                   {appointment.status === 'missed' && (
                      <button
                        onClick={() => onStatusUpdate(appointment._id, 'confirmed')}
                        className="px-3 py-1.5 bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 rounded-lg text-xs font-bold transition-all"
                      >
                        Reschedule
                      </button>
                   )}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

const TabButton = ({ active, children, onClick, count }) => (
  <button
    onClick={onClick}
    className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all duration-200 flex items-center gap-2 ${
      active
        ? 'bg-white text-primary-600 shadow-sm ring-1 ring-slate-200'
        : 'text-slate-500 hover:text-slate-700 hover:bg-slate-100'
    }`}
  >
    {children}
    {count > 0 && (
      <span className={`px-2 py-0.5 rounded-full text-[10px] ${
        active ? 'bg-primary-50 text-primary-700' : 'bg-slate-200 text-slate-600'
      }`}>
        {count}
      </span>
    )}
  </button>
);

const AppointmentCard = ({ appointment, index, type, onStatusUpdate, onViewDetails, onRefer }) => {
  const isQueue = type === 'queue';
  
  return (
    <div className={`group bg-white border border-slate-100 rounded-xl p-5 hover:border-primary-200 hover:shadow-md transition-all duration-200 relative overflow-hidden ${
      appointment.status === 'in_progress' ? 'ring-2 ring-yellow-400 ring-offset-2' : ''
    }`}>
      {appointment.status === 'in_progress' && (
        <div className="absolute top-0 right-0 bg-yellow-400 text-yellow-900 text-[10px] font-bold px-2 py-1 rounded-bl-lg uppercase tracking-wider">
          In Consultation
        </div>
      )}
      
      <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
        <div className="flex items-center gap-4 w-full md:w-auto">
          <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-lg font-bold shadow-sm ${
            isQueue ? 'bg-primary-600 text-white' : 'bg-slate-100 text-slate-600'
          }`}>
            #{appointment.tokenNumber}
          </div>
          
          <div>
            <h3 className="font-bold text-slate-900 text-lg flex items-center gap-2">
              {appointment.patientId?.firstName} {appointment.patientId?.lastName}
              {appointment.patientDetails?.urgency === 'high' && (
                <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" title="High Urgency" />
              )}
            </h3>
            <div className="flex items-center gap-3 text-sm text-slate-500">
              <span className="flex items-center gap-1">
                <ClockIcon className="w-3.5 h-3.5" /> {appointment.appointmentTime}
              </span>
              <span className="flex items-center gap-1">
                <span className={`w-1.5 h-1.5 rounded-full ${
                  appointment.patientDetails?.urgency === 'high' ? 'bg-red-500' :
                  appointment.patientDetails?.urgency === 'medium' ? 'bg-yellow-500' : 'bg-green-500'
                }`} />
                {appointment.patientDetails?.urgency} Urgency
              </span>
            </div>
          </div>
        </div>
        
        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto justify-end">
           {/* Actions based on status */}
           <button 
             onClick={() => onViewDetails(appointment)}
             className="p-2 text-slate-400 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-colors"
             title="View Details"
           >
             <EyeIcon className="w-5 h-5" />
           </button>
           
           {appointment.status === 'confirmed' && (
              <button
                onClick={() => onStatusUpdate(appointment._id, 'in_progress')}
                className="px-4 py-2 bg-yellow-500 text-white text-sm font-semibold rounded-lg hover:bg-yellow-600 shadow-sm hover:shadow-md transition-all flex items-center gap-2"
              >
                <ClockIcon className="w-4 h-4" /> Start
              </button>
           )}
           
           {appointment.status === 'in_progress' && (
              <div className="flex gap-2">
                {onRefer && (
                  <button
                    onClick={() => onRefer(appointment)}
                    className="px-4 py-2 bg-purple-100 text-purple-700 text-sm font-semibold rounded-lg hover:bg-purple-200 transition-all"
                  >
                    Refer
                  </button>
                )}
                <button
                  onClick={() => onStatusUpdate(appointment._id, 'completed')}
                  className="px-4 py-2 bg-green-600 text-white text-sm font-semibold rounded-lg hover:bg-green-700 shadow-sm hover:shadow-md transition-all flex items-center gap-2"
                >
                  <CheckIcon className="w-4 h-4" /> Complete
                </button>
              </div>
           )}
           
           {appointment.status === 'missed' && (
              <button
                onClick={() => onStatusUpdate(appointment._id, 'confirmed')}
                className="px-4 py-2 bg-white border border-slate-200 text-slate-600 text-sm font-semibold rounded-lg hover:bg-slate-50 transition-all"
              >
                Reschedule
              </button>
           )}
        </div>
      </div>
      
      <div className="mt-4 pt-3 border-t border-slate-50 flex justify-between items-center text-sm">
        <div className="text-slate-600">
          <span className="font-medium text-slate-400 mr-2">Symptoms:</span>
          {appointment.patientDetails?.symptoms}
        </div>
        <div className="font-mono text-slate-400 text-xs">
          ID: {appointment._id.slice(-4)}
        </div>
      </div>
    </div>
  );
};

const EmptyState = ({ type, date }) => {
  const messages = {
    queue: { icon: QueueListIcon, title: "Queue Empty", text: `No patients waiting in queue for ${date}` },
    all: { icon: CalendarDaysIcon, title: "No Appointments", text: `No appointments scheduled for ${date}` },
    completed: { icon: CheckCircleIcon, title: "No Completed Visits", text: `You haven't completed any visits yet today` },
    missed: { icon: ClockIcon, title: "No Missed Appointments", text: "Great! No missed appointments so far" }
  };
  
  const Info = messages[type];
  const Icon = Info.icon;
  
  return (
    <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
      <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mb-4">
        <Icon className="w-8 h-8 text-slate-300" />
      </div>
      <h3 className="text-lg font-bold text-slate-900 mb-1">{Info.title}</h3>
      <p className="text-slate-500 max-w-sm">{Info.text}</p>
    </div>
  );
};

export default DoctorDashboard;
