/**
 * Rating Form Component
 * Form for submitting ratings and feedback for completed appointments
 */

import React, { useState } from 'react';
import { StarIcon } from '@heroicons/react/24/solid';
import { StarIcon as StarOutlineIcon } from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';
import { ratingService } from '../../services/ratingService';

const RatingForm = ({ appointment, onSubmit, onCancel }) => {
  const [ratings, setRatings] = useState({
    hospitalRating: 0,
    doctorRating: 0,
    ratingDetails: {
      hospitalCleanliness: 0,
      hospitalStaff: 0,
      hospitalFacilities: 0,
      waitingTime: 0,
      doctorBehavior: 0,
      doctorExpertise: 0,
      consultationQuality: 0,
      followUpCare: 0
    }
  });

  const [feedback, setFeedback] = useState({
    hospitalFeedback: '',
    doctorFeedback: '',
    suggestions: ''
  });

  const [wouldRecommend, setWouldRecommend] = useState({
    hospital: true,
    doctor: true
  });

  const [loading, setLoading] = useState(false);

  const handleRatingChange = (category, value) => {
    if (category === 'hospitalRating' || category === 'doctorRating') {
      setRatings(prev => ({
        ...prev,
        [category]: value
      }));
    } else {
      setRatings(prev => ({
        ...prev,
        ratingDetails: {
          ...prev.ratingDetails,
          [category]: value
        }
      }));
    }
  };

  const handleFeedbackChange = (field, value) => {
    setFeedback(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (ratings.hospitalRating === 0 || ratings.doctorRating === 0) {
      toast.error('Please provide both hospital and doctor ratings');
      return;
    }

    setLoading(true);

    try {
      const ratingData = {
        appointmentId: appointment._id,
        hospitalId: appointment.hospitalId._id,
        doctorId: appointment.doctorId._id,
        hospitalRating: ratings.hospitalRating,
        doctorRating: ratings.doctorRating,
        ratingDetails: ratings.ratingDetails,
        feedback,
        wouldRecommend
      };

      await ratingService.submitRating(ratingData);
      toast.success('Rating submitted successfully!');
      onSubmit && onSubmit();
    } catch (error) {
      console.error('Error submitting rating:', error);
      toast.error(error.response?.data?.message || 'Failed to submit rating');
    } finally {
      setLoading(false);
    }
  };

  const renderStarRating = (category, currentRating, label) => {
    return (
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          {label}
        </label>
        <div className="flex items-center space-x-1">
          {[1, 2, 3, 4, 5].map((star) => (
            <button
              key={star}
              type="button"
              onClick={() => handleRatingChange(category, star)}
              className="focus:outline-none"
            >
              {star <= currentRating ? (
                <StarIcon className="w-6 h-6 text-yellow-400 hover:text-yellow-500" />
              ) : (
                <StarOutlineIcon className="w-6 h-6 text-gray-300 hover:text-yellow-400" />
              )}
            </button>
          ))}
          <span className="ml-2 text-sm text-gray-600">
            {currentRating > 0 ? `${currentRating}/5` : 'Not rated'}
          </span>
        </div>
      </div>
    );
  };

  return (
    <div className="max-w-4xl mx-auto bg-white rounded-lg shadow-md p-6">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Rate Your Experience</h2>
        <div className="bg-gray-50 rounded-lg p-4">
          <div className="flex justify-between items-start">
            <div>
              <h3 className="font-semibold text-gray-900">
                {appointment.hospitalId.name}
              </h3>
              <p className="text-gray-600">
                Dr. {appointment.doctorId.firstName} {appointment.doctorId.lastName}
              </p>
              <p className="text-sm text-gray-500">
                {new Date(appointment.appointmentDate).toLocaleDateString()} at {appointment.appointmentTime}
              </p>
            </div>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Overall Ratings */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-blue-50 rounded-lg p-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Hospital Rating</h3>
            {renderStarRating('hospitalRating', ratings.hospitalRating, 'Overall Hospital Experience')}
          </div>
          
          <div className="bg-green-50 rounded-lg p-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Doctor Rating</h3>
            {renderStarRating('doctorRating', ratings.doctorRating, 'Overall Doctor Experience')}
          </div>
        </div>

        {/* Detailed Hospital Ratings */}
        <div className="bg-gray-50 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Hospital Details</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {renderStarRating('hospitalCleanliness', ratings.ratingDetails.hospitalCleanliness, 'Cleanliness')}
            {renderStarRating('hospitalStaff', ratings.ratingDetails.hospitalStaff, 'Staff Behavior')}
            {renderStarRating('hospitalFacilities', ratings.ratingDetails.hospitalFacilities, 'Facilities')}
            {renderStarRating('waitingTime', ratings.ratingDetails.waitingTime, 'Waiting Time')}
          </div>
        </div>

        {/* Detailed Doctor Ratings */}
        <div className="bg-gray-50 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Doctor Details</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {renderStarRating('doctorBehavior', ratings.ratingDetails.doctorBehavior, 'Doctor Behavior')}
            {renderStarRating('doctorExpertise', ratings.ratingDetails.doctorExpertise, 'Medical Expertise')}
            {renderStarRating('consultationQuality', ratings.ratingDetails.consultationQuality, 'Consultation Quality')}
            {renderStarRating('followUpCare', ratings.ratingDetails.followUpCare, 'Follow-up Care')}
          </div>
        </div>

        {/* Feedback Section */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-gray-900">Written Feedback</h3>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Hospital Feedback
            </label>
            <textarea
              value={feedback.hospitalFeedback}
              onChange={(e) => handleFeedbackChange('hospitalFeedback', e.target.value)}
              rows={3}
              maxLength={500}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Share your experience with the hospital..."
            />
            <p className="text-xs text-gray-500 mt-1">
              {feedback.hospitalFeedback.length}/500 characters
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Doctor Feedback
            </label>
            <textarea
              value={feedback.doctorFeedback}
              onChange={(e) => handleFeedbackChange('doctorFeedback', e.target.value)}
              rows={3}
              maxLength={500}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Share your experience with the doctor..."
            />
            <p className="text-xs text-gray-500 mt-1">
              {feedback.doctorFeedback.length}/500 characters
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Suggestions for Improvement
            </label>
            <textarea
              value={feedback.suggestions}
              onChange={(e) => handleFeedbackChange('suggestions', e.target.value)}
              rows={2}
              maxLength={300}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Any suggestions to improve the service..."
            />
            <p className="text-xs text-gray-500 mt-1">
              {feedback.suggestions.length}/300 characters
            </p>
          </div>
        </div>

        {/* Recommendation Section */}
        <div className="bg-gray-50 rounded-lg p-4">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Would you recommend?</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={wouldRecommend.hospital}
                  onChange={(e) => setWouldRecommend(prev => ({
                    ...prev,
                    hospital: e.target.checked
                  }))}
                  className="mr-2"
                />
                <span className="text-sm font-medium text-gray-700">
                  I would recommend this hospital
                </span>
              </label>
            </div>
            <div>
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={wouldRecommend.doctor}
                  onChange={(e) => setWouldRecommend(prev => ({
                    ...prev,
                    doctor: e.target.checked
                  }))}
                  className="mr-2"
                />
                <span className="text-sm font-medium text-gray-700">
                  I would recommend this doctor
                </span>
              </label>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex justify-end space-x-4 pt-6 border-t">
          <button
            type="button"
            onClick={onCancel}
            className="px-6 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-500"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading || ratings.hospitalRating === 0 || ratings.doctorRating === 0}
            className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Submitting...' : 'Submit Rating'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default RatingForm;