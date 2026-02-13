/**
 * Admin Dashboard Component
 * Dashboard for super admin users with hospital approval functionality
 */

import React, { useState, useEffect, useCallback } from 'react';
import { adminService } from '../../services/adminService';
import {
  BuildingOfficeIcon,
  UserGroupIcon,
  ClockIcon,
  CheckCircleIcon,
  XCircleIcon,
  ExclamationTriangleIcon,
  MapPinIcon,
  PhoneIcon,
  EnvelopeIcon
} from '@heroicons/react/24/outline';

const AdminDashboard = () => {
  const [activeTab, setActiveTab] = useState('overview');
  const [stats, setStats] = useState(null);
  const [pendingHospitals, setPendingHospitals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState(null);
  const [selectedHospital, setSelectedHospital] = useState(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [showRejectionModal, setShowRejectionModal] = useState(false);

  const loadDashboardData = useCallback(async () => {
    try {
      setLoading(true);
      const [statsResponse, pendingResponse] = await Promise.all([
        adminService.getPlatformStats(),
        adminService.getPendingHospitals()
      ]);
      
      setStats(statsResponse.data.stats);
      setPendingHospitals(pendingResponse.data.hospitals);
    } catch (error) {
      console.error('Error loading dashboard data:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadDashboardData();
  }, [loadDashboardData]);

  const handleApproveHospital = async (hospitalId) => {
    try {
      setProcessingId(hospitalId);
      await adminService.updateHospitalApproval(hospitalId, 'approved');
      
      // Remove from pending list
      setPendingHospitals(prev => prev.filter(h => h._id !== hospitalId));
      
      // Update stats
      setStats(prev => ({
        ...prev,
        totalHospitals: prev.totalHospitals + 1,
        pendingHospitals: prev.pendingHospitals - 1
      }));

      alert('Hospital approved successfully!');
    } catch (error) {
      console.error('Error approving hospital:', error);
      alert('Failed to approve hospital. Please try again.');
    } finally {
      setProcessingId(null);
    }
  };

  const handleRejectHospital = async () => {
    if (!selectedHospital || !rejectionReason.trim()) {
      alert('Please provide a rejection reason.');
      return;
    }

    try {
      setProcessingId(selectedHospital._id);
      await adminService.updateHospitalApproval(
        selectedHospital._id, 
        'rejected', 
        rejectionReason
      );
      
      // Remove from pending list
      setPendingHospitals(prev => prev.filter(h => h._id !== selectedHospital._id));
      
      // Update stats
      setStats(prev => ({
        ...prev,
        pendingHospitals: prev.pendingHospitals - 1
      }));

      setShowRejectionModal(false);
      setSelectedHospital(null);
      setRejectionReason('');
      alert('Hospital rejected successfully!');
    } catch (error) {
      console.error('Error rejecting hospital:', error);
      alert('Failed to reject hospital. Please try again.');
    } finally {
      setProcessingId(null);
    }
  };

  const openRejectionModal = (hospital) => {
    setSelectedHospital(hospital);
    setShowRejectionModal(true);
  };

  const closeRejectionModal = () => {
    setShowRejectionModal(false);
    setSelectedHospital(null);
    setRejectionReason('');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="loading-spinner mr-2"></div>
        <span>Loading admin dashboard...</span>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Super Admin Dashboard
        </h1>
        <p className="text-gray-600">
          Platform oversight and hospital management
        </p>
      </div>

      {/* Navigation Tabs */}
      <div className="border-b border-gray-200 mb-8">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab('overview')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'overview'
                ? 'border-primary-500 text-primary-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Overview
          </button>
          <button
            onClick={() => setActiveTab('approvals')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'approvals'
                ? 'border-primary-500 text-primary-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Hospital Approvals
            {pendingHospitals.length > 0 && (
              <span className="ml-2 bg-red-100 text-red-800 text-xs font-medium px-2.5 py-0.5 rounded-full">
                {pendingHospitals.length}
              </span>
            )}
          </button>
        </nav>
      </div>

      {/* Overview Tab */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="card">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <BuildingOfficeIcon className="h-8 w-8 text-primary-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Total Hospitals</p>
                  <p className="text-2xl font-semibold text-gray-900">
                    {stats?.totalHospitals || 0}
                  </p>
                </div>
              </div>
            </div>

            <div className="card">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <ClockIcon className="h-8 w-8 text-yellow-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Pending Approvals</p>
                  <p className="text-2xl font-semibold text-gray-900">
                    {stats?.pendingHospitals || 0}
                  </p>
                </div>
              </div>
            </div>

            <div className="card">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <UserGroupIcon className="h-8 w-8 text-blue-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Total Doctors</p>
                  <p className="text-2xl font-semibold text-gray-900">
                    {stats?.totalDoctors || 0}
                  </p>
                </div>
              </div>
            </div>

            <div className="card">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <UserGroupIcon className="h-8 w-8 text-green-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Total Patients</p>
                  <p className="text-2xl font-semibold text-gray-900">
                    {stats?.totalPatients || 0}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="card">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <button
                onClick={() => setActiveTab('approvals')}
                className="flex items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <ClockIcon className="h-6 w-6 text-yellow-600 mr-3" />
                <div className="text-left">
                  <p className="font-medium text-gray-900">Review Hospital Approvals</p>
                  <p className="text-sm text-gray-600">
                    {pendingHospitals.length} hospitals awaiting approval
                  </p>
                </div>
              </button>
              
              <button
                onClick={loadDashboardData}
                className="flex items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <BuildingOfficeIcon className="h-6 w-6 text-primary-600 mr-3" />
                <div className="text-left">
                  <p className="font-medium text-gray-900">Refresh Data</p>
                  <p className="text-sm text-gray-600">Update dashboard statistics</p>
                </div>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Hospital Approvals Tab */}
      {activeTab === 'approvals' && (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold text-gray-900">
              Hospital Approval Requests
            </h2>
            <button
              onClick={loadDashboardData}
              className="btn-secondary"
            >
              Refresh
            </button>
          </div>

          {pendingHospitals.length === 0 ? (
            <div className="card text-center py-12">
              <CheckCircleIcon className="h-12 w-12 text-green-500 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                No Pending Approvals
              </h3>
              <p className="text-gray-600">
                All hospital registration requests have been processed.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {pendingHospitals.map((hospital) => (
                <div key={hospital._id} className="card">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center mb-2">
                        <h3 className="text-lg font-semibold text-gray-900 mr-3">
                          {hospital.name}
                        </h3>
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                          <ClockIcon className="h-3 w-3 mr-1" />
                          Pending Approval
                        </span>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                        <div>
                          <h4 className="font-medium text-gray-900 mb-2">Hospital Information</h4>
                          <div className="space-y-1 text-sm text-gray-600">
                            <div className="flex items-center">
                              <MapPinIcon className="h-4 w-4 mr-2" />
                              {hospital.address.street}, {hospital.address.city}, {hospital.address.state} {hospital.address.zipCode}
                            </div>
                            <div>
                              <span className="font-medium">Type:</span> {hospital.type.replace('_', ' ')}
                            </div>
                            <div>
                              <span className="font-medium">Category:</span> {hospital.category.replace('_', ' ')}
                            </div>
                            <div>
                              <span className="font-medium">Total Beds:</span> {hospital.totalBeds}
                            </div>
                            <div>
                              <span className="font-medium">Registration #:</span> {hospital.registrationNumber}
                            </div>
                          </div>
                        </div>

                        <div>
                          <h4 className="font-medium text-gray-900 mb-2">Admin Contact</h4>
                          <div className="space-y-1 text-sm text-gray-600">
                            <div>
                              <span className="font-medium">Name:</span> {hospital.adminId?.firstName} {hospital.adminId?.lastName}
                            </div>
                            <div className="flex items-center">
                              <EnvelopeIcon className="h-4 w-4 mr-2" />
                              {hospital.adminId?.email}
                            </div>
                            <div className="flex items-center">
                              <PhoneIcon className="h-4 w-4 mr-2" />
                              {hospital.adminId?.phone}
                            </div>
                            <div>
                              <span className="font-medium">Submitted:</span> {new Date(hospital.createdAt).toLocaleDateString()}
                            </div>
                          </div>
                        </div>
                      </div>

                      {hospital.description && (
                        <div className="mb-4">
                          <h4 className="font-medium text-gray-900 mb-1">Description</h4>
                          <p className="text-sm text-gray-600">{hospital.description}</p>
                        </div>
                      )}

                      {hospital.departments && hospital.departments.length > 0 && (
                        <div className="mb-4">
                          <h4 className="font-medium text-gray-900 mb-2">Departments</h4>
                          <div className="flex flex-wrap gap-2">
                            {hospital.departments.map((dept, index) => (
                              <span
                                key={index}
                                className="inline-block px-2 py-1 bg-primary-100 text-primary-800 text-xs rounded"
                              >
                                {dept.name}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="flex flex-col space-y-2 ml-6">
                      <button
                        onClick={() => handleApproveHospital(hospital._id)}
                        disabled={processingId === hospital._id}
                        className="btn-primary flex items-center px-4 py-2 text-sm"
                      >
                        {processingId === hospital._id ? (
                          <>
                            <div className="loading-spinner mr-2"></div>
                            Processing...
                          </>
                        ) : (
                          <>
                            <CheckCircleIcon className="h-4 w-4 mr-2" />
                            Approve
                          </>
                        )}
                      </button>
                      
                      <button
                        onClick={() => openRejectionModal(hospital)}
                        disabled={processingId === hospital._id}
                        className="btn-secondary flex items-center px-4 py-2 text-sm border-red-300 text-red-700 hover:bg-red-50"
                      >
                        <XCircleIcon className="h-4 w-4 mr-2" />
                        Reject
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Rejection Modal */}
      {showRejectionModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <div className="flex items-center mb-4">
                <ExclamationTriangleIcon className="h-6 w-6 text-red-600 mr-2" />
                <h3 className="text-lg font-medium text-gray-900">
                  Reject Hospital Application
                </h3>
              </div>
              
              <p className="text-sm text-gray-600 mb-4">
                Please provide a reason for rejecting <strong>{selectedHospital?.name}</strong>:
              </p>
              
              <textarea
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                placeholder="Enter rejection reason..."
                className="w-full p-3 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
                rows="4"
              />
              
              <div className="flex justify-end space-x-3 mt-4">
                <button
                  onClick={closeRejectionModal}
                  className="btn-secondary"
                >
                  Cancel
                </button>
                <button
                  onClick={handleRejectHospital}
                  disabled={!rejectionReason.trim() || processingId === selectedHospital?._id}
                  className="btn-primary bg-red-600 hover:bg-red-700"
                >
                  {processingId === selectedHospital?._id ? (
                    <>
                      <div className="loading-spinner mr-2"></div>
                      Rejecting...
                    </>
                  ) : (
                    'Reject Hospital'
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;