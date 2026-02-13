/**
 * Hospital Details Page Component
 * Comprehensive hospital information with booking functionality
 */

import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQueryClient } from 'react-query';
import { useAuth } from '../../context/AuthContext';
import { hospitalService } from '../../services/hospitalService';
import { appointmentService } from '../../services/appointmentService';
import RatingDisplay from '../../components/rating/RatingDisplay';
import toast from 'react-hot-toast';
import {
  MapPinIcon,
  PhoneIcon,
  EnvelopeIcon,
  StarIcon,
  ClockIcon,
  UsersIcon,
  BuildingOfficeIcon,
  UserIcon,
  HeartIcon,
  CheckCircleIcon,
  XCircleIcon,
  ArrowPathIcon,
  CalendarIcon,
  InformationCircleIcon
} from '@heroicons/react/24/outline';
import { StarIcon as StarIconSolid } from '@heroicons/react/24/solid';

const HospitalDetails = () => {
  const { hospitalId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  
  const [hospital, setHospital] = useState(null);
  const [doctors, setDoctors] = useState([]);
  const [ratings, setRatings] = useState({ summary: {}, reviews: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('overview');
  const [selectedDoctor, setSelectedDoctor] = useState(null);
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [bookingData, setBookingData] = useState({
    appointmentDate: '',
    appointmentTime: '',
    symptoms: '',
    urgency: 'medium',
    notes: ''
  });
  const [bookingLoading, setBookingLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    if (hospitalId) {
      fetchHospitalDetails();
    }
  }, [hospitalId]);

  // Auto-refresh stats every 30 seconds when on overview tab
  useEffect(() => {
    let interval;
    if (activeTab === 'overview' && hospital) {
      interval = setInterval(() => {
        fetchHospitalDetails(true);
      }, 30000); // 30 seconds
    }
    
    return () => {
      if (interval) {
        clearInterval(interval);
      }
    };
  }, [activeTab, hospital, hospitalId]);

  const fetchHospitalDetails = async (showRefreshIndicator = false) => {
    try {
      if (showRefreshIndicator) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }
      setError(null);

      // Fetch hospital details, doctors, and ratings in parallel
      const [hospitalResponse, doctorsResponse, ratingsResponse] = await Promise.all([
        hospitalService.getHospitalById(hospitalId),
        hospitalService.getDoctorsByHospital(hospitalId),
        fetch(`http://localhost:5000/api/ratings/hospital/${hospitalId}`)
          .then(res => res.json())
          .catch(() => ({ success: false, data: { summary: {}, reviews: [] } }))
      ]);

      if (hospitalResponse.data?.success) {
        setHospital(hospitalResponse.data.data.hospital);
      }

      if (doctorsResponse.data?.success) {
        setDoctors(doctorsResponse.data.data.doctors || []);
      }

      if (ratingsResponse.success) {
        setRatings(ratingsResponse.data);
      }

    } catch (err) {
      console.error('Error fetching hospital details:', err);
      setError('Failed to load hospital details');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleBookAppointment = (doctor) => {
    if (!user) {
      navigate('/login');
      return;
    }
    
    if (user.role !== 'patient') {
      toast.error('Only patients can book appointments');
      return;
    }

    // Validate hospital and doctor data
    if (!hospital || !hospital._id) {
      toast.error('Hospital information not loaded. Please refresh the page.');
      return;
    }

    if (!doctor || !doctor._id) {
      toast.error('Doctor information not available. Please try again.');
      return;
    }

    console.log('🔍 Opening booking modal for:', {
      hospital: { id: hospital._id, name: hospital.name },
      doctor: { id: doctor._id, name: `${doctor.firstName} ${doctor.lastName}` }
    });

    setSelectedDoctor(doctor);
    setShowBookingModal(true);
  };

  const handleBookingSubmit = async (e) => {
    e.preventDefault();
    
    if (!selectedDoctor || !bookingData.appointmentDate || !bookingData.appointmentTime || !bookingData.symptoms) {
      alert('Please fill in all required fields');
      return;
    }

    // Prepare appointment payload outside try block for error logging
    const appointmentPayload = {
      hospitalId: hospital._id,
      doctorId: selectedDoctor._id,
      appointmentDate: bookingData.appointmentDate,
      appointmentTime: bookingData.appointmentTime,
      patientDetails: {
        symptoms: bookingData.symptoms,
        urgency: bookingData.urgency,
        notes: bookingData.notes
      }
    };

    try {
      setBookingLoading(true);

      const response = await appointmentService.bookAppointment(appointmentPayload);

      if (response.data?.success) {
        toast.success('Appointment booked successfully! 🎉');
        setShowBookingModal(false);
        setBookingData({ appointmentDate: '', appointmentTime: '', symptoms: '', urgency: 'medium', notes: '' });
        setSelectedDoctor(null);
        
        // Invalidate and refetch patient appointments cache
        queryClient.invalidateQueries(['patient-appointments']);
        
        // Refresh hospital data to update queue count
        fetchHospitalDetails();
        
        // Show success message with navigation option
        toast.success('Redirecting to your dashboard...', {
          duration: 2000,
          icon: '📋'
        });
        
        // Navigate to patient dashboard to see the new appointment
        if (user?.role === 'patient') {
          setTimeout(() => {
            navigate('/dashboard/patient');
          }, 2000);
        }
      }
    } catch (err) {
      console.error('❌ Error booking appointment:', err);
      
      // Provide detailed error information
      let errorMessage = 'Failed to book appointment';
      
      if (err.response?.data?.message) {
        errorMessage = err.response.data.message;
        
        // Show suggested times if available
        if (err.response.data.data?.suggestedTimes) {
          const suggestedTimes = err.response.data.data.suggestedTimes;
          if (suggestedTimes.length > 0) {
            const timeOptions = suggestedTimes.map(time => {
              const [hours, minutes] = time.split(':');
              const hour12 = hours > 12 ? hours - 12 : hours;
              const ampm = hours >= 12 ? 'PM' : 'AM';
              return `${hour12}:${minutes} ${ampm}`;
            }).join(', ');
            
            toast.error(`${errorMessage}\n\nSuggested available times: ${timeOptions}`, {
              duration: 8000,
              style: {
                maxWidth: '500px'
              }
            });
          } else {
            toast.error(errorMessage);
          }
        } else {
          toast.error(errorMessage);
        }
      } else if (err.response?.data?.errors) {
        const validationErrors = err.response.data.errors.map(error => error.msg).join(', ');
        errorMessage = `Validation errors: ${validationErrors}`;
        toast.error(errorMessage);
      } else if (err.message) {
        errorMessage = err.message;
        toast.error(errorMessage);
      } else {
        toast.error(errorMessage);
      }
    } finally {
      setBookingLoading(false);
    }
  };

  const renderStars = (rating, size = 'w-4 h-4') => {
    const stars = [];
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 !== 0;

    for (let i = 0; i < 5; i++) {
      if (i < fullStars) {
        stars.push(
          <StarIconSolid key={i} className={`${size} text-amber-400`} />
        );
      } else if (i === fullStars && hasHalfStar) {
        stars.push(
          <div key={i} className="relative">
            <StarIcon className={`${size} text-slate-200`} />
            <div className="absolute inset-0 overflow-hidden w-1/2">
              <StarIconSolid className={`${size} text-amber-400`} />
            </div>
          </div>
        );
      } else {
        stars.push(
          <StarIcon key={i} className={`${size} text-slate-200`} />
        );
      }
    }
    return stars;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="flex flex-col items-center">
          <div className="w-12 h-12 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin mb-4"></div>
          <span className="text-slate-500 font-medium animate-pulse">Loading hospital details...</span>
        </div>
      </div>
    );
  }

  if (error || !hospital) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="text-center bg-white rounded-2xl shadow-soft p-8 max-w-md w-full border border-slate-100">
          <div className="w-16 h-16 bg-red-50 text-red-500 rounded-full flex items-center justify-center mx-auto mb-4">
            <BuildingOfficeIcon className="w-8 h-8" />
          </div>
          <h3 className="text-xl font-bold text-slate-900 mb-2">{error || 'Hospital not found'}</h3>
          <p className="text-slate-500 mb-6">The hospital you are looking for might have been removed or is temporarily unavailable.</p>
          <button 
            onClick={() => navigate('/hospitals')}
            className="w-full py-3 bg-slate-900 text-white rounded-xl hover:bg-slate-800 transition-colors font-medium"
          >
            Back to Hospitals
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 pb-12">
      {/* Hero Header */}
      <div className="bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12">
          <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-8">
            <div className="flex-1">
              <div className="flex items-start gap-4 mb-6">
                <div className="w-16 h-16 bg-primary-50 rounded-2xl flex items-center justify-center flex-shrink-0 text-primary-600">
                  <BuildingOfficeIcon className="w-10 h-10" />
                </div>
                <div>
                  <h1 className="text-3xl md:text-4xl font-bold text-slate-900 mb-2">{hospital.name}</h1>
                  <div className="flex items-center gap-2 text-slate-500">
                    <MapPinIcon className="h-5 w-5 flex-shrink-0" />
                    <span>
                      {hospital.address?.street}, {hospital.address?.city}, {hospital.address?.state} - {hospital.address?.pincode}
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex flex-wrap gap-4 md:gap-8">
                <div className="flex items-center gap-3 bg-slate-50 px-4 py-2 rounded-xl border border-slate-100">
                  <PhoneIcon className="h-5 w-5 text-slate-400" />
                  <span className="text-sm font-medium text-slate-700">{hospital.phone}</span>
                </div>
                <div className="flex items-center gap-3 bg-slate-50 px-4 py-2 rounded-xl border border-slate-100">
                  <EnvelopeIcon className="h-5 w-5 text-slate-400" />
                  <span className="text-sm font-medium text-slate-700">{hospital.email}</span>
                </div>
                <div className="flex items-center gap-3 bg-slate-50 px-4 py-2 rounded-xl border border-slate-100">
                  <ClockIcon className="h-5 w-5 text-slate-400" />
                  <span className="text-sm font-medium text-slate-700">
                    {hospital.operatingHours?.weekdays?.open} - {hospital.operatingHours?.weekdays?.close}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex-shrink-0">
              <div className="bg-white rounded-2xl p-6 shadow-soft border border-slate-100 text-center min-w-[240px]">
                <div className="flex items-center justify-center gap-2 mb-2">
                  <span className="text-4xl font-bold text-slate-900">{hospital.stats?.averageRating?.toFixed(1) || '0.0'}</span>
                  <div className="flex flex-col items-start">
                    <div className="flex">
                      {renderStars(hospital.stats?.averageRating || 0, 'w-4 h-4')}
                    </div>
                    <span className="text-xs text-slate-400 mt-1">{hospital.stats?.totalRatings || 0} reviews</span>
                  </div>
                </div>
                
                <div className="h-px bg-slate-100 my-4" />
                
                <div className="flex items-center justify-center gap-3">
                  <div className={`w-3 h-3 rounded-full animate-pulse ${
                    hospital.currentQueueCount < 10 ? 'bg-emerald-500' : hospital.currentQueueCount < 20 ? 'bg-amber-500' : 'bg-rose-500'
                  }`} />
                  <span className="text-sm font-bold text-slate-700">
                    {hospital.currentQueueCount || 0} patients in queue
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-px">
        {/* Navigation Tabs */}
        <div className="border-b border-slate-200 mb-8">
          <nav className="flex space-x-8" aria-label="Tabs">
            {[
              { id: 'overview', label: 'Overview' },
              { id: 'doctors', label: `Doctors (${doctors.length})` },
              { id: 'facilities', label: 'Facilities' },
              { id: 'reviews', label: `Reviews (${ratings.summary.totalReviews || 0})` }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`py-4 px-1 border-b-2 font-medium text-sm transition-all ${
                  activeTab === tab.id
                    ? 'border-primary-500 text-primary-600'
                    : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </nav>
        </div>

        {/* Tab Content */}
        {activeTab === 'overview' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Left Column: Hospital Info */}
            <div className="lg:col-span-2 space-y-8">
              {/* Info Card */}
              <div className="bg-white rounded-2xl shadow-soft border border-slate-100 p-6 md:p-8">
                <h2 className="text-xl font-bold text-slate-900 mb-6">Hospital Information</h2>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-8">
                  <div className="p-4 bg-slate-50 rounded-xl">
                    <span className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Type</span>
                    <p className="font-semibold text-slate-900 capitalize">{hospital.type?.replace('_', ' ')}</p>
                  </div>
                  <div className="p-4 bg-slate-50 rounded-xl">
                    <span className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Category</span>
                    <p className="font-semibold text-slate-900 capitalize">{hospital.category?.replace('_', ' ')}</p>
                  </div>
                  <div className="p-4 bg-slate-50 rounded-xl">
                    <span className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Total Beds</span>
                    <p className="font-semibold text-slate-900">{hospital.totalBeds}</p>
                  </div>
                  <div className="p-4 bg-emerald-50 rounded-xl">
                    <span className="block text-xs font-bold text-emerald-600 uppercase tracking-wider mb-1">Available</span>
                    <p className="font-semibold text-emerald-900">{hospital.availableBeds || hospital.totalBeds}</p>
                  </div>
                </div>
                {hospital.description && (
                  <div>
                    <h3 className="text-sm font-bold text-slate-900 mb-2">About</h3>
                    <p className="text-slate-600 leading-relaxed">{hospital.description}</p>
                  </div>
                )}
              </div>

              {/* Departments */}
              {hospital.departments && hospital.departments.length > 0 && (
                <div className="bg-white rounded-2xl shadow-soft border border-slate-100 p-6 md:p-8">
                  <h2 className="text-xl font-bold text-slate-900 mb-6">Departments</h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {hospital.departments.map((dept, index) => (
                      <div key={index} className="p-4 rounded-xl border border-slate-100 hover:border-primary-100 hover:bg-primary-50/30 transition-colors">
                        <h3 className="font-bold text-slate-900 mb-1">{dept.name}</h3>
                        {dept.description && (
                          <p className="text-sm text-slate-500 line-clamp-2">{dept.description}</p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Right Column: Stats & Hours */}
            <div className="space-y-8">
              {/* Quick Stats */}
              <div className="bg-white rounded-2xl shadow-soft border border-slate-100 p-6">
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-lg font-bold text-slate-900">Live Statistics</h2>
                  <button
                    onClick={() => fetchHospitalDetails(true)}
                    disabled={refreshing}
                    className="p-2 text-slate-400 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-all disabled:opacity-50"
                    title="Refresh stats"
                  >
                    <ArrowPathIcon className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
                  </button>
                </div>
                <div className="space-y-4">
                  <div className="flex justify-between items-center p-3 bg-slate-50 rounded-xl">
                    <span className="text-sm font-medium text-slate-600">Total Appointments</span>
                    <span className="font-bold text-slate-900">{hospital.stats?.totalAppointments || 0}</span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-slate-50 rounded-xl">
                    <span className="text-sm font-medium text-slate-600">Completed</span>
                    <span className="font-bold text-slate-900">{hospital.stats?.completedAppointments || 0}</span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-slate-50 rounded-xl">
                    <span className="text-sm font-medium text-slate-600">Current Queue</span>
                    <span className="font-bold text-slate-900">{hospital.currentQueueCount || 0}</span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-slate-50 rounded-xl">
                    <span className="text-sm font-medium text-slate-600">Available Doctors</span>
                    <span className="font-bold text-slate-900">{doctors.length}</span>
                  </div>
                </div>
              </div>

              {/* Operating Hours */}
              <div className="bg-white rounded-2xl shadow-soft border border-slate-100 p-6">
                <h2 className="text-lg font-bold text-slate-900 mb-6">Operating Hours</h2>
                <div className="space-y-4">
                  <div className="flex justify-between items-center border-b border-slate-50 pb-3">
                    <span className="text-sm font-medium text-slate-600">Weekdays</span>
                    <span className="text-sm font-bold text-slate-900">
                      {hospital.operatingHours?.weekdays?.open} - {hospital.operatingHours?.weekdays?.close}
                    </span>
                  </div>
                  <div className="flex justify-between items-center border-b border-slate-50 pb-3">
                    <span className="text-sm font-medium text-slate-600">Weekends</span>
                    <span className="text-sm font-bold text-slate-900">
                      {hospital.operatingHours?.weekends?.open} - {hospital.operatingHours?.weekends?.close}
                    </span>
                  </div>
                  {hospital.operatingHours?.emergency24x7 && (
                    <div className="flex items-center justify-center p-3 bg-red-50 text-red-700 rounded-xl mt-4 border border-red-100">
                      <HeartIcon className="h-5 w-5 mr-2 animate-pulse" />
                      <span className="text-sm font-bold">24/7 Emergency Services</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'doctors' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-bold text-slate-900">Available Doctors</h2>
              <span className="text-sm font-medium text-slate-500 bg-slate-100 px-3 py-1 rounded-full">{doctors.length} specialists</span>
            </div>
            
            {doctors.length === 0 ? (
              <div className="bg-white rounded-2xl shadow-soft border border-slate-100 p-12 text-center">
                <UserIcon className="h-16 w-16 text-slate-300 mx-auto mb-4" />
                <h3 className="text-lg font-bold text-slate-900 mb-2">No doctors found</h3>
                <p className="text-slate-500">There are currently no doctors listed for this hospital.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {doctors.map((doctor) => (
                  <div key={doctor._id} className="bg-white rounded-2xl shadow-soft border border-slate-100 p-6 hover:shadow-lg transition-all duration-300 hover:-translate-y-1 group">
                    <div className="flex items-start justify-between mb-4">
                      <div className="w-16 h-16 bg-primary-50 rounded-2xl flex items-center justify-center text-2xl font-bold text-primary-600 group-hover:bg-primary-600 group-hover:text-white transition-colors">
                        {doctor.firstName.charAt(0)}{doctor.lastName.charAt(0)}
                      </div>
                      <div className="bg-green-50 text-green-700 text-xs font-bold px-2 py-1 rounded-lg border border-green-100 uppercase tracking-wider">
                        Available
                      </div>
                    </div>
                    
                    <h3 className="text-lg font-bold text-slate-900 mb-1">Dr. {doctor.firstName} {doctor.lastName}</h3>
                    <p className="text-sm font-medium text-primary-600 mb-4">{doctor.specialization}</p>
                    
                    <div className="space-y-3 mb-6">
                      <div className="flex items-center text-sm text-slate-500">
                        <UserIcon className="h-4 w-4 mr-2" />
                        <span>{doctor.experience} years experience</span>
                      </div>
                      <div className="flex items-center text-sm text-slate-500">
                        <ClockIcon className="h-4 w-4 mr-2" />
                        <span>Available Today</span>
                      </div>
                    </div>

                    <button
                      onClick={() => handleBookAppointment(doctor)}
                      className="w-full py-3 bg-white border border-slate-200 text-slate-700 font-bold rounded-xl hover:bg-slate-900 hover:text-white hover:border-slate-900 transition-all duration-300"
                    >
                      Book Appointment
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Placeholder for Facilities Tab */}
        {activeTab === 'facilities' && (
          <div className="bg-white rounded-2xl shadow-soft border border-slate-100 p-12 text-center">
            <BuildingOfficeIcon className="h-16 w-16 text-slate-300 mx-auto mb-4" />
            <h3 className="text-lg font-bold text-slate-900 mb-2">Facilities Information</h3>
            <p className="text-slate-500">Detailed facilities information will be available soon.</p>
          </div>
        )}

        {/* Reviews Tab */}
        {activeTab === 'reviews' && (
          <div className="space-y-8">
            <div className="bg-white rounded-2xl shadow-soft border border-slate-100 p-6 md:p-8">
              <RatingDisplay 
                ratings={ratings} 
                title="Patient Reviews" 
                type="hospital" 
              />
            </div>
          </div>
        )}
      </div>

      {/* Booking Modal */}
      {showBookingModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
            {/* Backdrop */}
            <div 
              className="fixed inset-0 transition-opacity bg-slate-900/60 backdrop-blur-sm" 
              onClick={() => setShowBookingModal(false)}
            />

            {/* Modal Content */}
            <div className="inline-block align-bottom bg-white rounded-2xl text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg w-full border border-slate-100">
              <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                <div className="sm:flex sm:items-start">
                  <div className="w-full">
                    <div className="flex justify-between items-center mb-6">
                      <h3 className="text-xl font-bold text-slate-900">
                        Book Appointment
                      </h3>
                      <button 
                        onClick={() => setShowBookingModal(false)}
                        className="text-slate-400 hover:text-slate-600 transition-colors"
                      >
                        <XCircleIcon className="h-6 w-6" />
                      </button>
                    </div>
                    
                    <div className="bg-primary-50 rounded-xl p-4 mb-6 border border-primary-100">
                      <div className="flex items-center gap-3 mb-2">
                        <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center text-primary-600 font-bold shadow-sm">
                          Dr
                        </div>
                        <div>
                          <p className="font-bold text-slate-900">Dr. {selectedDoctor?.firstName} {selectedDoctor?.lastName}</p>
                          <p className="text-xs text-primary-700 font-medium uppercase tracking-wide">{selectedDoctor?.specialization}</p>
                        </div>
                      </div>
                    </div>

                    <form onSubmit={handleBookingSubmit} className="space-y-5">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-slate-700 mb-1">Date</label>
                          <div className="relative">
                            <CalendarIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                            <input
                              type="date"
                              required
                              min={new Date().toISOString().split('T')[0]}
                              value={bookingData.appointmentDate}
                              onChange={(e) => setBookingData({ ...bookingData, appointmentDate: e.target.value })}
                              className="w-full pl-10 p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
                            />
                          </div>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-slate-700 mb-1">Time</label>
                          <div className="relative">
                            <ClockIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                            <input
                              type="time"
                              required
                              value={bookingData.appointmentTime}
                              onChange={(e) => setBookingData({ ...bookingData, appointmentTime: e.target.value })}
                              className="w-full pl-10 p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
                            />
                          </div>
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Urgency Level</label>
                        <div className="grid grid-cols-3 gap-3">
                          {['low', 'medium', 'high'].map((level) => (
                            <button
                              key={level}
                              type="button"
                              onClick={() => setBookingData({ ...bookingData, urgency: level })}
                              className={`py-2 px-3 rounded-lg text-sm font-bold capitalize transition-all border ${
                                bookingData.urgency === level
                                  ? level === 'high' 
                                    ? 'bg-red-50 text-red-700 border-red-200 ring-1 ring-red-200'
                                    : level === 'medium'
                                      ? 'bg-amber-50 text-amber-700 border-amber-200 ring-1 ring-amber-200'
                                      : 'bg-green-50 text-green-700 border-green-200 ring-1 ring-green-200'
                                  : 'bg-white text-slate-500 border-slate-200 hover:bg-slate-50'
                              }`}
                            >
                              {level}
                            </button>
                          ))}
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Symptoms</label>
                        <textarea
                          required
                          rows="3"
                          placeholder="Briefly describe your symptoms..."
                          value={bookingData.symptoms}
                          onChange={(e) => setBookingData({ ...bookingData, symptoms: e.target.value })}
                          className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
                        />
                      </div>

                      <div className="pt-2">
                        <button
                          type="submit"
                          disabled={bookingLoading}
                          className="w-full py-3.5 bg-gradient-to-r from-primary-600 to-primary-500 text-white rounded-xl font-bold shadow-lg shadow-primary-500/30 hover:shadow-primary-500/40 hover:-translate-y-0.5 transition-all disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                        >
                          {bookingLoading ? (
                            <>
                              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                              <span>Processing...</span>
                            </>
                          ) : (
                            <>
                              <CheckCircleIcon className="w-5 h-5" />
                              <span>Confirm Appointment</span>
                            </>
                          )}
                        </button>
                      </div>
                    </form>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default HospitalDetails;
