/**
 * Rate Appointment Page
 * Page for patients to rate their completed appointments
 */

import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { appointmentService } from '../../services/appointmentService';
import RatingForm from '../../components/rating/RatingForm';
import toast from 'react-hot-toast';
import {
  ArrowLeftIcon,
  ClockIcon,
  CalendarDaysIcon,
  UserIcon,
  BuildingOfficeIcon
} from '@heroicons/react/24/outline';

const RateAppointment = () => {
  const { appointmentId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [appointment, setAppointment] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchAppointment = useCallback(async () => {
    try {
      setLoading(true);
      const response = await appointmentService.getAppointmentById(appointmentId);
      
      if (response.data.success) {
        const appointmentData = response.data.data.appointment;
        
        // Verify this is the patient's appointment and it's completed
        if (appointmentData.patientId._id !== user._id) {
          setError('You are not authorized to rate this appointment');
          return;
        }
        
        if (appointmentData.status !== 'completed') {
          setError('Only completed appointments can be rated');
          return;
        }
        
        setAppointment(appointmentData);
      } else {
        setError('Appointment not found');
      }
    } catch (error) {
      console.error('Error fetching appointment:', error);
      setError('Failed to load appointment details');
    } finally {
      setLoading(false);
    }
  }, [appointmentId, user._id]);

  useEffect(() => {
    if (appointmentId) {
      fetchAppointment();
    } else {
      setError('No appointment ID provided');
      setLoading(false);
    }
  }, [appointmentId, fetchAppointment]);

  const handleRatingSubmit = () => {
    toast.success('Thank you for your feedback!');
    navigate('/dashboard');
  };

  const handleCancel = () => {
    navigate('/dashboard');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading appointment details...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="bg-red-100 rounded-full p-3 mx-auto mb-4 w-16 h-16 flex items-center justify-center">
            <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Unable to Load Appointment</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={() => navigate('/dashboard')}
            className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            <ArrowLeftIcon className="w-4 h-4 mr-2" />
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => navigate('/dashboard')}
            className="inline-flex items-center text-blue-600 hover:text-blue-700 mb-4"
          >
            <ArrowLeftIcon className="w-4 h-4 mr-2" />
            Back to Dashboard
          </button>
          
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">Rate Your Appointment</h1>
            
            {/* Appointment Summary */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="flex items-center space-x-3">
                <div className="flex-shrink-0">
                  <BuildingOfficeIcon className="w-8 h-8 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900">Hospital</p>
                  <p className="text-sm text-gray-600">{appointment.hospitalId.name}</p>
                </div>
              </div>
              
              <div className="flex items-center space-x-3">
                <div className="flex-shrink-0">
                  <UserIcon className="w-8 h-8 text-green-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900">Doctor</p>
                  <p className="text-sm text-gray-600">
                    Dr. {appointment.doctorId.firstName} {appointment.doctorId.lastName}
                  </p>
                  {appointment.doctorId.doctorInfo?.specialization && (
                    <p className="text-xs text-gray-500">
                      {appointment.doctorId.doctorInfo.specialization}
                    </p>
                  )}
                </div>
              </div>
              
              <div className="flex items-center space-x-3">
                <div className="flex-shrink-0">
                  <CalendarDaysIcon className="w-8 h-8 text-purple-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900">Appointment</p>
                  <p className="text-sm text-gray-600">
                    {new Date(appointment.appointmentDate).toLocaleDateString()}
                  </p>
                  <p className="text-xs text-gray-500 flex items-center">
                    <ClockIcon className="w-3 h-3 mr-1" />
                    {appointment.appointmentTime}
                  </p>
                </div>
              </div>
            </div>
            
            {/* Appointment Details */}
            {appointment.patientDetails && (
              <div className="mt-6 pt-6 border-t border-gray-200">
                <h3 className="text-sm font-medium text-gray-900 mb-2">Appointment Details</h3>
                <div className="bg-gray-50 rounded-lg p-4">
                  {appointment.patientDetails.symptoms && (
                    <div className="mb-2">
                      <span className="text-sm font-medium text-gray-700">Symptoms: </span>
                      <span className="text-sm text-gray-600">{appointment.patientDetails.symptoms}</span>
                    </div>
                  )}
                  {appointment.patientDetails.urgency && (
                    <div className="mb-2">
                      <span className="text-sm font-medium text-gray-700">Urgency: </span>
                      <span className={`text-sm capitalize ${
                        appointment.patientDetails.urgency === 'high' ? 'text-red-600' :
                        appointment.patientDetails.urgency === 'medium' ? 'text-yellow-600' :
                        'text-green-600'
                      }`}>
                        {appointment.patientDetails.urgency}
                      </span>
                    </div>
                  )}
                  <div>
                    <span className="text-sm font-medium text-gray-700">Consultation Fee: </span>
                    <span className="text-sm text-gray-600">₹{appointment.consultationFee}</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Rating Form */}
        <RatingForm
          appointment={appointment}
          onSubmit={handleRatingSubmit}
          onCancel={handleCancel}
        />
      </div>
    </div>
  );
};

export default RateAppointment;