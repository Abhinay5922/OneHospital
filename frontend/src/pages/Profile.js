/**
 * Profile Page Component
 * User profile management
 */

import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useForm } from 'react-hook-form';
import { UserCircleIcon, PencilIcon } from '@heroicons/react/24/outline';

const Profile = () => {
  const { user, updateProfile } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset
  } = useForm({
    defaultValues: {
      firstName: user?.firstName || '',
      lastName: user?.lastName || '',
      phone: user?.phone || '',
      // Patient info
      dateOfBirth: user?.patientInfo?.dateOfBirth ? new Date(user.patientInfo.dateOfBirth).toISOString().split('T')[0] : '',
      gender: user?.patientInfo?.gender || '',
      // Doctor info
      specialization: user?.doctorInfo?.specialization || '',
      qualification: user?.doctorInfo?.qualification || '',
      experience: user?.doctorInfo?.experience || '',
      consultationFee: user?.doctorInfo?.consultationFee || ''
    }
  });

  // Reset form when user data changes
  useEffect(() => {
    if (user) {
      reset({
        firstName: user.firstName || '',
        lastName: user.lastName || '',
        phone: user.phone || '',
        // Patient info
        dateOfBirth: user.patientInfo?.dateOfBirth ? new Date(user.patientInfo.dateOfBirth).toISOString().split('T')[0] : '',
        gender: user.patientInfo?.gender || '',
        // Doctor info
        specialization: user.doctorInfo?.specialization || '',
        qualification: user.doctorInfo?.qualification || '',
        experience: user.doctorInfo?.experience || '',
        consultationFee: user.doctorInfo?.consultationFee || ''
      });
    }
  }, [user, reset]);

  const onSubmit = async (data) => {
    const result = await updateProfile(data);
    if (result.success) {
      setIsEditing(false);
      reset(data);
    }
  };

  const getRoleDisplayName = (role) => {
    switch (role) {
      case 'patient': return 'Patient';
      case 'doctor': return 'Doctor';
      case 'hospital_admin': return 'Hospital Admin';
      case 'super_admin': return 'Super Admin';
      default: return 'User';
    }
  };

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="loading-spinner mr-2"></div>
        <span>Loading profile...</span>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="bg-white shadow-lg rounded-lg overflow-hidden">
        {/* Header */}
        <div className="bg-primary-600 px-6 py-8">
          <div className="flex items-center">
            <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center mr-6">
              <UserCircleIcon className="w-16 h-16 text-primary-600" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white">
                {user.firstName} {user.lastName}
              </h1>
              <p className="text-primary-100">{getRoleDisplayName(user.role)}</p>
              <p className="text-primary-200 text-sm">{user.email}</p>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-semibold text-gray-900">Profile Information</h2>
            <button
              onClick={() => setIsEditing(!isEditing)}
              className="flex items-center gap-2 btn-primary"
            >
              <PencilIcon className="w-4 h-4" />
              {isEditing ? 'Cancel' : 'Edit Profile'}
            </button>
          </div>

          <form onSubmit={handleSubmit(onSubmit)}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Basic Information */}
              <div className="space-y-4">
                <h3 className="text-lg font-medium text-gray-900 border-b pb-2">
                  Basic Information
                </h3>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    First Name
                  </label>
                  <input
                    {...register('firstName', { required: 'First name is required' })}
                    type="text"
                    disabled={!isEditing}
                    className={`input-field mt-1 ${!isEditing ? 'bg-gray-50' : ''}`}
                  />
                  {errors.firstName && (
                    <p className="mt-1 text-sm text-red-600">{errors.firstName.message}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Last Name
                  </label>
                  <input
                    {...register('lastName', { required: 'Last name is required' })}
                    type="text"
                    disabled={!isEditing}
                    className={`input-field mt-1 ${!isEditing ? 'bg-gray-50' : ''}`}
                  />
                  {errors.lastName && (
                    <p className="mt-1 text-sm text-red-600">{errors.lastName.message}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Email
                  </label>
                  <input
                    type="email"
                    value={user.email}
                    disabled
                    className="input-field mt-1 bg-gray-50"
                  />
                  <p className="mt-1 text-xs text-gray-500">Email cannot be changed</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Phone
                  </label>
                  <input
                    {...register('phone', {
                      required: 'Phone is required',
                      pattern: {
                        value: /^\d{10}$/,
                        message: 'Please enter a valid 10-digit phone number'
                      }
                    })}
                    type="tel"
                    disabled={!isEditing}
                    className={`input-field mt-1 ${!isEditing ? 'bg-gray-50' : ''}`}
                  />
                  {errors.phone && (
                    <p className="mt-1 text-sm text-red-600">{errors.phone.message}</p>
                  )}
                </div>
              </div>

              {/* Role-specific Information */}
              <div className="space-y-4">
                {user.role === 'patient' && (
                  <>
                    <h3 className="text-lg font-medium text-gray-900 border-b pb-2">
                      Patient Information
                    </h3>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700">
                        Date of Birth
                      </label>
                      <input
                        {...register('dateOfBirth')}
                        type="date"
                        disabled={!isEditing}
                        className={`input-field mt-1 ${!isEditing ? 'bg-gray-50' : ''}`}
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700">
                        Gender
                      </label>
                      <select
                        {...register('gender')}
                        disabled={!isEditing}
                        className={`input-field mt-1 ${!isEditing ? 'bg-gray-50' : ''}`}
                      >
                        <option value="">Select Gender</option>
                        <option value="male">Male</option>
                        <option value="female">Female</option>
                        <option value="other">Other</option>
                      </select>
                    </div>
                  </>
                )}

                {user.role === 'doctor' && (
                  <>
                    <h3 className="text-lg font-medium text-gray-900 border-b pb-2">
                      Doctor Information
                    </h3>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700">
                        Specialization
                      </label>
                      <input
                        {...register('specialization')}
                        type="text"
                        disabled={!isEditing}
                        className={`input-field mt-1 ${!isEditing ? 'bg-gray-50' : ''}`}
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700">
                        Qualification
                      </label>
                      <input
                        {...register('qualification')}
                        type="text"
                        disabled={!isEditing}
                        className={`input-field mt-1 ${!isEditing ? 'bg-gray-50' : ''}`}
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700">
                        Experience (Years)
                      </label>
                      <input
                        {...register('experience')}
                        type="number"
                        disabled={!isEditing}
                        className={`input-field mt-1 ${!isEditing ? 'bg-gray-50' : ''}`}
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700">
                        Consultation Fee (₹)
                      </label>
                      <input
                        {...register('consultationFee')}
                        type="number"
                        disabled={!isEditing}
                        className={`input-field mt-1 ${!isEditing ? 'bg-gray-50' : ''}`}
                      />
                    </div>
                  </>
                )}

                {user.hospitalId && (
                  <>
                    <h3 className="text-lg font-medium text-gray-900 border-b pb-2">
                      Hospital Information
                    </h3>
                    <div className="p-4 bg-gray-50 rounded-lg">
                      <p className="font-medium">{user.hospitalId?.name}</p>
                      <p className="text-sm text-gray-600">
                        {user.hospitalId?.address?.city}, {user.hospitalId?.address?.state}
                      </p>
                      <p className="text-sm text-gray-600 capitalize">
                        {user.hospitalId?.type} • {user.hospitalId?.category}
                      </p>
                    </div>
                  </>
                )}
              </div>
            </div>

            {isEditing && (
              <div className="mt-8 flex justify-end space-x-4">
                <button
                  type="button"
                  onClick={() => {
                    setIsEditing(false);
                    reset();
                  }}
                  className="btn-secondary"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="btn-primary"
                >
                  {isSubmitting ? (
                    <div className="flex items-center">
                      <div className="loading-spinner mr-2"></div>
                      Saving...
                    </div>
                  ) : (
                    'Save Changes'
                  )}
                </button>
              </div>
            )}
          </form>
        </div>
      </div>
    </div>
  );
};

export default Profile;