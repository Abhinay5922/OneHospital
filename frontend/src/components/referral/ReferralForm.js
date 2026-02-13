/**
 * Referral Form Component
 * Form for doctors to refer patients to specialists
 */

import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { referralService } from '../../services/referralService';
import { XMarkIcon, PlusIcon, TrashIcon } from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';

const ReferralForm = ({ appointment, onClose, onSuccess }) => {
  const [availableDoctors, setAvailableDoctors] = useState([]);
  const [loadingDoctors, setLoadingDoctors] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors }
  } = useForm({
    defaultValues: {
      urgencyLevel: 'routine',
      expectedDuration: '1hour',
      followUpRequired: false,
      medications: [{ name: '', dosage: '', frequency: '', duration: '' }],
      testResults: [{ testName: '', result: '', date: '', notes: '' }]
    }
  });

  const watchedSpecialty = watch('specialtyRequired');

  const specialties = [
    'Cardiology', 'Neurology', 'Orthopedics', 'Pediatrics', 'Gynecology',
    'Dermatology', 'Psychiatry', 'Oncology', 'Endocrinology', 'Gastroenterology',
    'Pulmonology', 'Nephrology', 'Rheumatology', 'Ophthalmology', 'ENT',
    'Urology', 'Anesthesiology', 'Radiology', 'Pathology', 'General Surgery'
  ];

  // Fetch available doctors when specialty changes
  useEffect(() => {
    if (watchedSpecialty) {
      fetchAvailableDoctors(watchedSpecialty);
    }
  }, [watchedSpecialty]);

  const fetchAvailableDoctors = async (specialty) => {
    try {
      setLoadingDoctors(true);
      const response = await referralService.getAvailableDoctors({ specialty });
      if (response.data.success) {
        setAvailableDoctors(response.data.data.doctors);
      }
    } catch (error) {
      console.error('Error fetching doctors:', error);
      toast.error('Failed to fetch available doctors');
    } finally {
      setLoadingDoctors(false);
    }
  };

  const onSubmit = async (data) => {
    try {
      setSubmitting(true);

      const referralData = {
        ...data,
        patientId: appointment.patientId._id,
        originalAppointmentId: appointment._id,
        // Filter out empty medications and test results
        medications: data.medications.filter(med => med.name.trim()),
        testResults: data.testResults.filter(test => test.testName.trim())
      };

      const response = await referralService.createReferral(referralData);
      
      if (response.data.success) {
        toast.success('Referral created successfully');
        onSuccess && onSuccess(response.data.data.referral);
        onClose();
      }
    } catch (error) {
      console.error('Error creating referral:', error);
      toast.error(error.response?.data?.message || 'Failed to create referral');
    } finally {
      setSubmitting(false);
    }
  };

  // Dynamic field management
  const addMedication = () => {
    const medications = watch('medications');
    setValue('medications', [...medications, { name: '', dosage: '', frequency: '', duration: '' }]);
  };

  const removeMedication = (index) => {
    const medications = watch('medications');
    setValue('medications', medications.filter((_, i) => i !== index));
  };

  const addTestResult = () => {
    const testResults = watch('testResults');
    setValue('testResults', [...testResults, { testName: '', result: '', date: '', notes: '' }]);
  };

  const removeTestResult = (index) => {
    const testResults = watch('testResults');
    setValue('testResults', testResults.filter((_, i) => i !== index));
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Create Referral</h2>
            <p className="text-gray-600">
              Patient: {appointment.patientId.firstName} {appointment.patientId.lastName}
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <XMarkIcon className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-6">
          {/* Basic Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Specialty Required *
              </label>
              <select
                {...register('specialtyRequired', { required: 'Specialty is required' })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                <option value="">Select Specialty</option>
                {specialties.map(specialty => (
                  <option key={specialty} value={specialty}>{specialty}</option>
                ))}
              </select>
              {errors.specialtyRequired && (
                <p className="mt-1 text-sm text-red-600">{errors.specialtyRequired.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Refer to Doctor *
              </label>
              <select
                {...register('referredToDoctorId', { required: 'Please select a doctor' })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                disabled={loadingDoctors || !watchedSpecialty}
              >
                <option value="">
                  {loadingDoctors ? 'Loading doctors...' : 'Select Doctor'}
                </option>
                {availableDoctors.map(doctor => (
                  <option key={doctor._id} value={doctor._id}>
                    Dr. {doctor.firstName} {doctor.lastName} - {doctor.hospitalId?.name}
                  </option>
                ))}
              </select>
              {errors.referredToDoctorId && (
                <p className="mt-1 text-sm text-red-600">{errors.referredToDoctorId.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Urgency Level
              </label>
              <select
                {...register('urgencyLevel')}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                <option value="routine">Routine</option>
                <option value="urgent">Urgent</option>
                <option value="emergency">Emergency</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Expected Duration
              </label>
              <select
                {...register('expectedDuration')}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                <option value="30min">30 minutes</option>
                <option value="1hour">1 hour</option>
                <option value="2hours">2 hours</option>
                <option value="half-day">Half day</option>
                <option value="full-day">Full day</option>
              </select>
            </div>
          </div>

          {/* Referral Details */}
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Referral Reason *
              </label>
              <textarea
                {...register('referralReason', { 
                  required: 'Referral reason is required',
                  minLength: { value: 10, message: 'Minimum 10 characters required' }
                })}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                placeholder="Why are you referring this patient?"
              />
              {errors.referralReason && (
                <p className="mt-1 text-sm text-red-600">{errors.referralReason.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Patient Condition *
              </label>
              <textarea
                {...register('patientCondition', { 
                  required: 'Patient condition is required',
                  minLength: { value: 10, message: 'Minimum 10 characters required' }
                })}
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                placeholder="Describe the patient's current condition in detail"
              />
              {errors.patientCondition && (
                <p className="mt-1 text-sm text-red-600">{errors.patientCondition.message}</p>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Symptoms
                </label>
                <textarea
                  {...register('symptoms')}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                  placeholder="List current symptoms"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Current Treatment
                </label>
                <textarea
                  {...register('currentTreatment')}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                  placeholder="Current treatment being provided"
                />
              </div>
            </div>
          </div>

          {/* Medications */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium text-gray-900">Current Medications</h3>
              <button
                type="button"
                onClick={addMedication}
                className="flex items-center text-primary-600 hover:text-primary-700"
              >
                <PlusIcon className="w-4 h-4 mr-1" />
                Add Medication
              </button>
            </div>
            
            {watch('medications')?.map((_, index) => (
              <div key={index} className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-4 p-4 border border-gray-200 rounded-lg">
                <div>
                  <input
                    {...register(`medications.${index}.name`)}
                    placeholder="Medication name"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                </div>
                <div>
                  <input
                    {...register(`medications.${index}.dosage`)}
                    placeholder="Dosage"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                </div>
                <div>
                  <input
                    {...register(`medications.${index}.frequency`)}
                    placeholder="Frequency"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                </div>
                <div>
                  <input
                    {...register(`medications.${index}.duration`)}
                    placeholder="Duration"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                </div>
                <div className="flex items-center">
                  <button
                    type="button"
                    onClick={() => removeMedication(index)}
                    className="text-red-600 hover:text-red-700"
                  >
                    <TrashIcon className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Test Results */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium text-gray-900">Test Results</h3>
              <button
                type="button"
                onClick={addTestResult}
                className="flex items-center text-primary-600 hover:text-primary-700"
              >
                <PlusIcon className="w-4 h-4 mr-1" />
                Add Test Result
              </button>
            </div>
            
            {watch('testResults')?.map((_, index) => (
              <div key={index} className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-4 p-4 border border-gray-200 rounded-lg">
                <div>
                  <input
                    {...register(`testResults.${index}.testName`)}
                    placeholder="Test name"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                </div>
                <div>
                  <input
                    {...register(`testResults.${index}.result`)}
                    placeholder="Result"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                </div>
                <div>
                  <input
                    {...register(`testResults.${index}.date`)}
                    type="date"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                </div>
                <div>
                  <input
                    {...register(`testResults.${index}.notes`)}
                    placeholder="Notes"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                </div>
                <div className="flex items-center">
                  <button
                    type="button"
                    onClick={() => removeTestResult(index)}
                    className="text-red-600 hover:text-red-700"
                  >
                    <TrashIcon className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Additional Information */}
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Preferred Appointment Date
              </label>
              <input
                {...register('preferredAppointmentDate')}
                type="date"
                min={new Date().toISOString().split('T')[0]}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Additional Notes
              </label>
              <textarea
                {...register('additionalNotes')}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                placeholder="Any additional information for the specialist"
              />
            </div>

            <div className="flex items-center">
              <input
                {...register('followUpRequired')}
                type="checkbox"
                className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
              />
              <label className="ml-2 block text-sm text-gray-900">
                Follow-up required with referring doctor
              </label>
            </div>

            {watch('followUpRequired') && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Follow-up Instructions
                </label>
                <textarea
                  {...register('followUpInstructions')}
                  rows={2}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                  placeholder="Instructions for follow-up"
                />
              </div>
            )}
          </div>

          {/* Form Actions */}
          <div className="flex justify-end space-x-4 pt-6 border-t">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-500"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-6 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 disabled:opacity-50"
            >
              {submitting ? 'Creating Referral...' : 'Create Referral'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ReferralForm;