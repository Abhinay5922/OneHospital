/**
 * Rating Display Component
 * Displays ratings and reviews for hospitals and doctors
 */

import React from 'react';
import { StarIcon } from '@heroicons/react/24/solid';
import { StarIcon as StarOutlineIcon } from '@heroicons/react/24/outline';
import { UserIcon } from '@heroicons/react/24/outline';

const RatingDisplay = ({ ratings, type = 'hospital' }) => {
  const { summary = {}, reviews = [] } = ratings;

  const renderStars = (rating, size = 'w-4 h-4') => {
    const stars = [];
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 !== 0;

    for (let i = 0; i < 5; i++) {
      if (i < fullStars) {
        stars.push(
          <StarIcon key={i} className={`${size} text-yellow-400`} />
        );
      } else if (i === fullStars && hasHalfStar) {
        stars.push(
          <div key={i} className="relative">
            <StarOutlineIcon className={`${size} text-gray-300`} />
            <div className="absolute inset-0 overflow-hidden w-1/2">
              <StarIcon className={`${size} text-yellow-400`} />
            </div>
          </div>
        );
      } else {
        stars.push(
          <StarOutlineIcon key={i} className={`${size} text-gray-300`} />
        );
      }
    }
    return stars;
  };

  const renderRatingBar = (rating, count, total) => {
    const percentage = total > 0 ? (count / total) * 100 : 0;
    return (
      <div className="flex items-center space-x-2">
        <span className="text-sm font-medium w-8">{rating}★</span>
        <div className="flex-1 bg-gray-200 rounded-full h-2">
          <div
            className="bg-yellow-400 h-2 rounded-full"
            style={{ width: `${percentage}%` }}
          ></div>
        </div>
        <span className="text-sm text-gray-600 w-8">{count}</span>
      </div>
    );
  };

  if (!summary || Object.keys(summary).length === 0) {
    return (
      <div className="text-center py-8">
        <div className="text-gray-400 mb-2">
          <StarOutlineIcon className="w-12 h-12 mx-auto" />
        </div>
        <p className="text-gray-600">No ratings yet</p>
        <p className="text-sm text-gray-500">Be the first to leave a review!</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Rating Summary */}
      <div className="bg-white rounded-lg border p-6">
        <div className="flex items-start space-x-6">
          {/* Overall Rating */}
          <div className="text-center">
            <div className="text-4xl font-bold text-gray-900 mb-1">
              {summary.averageRating?.toFixed(1) || '0.0'}
            </div>
            <div className="flex items-center justify-center mb-2">
              {renderStars(summary.averageRating || 0, 'w-5 h-5')}
            </div>
            <p className="text-sm text-gray-600">
              {summary.totalRatings || 0} reviews
            </p>
          </div>

          {/* Rating Distribution */}
          <div className="flex-1">
            <h4 className="text-sm font-medium text-gray-900 mb-3">Rating Distribution</h4>
            <div className="space-y-2">
              {[5, 4, 3, 2, 1].map((rating) => (
                <div key={rating}>
                  {renderRatingBar(
                    rating,
                    summary.ratingDistribution?.[rating] || 0,
                    summary.totalRatings || 0
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Detailed Ratings for Doctors */}
          {type === 'doctor' && summary.averageDetails && (
            <div className="flex-1">
              <h4 className="text-sm font-medium text-gray-900 mb-3">Detailed Ratings</h4>
              <div className="space-y-2">
                {Object.entries(summary.averageDetails).map(([key, value]) => {
                  if (!value) return null;
                  const label = key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase());
                  return (
                    <div key={key} className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">{label}:</span>
                      <div className="flex items-center space-x-1">
                        <span className="text-sm font-medium">{value.toFixed(1)}</span>
                        {renderStars(value, 'w-3 h-3')}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Individual Reviews */}
      {reviews.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-gray-900">Recent Reviews</h3>
          {reviews.map((review, index) => (
            <div key={index} className="bg-white rounded-lg border p-6">
              <div className="flex items-start space-x-4">
                <div className="flex-shrink-0">
                  <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center">
                    <UserIcon className="w-6 h-6 text-gray-500" />
                  </div>
                </div>
                
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-2">
                    <div>
                      <p className="font-medium text-gray-900">
                        {review.patientId?.firstName} {review.patientId?.lastName?.charAt(0)}.
                      </p>
                      <div className="flex items-center space-x-2">
                        <div className="flex items-center">
                          {renderStars(type === 'hospital' ? review.hospitalRating : review.doctorRating, 'w-4 h-4')}
                        </div>
                        <span className="text-sm text-gray-600">
                          {type === 'hospital' ? review.hospitalRating : review.doctorRating}/5
                        </span>
                      </div>
                    </div>
                    <span className="text-sm text-gray-500">
                      {new Date(review.createdAt).toLocaleDateString()}
                    </span>
                  </div>

                  {/* Review Content */}
                  <div className="space-y-2">
                    {type === 'hospital' && review.feedback?.hospitalFeedback && (
                      <div>
                        <p className="text-sm font-medium text-gray-700">Hospital Experience:</p>
                        <p className="text-gray-600">{review.feedback.hospitalFeedback}</p>
                      </div>
                    )}
                    
                    {type === 'doctor' && review.feedback?.doctorFeedback && (
                      <div>
                        <p className="text-sm font-medium text-gray-700">Doctor Experience:</p>
                        <p className="text-gray-600">{review.feedback.doctorFeedback}</p>
                      </div>
                    )}

                    {review.feedback?.suggestions && (
                      <div>
                        <p className="text-sm font-medium text-gray-700">Suggestions:</p>
                        <p className="text-gray-600">{review.feedback.suggestions}</p>
                      </div>
                    )}
                  </div>

                  {/* Doctor Info for Hospital Reviews */}
                  {type === 'hospital' && review.doctorId && (
                    <div className="mt-3 pt-3 border-t border-gray-100">
                      <p className="text-sm text-gray-600">
                        Treated by: Dr. {review.doctorId.firstName} {review.doctorId.lastName}
                        {review.doctorId.doctorInfo?.specialization && (
                          <span className="text-gray-500">
                            {' '}({review.doctorId.doctorInfo.specialization})
                          </span>
                        )}
                      </p>
                    </div>
                  )}

                  {/* Recommendation */}
                  <div className="mt-3 flex items-center space-x-4">
                    {review.wouldRecommend?.hospital && type === 'hospital' && (
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                        ✓ Recommends Hospital
                      </span>
                    )}
                    {review.wouldRecommend?.doctor && type === 'doctor' && (
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                        ✓ Recommends Doctor
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default RatingDisplay;