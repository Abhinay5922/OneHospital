/**
 * Home Page Component
 * Landing page with hero section and key features
 */

import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { statsService } from '../services/statsService';
import {
  MagnifyingGlassIcon,
  ClockIcon,
  StarIcon,
  UserGroupIcon,
  CalendarDaysIcon,
  ChartBarIcon,
  ArrowRightIcon,
  ShieldCheckIcon
} from '@heroicons/react/24/outline';

const Home = () => {
  const { isAuthenticated, user, loading } = useAuth();
  const [stats, setStats] = useState({
    hospitals: '0',
    doctors: '0',
    patients: '0',
    appointments: '0'
  });
  const [statsLoading, setStatsLoading] = useState(true);

  // Fetch real statistics
  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await statsService.getPlatformStats();
        if (response.data.success) {
          const data = response.data.data;
          setStats({
            hospitals: data.hospitals.display,
            doctors: data.doctors.display,
            patients: data.patients.display,
            appointments: data.appointments.display
          });
        }
      } catch (error) {
        console.error('Failed to fetch stats:', error);
        // Keep default values if API fails
      } finally {
        setStatsLoading(false);
      }
    };

    fetchStats();
  }, []);

  // Helper function to get correct dashboard route based on user role
  const getDashboardRoute = (role) => {
    switch (role) {
      case 'patient':
        return '/hospitals';
      case 'doctor':
        return '/dashboard/doctor';
      case 'hospital_admin':
        return '/dashboard/hospital';
      case 'super_admin':
        return '/dashboard/admin';
      default:
        return '/hospitals';
    }
  };

  const features = [
    {
      icon: MagnifyingGlassIcon,
      title: 'Find Hospitals',
      description: 'Search and compare hospitals based on location, specialization, and ratings.',
      color: 'bg-blue-50 text-blue-600'
    },
    {
      icon: ClockIcon,
      title: 'Real-time Queue',
      description: 'See live waiting times and queue status before visiting the hospital.',
      color: 'bg-emerald-50 text-emerald-600'
    },
    {
      icon: CalendarDaysIcon,
      title: 'Easy Booking',
      description: 'Book appointments online and get instant confirmation with token numbers.',
      color: 'bg-violet-50 text-violet-600'
    },
    {
      icon: StarIcon,
      title: 'Rate & Review',
      description: 'Share your experience and help others make informed decisions.',
      color: 'bg-amber-50 text-amber-600'
    },
    {
      icon: UserGroupIcon,
      title: 'Multi-Hospital',
      description: 'Access multiple hospitals through a single unified platform.',
      color: 'bg-cyan-50 text-cyan-600'
    },
    {
      icon: ChartBarIcon,
      title: 'Smart Analytics',
      description: 'Get insights on hospital performance and patient satisfaction.',
      color: 'bg-rose-50 text-rose-600'
    }
  ];

  const statsData = [
    { label: 'Hospitals Partnered', value: stats.hospitals, icon: BuildingOffice2Icon, color: 'text-blue-600', bg: 'bg-blue-100' },
    { label: 'Expert Doctors', value: stats.doctors, icon: UserGroupIcon, color: 'text-emerald-600', bg: 'bg-emerald-100' },
    { label: 'Happy Patients', value: stats.patients, icon: ShieldCheckIcon, color: 'text-violet-600', bg: 'bg-violet-100' },
    { label: 'Appointments', value: stats.appointments, icon: CalendarDaysIcon, color: 'text-amber-600', bg: 'bg-amber-100' }
  ];

  // Helper component for Stat Icon
  function BuildingOffice2Icon({ className }) {
    return (
      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 21h19.5m-18-18v18m10.5-18v18m6-13.5V21M6.75 6.75h.75m-.75 3h.75m-.75 3h.75m3-6h.75m-.75 3h.75m-.75 3h.75M6.75 21v-3.375c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21M3 3h12m-.75 4.5H21m-3.75 3.75h.008v.008h-.008v-.008zm0 3h.008v.008h-.008v-.008zm0 3h.008v.008h-.008v-.008z" />
      </svg>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 font-sans">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-white">
        <div className="absolute inset-0 bg-gradient-to-br from-primary-50 to-white z-0" />
        <div className="absolute right-0 top-0 w-1/2 h-full bg-gradient-to-l from-primary-100/30 to-transparent transform skew-x-12 z-0" />
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 pt-20 pb-24 md:pt-32 md:pb-32">
          <div className="text-center max-w-4xl mx-auto">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary-50 border border-primary-100 text-primary-700 text-sm font-semibold mb-8 animate-fade-in-up">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-primary-500"></span>
              </span>
              No.1 Smart Hospital Management System
            </div>
            
            <h1 className="text-5xl md:text-7xl font-bold mb-8 text-slate-900 tracking-tight leading-tight">
              Healthcare Made <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary-600 to-teal-500">Simple</span> & <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary-600 to-teal-500">Smart</span>
            </h1>
            
            <p className="text-xl md:text-2xl mb-12 text-slate-600 max-w-2xl mx-auto leading-relaxed">
              Find the right hospital, book appointments instantly, and track real-time queues. 
              Your complete healthcare journey, simplified.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              {loading ? (
                <div className="px-8 py-4 rounded-xl bg-slate-100 text-slate-400 font-semibold animate-pulse">
                  Loading...
                </div>
              ) : isAuthenticated ? (
                <Link
                  to={getDashboardRoute(user?.role)}
                  className="group relative px-8 py-4 bg-primary-600 text-white rounded-xl font-bold text-lg shadow-lg shadow-primary-500/30 hover:shadow-primary-500/50 hover:-translate-y-1 transition-all duration-300 overflow-hidden"
                >
                  <span className="relative z-10 flex items-center gap-2">
                    {user?.role === 'patient' ? 'Find Hospitals Now' : 'Go to Dashboard'}
                    <ArrowRightIcon className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
                  </span>
                  <div className="absolute inset-0 bg-gradient-to-r from-primary-700 to-primary-600 transform scale-x-0 group-hover:scale-x-100 transition-transform origin-left duration-300" />
                </Link>
              ) : (
                <>
                  <Link
                    to="/hospitals"
                    className="group relative px-8 py-4 bg-primary-600 text-white rounded-xl font-bold text-lg shadow-lg shadow-primary-500/30 hover:shadow-primary-500/50 hover:-translate-y-1 transition-all duration-300 overflow-hidden"
                  >
                    <span className="relative z-10 flex items-center gap-2">
                      Find Hospitals
                      <MagnifyingGlassIcon className="h-5 w-5 group-hover:scale-110 transition-transform" />
                    </span>
                    <div className="absolute inset-0 bg-gradient-to-r from-primary-700 to-primary-600 transform scale-x-0 group-hover:scale-x-100 transition-transform origin-left duration-300" />
                  </Link>
                  <Link
                    to="/register"
                    className="px-8 py-4 bg-white text-slate-700 border border-slate-200 rounded-xl font-bold text-lg hover:bg-slate-50 hover:border-slate-300 hover:text-primary-600 transition-all duration-300 shadow-sm hover:shadow-md"
                  >
                    Get Started
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
        
        {/* Decorative Wave */}
        <div className="absolute bottom-0 left-0 right-0">
          <svg className="fill-slate-50" viewBox="0 0 1440 120">
            <path d="M0,64L80,69.3C160,75,320,85,480,80C640,75,800,53,960,48C1120,43,1280,53,1360,58.7L1440,64L1440,120L1360,120C1280,120,1120,120,960,120C800,120,640,120,480,120C320,120,160,120,80,120L0,120Z"></path>
          </svg>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-12 bg-slate-50 relative z-10 -mt-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {statsData.map((stat, index) => (
              <div key={index} className="bg-white p-6 rounded-2xl shadow-soft border border-slate-100 hover:shadow-lg transition-all duration-300 hover:-translate-y-1 text-center group">
                <div className={`w-14 h-14 mx-auto rounded-xl flex items-center justify-center mb-4 ${stat.bg} group-hover:scale-110 transition-transform duration-300`}>
                  <stat.icon className={`w-7 h-7 ${stat.color}`} />
                </div>
                <div className="text-3xl md:text-4xl font-bold text-slate-900 mb-1">
                  {statsLoading ? (
                    <div className="animate-pulse bg-slate-200 h-8 w-20 mx-auto rounded"></div>
                  ) : (
                    stat.value
                  )}
                </div>
                <div className="text-sm font-medium text-slate-500 uppercase tracking-wide">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16 max-w-3xl mx-auto">
            <h2 className="text-sm font-bold text-primary-600 uppercase tracking-widest mb-2">Why Choose Us</h2>
            <h3 className="text-3xl md:text-4xl font-bold text-slate-900 mb-6">
              Smart Hospital Network system
            </h3>
            <p className="text-xl text-slate-600">
              Experience the future of healthcare with our comprehensive, user-friendly platform designed for everyone.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <div key={index} className="group p-8 rounded-2xl bg-slate-50 border border-slate-100 hover:bg-white hover:shadow-xl hover:shadow-primary-500/5 hover:-translate-y-1 transition-all duration-300">
                <div className={`w-14 h-14 rounded-2xl flex items-center justify-center mb-6 ${feature.color} bg-opacity-20 group-hover:scale-110 transition-transform duration-300`}>
                  <feature.icon className="w-7 h-7" />
                </div>
                <h3 className="text-xl font-bold text-slate-900 mb-3 group-hover:text-primary-600 transition-colors">
                  {feature.title}
                </h3>
                <p className="text-slate-600 leading-relaxed">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 relative overflow-hidden">
        <div className="absolute inset-0 bg-slate-900 z-0" />
        <div className="absolute inset-0 bg-gradient-to-r from-primary-900 to-slate-900 opacity-90 z-0" />
        <div className="absolute -top-24 -right-24 w-96 h-96 bg-primary-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob" />
        <div className="absolute -bottom-24 -left-24 w-96 h-96 bg-teal-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-2000" />
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
          <h2 className="text-3xl md:text-5xl font-bold text-white mb-6">
            Ready to Transform Your Healthcare Experience?
          </h2>
          <p className="text-xl text-slate-300 mb-10 max-w-2xl mx-auto">
            Join thousands of patients and healthcare providers who trust One Hospital for their medical needs.
          </p>
          
          {!isAuthenticated && !loading && (
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                to="/register?role=patient"
                className="px-8 py-4 bg-white text-primary-900 rounded-xl font-bold text-lg hover:bg-primary-50 hover:scale-105 transition-all duration-300 shadow-lg"
              >
                Register as Patient
              </Link>
              <Link
                to="/register?role=hospital_admin"
                className="px-8 py-4 bg-transparent border-2 border-white/20 text-white rounded-xl font-bold text-lg hover:bg-white/10 hover:border-white transition-all duration-300 backdrop-blur-sm"
              >
                Partner with Us
              </Link>
            </div>
          )}
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-white border-t border-slate-100 pt-16 pb-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-12">
            <div className="col-span-1 md:col-span-2">
              <div className="flex items-center space-x-2 mb-6">
                <div className="w-10 h-10 bg-gradient-to-br from-primary-600 to-teal-500 rounded-xl flex items-center justify-center text-white font-bold text-xl shadow-lg shadow-primary-500/30">
                  H
                </div>
                <span className="text-2xl font-bold text-slate-900">One Hospital</span>
              </div>
              <p className="text-slate-500 max-w-sm leading-relaxed">
                A comprehensive digital healthcare platform connecting patients with top hospitals and doctors. Smart, simple, and secure.
              </p>
            </div>
            
            <div>
              <h4 className="font-bold text-slate-900 mb-6">Quick Links</h4>
              <ul className="space-y-4 text-slate-500">
                <li><Link to="/hospitals" className="hover:text-primary-600 transition-colors">Find Hospitals</Link></li>
                <li><Link to="/login" className="hover:text-primary-600 transition-colors">Login</Link></li>
                <li><Link to="/register" className="hover:text-primary-600 transition-colors">Register</Link></li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-bold text-slate-900 mb-6">Legal</h4>
              <ul className="space-y-4 text-slate-500">
                <li><span className="cursor-pointer hover:text-primary-600 transition-colors">Privacy Policy</span></li>
                <li><span className="cursor-pointer hover:text-primary-600 transition-colors">Terms of Service</span></li>
                <li><span className="cursor-pointer hover:text-primary-600 transition-colors">Contact Support</span></li>
              </ul>
            </div>
          </div>
          
          <div className="border-t border-slate-100 pt-8 text-center">
            <p className="text-slate-400 text-sm">
              © 2025 One Hospital. Final Year MCA Project. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Home;