/**
 * Hospital Search Page Component
 * Search and filter hospitals with real-time queue information
 */

import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from 'react-query';
import { hospitalService } from '../../services/hospitalService';
import {
  MagnifyingGlassIcon,
  MapPinIcon,
  UsersIcon,
  FunnelIcon,
  BuildingOffice2Icon,
  ChevronDownIcon
} from '@heroicons/react/24/outline';
import { StarIcon as StarIconSolid } from '@heroicons/react/24/solid';

const HospitalSearch = () => {
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

  // Fetch hospitals with current filters
  const { data, isLoading, error, refetch } = useQuery(
    ['hospitals', filters],
    () => hospitalService.getHospitals(filters),
    {
      keepPreviousData: true,
      staleTime: 30000 // 30 seconds
    }
  );

  const hospitals = data?.data?.hospitals || [];
  const pagination = data?.data?.pagination || {};

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
    refetch();
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
    if (count < 10) return 'text-emerald-600 bg-emerald-50 ring-emerald-100';
    if (count < 20) return 'text-amber-600 bg-amber-50 ring-amber-100';
    return 'text-rose-600 bg-rose-50 ring-rose-100';
  };

  // Get queue status text
  const getQueueStatusText = (count) => {
    if (count < 10) return 'Low Wait Time';
    if (count < 20) return 'Medium Wait Time';
    return 'High Wait Time';
  };

  return (
    <div className="min-h-screen bg-slate-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header Section */}
        <div className="text-center max-w-2xl mx-auto mb-12">
          <h1 className="text-4xl font-bold text-slate-900 mb-4 tracking-tight">
            Find the Best Care Near You
          </h1>
          <p className="text-lg text-slate-600">
            Search top-rated hospitals, check real-time wait times, and book appointments instantly.
          </p>
        </div>

        {/* Search and Filters Card */}
        <div className="bg-white rounded-2xl shadow-soft p-6 md:p-8 border border-slate-100 transition-all duration-300 hover:shadow-lg relative overflow-hidden">
          {/* Decorative background element */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-primary-50 rounded-full -translate-y-1/2 translate-x-1/2 opacity-50 blur-3xl pointer-events-none" />
          
          <form onSubmit={handleSearch} className="relative z-10">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1 relative group">
                <MagnifyingGlassIcon className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-slate-400 group-focus-within:text-primary-500 transition-colors" />
                <input
                  type="text"
                  placeholder="Search hospitals by name, city, or specialization..."
                  value={filters.search}
                  onChange={(e) => handleFilterChange('search', e.target.value)}
                  className="w-full pl-12 pr-4 py-3.5 bg-slate-50 border-slate-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all outline-none text-slate-900 placeholder-slate-400"
                />
              </div>
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setShowFilters(!showFilters)}
                  className={`px-6 py-3.5 rounded-xl font-semibold flex items-center gap-2 transition-all ${
                    showFilters 
                      ? 'bg-slate-100 text-slate-700' 
                      : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  <FunnelIcon className="h-5 w-5" />
                  <span>Filters</span>
                  <ChevronDownIcon className={`h-4 w-4 transition-transform duration-200 ${showFilters ? 'rotate-180' : ''}`} />
                </button>
                <button
                  type="submit"
                  className="px-8 py-3.5 bg-gradient-to-r from-primary-600 to-primary-500 text-white rounded-xl font-semibold hover:shadow-lg hover:shadow-primary-500/30 hover:-translate-y-0.5 transition-all duration-300"
                >
                  Search
                </button>
              </div>
            </div>

            {/* Expanded Filters */}
            <div className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 overflow-hidden transition-all duration-300 ease-in-out ${
              showFilters ? 'mt-8 opacity-100 max-h-96' : 'mt-0 opacity-0 max-h-0'
            }`}>
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">City</label>
                <input
                  type="text"
                  placeholder="e.g. New York"
                  value={filters.city}
                  onChange={(e) => handleFilterChange('city', e.target.value)}
                  className="w-full p-3 bg-slate-50 border-slate-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none text-sm"
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">State</label>
                <input
                  type="text"
                  placeholder="e.g. NY"
                  value={filters.state}
                  onChange={(e) => handleFilterChange('state', e.target.value)}
                  className="w-full p-3 bg-slate-50 border-slate-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none text-sm"
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Hospital Type</label>
                <select
                  value={filters.type}
                  onChange={(e) => handleFilterChange('type', e.target.value)}
                  className="w-full p-3 bg-slate-50 border-slate-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none text-sm"
                >
                  <option value="">All Types</option>
                  <option value="government">Government</option>
                  <option value="private">Private</option>
                  <option value="semi_government">Semi-Government</option>
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Category</label>
                <select
                  value={filters.category}
                  onChange={(e) => handleFilterChange('category', e.target.value)}
                  className="w-full p-3 bg-slate-50 border-slate-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none text-sm"
                >
                  <option value="">All Categories</option>
                  <option value="general">General</option>
                  <option value="specialty">Specialty</option>
                  <option value="super_specialty">Super Specialty</option>
                  <option value="clinic">Clinic</option>
                </select>
              </div>

              <div className="col-span-full pt-4 border-t border-slate-100 flex flex-wrap justify-between items-center gap-4">
                <div className="flex flex-wrap items-center gap-6">
                  <div className="flex items-center gap-3">
                    <label className="text-sm font-medium text-slate-600">Sort By:</label>
                    <select
                      value={filters.sortBy}
                      onChange={(e) => handleFilterChange('sortBy', e.target.value)}
                      className="p-2 bg-transparent font-medium text-slate-900 border-none focus:ring-0 cursor-pointer hover:text-primary-600 transition-colors"
                    >
                      <option value="stats.averageRating">Rating</option>
                      <option value="name">Name</option>
                      <option value="createdAt">Newest</option>
                    </select>
                  </div>
                  <div className="flex items-center gap-3">
                    <label className="text-sm font-medium text-slate-600">Order:</label>
                    <select
                      value={filters.sortOrder}
                      onChange={(e) => handleFilterChange('sortOrder', e.target.value)}
                      className="p-2 bg-transparent font-medium text-slate-900 border-none focus:ring-0 cursor-pointer hover:text-primary-600 transition-colors"
                    >
                      <option value="desc">High to Low</option>
                      <option value="asc">Low to High</option>
                    </select>
                  </div>
                </div>

                <button
                  onClick={clearFilters}
                  className="text-sm font-medium text-slate-500 hover:text-red-600 transition-colors"
                >
                  Reset Filters
                </button>
              </div>
            </div>
          </form>
        </div>

        {/* Results Section */}
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <div className="w-12 h-12 border-4 border-primary-100 border-t-primary-600 rounded-full animate-spin mb-4"></div>
            <span className="text-slate-500 font-medium animate-pulse">Finding best hospitals...</span>
          </div>
        ) : error ? (
          <div className="text-center py-20 bg-white rounded-2xl shadow-sm border border-slate-100">
            <div className="w-16 h-16 bg-red-50 text-red-500 rounded-full flex items-center justify-center mx-auto mb-4">
              <BuildingOffice2Icon className="w-8 h-8" />
            </div>
            <h3 className="text-lg font-bold text-slate-900 mb-2">Something went wrong</h3>
            <p className="text-slate-500 mb-6">We couldn't load the hospital list. Please try again.</p>
            <button onClick={refetch} className="px-6 py-2.5 bg-slate-900 text-white rounded-lg hover:bg-slate-800 transition-colors">
              Retry Search
            </button>
          </div>
        ) : hospitals.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-2xl shadow-sm border border-slate-100">
            <div className="w-16 h-16 bg-slate-50 text-slate-400 rounded-full flex items-center justify-center mx-auto mb-4">
              <MagnifyingGlassIcon className="w-8 h-8" />
            </div>
            <h3 className="text-lg font-bold text-slate-900 mb-2">No hospitals found</h3>
            <p className="text-slate-500 mb-6 max-w-md mx-auto">We couldn't find any hospitals matching your criteria. Try adjusting your filters or search term.</p>
            <button onClick={clearFilters} className="px-6 py-2.5 bg-primary-50 text-primary-600 rounded-lg hover:bg-primary-100 transition-colors font-medium">
              Clear All Filters
            </button>
          </div>
        ) : (
          <>
            {/* Results Header */}
            <div className="flex justify-between items-end px-2">
              <div>
                <h2 className="text-xl font-bold text-slate-900">Search Results</h2>
                <p className="text-slate-500 text-sm mt-1">
                  Showing <span className="font-semibold text-slate-900">{hospitals.length}</span> of {pagination.total} hospitals
                </p>
              </div>
            </div>

            {/* Hospital Cards Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {hospitals.map((hospital) => (
                <div key={hospital._id} className="group bg-white rounded-2xl p-6 shadow-soft hover:shadow-glow border border-slate-100 transition-all duration-300 hover:-translate-y-1 relative overflow-hidden flex flex-col h-full">
                  {/* Card Header */}
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex-1 min-w-0 pr-4">
                      <h3 className="text-lg font-bold text-slate-900 mb-1 truncate group-hover:text-primary-600 transition-colors">
                        {hospital.name}
                      </h3>
                      <div className="flex items-center text-sm text-slate-500">
                        <MapPinIcon className="h-4 w-4 mr-1 flex-shrink-0 text-slate-400" />
                        <span className="truncate">{hospital.address.city}, {hospital.address.state}</span>
                      </div>
                    </div>
                    <div className="flex flex-col items-end">
                      <div className="flex items-center gap-1 bg-amber-50 px-2 py-1 rounded-lg border border-amber-100">
                        <StarIconSolid className="h-4 w-4 text-amber-400" />
                        <span className="text-sm font-bold text-amber-700">
                          {hospital.stats.averageRating.toFixed(1)}
                        </span>
                      </div>
                      <span className="text-[10px] text-slate-400 mt-1">{hospital.stats.totalRatings} reviews</span>
                    </div>
                  </div>

                  {/* Tags */}
                  <div className="flex flex-wrap gap-2 mb-6">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-600 capitalize">
                      {hospital.type.replace('_', ' ')}
                    </span>
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-50 text-blue-600 capitalize">
                      {hospital.category.replace('_', ' ')}
                    </span>
                  </div>

                  {/* Queue Status Box */}
                  <div className={`mb-6 p-4 rounded-xl border ${
                    hospital.currentQueueCount < 10 
                      ? 'bg-emerald-50/50 border-emerald-100' 
                      : hospital.currentQueueCount < 20
                      ? 'bg-amber-50/50 border-amber-100'
                      : 'bg-rose-50/50 border-rose-100'
                  }`}>
                    <div className="flex justify-between items-center mb-2">
                      <div className="flex items-center gap-2">
                        <div className={`w-2 h-2 rounded-full ${
                          hospital.currentQueueCount < 10 ? 'bg-emerald-500' : hospital.currentQueueCount < 20 ? 'bg-amber-500' : 'bg-rose-500'
                        } animate-pulse`} />
                        <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Live Status</span>
                      </div>
                      <span className={`text-xs font-bold px-2 py-0.5 rounded-full ring-1 ring-inset ${getQueueStatusColor(hospital.currentQueueCount)}`}>
                        {getQueueStatusText(hospital.currentQueueCount)}
                      </span>
                    </div>
                    
                    <div className="flex items-end justify-between">
                      <div>
                        <div className="flex items-baseline gap-1">
                          <span className="text-2xl font-bold text-slate-900">{hospital.currentQueueCount}</span>
                          <span className="text-sm text-slate-500 font-medium">patients</span>
                        </div>
                        <p className="text-xs text-slate-400 mt-0.5">Currently waiting</p>
                      </div>
                      <UsersIcon className={`h-8 w-8 opacity-20 ${
                        hospital.currentQueueCount < 10 ? 'text-emerald-600' : hospital.currentQueueCount < 20 ? 'text-amber-600' : 'text-rose-600'
                      }`} />
                    </div>
                  </div>

                  {/* Spacer to push button to bottom */}
                  <div className="flex-1" />

                  {/* Departments Preview (Optional, space permitting) */}
                  {hospital.departments && hospital.departments.length > 0 && (
                    <div className="mb-4">
                      <p className="text-xs font-medium text-slate-400 mb-2 uppercase tracking-wider">Top Departments</p>
                      <div className="flex flex-wrap gap-1.5">
                        {hospital.departments.slice(0, 3).map((dept, index) => (
                          <span
                            key={index}
                            className="inline-block px-2 py-1 bg-slate-50 text-slate-600 text-[10px] font-medium rounded-md border border-slate-100"
                          >
                            {dept.name}
                          </span>
                        ))}
                        {hospital.departments.length > 3 && (
                          <span className="inline-block px-2 py-1 text-slate-400 text-[10px] font-medium">
                            +{hospital.departments.length - 3} more
                          </span>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Action Button */}
                  <Link
                    to={`/hospitals/${hospital._id}`}
                    className="block w-full text-center py-3 bg-white border border-primary-200 text-primary-600 font-semibold rounded-xl hover:bg-primary-50 hover:border-primary-300 transition-all duration-200 shadow-sm"
                  >
                    View Details & Book
                  </Link>
                </div>
              ))}
            </div>

            {/* Pagination */}
            {pagination.pages > 1 && (
              <div className="flex justify-center items-center gap-2 mt-12">
                <button
                  onClick={() => handleFilterChange('page', Math.max(1, filters.page - 1))}
                  disabled={filters.page === 1}
                  className="px-4 py-2 border border-slate-200 rounded-lg text-sm font-medium text-slate-600 hover:bg-white hover:text-primary-600 hover:border-primary-200 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                >
                  Previous
                </button>

                <div className="flex gap-1">
                  {Array.from({ length: Math.min(5, pagination.pages) }, (_, i) => {
                    const page = i + 1;
                    return (
                      <button
                        key={page}
                        onClick={() => handleFilterChange('page', page)}
                        className={`w-10 h-10 rounded-lg text-sm font-bold transition-all ${
                          filters.page === page
                            ? 'bg-primary-600 text-white shadow-lg shadow-primary-500/30'
                            : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 hover:border-slate-300'
                        }`}
                      >
                        {page}
                      </button>
                    );
                  })}
                </div>

                <button
                  onClick={() => handleFilterChange('page', Math.min(pagination.pages, filters.page + 1))}
                  disabled={filters.page === pagination.pages}
                  className="px-4 py-2 border border-slate-200 rounded-lg text-sm font-medium text-slate-600 hover:bg-white hover:text-primary-600 hover:border-primary-200 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                >
                  Next
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default HospitalSearch;
