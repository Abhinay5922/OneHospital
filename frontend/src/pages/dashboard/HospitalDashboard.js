/**
 * Hospital Dashboard Component
 * Comprehensive dashboard for hospital admin users
 */

import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { hospitalService } from '../../services/hospitalService';
import toast from 'react-hot-toast';
import { 
  BuildingOfficeIcon, 
  UserGroupIcon, 
  CalendarDaysIcon,
  ClockIcon,
  StarIcon,
  ChartBarIcon,
  PlusIcon,
  PencilIcon,
  EyeIcon,
  CheckCircleIcon,
  XCircleIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline';

const HospitalDashboard = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [dashboardData, setDashboardData] = useState(null);
  const [hospitalInfo, setHospitalInfo] = useState(null);
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    loadDashboardData();
  }, [user]);

  const loadDashboardData = async () => {
    if (!user?.hospitalId) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      
      // Extract hospital ID properly (it might be an object or string)
      const hospitalId = user.hospitalId._id || user.hospitalId;
      
      // Load hospital info and dashboard data
      const [hospitalResponse, dashboardResponse] = await Promise.all([
        hospitalService.getHospitalById(hospitalId),
        hospitalService.getHospitalDashboard(hospitalId)
      ]);

      setHospitalInfo(hospitalResponse.data.data.hospital);
      setDashboardData(dashboardResponse.data.data);
    } catch (error) {
      console.error('Failed to load dashboard data:', error);
      toast.error('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'approved': return 'text-green-600 bg-green-100';
      case 'pending': return 'text-yellow-600 bg-yellow-100';
      case 'rejected': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'approved': return <CheckCircleIcon className="w-5 h-5" />;
      case 'pending': return <ExclamationTriangleIcon className="w-5 h-5" />;
      case 'rejected': return <XCircleIcon className="w-5 h-5" />;
      default: return <ClockIcon className="w-5 h-5" />;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="loading-spinner mr-2"></div>
        <span>Loading dashboard...</span>
      </div>
    );
  }

  if (!user?.hospitalId) {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-lg shadow-md p-8 text-center">
          <BuildingOfficeIcon className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            No Hospital Associated
          </h2>
          <p className="text-gray-600 mb-6">
            You need to register a hospital to access the hospital dashboard.
          </p>
          <button
            onClick={() => setActiveTab('register')}
            className="btn-primary"
          >
            <PlusIcon className="w-4 h-4 mr-2" />
            Register Hospital
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Hospital Dashboard
            </h1>
            <p className="text-gray-600">
              Manage {hospitalInfo?.name || 'your hospital'} operations and staff
            </p>
          </div>
          {hospitalInfo && (
            <div className={`flex items-center gap-2 px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(hospitalInfo.approvalStatus)}`}>
              {getStatusIcon(hospitalInfo.approvalStatus)}
              <span className="capitalize">{hospitalInfo.approvalStatus}</span>
            </div>
          )}
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="border-b border-gray-200 mb-6">
        <nav className="-mb-px flex space-x-8">
          {[
            { id: 'overview', name: 'Overview', icon: ChartBarIcon },
            { id: 'hospital', name: 'Hospital Info', icon: BuildingOfficeIcon },
            { id: 'doctors', name: 'Doctors', icon: UserGroupIcon },
            { id: 'appointments', name: 'Appointments', icon: CalendarDaysIcon },
            { id: 'analytics', name: 'Analytics', icon: StarIcon }
          ].map((tab) => (
            <button
              key={tab.id}
              data-tab={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === tab.id
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <tab.icon className="w-4 h-4" />
              {tab.name}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      {activeTab === 'overview' && (
        <OverviewTab 
          hospitalInfo={hospitalInfo} 
          dashboardData={dashboardData} 
        />
      )}
      
      {activeTab === 'hospital' && (
        <HospitalInfoTab 
          hospitalInfo={hospitalInfo} 
          onUpdate={loadDashboardData}
        />
      )}
      
      {activeTab === 'doctors' && (
        <DoctorsTab 
          hospitalId={hospitalInfo?._id || (user?.hospitalId?._id || user?.hospitalId)} 
        />
      )}
      
      {activeTab === 'appointments' && (
        <AppointmentsTab 
          dashboardData={dashboardData} 
        />
      )}
      
      {activeTab === 'analytics' && (
        <AnalyticsTab 
          hospitalInfo={hospitalInfo} 
        />
      )}
    </div>
  );
};

// Overview Tab Component
const OverviewTab = ({ hospitalInfo, dashboardData }) => {
  const [showAddDoctorModal, setShowAddDoctorModal] = useState(false);
  const [showUpdateHospitalModal, setShowUpdateHospitalModal] = useState(false);
  const [showReportsModal, setShowReportsModal] = useState(false);

  const stats = [
    {
      name: 'Total Beds',
      value: hospitalInfo?.totalBeds || 0,
      icon: BuildingOfficeIcon,
      color: 'bg-blue-500'
    },
    {
      name: 'Available Beds',
      value: hospitalInfo?.availableBeds || 0,
      icon: CheckCircleIcon,
      color: 'bg-green-500'
    },
    {
      name: 'Today\'s Appointments',
      value: dashboardData?.appointmentsSummary?.reduce((sum, item) => sum + item.count, 0) || 0,
      icon: CalendarDaysIcon,
      color: 'bg-purple-500'
    },
    {
      name: 'Active Doctors',
      value: dashboardData?.doctorQueues?.length || 0,
      icon: UserGroupIcon,
      color: 'bg-orange-500'
    }
  ];

  const handleAddDoctor = () => {
    setShowAddDoctorModal(true);
  };

  const handleUpdateHospital = () => {
    setShowUpdateHospitalModal(true);
  };

  const handleViewReports = () => {
    setShowReportsModal(true);
  };

  const quickActions = [
    {
      id: 'add-doctor',
      name: 'Add Doctor',
      description: 'Add a new doctor to your hospital',
      icon: PlusIcon,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
      hoverColor: 'hover:bg-blue-100',
      action: handleAddDoctor
    },
    {
      id: 'update-hospital',
      name: 'Update Hospital Info',
      description: 'Edit hospital details and settings',
      icon: PencilIcon,
      color: 'text-green-600',
      bgColor: 'bg-green-50',
      hoverColor: 'hover:bg-green-100',
      action: handleUpdateHospital
    },
    {
      id: 'view-reports',
      name: 'View Reports',
      description: 'Generate and view hospital reports',
      icon: EyeIcon,
      color: 'text-purple-600',
      bgColor: 'bg-purple-50',
      hoverColor: 'hover:bg-purple-100',
      action: handleViewReports
    },
    {
      id: 'view-analytics',
      name: 'View Analytics',
      description: 'Access detailed hospital analytics',
      icon: ChartBarIcon,
      color: 'text-indigo-600',
      bgColor: 'bg-indigo-50',
      hoverColor: 'hover:bg-indigo-100',
      action: () => {
        // Switch to analytics tab
        const analyticsTab = document.querySelector('[data-tab="analytics"]');
        if (analyticsTab) {
          analyticsTab.click();
        } else {
          toast('Switch to Analytics tab to view detailed reports', {
            icon: 'ℹ️',
            style: {
              background: '#e0f2fe',
              color: '#0369a1',
              border: '1px solid #bae6fd'
            }
          });
        }
      }
    }
  ];

  return (
    <div className="space-y-6">
      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat) => (
          <div key={stat.name} className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow">
            <div className="flex items-center">
              <div className={`${stat.color} rounded-lg p-3 mr-4`}>
                <stat.icon className="w-6 h-6 text-white" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">{stat.name}</p>
                <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Enhanced Quick Actions */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-gray-900">Quick Actions</h3>
          <span className="text-sm text-gray-500">Frequently used actions</span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {quickActions.map((action) => (
            <button
              key={action.id}
              onClick={action.action}
              className={`flex items-start gap-4 p-4 border border-gray-200 rounded-lg ${action.hoverColor} transition-all duration-200 hover:shadow-md hover:border-gray-300 text-left`}
            >
              <div className={`${action.bgColor} rounded-lg p-3 flex-shrink-0`}>
                <action.icon className={`w-5 h-5 ${action.color}`} />
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="font-medium text-gray-900 mb-1">{action.name}</h4>
                <p className="text-sm text-gray-600 leading-relaxed">{action.description}</p>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Recent Appointments */}
      {dashboardData?.recentAppointments && (
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Recent Appointments</h3>
            <button 
              onClick={() => {
                const appointmentsTab = document.querySelector('[data-tab="appointments"]');
                if (appointmentsTab) {
                  appointmentsTab.click();
                } else {
                  toast('Switch to Appointments tab to view all appointments', {
                    icon: 'ℹ️',
                    style: {
                      background: '#e0f2fe',
                      color: '#0369a1',
                      border: '1px solid #bae6fd'
                    }
                  });
                }
              }}
              className="text-sm text-blue-600 hover:text-blue-800 font-medium"
            >
              View All →
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Patient
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Doctor
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Time
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {dashboardData.recentAppointments.slice(0, 5).map((appointment) => (
                  <tr key={appointment._id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {appointment.patientId?.firstName} {appointment.patientId?.lastName}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      Dr. {appointment.doctorId?.firstName} {appointment.doctorId?.lastName}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {appointment.appointmentTime}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        appointment.status === 'confirmed' ? 'bg-blue-100 text-blue-800' :
                        appointment.status === 'in_progress' ? 'bg-yellow-100 text-yellow-800' :
                        appointment.status === 'completed' ? 'bg-green-100 text-green-800' :
                        appointment.status === 'cancelled' ? 'bg-red-100 text-red-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {appointment.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Quick Action Modals */}
      {showAddDoctorModal && (
        <QuickAddDoctorModal
          onClose={() => setShowAddDoctorModal(false)}
          onSuccess={() => {
            setShowAddDoctorModal(false);
            toast.success('Doctor added successfully! Switch to Doctors tab to manage.');
          }}
        />
      )}

      {showUpdateHospitalModal && (
        <QuickUpdateHospitalModal
          hospitalInfo={hospitalInfo}
          onClose={() => setShowUpdateHospitalModal(false)}
          onSuccess={() => {
            setShowUpdateHospitalModal(false);
            toast.success('Hospital information updated! Switch to Hospital Info tab for detailed editing.');
          }}
        />
      )}

      {showReportsModal && (
        <QuickReportsModal
          hospitalInfo={hospitalInfo}
          dashboardData={dashboardData}
          onClose={() => setShowReportsModal(false)}
        />
      )}
    </div>
  );
};

// Hospital Info Tab Component
const HospitalInfoTab = ({ hospitalInfo, onUpdate }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({});
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (hospitalInfo) {
      setFormData({
        name: hospitalInfo.name || '',
        email: hospitalInfo.email || '',
        phone: hospitalInfo.phone || '',
        type: hospitalInfo.type || '',
        category: hospitalInfo.category || '',
        totalBeds: hospitalInfo.totalBeds || '',
        availableBeds: hospitalInfo.availableBeds || '',
        'address.street': hospitalInfo.address?.street || '',
        'address.city': hospitalInfo.address?.city || '',
        'address.state': hospitalInfo.address?.state || '',
        'address.pincode': hospitalInfo.address?.pincode || ''
      });
    }
  }, [hospitalInfo]);

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      
      // Prepare update data
      const updateData = {
        name: formData.name,
        email: formData.email,
        phone: formData.phone,
        type: formData.type,
        category: formData.category,
        totalBeds: parseInt(formData.totalBeds),
        availableBeds: parseInt(formData.availableBeds),
        address: {
          street: formData['address.street'],
          city: formData['address.city'],
          state: formData['address.state'],
          pincode: formData['address.pincode']
        }
      };

      await hospitalService.updateHospital(hospitalInfo._id, updateData);
      toast.success('Hospital information updated successfully');
      setIsEditing(false);
      onUpdate();
    } catch (error) {
      console.error('Update hospital error:', error);
      toast.error(error.response?.data?.message || 'Failed to update hospital information');
    } finally {
      setLoading(false);
    }
  };

  if (!hospitalInfo) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6 text-center">
        <p className="text-gray-500">No hospital information available</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-lg font-semibold text-gray-900">Hospital Information</h3>
        <button
          onClick={() => setIsEditing(!isEditing)}
          disabled={loading}
          className="btn-primary disabled:opacity-50"
        >
          <PencilIcon className="w-4 h-4 mr-2" />
          {isEditing ? 'Cancel' : 'Edit'}
        </button>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Hospital Name *
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => handleInputChange('name', e.target.value)}
              disabled={!isEditing}
              required
              className={`input-field ${!isEditing ? 'bg-gray-50' : ''}`}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Registration Number
            </label>
            <input
              type="text"
              value={hospitalInfo.registrationNumber}
              disabled
              className="input-field bg-gray-50"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Email *
            </label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) => handleInputChange('email', e.target.value)}
              disabled={!isEditing}
              required
              className={`input-field ${!isEditing ? 'bg-gray-50' : ''}`}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Phone *
            </label>
            <input
              type="tel"
              value={formData.phone}
              onChange={(e) => handleInputChange('phone', e.target.value)}
              disabled={!isEditing}
              required
              className={`input-field ${!isEditing ? 'bg-gray-50' : ''}`}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Type *
            </label>
            <select
              value={formData.type}
              onChange={(e) => handleInputChange('type', e.target.value)}
              disabled={!isEditing}
              required
              className={`input-field ${!isEditing ? 'bg-gray-50' : ''}`}
            >
              <option value="">Select Type</option>
              <option value="government">Government</option>
              <option value="private">Private</option>
              <option value="semi_government">Semi-Government</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Category *
            </label>
            <select
              value={formData.category}
              onChange={(e) => handleInputChange('category', e.target.value)}
              disabled={!isEditing}
              required
              className={`input-field ${!isEditing ? 'bg-gray-50' : ''}`}
            >
              <option value="">Select Category</option>
              <option value="general">General</option>
              <option value="specialty">Specialty</option>
              <option value="super_specialty">Super Specialty</option>
              <option value="clinic">Clinic</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Total Beds *
            </label>
            <input
              type="number"
              value={formData.totalBeds}
              onChange={(e) => handleInputChange('totalBeds', e.target.value)}
              disabled={!isEditing}
              required
              min="1"
              className={`input-field ${!isEditing ? 'bg-gray-50' : ''}`}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Available Beds *
            </label>
            <input
              type="number"
              value={formData.availableBeds}
              onChange={(e) => handleInputChange('availableBeds', e.target.value)}
              disabled={!isEditing}
              required
              min="0"
              max={formData.totalBeds}
              className={`input-field ${!isEditing ? 'bg-gray-50' : ''}`}
            />
          </div>
        </div>

        {/* Address Section */}
        <div className="mt-6">
          <h4 className="text-md font-medium text-gray-900 mb-4">Address</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Street Address *
              </label>
              <input
                type="text"
                value={formData['address.street']}
                onChange={(e) => handleInputChange('address.street', e.target.value)}
                disabled={!isEditing}
                required
                className={`input-field ${!isEditing ? 'bg-gray-50' : ''}`}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                City *
              </label>
              <input
                type="text"
                value={formData['address.city']}
                onChange={(e) => handleInputChange('address.city', e.target.value)}
                disabled={!isEditing}
                required
                className={`input-field ${!isEditing ? 'bg-gray-50' : ''}`}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                State *
              </label>
              <input
                type="text"
                value={formData['address.state']}
                onChange={(e) => handleInputChange('address.state', e.target.value)}
                disabled={!isEditing}
                required
                className={`input-field ${!isEditing ? 'bg-gray-50' : ''}`}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Pincode *
              </label>
              <input
                type="text"
                value={formData['address.pincode']}
                onChange={(e) => handleInputChange('address.pincode', e.target.value)}
                disabled={!isEditing}
                required
                pattern="[0-9]{6}"
                className={`input-field ${!isEditing ? 'bg-gray-50' : ''}`}
              />
            </div>
          </div>
        </div>

        {isEditing && (
          <div className="mt-6 flex justify-end space-x-4">
            <button
              type="button"
              onClick={() => setIsEditing(false)}
              disabled={loading}
              className="btn-secondary disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="btn-primary disabled:opacity-50"
            >
              {loading ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        )}
      </form>
    </div>
  );
};

// Doctors Tab Component
const DoctorsTab = ({ hospitalId }) => {
  const [doctors, setDoctors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedDoctor, setSelectedDoctor] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    loadDoctors();
  }, [hospitalId]);

  const loadDoctors = async () => {
    if (!hospitalId) return;
    
    try {
      setLoading(true);
      const response = await hospitalService.getDoctorsByHospital(hospitalId);
      setDoctors(response.data.data.doctors);
    } catch (error) {
      console.error('Failed to load doctors:', error);
      toast.error('Failed to load doctors');
    } finally {
      setLoading(false);
    }
  };

  const handleAddDoctor = () => {
    setSelectedDoctor(null);
    setShowAddModal(true);
  };

  const handleEditDoctor = (doctor) => {
    setSelectedDoctor(doctor);
    setShowEditModal(true);
  };

  const handleDeleteDoctor = async (doctorId, doctorName) => {
    if (!window.confirm(`Are you sure you want to deactivate Dr. ${doctorName}?`)) {
      return;
    }

    try {
      setActionLoading(true);
      await hospitalService.deleteDoctor(doctorId);
      toast.success('Doctor deactivated successfully');
      loadDoctors();
    } catch (error) {
      console.error('Failed to delete doctor:', error);
      toast.error(error.response?.data?.message || 'Failed to deactivate doctor');
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6 text-center">
        <div className="loading-spinner mx-auto mb-2"></div>
        <p>Loading doctors...</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-lg font-semibold text-gray-900">Doctors Management</h3>
        <button 
          onClick={handleAddDoctor}
          disabled={actionLoading}
          className="btn-primary disabled:opacity-50"
        >
          <PlusIcon className="w-4 h-4 mr-2" />
          Add Doctor
        </button>
      </div>

      {doctors.length === 0 ? (
        <div className="text-center py-8">
          <UserGroupIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-500 mb-4">No doctors found</p>
          <button 
            onClick={handleAddDoctor}
            className="btn-primary"
          >
            <PlusIcon className="w-4 h-4 mr-2" />
            Add First Doctor
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {doctors.map((doctor) => (
            <div key={doctor._id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
              <div className="flex items-center mb-3">
                <div className="w-12 h-12 bg-primary-100 rounded-full flex items-center justify-center mr-3">
                  <UserGroupIcon className="w-6 h-6 text-primary-600" />
                </div>
                <div className="flex-1">
                  <h4 className="font-medium text-gray-900">
                    Dr. {doctor.firstName} {doctor.lastName}
                  </h4>
                  <p className="text-sm text-gray-500">
                    {doctor.doctorInfo?.specialization || 'General'}
                  </p>
                </div>
              </div>
              
              <div className="space-y-2 text-sm mb-4">
                <p><span className="font-medium">Email:</span> {doctor.email}</p>
                <p><span className="font-medium">Phone:</span> {doctor.phone}</p>
                <p><span className="font-medium">Experience:</span> {doctor.doctorInfo?.experience || 0} years</p>
                <p><span className="font-medium">Fee:</span> ₹{doctor.doctorInfo?.consultationFee || 0}</p>
                <div className="flex items-center">
                  <span className="font-medium mr-2">Status:</span>
                  <span className={`px-2 py-1 rounded-full text-xs ${
                    doctor.doctorInfo?.isAvailable 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-red-100 text-red-800'
                  }`}>
                    {doctor.doctorInfo?.isAvailable ? 'Available' : 'Unavailable'}
                  </span>
                </div>
              </div>

              <div className="flex space-x-2">
                <button
                  onClick={() => handleEditDoctor(doctor)}
                  disabled={actionLoading}
                  className="flex-1 px-3 py-2 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
                >
                  <PencilIcon className="w-4 h-4 inline mr-1" />
                  Edit
                </button>
                <button
                  onClick={() => handleDeleteDoctor(doctor._id, `${doctor.firstName} ${doctor.lastName}`)}
                  disabled={actionLoading}
                  className="flex-1 px-3 py-2 text-sm bg-red-600 text-white rounded-md hover:bg-red-700 disabled:opacity-50"
                >
                  <XCircleIcon className="w-4 h-4 inline mr-1" />
                  Remove
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add Doctor Modal */}
      {showAddModal && (
        <AddDoctorModal
          onClose={() => setShowAddModal(false)}
          onSuccess={() => {
            setShowAddModal(false);
            loadDoctors();
          }}
        />
      )}

      {/* Edit Doctor Modal */}
      {showEditModal && selectedDoctor && (
        <EditDoctorModal
          doctor={selectedDoctor}
          onClose={() => setShowEditModal(false)}
          onSuccess={() => {
            setShowEditModal(false);
            loadDoctors();
          }}
        />
      )}
    </div>
  );
};

// Add Doctor Modal Component
const AddDoctorModal = ({ onClose, onSuccess }) => {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    password: '',
    doctorInfo: {
      specialization: '',
      qualification: '',
      experience: '',
      consultationFee: '',
      isAvailable: true
    }
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      await hospitalService.addDoctor(formData);
      toast.success('Doctor added successfully');
      onSuccess();
    } catch (error) {
      console.error('Add doctor error:', error);
      toast.error(error.response?.data?.message || 'Failed to add doctor');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field, value) => {
    if (field.startsWith('doctorInfo.')) {
      const doctorField = field.replace('doctorInfo.', '');
      setFormData(prev => ({
        ...prev,
        doctorInfo: {
          ...prev.doctorInfo,
          [doctorField]: value
        }
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [field]: value
      }));
    }
  };

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-10 mx-auto p-5 border w-full max-w-2xl shadow-lg rounded-md bg-white">
        <div className="mt-3">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-medium text-gray-900">Add New Doctor</h3>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
              <XCircleIcon className="h-6 w-6" />
            </button>
          </div>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  First Name *
                </label>
                <input
                  type="text"
                  required
                  value={formData.firstName}
                  onChange={(e) => handleInputChange('firstName', e.target.value)}
                  className="input-field"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Last Name *
                </label>
                <input
                  type="text"
                  required
                  value={formData.lastName}
                  onChange={(e) => handleInputChange('lastName', e.target.value)}
                  className="input-field"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email *
                </label>
                <input
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                  className="input-field"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Phone *
                </label>
                <input
                  type="tel"
                  required
                  value={formData.phone}
                  onChange={(e) => handleInputChange('phone', e.target.value)}
                  className="input-field"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Password *
                </label>
                <input
                  type="password"
                  required
                  minLength="6"
                  value={formData.password}
                  onChange={(e) => handleInputChange('password', e.target.value)}
                  className="input-field"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Specialization *
                </label>
                <select
                  required
                  value={formData.doctorInfo.specialization}
                  onChange={(e) => handleInputChange('doctorInfo.specialization', e.target.value)}
                  className="input-field"
                >
                  <option value="">Select Specialization</option>
                  <option value="General Medicine">General Medicine</option>
                  <option value="Cardiology">Cardiology</option>
                  <option value="Neurology">Neurology</option>
                  <option value="Orthopedics">Orthopedics</option>
                  <option value="Pediatrics">Pediatrics</option>
                  <option value="Gynecology">Gynecology</option>
                  <option value="Dermatology">Dermatology</option>
                  <option value="ENT">ENT</option>
                  <option value="Ophthalmology">Ophthalmology</option>
                  <option value="Psychiatry">Psychiatry</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Qualification *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g., MBBS, MD"
                  value={formData.doctorInfo.qualification}
                  onChange={(e) => handleInputChange('doctorInfo.qualification', e.target.value)}
                  className="input-field"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Experience (Years) *
                </label>
                <input
                  type="number"
                  required
                  min="0"
                  max="50"
                  value={formData.doctorInfo.experience}
                  onChange={(e) => handleInputChange('doctorInfo.experience', e.target.value)}
                  className="input-field"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Consultation Fee (₹) *
                </label>
                <input
                  type="number"
                  required
                  min="100"
                  value={formData.doctorInfo.consultationFee}
                  onChange={(e) => handleInputChange('doctorInfo.consultationFee', e.target.value)}
                  className="input-field"
                />
              </div>

              <div className="md:col-span-2">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={formData.doctorInfo.isAvailable}
                    onChange={(e) => handleInputChange('doctorInfo.isAvailable', e.target.checked)}
                    className="mr-2"
                  />
                  <span className="text-sm font-medium text-gray-700">Available for appointments</span>
                </label>
              </div>
            </div>

            <div className="flex justify-end space-x-3 pt-4">
              <button
                type="button"
                onClick={onClose}
                disabled={loading}
                className="btn-secondary disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="btn-primary disabled:opacity-50"
              >
                {loading ? 'Adding...' : 'Add Doctor'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

// Edit Doctor Modal Component
const EditDoctorModal = ({ doctor, onClose, onSuccess }) => {
  const [formData, setFormData] = useState({
    firstName: doctor.firstName || '',
    lastName: doctor.lastName || '',
    email: doctor.email || '',
    phone: doctor.phone || '',
    doctorInfo: {
      specialization: doctor.doctorInfo?.specialization || '',
      qualification: doctor.doctorInfo?.qualification || '',
      experience: doctor.doctorInfo?.experience || '',
      consultationFee: doctor.doctorInfo?.consultationFee || '',
      isAvailable: doctor.doctorInfo?.isAvailable !== false
    }
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      await hospitalService.updateDoctor(doctor._id, formData);
      toast.success('Doctor updated successfully');
      onSuccess();
    } catch (error) {
      console.error('Update doctor error:', error);
      toast.error(error.response?.data?.message || 'Failed to update doctor');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field, value) => {
    if (field.startsWith('doctorInfo.')) {
      const doctorField = field.replace('doctorInfo.', '');
      setFormData(prev => ({
        ...prev,
        doctorInfo: {
          ...prev.doctorInfo,
          [doctorField]: value
        }
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [field]: value
      }));
    }
  };

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-10 mx-auto p-5 border w-full max-w-2xl shadow-lg rounded-md bg-white">
        <div className="mt-3">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-medium text-gray-900">
              Edit Dr. {doctor.firstName} {doctor.lastName}
            </h3>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
              <XCircleIcon className="h-6 w-6" />
            </button>
          </div>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  First Name *
                </label>
                <input
                  type="text"
                  required
                  value={formData.firstName}
                  onChange={(e) => handleInputChange('firstName', e.target.value)}
                  className="input-field"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Last Name *
                </label>
                <input
                  type="text"
                  required
                  value={formData.lastName}
                  onChange={(e) => handleInputChange('lastName', e.target.value)}
                  className="input-field"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email *
                </label>
                <input
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                  className="input-field"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Phone *
                </label>
                <input
                  type="tel"
                  required
                  value={formData.phone}
                  onChange={(e) => handleInputChange('phone', e.target.value)}
                  className="input-field"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Specialization *
                </label>
                <select
                  required
                  value={formData.doctorInfo.specialization}
                  onChange={(e) => handleInputChange('doctorInfo.specialization', e.target.value)}
                  className="input-field"
                >
                  <option value="">Select Specialization</option>
                  <option value="General Medicine">General Medicine</option>
                  <option value="Cardiology">Cardiology</option>
                  <option value="Neurology">Neurology</option>
                  <option value="Orthopedics">Orthopedics</option>
                  <option value="Pediatrics">Pediatrics</option>
                  <option value="Gynecology">Gynecology</option>
                  <option value="Dermatology">Dermatology</option>
                  <option value="ENT">ENT</option>
                  <option value="Ophthalmology">Ophthalmology</option>
                  <option value="Psychiatry">Psychiatry</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Qualification *
                </label>
                <input
                  type="text"
                  required
                  value={formData.doctorInfo.qualification}
                  onChange={(e) => handleInputChange('doctorInfo.qualification', e.target.value)}
                  className="input-field"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Experience (Years) *
                </label>
                <input
                  type="number"
                  required
                  min="0"
                  max="50"
                  value={formData.doctorInfo.experience}
                  onChange={(e) => handleInputChange('doctorInfo.experience', e.target.value)}
                  className="input-field"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Consultation Fee (₹) *
                </label>
                <input
                  type="number"
                  required
                  min="100"
                  value={formData.doctorInfo.consultationFee}
                  onChange={(e) => handleInputChange('doctorInfo.consultationFee', e.target.value)}
                  className="input-field"
                />
              </div>

              <div className="md:col-span-2">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={formData.doctorInfo.isAvailable}
                    onChange={(e) => handleInputChange('doctorInfo.isAvailable', e.target.checked)}
                    className="mr-2"
                  />
                  <span className="text-sm font-medium text-gray-700">Available for appointments</span>
                </label>
              </div>
            </div>

            <div className="flex justify-end space-x-3 pt-4">
              <button
                type="button"
                onClick={onClose}
                disabled={loading}
                className="btn-secondary disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="btn-primary disabled:opacity-50"
              >
                {loading ? 'Updating...' : 'Update Doctor'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

// Appointments Tab Component
const AppointmentsTab = ({ dashboardData }) => {
  const [selectedAppointment, setSelectedAppointment] = useState(null);
  const [showPatientModal, setShowPatientModal] = useState(false);

  const handleAppointmentClick = (appointment) => {
    setSelectedAppointment(appointment);
    setShowPatientModal(true);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'confirmed': return 'bg-blue-100 text-blue-800';
      case 'in_progress': return 'bg-yellow-100 text-yellow-800';
      case 'completed': return 'bg-green-100 text-green-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  };

  return (
    <div className="space-y-6">
      {/* Appointment Summary */}
      {dashboardData?.appointmentsSummary && (
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Today's Appointments Summary</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {dashboardData.appointmentsSummary.map((item) => (
              <div key={item._id} className="text-center p-4 border border-gray-200 rounded-lg">
                <p className="text-2xl font-bold text-gray-900">{item.count}</p>
                <p className="text-sm text-gray-500 capitalize">{item._id}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* All Appointments List */}
      {dashboardData?.recentAppointments && (
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-lg font-semibold text-gray-900">All Appointments</h3>
            <span className="text-sm text-gray-600">
              {dashboardData.recentAppointments.length} appointments
            </span>
          </div>
          
          {dashboardData.recentAppointments.length === 0 ? (
            <div className="text-center py-8">
              <CalendarDaysIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">No appointments found</p>
            </div>
          ) : (
            <div className="space-y-3">
              {dashboardData.recentAppointments.map((appointment) => (
                <div 
                  key={appointment._id} 
                  className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer hover:bg-gray-50"
                  onClick={() => handleAppointmentClick(appointment)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div className="flex-shrink-0">
                        <div className="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center">
                          <span className="text-primary-600 font-semibold">
                            #{appointment.tokenNumber}
                          </span>
                        </div>
                      </div>
                      
                      <div className="flex-1">
                        <div className="flex items-center space-x-2">
                          <h4 className="font-medium text-gray-900">
                            {appointment.patientId?.firstName} {appointment.patientId?.lastName}
                          </h4>
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(appointment.status)}`}>
                            {appointment.status}
                          </span>
                        </div>
                        
                        <div className="mt-1 text-sm text-gray-600">
                          <p>Dr. {appointment.doctorId?.firstName} {appointment.doctorId?.lastName}</p>
                          <p>{appointment.doctorId?.doctorInfo?.specialization}</p>
                        </div>
                        
                        <div className="mt-2 text-sm text-gray-500">
                          <span className="mr-4">📅 {formatDate(appointment.appointmentDate)}</span>
                          <span className="mr-4">🕐 {appointment.appointmentTime}</span>
                          <span>📞 {appointment.patientId?.phone}</span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex-shrink-0">
                      <EyeIcon className="w-5 h-5 text-gray-400" />
                    </div>
                  </div>
                  
                  {appointment.patientDetails?.symptoms && (
                    <div className="mt-3 pt-3 border-t border-gray-100">
                      <p className="text-sm text-gray-600">
                        <span className="font-medium">Symptoms:</span> {appointment.patientDetails.symptoms}
                      </p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Doctor Queues */}
      {dashboardData?.doctorQueues && (
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Today's Doctor Queues</h3>
          <div className="space-y-4">
            {dashboardData.doctorQueues.map((queue) => (
              <div key={queue._id} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                <div>
                  <h4 className="font-medium text-gray-900">{queue.doctorName}</h4>
                  <p className="text-sm text-gray-500">{queue.specialization}</p>
                </div>
                <div className="text-right">
                  <p className="text-lg font-semibold text-gray-900">{queue.queueCount}</p>
                  <p className="text-sm text-gray-500">in queue</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Patient Details Modal */}
      {showPatientModal && selectedAppointment && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-gray-900">
                  Patient Details
                </h3>
                <button
                  onClick={() => setShowPatientModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <XCircleIcon className="h-6 w-6" />
                </button>
              </div>
              
              <div className="space-y-4">
                {/* Patient Info */}
                <div className="bg-gray-50 rounded-lg p-4">
                  <h4 className="font-medium text-gray-900 mb-2">Patient Information</h4>
                  <div className="space-y-2 text-sm">
                    <p><span className="font-medium">Name:</span> {selectedAppointment.patientId?.firstName} {selectedAppointment.patientId?.lastName}</p>
                    <p><span className="font-medium">Phone:</span> {selectedAppointment.patientId?.phone}</p>
                    <p><span className="font-medium">Token Number:</span> #{selectedAppointment.tokenNumber}</p>
                  </div>
                </div>

                {/* Appointment Info */}
                <div className="bg-gray-50 rounded-lg p-4">
                  <h4 className="font-medium text-gray-900 mb-2">Appointment Details</h4>
                  <div className="space-y-2 text-sm">
                    <p><span className="font-medium">Doctor:</span> Dr. {selectedAppointment.doctorId?.firstName} {selectedAppointment.doctorId?.lastName}</p>
                    <p><span className="font-medium">Specialization:</span> {selectedAppointment.doctorId?.doctorInfo?.specialization}</p>
                    <p><span className="font-medium">Date:</span> {formatDate(selectedAppointment.appointmentDate)}</p>
                    <p><span className="font-medium">Time:</span> {selectedAppointment.appointmentTime}</p>
                    <p><span className="font-medium">Status:</span> 
                      <span className={`ml-2 px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(selectedAppointment.status)}`}>
                        {selectedAppointment.status}
                      </span>
                    </p>
                  </div>
                </div>

                {/* Medical Info */}
                <div className="bg-gray-50 rounded-lg p-4">
                  <h4 className="font-medium text-gray-900 mb-2">Medical Information</h4>
                  <div className="space-y-2 text-sm">
                    <p><span className="font-medium">Symptoms:</span> {selectedAppointment.patientDetails?.symptoms}</p>
                    <p><span className="font-medium">Urgency:</span> 
                      <span className={`ml-2 px-2 py-1 rounded-full text-xs font-medium ${
                        selectedAppointment.patientDetails?.urgency === 'high' ? 'bg-red-100 text-red-800' :
                        selectedAppointment.patientDetails?.urgency === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-green-100 text-green-800'
                      }`}>
                        {selectedAppointment.patientDetails?.urgency}
                      </span>
                    </p>
                    {selectedAppointment.patientDetails?.notes && (
                      <p><span className="font-medium">Notes:</span> {selectedAppointment.patientDetails.notes}</p>
                    )}
                    <p><span className="font-medium">Consultation Fee:</span> ₹{selectedAppointment.consultationFee}</p>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex justify-end space-x-3 pt-4">
                  <button
                    onClick={() => setShowPatientModal(false)}
                    className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                  >
                    Close
                  </button>
                  <button
                    className="px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700"
                  >
                    Update Status
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// Analytics Tab Component
const AnalyticsTab = ({ hospitalInfo }) => {
  const [analyticsData, setAnalyticsData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAnalyticsData();
  }, [hospitalInfo]);

  const loadAnalyticsData = async () => {
    if (!hospitalInfo?._id) return;
    
    try {
      setLoading(true);
      const response = await hospitalService.getHospitalDashboard(hospitalInfo._id);
      setAnalyticsData(response.data.data.analytics);
    } catch (error) {
      console.error('Failed to load analytics:', error);
      toast.error('Failed to load analytics data');
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR'
    }).format(amount);
  };

  const getMonthName = (monthNum) => {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 
                   'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return months[monthNum - 1];
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6 text-center">
        <div className="loading-spinner mx-auto mb-2"></div>
        <p>Loading analytics...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Key Metrics */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Key Performance Metrics</h3>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="text-center p-4 border border-gray-200 rounded-lg bg-blue-50">
            <p className="text-3xl font-bold text-blue-600">{analyticsData?.totalAppointments || 0}</p>
            <p className="text-sm text-gray-600">Total Appointments</p>
          </div>
          <div className="text-center p-4 border border-gray-200 rounded-lg bg-green-50">
            <p className="text-3xl font-bold text-green-600">{analyticsData?.completedAppointments || 0}</p>
            <p className="text-sm text-gray-600">Completed</p>
          </div>
          <div className="text-center p-4 border border-gray-200 rounded-lg bg-purple-50">
            <p className="text-3xl font-bold text-purple-600">
              {analyticsData?.totalAppointments > 0 
                ? Math.round((analyticsData.completedAppointments / analyticsData.totalAppointments) * 100)
                : 0}%
            </p>
            <p className="text-sm text-gray-600">Completion Rate</p>
          </div>
          <div className="text-center p-4 border border-gray-200 rounded-lg bg-yellow-50">
            <div className="flex items-center justify-center mb-2">
              <StarIcon className="w-5 h-5 text-yellow-400 mr-1" />
              <p className="text-3xl font-bold text-yellow-600">{hospitalInfo?.stats?.averageRating || 0}</p>
            </div>
            <p className="text-sm text-gray-600">Average Rating</p>
          </div>
        </div>
      </div>

      {/* Revenue Analytics */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Revenue Analytics</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="text-center p-4 border border-gray-200 rounded-lg">
            <p className="text-2xl font-bold text-gray-900">
              {formatCurrency(analyticsData?.revenueAnalytics?.totalRevenue || 0)}
            </p>
            <p className="text-sm text-gray-500">Total Revenue</p>
          </div>
          <div className="text-center p-4 border border-gray-200 rounded-lg">
            <p className="text-2xl font-bold text-green-600">
              {formatCurrency(analyticsData?.revenueAnalytics?.completedRevenue || 0)}
            </p>
            <p className="text-sm text-gray-500">Completed Revenue</p>
          </div>
          <div className="text-center p-4 border border-gray-200 rounded-lg">
            <p className="text-2xl font-bold text-yellow-600">
              {formatCurrency(analyticsData?.revenueAnalytics?.pendingRevenue || 0)}
            </p>
            <p className="text-sm text-gray-500">Pending Revenue</p>
          </div>
        </div>
      </div>

      {/* Appointments by Status */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Appointments by Status</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {analyticsData?.appointmentsByStatus?.map((status) => (
            <div key={status._id} className="text-center p-4 border border-gray-200 rounded-lg">
              <p className="text-xl font-bold text-gray-900">{status.count}</p>
              <p className="text-sm text-gray-500 capitalize">{status._id}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Doctor Performance */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Doctor Performance</h3>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Doctor
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Specialization
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Total Appointments
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Completed
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Completion Rate
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Revenue
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {analyticsData?.appointmentsByDoctor?.map((doctor) => (
                <tr key={doctor._id}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {doctor.doctorName}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {doctor.specialization}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {doctor.totalAppointments}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {doctor.completedAppointments}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {Math.round(doctor.completionRate || 0)}%
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {formatCurrency(doctor.totalRevenue)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Monthly Trends */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Monthly Appointment Trends</h3>
        <div className="space-y-4">
          {analyticsData?.appointmentsByMonth?.map((month) => (
            <div key={`${month._id.year}-${month._id.month}`} className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
              <span className="font-medium">
                {getMonthName(month._id.month)} {month._id.year}
              </span>
              <div className="flex items-center">
                <div className="w-32 bg-gray-200 rounded-full h-2 mr-3">
                  <div 
                    className="bg-blue-600 h-2 rounded-full" 
                    style={{ 
                      width: `${Math.min((month.count / Math.max(...(analyticsData.appointmentsByMonth?.map(m => m.count) || [1]))) * 100, 100)}%` 
                    }}
                  ></div>
                </div>
                <span className="font-semibold text-gray-900">{month.count}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Patient Demographics */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Patient Demographics (by Urgency)</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {analyticsData?.patientDemographics?.map((demo) => (
            <div key={demo._id} className="text-center p-4 border border-gray-200 rounded-lg">
              <p className="text-xl font-bold text-gray-900">{demo.count}</p>
              <p className="text-sm text-gray-500 capitalize">{demo._id || 'Not specified'}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Recent Activity */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Activity (Last 7 Days)</h3>
        <div className="space-y-3">
          {analyticsData?.recentActivity?.map((activity) => (
            <div key={activity._id} className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
              <span className="font-medium">{new Date(activity._id).toLocaleDateString()}</span>
              <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium">
                {activity.count} appointments
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Bed Occupancy */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Bed Occupancy</h3>
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <span className="text-gray-600">Total Beds</span>
            <span className="font-semibold">{hospitalInfo?.totalBeds || 0}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-gray-600">Available Beds</span>
            <span className="font-semibold text-green-600">{hospitalInfo?.availableBeds || 0}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-gray-600">Occupied Beds</span>
            <span className="font-semibold text-red-600">
              {(hospitalInfo?.totalBeds || 0) - (hospitalInfo?.availableBeds || 0)}
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-3">
            <div 
              className="bg-blue-600 h-3 rounded-full transition-all duration-300" 
              style={{ 
                width: `${hospitalInfo?.totalBeds ? 
                  ((hospitalInfo.totalBeds - hospitalInfo.availableBeds) / hospitalInfo.totalBeds) * 100 : 0}%` 
              }}
            ></div>
          </div>
          <div className="text-center text-sm text-gray-600">
            {hospitalInfo?.totalBeds ? 
              Math.round(((hospitalInfo.totalBeds - hospitalInfo.availableBeds) / hospitalInfo.totalBeds) * 100) : 0}% Occupancy
          </div>
        </div>
      </div>
    </div>
  );
};

// Quick Add Doctor Modal Component
const QuickAddDoctorModal = ({ onClose, onSuccess }) => {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    password: 'password123', // Default password
    doctorInfo: {
      specialization: 'General Medicine',
      qualification: 'MBBS',
      experience: '1',
      consultationFee: '500',
      isAvailable: true
    }
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      await hospitalService.addDoctor(formData);
      onSuccess();
    } catch (error) {
      console.error('Quick add doctor error:', error);
      toast.error(error.response?.data?.message || 'Failed to add doctor');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-10 mx-auto p-5 border w-full max-w-md shadow-lg rounded-md bg-white">
        <div className="mt-3">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-medium text-gray-900">Quick Add Doctor</h3>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
              <XCircleIcon className="h-6 w-6" />
            </button>
          </div>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <input
                type="text"
                placeholder="First Name"
                required
                value={formData.firstName}
                onChange={(e) => setFormData(prev => ({ ...prev, firstName: e.target.value }))}
                className="input-field"
              />
              <input
                type="text"
                placeholder="Last Name"
                required
                value={formData.lastName}
                onChange={(e) => setFormData(prev => ({ ...prev, lastName: e.target.value }))}
                className="input-field"
              />
            </div>
            
            <input
              type="email"
              placeholder="Email"
              required
              value={formData.email}
              onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
              className="input-field"
            />
            
            <input
              type="tel"
              placeholder="Phone"
              required
              value={formData.phone}
              onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
              className="input-field"
            />
            
            <select
              value={formData.doctorInfo.specialization}
              onChange={(e) => setFormData(prev => ({
                ...prev,
                doctorInfo: { ...prev.doctorInfo, specialization: e.target.value }
              }))}
              className="input-field"
            >
              <option value="General Medicine">General Medicine</option>
              <option value="Cardiology">Cardiology</option>
              <option value="Neurology">Neurology</option>
              <option value="Orthopedics">Orthopedics</option>
              <option value="Pediatrics">Pediatrics</option>
            </select>

            <div className="flex justify-end space-x-3 pt-4">
              <button type="button" onClick={onClose} className="btn-secondary">
                Cancel
              </button>
              <button type="submit" disabled={loading} className="btn-primary">
                {loading ? 'Adding...' : 'Add Doctor'}
              </button>
            </div>
          </form>
          
          <p className="text-xs text-gray-500 mt-2">
            For detailed doctor management, use the Doctors tab.
          </p>
        </div>
      </div>
    </div>
  );
};

// Quick Update Hospital Modal Component
const QuickUpdateHospitalModal = ({ hospitalInfo, onClose, onSuccess }) => {
  const [formData, setFormData] = useState({
    totalBeds: hospitalInfo?.totalBeds || '',
    availableBeds: hospitalInfo?.availableBeds || '',
    phone: hospitalInfo?.phone || ''
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      await hospitalService.updateHospital(hospitalInfo._id, {
        totalBeds: parseInt(formData.totalBeds),
        availableBeds: parseInt(formData.availableBeds),
        phone: formData.phone
      });
      onSuccess();
    } catch (error) {
      console.error('Quick update hospital error:', error);
      toast.error(error.response?.data?.message || 'Failed to update hospital');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-20 mx-auto p-5 border w-full max-w-md shadow-lg rounded-md bg-white">
        <div className="mt-3">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-medium text-gray-900">Quick Update</h3>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
              <XCircleIcon className="h-6 w-6" />
            </button>
          </div>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Total Beds
              </label>
              <input
                type="number"
                required
                min="1"
                value={formData.totalBeds}
                onChange={(e) => setFormData(prev => ({ ...prev, totalBeds: e.target.value }))}
                className="input-field"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Available Beds
              </label>
              <input
                type="number"
                required
                min="0"
                max={formData.totalBeds}
                value={formData.availableBeds}
                onChange={(e) => setFormData(prev => ({ ...prev, availableBeds: e.target.value }))}
                className="input-field"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Phone Number
              </label>
              <input
                type="tel"
                required
                value={formData.phone}
                onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                className="input-field"
              />
            </div>

            <div className="flex justify-end space-x-3 pt-4">
              <button type="button" onClick={onClose} className="btn-secondary">
                Cancel
              </button>
              <button type="submit" disabled={loading} className="btn-primary">
                {loading ? 'Updating...' : 'Update'}
              </button>
            </div>
          </form>
          
          <p className="text-xs text-gray-500 mt-2">
            For complete hospital management, use the Hospital Info tab.
          </p>
        </div>
      </div>
    </div>
  );
};

// Quick Reports Modal Component
const QuickReportsModal = ({ hospitalInfo, dashboardData, onClose }) => {
  const generateReport = (type) => {
    const reportData = {
      hospital: hospitalInfo?.name || 'Hospital',
      date: new Date().toLocaleDateString(),
      totalAppointments: dashboardData?.recentAppointments?.length || 0,
      totalBeds: hospitalInfo?.totalBeds || 0,
      availableBeds: hospitalInfo?.availableBeds || 0,
      occupancyRate: hospitalInfo?.totalBeds ? 
        Math.round(((hospitalInfo.totalBeds - hospitalInfo.availableBeds) / hospitalInfo.totalBeds) * 100) : 0
    };

    const reportContent = `
HOSPITAL REPORT - ${type.toUpperCase()}
Generated: ${reportData.date}
Hospital: ${reportData.hospital}

SUMMARY:
- Total Appointments: ${reportData.totalAppointments}
- Total Beds: ${reportData.totalBeds}
- Available Beds: ${reportData.availableBeds}
- Occupancy Rate: ${reportData.occupancyRate}%

This is a quick report. For detailed analytics, visit the Analytics tab.
    `;

    // Create and download report
    const blob = new Blob([reportContent], { type: 'text/plain' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${reportData.hospital}_${type}_report_${new Date().toISOString().split('T')[0]}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
    
    toast.success(`${type} report downloaded successfully!`);
  };

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-20 mx-auto p-5 border w-full max-w-md shadow-lg rounded-md bg-white">
        <div className="mt-3">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-medium text-gray-900">Generate Reports</h3>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
              <XCircleIcon className="h-6 w-6" />
            </button>
          </div>
          
          <div className="space-y-3">
            <button
              onClick={() => generateReport('daily')}
              className="w-full flex items-center gap-3 p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors text-left"
            >
              <CalendarDaysIcon className="w-5 h-5 text-blue-600" />
              <div>
                <p className="font-medium">Daily Report</p>
                <p className="text-sm text-gray-600">Today's summary</p>
              </div>
            </button>
            
            <button
              onClick={() => generateReport('occupancy')}
              className="w-full flex items-center gap-3 p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors text-left"
            >
              <BuildingOfficeIcon className="w-5 h-5 text-green-600" />
              <div>
                <p className="font-medium">Bed Occupancy</p>
                <p className="text-sm text-gray-600">Current bed status</p>
              </div>
            </button>
            
            <button
              onClick={() => generateReport('appointments')}
              className="w-full flex items-center gap-3 p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors text-left"
            >
              <UserGroupIcon className="w-5 h-5 text-purple-600" />
              <div>
                <p className="font-medium">Appointments Summary</p>
                <p className="text-sm text-gray-600">Recent appointments</p>
              </div>
            </button>
          </div>
          
          <div className="flex justify-end pt-4">
            <button onClick={onClose} className="btn-secondary">
              Close
            </button>
          </div>
          
          <p className="text-xs text-gray-500 mt-2">
            For detailed analytics and reports, visit the Analytics tab.
          </p>
        </div>
      </div>
    </div>
  );
};

export default HospitalDashboard;