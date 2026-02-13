/**
 * Patient Dashboard Component
 * Dashboard for patient users showing appointments and quick actions
 */

import React, { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useQuery, useQueryClient } from 'react-query';
import { appointmentService } from '../../services/appointmentService';
import { ratingService } from '../../services/ratingService';
import { useAuth } from '../../context/AuthContext';
import { useSocket } from '../../context/SocketContext';
import EmergencyButton from '../../components/emergency/EmergencyButton';
import toast from 'react-hot-toast';
import {
  CalendarDaysIcon,
  ClockIcon,
  MapPinIcon,
  UserIcon,
  PlusIcon,
  ArrowPathIcon,
  ExclamationTriangleIcon,
  StarIcon,
  CheckCircleIcon,
  XCircleIcon,
  BoltIcon
} from '@heroicons/react/24/outline';
import { format, parseISO } from 'date-fns';

const PatientDashboard = () => {
  const { user } = useAuth();
  const { socket } = useSocket();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState('upcoming');
  const [manualAppointments, setManualAppointments] = useState([]);
  const [manualLoading, setManualLoading] = useState(false);
  const [ratedAppointments, setRatedAppointments] = useState(new Set());

  // Fetch patient appointments with very aggressive settings
  const { data: appointmentsData, isLoading, error, refetch } = useQuery(
    ['patient-appointments', user?._id],
    () => appointmentService.getPatientAppointments({ limit: 100 }),
    {
      enabled: !!user?._id,
      refetchInterval: 5000,
      refetchOnWindowFocus: true,
      refetchOnMount: true,
      refetchOnReconnect: true,
      staleTime: 0,
      cacheTime: 0,
      retry: 1,
      retryDelay: 500
    }
  );

  // Manual fetch function
  const fetchAppointmentsManually = useCallback(async () => {
    if (!user?._id) return;
    
    setManualLoading(true);
    try {
      const response = await appointmentService.getPatientAppointments({ limit: 100 });
      if (response.data?.success) {
        setManualAppointments(response.data.data.appointments);
        console.log('✅ Manual fetch successful:', response.data.data.appointments.length, 'appointments');
      }
    } catch (error) {
      console.error('❌ Manual fetch failed:', error);
    } finally {
      setManualLoading(false);
    }
  }, [user?._id]);

  // Fetch rated appointments
  const fetchRatedAppointments = useCallback(async () => {
    if (!user?._id) return;
    
    try {
      const response = await ratingService.getPatientRatings({ limit: 100 });
      if (response.data?.success) {
        const ratedIds = new Set(response.data.data.ratings.map(rating => rating.appointmentId._id));
        setRatedAppointments(ratedIds);
      }
    } catch (error) {
      console.error('Failed to fetch rated appointments:', error);
    }
  }, [user?._id]);

  useEffect(() => {
    if (user?._id) {
      queryClient.removeQueries(['patient-appointments']);
      fetchAppointmentsManually();
      fetchRatedAppointments();
      setTimeout(() => refetch(), 100);
    }
  }, [user?._id, queryClient, refetch, fetchAppointmentsManually, fetchRatedAppointments]);

  const appointments = appointmentsData?.data?.appointments || manualAppointments || [];
  const isActuallyLoading = isLoading || manualLoading;

  // Filter appointments
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const upcomingAppointments = appointments.filter(apt => {
    const appointmentDate = new Date(apt.appointmentDate);
    appointmentDate.setHours(0, 0, 0, 0);
    const isStatusOk = apt.status === 'confirmed' || apt.status === 'in_progress';
    const isDateOk = appointmentDate >= today;
    return isStatusOk && isDateOk;
  }).sort((a, b) => {
    const dateA = new Date(a.appointmentDate);
    const dateB = new Date(b.appointmentDate);
    if (dateA.getTime() === dateB.getTime()) {
      return a.appointmentTime.localeCompare(b.appointmentTime);
    }
    return dateA - dateB;
  });
  
  const pastAppointments = appointments.filter(apt => {
    const appointmentDate = new Date(apt.appointmentDate);
    appointmentDate.setHours(0, 0, 0, 0);
    return apt.status === 'completed' || 
           apt.status === 'cancelled' || 
           (appointmentDate < today && (apt.status === 'confirmed' || apt.status === 'in_progress'));
  }).sort((a, b) => {
    const dateA = new Date(a.appointmentDate);
    const dateB = new Date(b.appointmentDate);
    if (dateA.getTime() === dateB.getTime()) {
      return b.appointmentTime.localeCompare(a.appointmentTime);
    }
    return dateB - dateA;
  });

  const getStatusBadge = (status) => {
    switch (status) {
      case 'confirmed':
        return <span className="badge badge-info"><CheckCircleIcon className="w-3 h-3 mr-1" /> Confirmed</span>;
      case 'in_progress':
        return <span className="badge badge-warning"><ClockIcon className="w-3 h-3 mr-1" /> In Progress</span>;
      case 'completed':
        return <span className="badge badge-success"><CheckIcon className="w-3 h-3 mr-1" /> Completed</span>;
      case 'cancelled':
        return <span className="badge badge-danger"><XCircleIcon className="w-3 h-3 mr-1" /> Cancelled</span>;
      default:
        return <span className="badge bg-slate-100 text-slate-600 border border-slate-200">{status}</span>;
    }
  };

  const handleEmergencyCall = (callData) => {
    toast.success('Emergency call requested successfully!');
    navigate(`/emergency/${callData.callId}`);
  };

  useEffect(() => {
    if (socket && user?._id) {
      socket.emit('join-patient', user._id);
      socket.on('emergency-call-accepted', (data) => {
        toast.success(`Dr. ${data.doctor.name} accepted your emergency call!`);
        navigate(`/emergency/${data.callId}`);
      });
      return () => {
        socket.off('emergency-call-accepted');
      };
    }
  }, [socket, user?._id, navigate]);

  return (
    <div className="space-y-8 animate-slide-up">
      {/* Header & Emergency Button */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 mb-2">
            Welcome back, <span className="text-primary-600">{user?.firstName}</span>
          </h1>
          <p className="text-slate-600">
            Manage your appointments and healthcare journey
          </p>
        </div>
        <div className="flex-shrink-0">
          <EmergencyButton onEmergencyCall={handleEmergencyCall} />
        </div>
      </div>

      {/* Quick Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatsCard 
          icon={<CalendarDaysIcon className="w-6 h-6 text-primary-600" />}
          value={upcomingAppointments.length}
          label="Upcoming"
          color="primary"
        />
        <StatsCard 
          icon={<CheckCircleIcon className="w-6 h-6 text-success-600" />}
          value={pastAppointments.filter(apt => apt.status === 'completed').length}
          label="Completed"
          color="success"
        />
        <StatsCard 
          icon={<UserIcon className="w-6 h-6 text-warning-600" />}
          value={new Set(appointments.map(apt => apt.doctorId._id)).size}
          label="Doctors Visited"
          color="warning"
        />
        <Link
          to="/hospitals"
          className="bg-white rounded-2xl shadow-soft p-6 border border-slate-100 hover:shadow-lg hover:-translate-y-1 transition-all duration-300 group flex flex-col items-center justify-center text-center h-full min-h-[140px]"
        >
          <div className="w-12 h-12 bg-primary-50 rounded-xl flex items-center justify-center mb-3 group-hover:bg-primary-100 transition-colors">
            <PlusIcon className="w-6 h-6 text-primary-600" />
          </div>
          <p className="text-sm font-semibold text-primary-600">Book New Appointment</p>
        </Link>
      </div>

      {/* Main Content Area */}
      <div className="card overflow-hidden p-0">
        {/* Tabs Header */}
        <div className="border-b border-slate-100 bg-slate-50/50 px-6 py-4 flex flex-col sm:flex-row justify-between items-center gap-4">
          <div className="flex space-x-1 bg-slate-100 p-1 rounded-xl">
            <TabButton 
              active={activeTab === 'upcoming'} 
              onClick={() => setActiveTab('upcoming')}
              count={upcomingAppointments.length}
            >
              Upcoming
            </TabButton>
            <TabButton 
              active={activeTab === 'past'} 
              onClick={() => setActiveTab('past')}
              count={pastAppointments.length}
            >
              History
            </TabButton>
          </div>
          
          <div className="flex items-center space-x-2">
            <button
              onClick={() => {
                toast.loading('Refreshing...', { id: 'refresh' });
                queryClient.removeQueries(['patient-appointments']);
                fetchAppointmentsManually();
                refetch().then(() => toast.success('Updated!', { id: 'refresh' }));
              }}
              disabled={isActuallyLoading}
              className="p-2 text-slate-400 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-colors disabled:opacity-50"
              title="Refresh list"
            >
              <ArrowPathIcon className={`w-5 h-5 ${isActuallyLoading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>

        {/* Content Body */}
        <div className="p-6 min-h-[400px]">
          {error ? (
            <ErrorState onRetry={() => refetch()} />
          ) : isActuallyLoading ? (
            <div className="flex flex-col items-center justify-center py-20 text-slate-400">
              <div className="loading-spinner mb-4"></div>
              <p>Syncing your appointments...</p>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Debug Info (Optional - kept for now as per original) */}
              {/* <div className="text-xs text-slate-400 text-center mb-4">
                Last updated: {new Date().toLocaleTimeString()}
              </div> */}
              
              {(activeTab === 'upcoming' ? upcomingAppointments : pastAppointments).length === 0 ? (
                <EmptyState 
                  type={activeTab} 
                  onRefresh={() => {
                    queryClient.clear();
                    fetchAppointmentsManually();
                    refetch();
                  }} 
                />
              ) : (
                <div className="grid grid-cols-1 gap-4">
                  {(activeTab === 'upcoming' ? upcomingAppointments : pastAppointments).map((appointment) => (
                    <div key={appointment._id} className="group border border-slate-100 rounded-xl p-5 hover:border-primary-200 hover:shadow-md transition-all duration-200 bg-white">
                      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
                        <div className="flex items-start gap-4">
                          <div className="w-12 h-12 bg-primary-50 rounded-full flex items-center justify-center flex-shrink-0 text-primary-600 font-bold text-lg">
                            {appointment.doctorId.firstName[0]}{appointment.doctorId.lastName[0]}
                          </div>
                          <div>
                            <h3 className="text-lg font-bold text-slate-900 group-hover:text-primary-600 transition-colors">
                              Dr. {appointment.doctorId.firstName} {appointment.doctorId.lastName}
                            </h3>
                            <p className="text-sm text-slate-500 font-medium">
                              {appointment.doctorId.doctorInfo?.specialization}
                            </p>
                          </div>
                        </div>
                        <div className="flex flex-col items-end gap-2">
                          {getStatusBadge(appointment.status)}
                          <span className="text-xs text-slate-400 font-medium">
                            ID: {appointment._id.slice(-6).toUpperCase()}
                          </span>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4 bg-slate-50 rounded-lg p-3 border border-slate-100">
                        <div className="flex items-center text-sm text-slate-600">
                          <CalendarDaysIcon className="w-4 h-4 mr-2 text-slate-400" />
                          <span className="font-medium">
                            {format(parseISO(appointment.appointmentDate), 'MMM dd, yyyy')}
                          </span>
                          {isToday(appointment.appointmentDate) && (
                            <span className="ml-2 px-1.5 py-0.5 bg-blue-100 text-blue-700 text-[10px] font-bold uppercase rounded">Today</span>
                          )}
                        </div>
                        <div className="flex items-center text-sm text-slate-600">
                          <ClockIcon className="w-4 h-4 mr-2 text-slate-400" />
                          <span className="font-medium">{appointment.appointmentTime}</span>
                        </div>
                        <div className="flex items-center text-sm text-slate-600">
                          <MapPinIcon className="w-4 h-4 mr-2 text-slate-400" />
                          <span className="truncate">{appointment.hospitalId.name}</span>
                        </div>
                      </div>

                      {appointment.status === 'confirmed' && (
                        <div className="bg-blue-50/50 border border-blue-100 rounded-lg p-3 mb-4 flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="bg-blue-100 p-2 rounded-lg text-blue-600">
                              <BoltIcon className="w-5 h-5" />
                            </div>
                            <div>
                              <p className="text-sm font-bold text-blue-900">Token #{appointment.tokenNumber}</p>
                              <p className="text-xs text-blue-700">Est. wait: {appointment.estimatedWaitTime} mins</p>
                            </div>
                          </div>
                          <Link 
                            to={`/hospitals/${appointment.hospitalId._id}`}
                            className="text-xs font-semibold text-blue-600 hover:text-blue-800 hover:underline"
                          >
                            View Hospital
                          </Link>
                        </div>
                      )}

                      <div className="flex items-center justify-between pt-2 border-t border-slate-50">
                        <div className="text-xs text-slate-500">
                          <span className="font-semibold">Reason:</span> {appointment.patientDetails?.symptoms || 'General Checkup'}
                        </div>
                        
                        <div className="flex gap-3">
                          {appointment.status === 'completed' && !ratedAppointments.has(appointment._id) && (
                            <Link
                              to={`/rate-appointment/${appointment._id}`}
                              className="text-sm font-medium text-warning-600 hover:text-warning-700 flex items-center gap-1"
                            >
                              <StarIcon className="w-4 h-4" />
                              Rate Visit
                            </Link>
                          )}
                          {appointment.status === 'completed' && ratedAppointments.has(appointment._id) && (
                            <span className="text-sm font-medium text-slate-400 flex items-center gap-1">
                              <StarIcon className="w-4 h-4 fill-current" />
                              Rated
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// Helper Components
const StatsCard = ({ icon, value, label, color }) => {
  const colorMap = {
    primary: 'bg-primary-50 text-primary-600',
    success: 'bg-success-50 text-success-600',
    warning: 'bg-warning-50 text-warning-600',
  };
  
  return (
    <div className="bg-white rounded-2xl shadow-soft p-6 border border-slate-100 hover:shadow-lg transition-all duration-300">
      <div className="flex items-center gap-4">
        <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${colorMap[color]}`}>
          {icon}
        </div>
        <div>
          <p className="text-2xl font-bold text-slate-900">{value}</p>
          <p className="text-sm font-medium text-slate-500">{label}</p>
        </div>
      </div>
    </div>
  );
};

const TabButton = ({ active, children, onClick, count }) => (
  <button
    onClick={onClick}
    className={`px-6 py-2 rounded-lg text-sm font-semibold transition-all duration-200 flex items-center gap-2 ${
      active
        ? 'bg-white text-primary-600 shadow-sm'
        : 'text-slate-500 hover:text-slate-700 hover:bg-slate-200/50'
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

const EmptyState = ({ type, onRefresh }) => (
  <div className="text-center py-12">
    <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-6">
      <CalendarDaysIcon className="w-10 h-10 text-slate-300" />
    </div>
    <h3 className="text-lg font-bold text-slate-900 mb-2">
      {type === 'upcoming' ? 'No Upcoming Appointments' : 'No Past History'}
    </h3>
    <p className="text-slate-500 max-w-sm mx-auto mb-8">
      {type === 'upcoming' 
        ? "You don't have any appointments scheduled at the moment. Need to see a doctor?"
        : "You haven't completed any appointments yet."
      }
    </p>
    {type === 'upcoming' && (
      <div className="flex justify-center gap-3">
        <button 
          onClick={onRefresh}
          className="px-4 py-2 bg-slate-100 text-slate-700 rounded-xl hover:bg-slate-200 font-medium text-sm transition-colors"
        >
          Refresh List
        </button>
        <Link to="/hospitals" className="btn-primary">
          Book Appointment
        </Link>
      </div>
    )}
  </div>
);

const ErrorState = ({ onRetry }) => (
  <div className="text-center py-12">
    <ExclamationTriangleIcon className="w-12 h-12 text-danger-400 mx-auto mb-4" />
    <h3 className="text-lg font-bold text-slate-900 mb-2">Failed to load appointments</h3>
    <p className="text-slate-500 mb-6">We couldn't sync your data. Please check your connection.</p>
    <button onClick={onRetry} className="btn-primary">
      Try Again
    </button>
  </div>
);

// Helper function to check if date is today
const isToday = (dateString) => {
  const date = new Date(dateString);
  const today = new Date();
  return date.getDate() === today.getDate() &&
    date.getMonth() === today.getMonth() &&
    date.getFullYear() === today.getFullYear();
};

const CheckIcon = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className={className}>
    <path fillRule="evenodd" d="M2.25 12c0-5.385 4.365-9.75 9.75-9.75s9.75 4.365 9.75 9.75-4.365 9.75-9.75 9.75S2.25 17.385 2.25 12zm13.36-1.814a.75.75 0 10-1.22-.872l-3.236 4.53L9.53 12.22a.75.75 0 00-1.06 1.06l2.25 2.25a.75.75 0 001.14-.094l3.75-5.25z" clipRule="evenodd" />
  </svg>
);

export default PatientDashboard;
