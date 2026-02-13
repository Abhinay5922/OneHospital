/**
 * Register Page Component
 * User registration form with role selection
 */

import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { useAuth } from '../../context/AuthContext';
import { hospitalService } from '../../services/hospitalService';
import { EyeIcon, EyeSlashIcon } from '@heroicons/react/24/outline';

// Hospital Selector Component
const HospitalSelector = ({ register, errors }) => {
  const [hospitals, setHospitals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchHospitals = async () => {
      try {
        console.log('🏥 Fetching hospitals for doctor registration...');
        const response = await hospitalService.getHospitals();
        console.log('Hospital API response:', response.data);
        
        if (response.data?.success && response.data.data?.hospitals) {
          const hospitalList = response.data.data.hospitals;
          setHospitals(hospitalList);
          console.log(`✅ Loaded ${hospitalList.length} hospitals:`, hospitalList.map(h => h.name));
        } else {
          console.error('❌ Invalid response structure:', response.data);
          setError('Invalid response from server');
        }
      } catch (error) {
        console.error('❌ Error fetching hospitals:', error);
        setError(error.response?.data?.message || error.message || 'Failed to fetch hospitals');
      } finally {
        setLoading(false);
      }
    };

    fetchHospitals();
  }, []);

  if (loading) {
    return (
      <div className="mt-1">
        <div className="input-field flex items-center">
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-600 mr-2"></div>
          Loading hospitals...
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="mt-1">
        <div className="input-field bg-red-50 border-red-200 text-red-700">
          Error: {error}
        </div>
        <p className="mt-1 text-sm text-red-600">
          Please contact admin or try again later.
        </p>
      </div>
    );
  }

  return (
    <div>
      <select
        {...register('hospitalId', {
          required: 'Please select a hospital'
        })}
        className="input-field mt-1"
      >
        <option value="">Select Hospital</option>
        {hospitals.map((hospital) => (
          <option key={hospital._id} value={hospital._id}>
            {hospital.name} - {hospital.address?.city}, {hospital.address?.state}
          </option>
        ))}
      </select>
      {errors.hospitalId && (
        <p className="mt-1 text-sm text-red-600">{errors.hospitalId.message}</p>
      )}
      {hospitals.length === 0 && !loading && !error && (
        <p className="mt-1 text-sm text-yellow-600">
          No approved hospitals found. Please contact admin.
        </p>
      )}
      {hospitals.length > 0 && (
        <p className="mt-1 text-sm text-green-600">
          ✅ {hospitals.length} hospital(s) available
        </p>
      )}
    </div>
  );
};

