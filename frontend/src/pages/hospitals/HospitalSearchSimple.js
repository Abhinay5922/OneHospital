/**
 * Hospital Search Page Component (Simple Version)
 * Search and filter hospitals without React Query
 */

import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { hospitalService } from '../../services/hospitalService';
import {
  MagnifyingGlassIcon,
  MapPinIcon,
  StarIcon,
  ClockIcon,
  UsersIcon,
  FunnelIcon
} from '@heroicons/react/24/outline';

const HospitalSearchSimple = () => {
  const [hospitals, setHospitals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filters, setFilters] = useState({
    search: '',
    city: '',
    state: '',
    type: '',
    category: '',
    sortBy: 'stats.averageRating',
    sortOrder: 'desc',
    page: 1,
    limit: 12
  });
  const [showFilters, setShowFilters] = useState(false);
  const [pagination, setPagination] = useState({});

  // Fetch hospitals when component mounts or filters change
  useEffect(() => {
    fetchHospitals();
  }, [filters]);

  const fetchHospitals = async () => {
    try {
      setLoading(true);
      setError(null);
      
      console.log('🏥 Fetching hospitals with filters:', filters);
      
      const response = await hospitalService.getHospitals(filters);
      
      console.log('🏥 Hospital service response:', response);
      
      if (response.data?.success) {
        const hospitals = response.data.data.hospitals || [];
        console.log('🏥 Hospitals received:', hospitals.length);
        setHospitals(hospitals);
        setPagination(response.data.data.pagination || {});
      } else {
        console.error('🏥 Hospital fetch failed - API returned success: false');
        setError('Failed to fetch hospitals - API error');
      }
    } catch (err) {
      console.error('🏥 Error fetching hospitals:', err);
      console.error('🏥 Error details:', {
        message: err.message,
        response: err.response?.data,
        status: err.response?.status
      });
      
      let errorMessage = 'Failed to fetch hospitals';
      
      if (err.response?.status === 500) {
        errorMessage = 'Server error - please try again later';
      } else if (err.response?.status === 404) {
        errorMessage = 'Hospital service not found';
      } else if (err.message.includes('timeout')) {
        errorMessage = 'Request timeout - please check your connection';
      } else if (err.message.includes('Network Error')) {
        errorMessage = 'Network error - please check if the backend server is running';
      } else if (err.response?.data?.message) {
        errorMessage = err.response.data.message;
      }
      
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // Handle filter changes
  const handleFilterChange = (key, value) => {
    setFilters(prev => ({
      ...prev,
      [key]: value,
      page: 1 // Reset to first page when filters change
    }));
  };

  // Handle search
  const handleSearch = (e) => {
    e.preventDefault();
    fetchHospitals();
  };

  // Clear all filters
  const clearFilters = () => {
    setFilters({
      search: '',
      city: '',
      state: '',
      type: '',
      category: '',
      sortBy: 'stats.averageRating',
      sortOrder: 'desc',
      page: 1,
      limit: 12
    });
  };

  // Get queue status color
  const getQueueStatusColor = (count) => {
    if (count < 10) return 'text-green-600 bg-green-100';
    if (count < 20) return 'text-yellow-600 bg-yellow-100';
    return 'text-red-600 bg-red-100';
  };

  // Get queue status text
  const getQueueStatusText = (count) => {
    if (count < 10) return 'Low Queue';
    if (count < 20) return 'Medium Queue';
    return 'High Queue';
  };

  return (
    <div className="max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Find Hospitals</h1>
        <p className="text-gray-600">
          Search and compare hospitals based on location, specialization, and real-time availability
        </p>
      </div>

      {/* Search and Filters */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-8">
        {/* Search Bar */}
        <form onSubmit={handleSearch} className="mb-4">
          <div className="flex gap-4">
            <div className="flex-1 relative">
              <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search hospitals by name, city, or specialization..."
                value={filters.search}
                onChange={(e) => handleFilterChange('search', e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <button
              type="submit"
              className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:ring-2 focus:ring-blue-500"
            >
              Search
            </button>
            <button
              type="button"
              onClick={() => setShowFilters(!showFilters)}
              className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50 flex items-center gap-2"
            >
              <FunnelIcon className="h-5 w-5" />
              Filters
            </button>
          </div>
        </form>

        {/* Advanced Filters */}
        {showFilters && (
          <div className="border-t pt-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  City
                </label>
                <input
                  type="text"
                  placeholder="Enter city"
                  value={filters.city}
                  onChange={(e) => handleFilterChange('city', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  State
                </label>
                <input
                  type="text"
                  placeholder="Enter state"
                  value={filters.state}
                  onChange={(e) => handleFilterChange('state', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Hospital Type
                </label>
                <select
                  value={filters.type}
                  onChange={(e) => handleFilterChange('type', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">All Types</option>
                  <option value="government">Government</option>
                  <option value="private">Private</option>
                  <option value="semi_government">Semi-Government</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Category
                </label>
                <select
                  value={filters.category}
                  onChange={(e) => handleFilterChange('category', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">All Categories</option>
                  <option value="general">General</option>
                  <option value="specialty">Specialty</option>
                  <option value="super_specialty">Super Specialty</option>
                  <option value="clinic">Clinic</option>
                </select>
              </div>
            </div>

            <div className="flex justify-between items-center">
              <div className="flex items-center gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Sort By
                  </label>
                  <select
                    value={filters.sortBy}
                    onChange={(e) => handleFilterChange('sortBy', e.target.value)}
                    className="px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="stats.averageRating">Rating</option>
                    <option value="name">Name</option>
                    <option value="createdAt">Newest</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Order
                  </label>
                  <select
                    value={filters.sortOrder}
                    onChange={(e) => handleFilterChange('sortOrder', e.target.value)}
                    className="px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="desc">High to Low</option>
                    <option value="asc">Low to High</option>
                  </select>
                </div>
              </div>

              <button
                onClick={clearFilters}
                className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50"
              >
                Clear Filters
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Results */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mr-3"></div>
          <span>Loading hospitals...</span>
        </div>
      ) : error ? (
        <div className="text-center py-12">
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            <p className="font-semibold">Error loading hospitals</p>
            <p>{error}</p>
            <div className="mt-2 text-sm">
              <p>🔧 Troubleshooting:</p>
              <p>• Check browser console (F12) for detailed errors</p>
              <p>• Verify backend server is running on port 5000</p>
              <p>• Check network connectivity</p>
            </div>
          </div>
          <div className="space-x-2">
            <button 
              onClick={fetchHospitals} 
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              Retry
            </button>
            <button 
              onClick={() => {
                console.log('🔍 Debug Info:');
                console.log('API Base URL:', process.env.REACT_APP_API_URL || 'http://localhost:5000/api');
                console.log('Current filters:', filters);
                console.log('Error details:', error);
                alert('Debug info logged to console. Press F12 to view.');
              }}
              className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700"
            >
              Debug Info
            </button>
          </div>
        </div>
      ) : hospitals.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-600 mb-4">No hospitals found matching your criteria.</p>
          <button onClick={clearFilters} className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700">
            Clear Filters
          </button>
        </div>
      ) : (
        <>
          {/* Results Header */}
          <div className="flex justify-between items-center mb-6">
            <p className="text-gray-600">
              Showing {hospitals.length} of {pagination.total || hospitals.length} hospitals
            </p>
            {pagination.pages > 1 && (
              <div className="text-sm text-gray-500">
                Page {pagination.current || 1} of {pagination.pages}
              </div>
            )}
          </div>

          {/* Hospital Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
            {hospitals.map((hospital) => (
              <div key={hospital._id} className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow">
                {/* Hospital Header */}
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-1">
                      {hospital.name}
                    </h3>
                    <div className="flex items-center text-sm text-gray-600 mb-2">
                      <MapPinIcon className="h-4 w-4 mr-1" />
                      {hospital.address?.city}, {hospital.address?.state}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="flex items-center mb-1">
                      <StarIcon className="h-4 w-4 text-yellow-400 mr-1" />
                      <span className="text-sm font-medium">
                        {hospital.stats?.averageRating?.toFixed(1) || '0.0'}
                      </span>
                    </div>
                    <div className="text-xs text-gray-500">
                      {hospital.stats?.totalRatings || 0} reviews
                    </div>
                  </div>
                </div>

                {/* Hospital Info */}
                <div className="space-y-2 mb-4">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Type:</span>
                    <span className="font-medium capitalize">
                      {hospital.type?.replace('_', ' ')}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Category:</span>
                    <span className="font-medium capitalize">
                      {hospital.category?.replace('_', ' ')}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Total Beds:</span>
                    <span className="font-medium">{hospital.totalBeds}</span>
                  </div>
                </div>

                {/* Queue Status */}
                <div className="flex items-center justify-between mb-4 p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center">
                    <UsersIcon className="h-5 w-5 text-gray-400 mr-2" />
                    <span className="text-sm text-gray-600">Current Queue:</span>
                  </div>
                  <div className="flex items-center">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getQueueStatusColor(hospital.currentQueueCount || 0)}`}>
                      {hospital.currentQueueCount || 0} patients
                    </span>
                  </div>
                </div>

                {/* Queue Status Badge */}
                <div className="mb-4">
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getQueueStatusColor(hospital.currentQueueCount || 0)}`}>
                    <ClockIcon className="h-3 w-3 mr-1" />
                    {getQueueStatusText(hospital.currentQueueCount || 0)}
                  </span>
                </div>

                {/* Departments */}
                {hospital.departments && hospital.departments.length > 0 && (
                  <div className="mb-4">
                    <p className="text-sm text-gray-600 mb-2">Departments:</p>
                    <div className="flex flex-wrap gap-1">
                      {hospital.departments.slice(0, 3).map((dept, index) => (
                        <span
                          key={index}
                          className="inline-block px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded"
                        >
                          {dept.name}
                        </span>
                      ))}
                      {hospital.departments.length > 3 && (
                        <span className="inline-block px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded">
                          +{hospital.departments.length - 3} more
                        </span>
                      )}
                    </div>
                  </div>
                )}

                {/* Action Button */}
                <Link
                  to={`/hospitals/${hospital._id}`}
                  className="block w-full text-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                >
                  View Details & Book
                </Link>
              </div>
            ))}
          </div>

          {/* Pagination */}
          {pagination.pages > 1 && (
            <div className="flex justify-center items-center space-x-2">
              <button
                onClick={() => handleFilterChange('page', Math.max(1, filters.page - 1))}
                disabled={filters.page === 1}
                className="px-3 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Previous
              </button>

              {Array.from({ length: Math.min(5, pagination.pages) }, (_, i) => {
                const page = i + 1;
                return (
                  <button
                    key={page}
                    onClick={() => handleFilterChange('page', page)}
                    className={`px-3 py-2 border rounded-md text-sm font-medium ${
                      filters.page === page
                        ? 'bg-blue-600 text-white border-blue-600'
                        : 'border-gray-300 text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    {page}
                  </button>
                );
              })}

              <button
                onClick={() => handleFilterChange('page', Math.min(pagination.pages, filters.page + 1))}
                disabled={filters.page === pagination.pages}
                className="px-3 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Next
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default HospitalSearchSimple;