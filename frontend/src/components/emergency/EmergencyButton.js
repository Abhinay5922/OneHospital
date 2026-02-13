/**
 * Emergency Button Component
 * Floating emergency button for patients to request immediate medical help
 */

import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useSocket } from '../../context/SocketContext';
import emergencyService from '../../services/emergencyService';
import toast from 'react-hot-toast';
import {
  ExclamationTriangleIcon,
  PhoneIcon,
  XMarkIcon
} from '@heroicons/react/24/outline';

const EmergencyButton = ({ onEmergencyCall }) => {
  const { user } = useAuth();
  const { socket } = useSocket();
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    urgencyLevel: 'high',
    symptoms: '',
    patientLocation: {
      address: ''
    }
  });

  // Only show for patients
  if (!user || user.role !== 'patient') {
    return null;
  }

  const handleEmergencyRequest = async (e) => {
    e.preventDefault();
    
    if (!formData.symptoms.trim() || formData.symptoms.length < 10) {
      toast.error('Please describe your symptoms (minimum 10 characters)');
      return;
    }

    try {
      setLoading(true);
      
      const response = await emergencyService.requestEmergencyCall(formData);
      
      if (response.data?.success) {
        toast.success('Emergency call requested! Searching for available doctors...');
        setShowModal(false);
        
        // Call parent callback if provided
        if (onEmergencyCall) {
          onEmergencyCall(response.data.data);
        }
        
        // Reset form
        setFormData({
          urgencyLevel: 'high',
          symptoms: '',
          patientLocation: { address: '' }
        });
      }
    } catch (error) {
      console.error('Emergency request error:', error);
      toast.error(error.response?.data?.message || 'Failed to request emergency call');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {/* Floating Emergency Button */}
      <button
        onClick={() => setShowModal(true)}
        className="fixed bottom-6 right-6 z-50 bg-red-600 hover:bg-red-700 text-white rounded-full p-4 shadow-lg transition-all duration-300 hover:scale-110 animate-pulse"
        title="Emergency Medical Help"
      >
        <ExclamationTriangleIcon className="w-8 h-8" />
      </button>

      {/* Emergency Request Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-75 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center">
                  <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mr-3">
                    <ExclamationTriangleIcon className="w-6 h-6 text-red-600" />
                  </div>
                  <div>
                    <h3 className="text-lg font-medium text-gray-900">
                      Emergency Medical Help
                    </h3>
                    <p className="text-sm text-gray-600">
                      Connect with available doctors immediately
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setShowModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <XMarkIcon className="h-6 w-6" />
                </button>
              </div>

              <form onSubmit={handleEmergencyRequest} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Urgency Level *
                  </label>
                  <select
                    value={formData.urgencyLevel}
                    onChange={(e) => setFormData(prev => ({ ...prev, urgencyLevel: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-red-500 focus:border-red-500"
                    required
                  >
                    <option value="medium">Medium - General concern</option>
                    <option value="high">High - Urgent care needed</option>
                    <option value="critical">Critical - Life threatening</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Describe Your Emergency *
                  </label>
                  <textarea
                    value={formData.symptoms}
                    onChange={(e) => setFormData(prev => ({ ...prev, symptoms: e.target.value }))}
                    placeholder="Please describe your symptoms, pain level, and current condition..."
                    rows="4"
                    minLength="10"
                    maxLength="1000"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-red-500 focus:border-red-500"
                    required
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    {formData.symptoms.length}/1000 characters (minimum 10)
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Your Current Location (Optional)
                  </label>
                  <input
                    type="text"
                    value={formData.patientLocation.address}
                    onChange={(e) => setFormData(prev => ({ 
                      ...prev, 
                      patientLocation: { ...prev.patientLocation, address: e.target.value }
                    }))}
                    placeholder="Your current address for emergency services"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-red-500 focus:border-red-500"
                  />
                </div>

                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                  <div className="flex">
                    <ExclamationTriangleIcon className="w-5 h-5 text-yellow-400 mr-2 mt-0.5" />
                    <div className="text-sm text-yellow-800">
                      <p className="font-medium">Important:</p>
                      <ul className="mt-1 list-disc list-inside space-y-1">
                        <li>For life-threatening emergencies, call 108/102 immediately</li>
                        <li>This service connects you with available doctors for consultation</li>
                        <li>Emergency consultation fee: ₹200</li>
                      </ul>
                    </div>
                  </div>
                </div>

                <div className="flex justify-end space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                    disabled={loading}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={loading || !formData.symptoms.trim() || formData.symptoms.length < 10}
                    className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:opacity-50 flex items-center gap-2"
                  >
                    {loading ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                        Requesting...
                      </>
                    ) : (
                      <>
                        <PhoneIcon className="w-4 h-4" />
                        Request Emergency Help
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default EmergencyButton;