const Register = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [selectedRole, setSelectedRole] = useState('patient');
  const { register: registerUser, isAuthenticated, loading } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  
  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting }
  } = useForm();

  // Get role from URL params if provided
  useEffect(() => {
    const roleParam = searchParams.get('role');
    if (roleParam && ['patient', 'hospital_admin', 'doctor'].includes(roleParam)) {
      setSelectedRole(roleParam);
    }
  }, [searchParams]);

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated) {
      navigate('/', { replace: true });
    }
  }, [isAuthenticated, navigate]);

  const watchedRole = watch('role', selectedRole);

  const onSubmit = async (data) => {
    const result = await registerUser(data);
    if (result.success) {
      navigate('/', { replace: true });
    }
  };

  const getRoleDescription = (role) => {
    switch (role) {
      case 'patient':
        return 'Book appointments and manage your healthcare';
      case 'hospital_admin':
        return 'Manage hospital operations and staff';
      case 'doctor':
        return 'Manage appointments and patient consultations';
      default:
        return '';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="loading-spinner"></div>
        <span className="ml-2">Loading...</span>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <div className="flex justify-center">
            <div className="w-12 h-12 bg-primary-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-xl">H</span>
            </div>
          </div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Create your account
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Or{' '}
            <Link
              to="/login"
              className="font-medium text-primary-600 hover:text-primary-500"
            >
              sign in to existing account
            </Link>
          </p>
        </div>

        <form className="mt-8 space-y-6" onSubmit={handleSubmit(onSubmit)}>
          {/* Role Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              I want to register as:
            </label>
            <div className="space-y-3">
              {[
                { value: 'patient', label: 'Patient', desc: 'Book appointments and manage healthcare' },
                { value: 'hospital_admin', label: 'Hospital Admin', desc: 'Manage hospital operations' },
                { value: 'doctor', label: 'Doctor', desc: 'Manage appointments and consultations' }
              ].map((role) => (
                <label key={role.value} className="flex items-start space-x-3 cursor-pointer">
                  <input
                    {...register('role', { required: 'Please select a role' })}
                    type="radio"
                    value={role.value}
                    className="mt-1 h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300"
                    onChange={(e) => setSelectedRole(e.target.value)}
                  />
                  <div>
                    <div className="text-sm font-medium text-gray-900">{role.label}</div>
                    <div className="text-xs text-gray-500">{role.desc}</div>
                  </div>
                </label>
              ))}
            </div>
            {errors.role && (
              <p className="mt-1 text-sm text-red-600">{errors.role.message}</p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            {/* First Name */}
            <div>
              <label htmlFor="firstName" className="block text-sm font-medium text-gray-700">
                First Name
              </label>
              <input
                {...register('firstName', {
                  required: 'First name is required',
                  minLength: { value: 2, message: 'First name must be at least 2 characters' }
                })}
                type="text"
                className="input-field mt-1"
                placeholder="John"
              />
              {errors.firstName && (
                <p className="mt-1 text-sm text-red-600">{errors.firstName.message}</p>
              )}
            </div>

            {/* Last Name */}
            <div>
              <label htmlFor="lastName" className="block text-sm font-medium text-gray-700">
                Last Name
              </label>
              <input
                {...register('lastName', {
                  required: 'Last name is required',
                  minLength: { value: 2, message: 'Last name must be at least 2 characters' }
                })}
                type="text"
                className="input-field mt-1"
                placeholder="Doe"
              />
              {errors.lastName && (
                <p className="mt-1 text-sm text-red-600">{errors.lastName.message}</p>
              )}
            </div>
          </div>

          {/* Email */}
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700">
              Email Address
            </label>
            <input
              {...register('email', {
                required: 'Email is required',
                pattern: {
                  value: /^\S+@\S+$/i,
                  message: 'Please enter a valid email address'
                }
              })}
              type="email"
              className="input-field mt-1"
              placeholder="john@example.com"
            />
            {errors.email && (
              <p className="mt-1 text-sm text-red-600">{errors.email.message}</p>
            )}
          </div>

          {/* Phone */}
          <div>
            <label htmlFor="phone" className="block text-sm font-medium text-gray-700">
              Phone Number
            </label>
            <input
              {...register('phone', {
                required: 'Phone number is required',
                pattern: {
                  value: /^\d{10}$/,
                  message: 'Please enter a valid 10-digit phone number'
                }
              })}
              type="tel"
              className="input-field mt-1"
              placeholder="9876543210"
            />
            {errors.phone && (
              <p className="mt-1 text-sm text-red-600">{errors.phone.message}</p>
            )}
          </div>

          {/* Password */}
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700">
              Password
            </label>
            <div className="relative mt-1">
              <input
                {...register('password', {
                  required: 'Password is required',
                  minLength: {
                    value: 6,
                    message: 'Password must be at least 6 characters'
                  },
                  pattern: {
                    value: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{6,}$/,
                    message: 'Password must contain uppercase, lowercase, and number'
                  }
                })}
                type={showPassword ? 'text' : 'password'}
                className="input-field pr-10"
                placeholder="Enter your password"
              />
              <button
                type="button"
                className="absolute inset-y-0 right-0 pr-3 flex items-center"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? (
                  <EyeSlashIcon className="h-5 w-5 text-gray-400" />
                ) : (
                  <EyeIcon className="h-5 w-5 text-gray-400" />
                )}
              </button>
            </div>
            {errors.password && (
              <p className="mt-1 text-sm text-red-600">{errors.password.message}</p>
            )}
          </div>

          {watchedRole === 'hospital_admin' && (
            <div className="space-y-4 p-4 bg-yellow-50 rounded-lg">
              <h3 className="text-sm font-medium text-gray-900">Hospital Information</h3>
              <p className="text-xs text-gray-600">
                You can register your hospital details after creating your account, or provide them now.
              </p>
              
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Hospital Name
                </label>
                <input
                  {...register('hospitalInfo.name')}
                  type="text"
                  className="input-field mt-1"
                  placeholder="e.g., City General Hospital"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Registration Number
                  </label>
                  <input
                    {...register('hospitalInfo.registrationNumber')}
                    type="text"
                    className="input-field mt-1"
                    placeholder="e.g., CGH001"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Hospital Type
                  </label>
                  <select
                    {...register('hospitalInfo.type')}
                    className="input-field mt-1"
                  >
                    <option value="">Select Type</option>
                    <option value="government">Government</option>
                    <option value="private">Private</option>
                    <option value="semi_government">Semi-Government</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Hospital Address
                </label>
                <input
                  {...register('hospitalInfo.address')}
                  type="text"
                  className="input-field mt-1"
                  placeholder="Complete hospital address"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    City
                  </label>
                  <input
                    {...register('hospitalInfo.city')}
                    type="text"
                    className="input-field mt-1"
                    placeholder="e.g., Mumbai"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    State
                  </label>
                  <input
                    {...register('hospitalInfo.state')}
                    type="text"
                    className="input-field mt-1"
                    placeholder="e.g., Maharashtra"
                  />
                </div>
              </div>
            </div>
          )}

          {watchedRole === 'patient' && (
            <div className="space-y-4 p-4 bg-blue-50 rounded-lg">
              <h3 className="text-sm font-medium text-gray-900">Patient Information</h3>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Date of Birth
                  </label>
                  <input
                    {...register('patientInfo.dateOfBirth', {
                      required: 'Date of birth is required'
                    })}
                    type="date"
                    className="input-field mt-1"
                  />
                  {errors.patientInfo?.dateOfBirth && (
                    <p className="mt-1 text-sm text-red-600">
                      {errors.patientInfo.dateOfBirth.message}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Gender
                  </label>
                  <select
                    {...register('patientInfo.gender', {
                      required: 'Gender is required'
                    })}
                    className="input-field mt-1"
                  >
                    <option value="">Select Gender</option>
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                    <option value="other">Other</option>
                  </select>
                  {errors.patientInfo?.gender && (
                    <p className="mt-1 text-sm text-red-600">
                      {errors.patientInfo.gender.message}
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}

          {watchedRole === 'doctor' && (
            <div className="space-y-4 p-4 bg-green-50 rounded-lg">
              <h3 className="text-sm font-medium text-gray-900">Doctor Information</h3>
              
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Hospital Affiliation
                </label>
                <HospitalSelector register={register} errors={errors} />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Specialization
                </label>
                <input
                  {...register('doctorInfo.specialization', {
                    required: 'Specialization is required'
                  })}
                  type="text"
                  className="input-field mt-1"
                  placeholder="e.g., Cardiology"
                />
                {errors.doctorInfo?.specialization && (
                  <p className="mt-1 text-sm text-red-600">
                    {errors.doctorInfo.specialization.message}
                  </p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Qualification
                  </label>
                  <input
                    {...register('doctorInfo.qualification', {
                      required: 'Qualification is required'
                    })}
                    type="text"
                    className="input-field mt-1"
                    placeholder="e.g., MBBS, MD"
                  />
                  {errors.doctorInfo?.qualification && (
                    <p className="mt-1 text-sm text-red-600">
                      {errors.doctorInfo.qualification.message}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Experience (Years)
                  </label>
                  <input
                    {...register('doctorInfo.experience', {
                      required: 'Experience is required',
                      min: { value: 0, message: 'Experience cannot be negative' }
                    })}
                    type="number"
                    className="input-field mt-1"
                    placeholder="5"
                  />
                  {errors.doctorInfo?.experience && (
                    <p className="mt-1 text-sm text-red-600">
                      {errors.doctorInfo.experience.message}
                    </p>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Consultation Fee (₹)
                </label>
                <input
                  {...register('doctorInfo.consultationFee', {
                    required: 'Consultation fee is required',
                    min: { value: 1, message: 'Fee must be at least ₹1' }
                  })}
                  type="number"
                  className="input-field mt-1"
                  placeholder="500"
                />
                {errors.doctorInfo?.consultationFee && (
                  <p className="mt-1 text-sm text-red-600">
                    {errors.doctorInfo.consultationFee.message}
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Submit Button */}
          <div>
            <button
              type="submit"
              disabled={isSubmitting}
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? (
                <div className="flex items-center">
                  <div className="loading-spinner mr-2"></div>
                  Creating account...
                </div>
              ) : (
                'Create Account'
              )}
            </button>
          </div>

          {/* Terms and Privacy */}
          <div className="text-center">
            <p className="text-xs text-gray-500">
              By creating an account, you agree to our{' '}
              <a href="#" className="text-primary-600 hover:text-primary-500">
                Terms of Service
              </a>{' '}
              and{' '}
              <a href="#" className="text-primary-600 hover:text-primary-500">
                Privacy Policy
              </a>
            </p>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Register;