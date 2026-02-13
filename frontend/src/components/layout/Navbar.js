/**
 * Navigation Bar Component
 * Main navigation with user authentication and role-based menu
 */

import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { 
  Bars3Icon, 
  XMarkIcon, 
  UserCircleIcon,
  HomeIcon,
  MagnifyingGlassIcon,
  CalendarIcon,
  ChartBarIcon,
  ArrowRightOnRectangleIcon
} from '@heroicons/react/24/outline';

const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const { user, isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // Handle scroll effect
  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 10);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Close menus on route change
  useEffect(() => {
    setIsOpen(false);
    setShowUserMenu(false);
  }, [location]);

  const handleLogout = async () => {
    await logout();
    navigate('/');
    setShowUserMenu(false);
  };

  const getDashboardLink = () => {
    if (!user) return '/';
    
    switch (user.role) {
      case 'patient':
        return '/dashboard/patient';
      case 'doctor':
        return '/dashboard/doctor';
      case 'hospital_admin':
        return '/dashboard/hospital';
      case 'super_admin':
        return '/dashboard/admin';
      default:
        return '/';
    }
  };

  const getRoleDisplayName = (role) => {
    switch (role) {
      case 'patient':
        return 'Patient';
      case 'doctor':
        return 'Doctor';
      case 'hospital_admin':
        return 'Hospital Admin';
      case 'super_admin':
        return 'Super Admin';
      default:
        return 'User';
    }
  };

  const isActive = (path) => location.pathname === path;

  return (
    <nav 
      className={`sticky top-0 z-50 transition-all duration-300 ${
        scrolled 
          ? 'bg-white/90 backdrop-blur-md shadow-soft border-b border-slate-200/60' 
          : 'bg-white border-b border-slate-200'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          {/* Logo and brand */}
          <div className="flex items-center">
            <Link to="/" className="flex items-center space-x-3 group">
              <div className="w-10 h-10 bg-gradient-to-br from-primary-500 to-primary-600 rounded-xl flex items-center justify-center shadow-lg shadow-primary-500/30 group-hover:scale-105 transition-transform duration-200">
                <span className="text-white font-bold text-xl font-heading">H</span>
              </div>
              <div className="flex flex-col">
                <span className="text-xl font-bold text-slate-900 leading-none font-heading group-hover:text-primary-600 transition-colors">One Hospital</span>
                <span className="text-xs text-slate-500 font-medium tracking-wide">SMART HEALTHCARE</span>
              </div>
            </Link>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-1">
            <NavLink 
              to="/" 
              icon={<HomeIcon className="w-5 h-5" />} 
              label="Home" 
              active={isActive('/')} 
            />
            
            <NavLink 
              to="/hospitals" 
              icon={<MagnifyingGlassIcon className="w-5 h-5" />} 
              label="Find Hospitals" 
              active={isActive('/hospitals')} 
            />

            {isAuthenticated ? (
              <div className="relative ml-4">
                <button
                  onClick={() => setShowUserMenu(!showUserMenu)}
                  className="flex items-center space-x-3 pl-4 border-l border-slate-200 focus:outline-none group"
                >
                  <div className="text-right hidden lg:block">
                    <p className="text-sm font-semibold text-slate-900 group-hover:text-primary-600 transition-colors">
                      {user.firstName} {user.lastName}
                    </p>
                    <p className="text-xs text-slate-500 font-medium">
                      {getRoleDisplayName(user.role)}
                    </p>
                  </div>
                  <div className="w-10 h-10 rounded-full bg-primary-50 border-2 border-primary-100 flex items-center justify-center text-primary-600 group-hover:bg-primary-100 transition-colors">
                    <UserCircleIcon className="w-6 h-6" />
                  </div>
                </button>

                {/* Dropdown Menu */}
                {showUserMenu && (
                  <>
                    <div 
                      className="fixed inset-0 z-10" 
                      onClick={() => setShowUserMenu(false)}
                    ></div>
                    <div className="absolute right-0 mt-3 w-56 bg-white rounded-xl shadow-xl border border-slate-100 py-2 z-20 animate-slide-up origin-top-right">
                      <div className="px-4 py-3 border-b border-slate-50 lg:hidden">
                        <p className="text-sm font-semibold text-slate-900">
                          {user.firstName} {user.lastName}
                        </p>
                        <p className="text-xs text-slate-500">
                          {getRoleDisplayName(user.role)}
                        </p>
                      </div>
                      
                      <Link
                        to={getDashboardLink()}
                        className="flex items-center px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50 hover:text-primary-600 transition-colors"
                      >
                        <ChartBarIcon className="w-4 h-4 mr-3" />
                        Dashboard
                      </Link>
                      
                      <Link
                        to="/profile"
                        className="flex items-center px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50 hover:text-primary-600 transition-colors"
                      >
                        <UserCircleIcon className="w-4 h-4 mr-3" />
                        Profile
                      </Link>
                      
                      <div className="border-t border-slate-50 my-1"></div>
                      
                      <button
                        onClick={handleLogout}
                        className="flex w-full items-center px-4 py-2.5 text-sm text-danger-600 hover:bg-danger-50 transition-colors"
                      >
                        <ArrowRightOnRectangleIcon className="w-4 h-4 mr-3" />
                        Sign out
                      </button>
                    </div>
                  </>
                )}
              </div>
            ) : (
              <div className="flex items-center space-x-3 ml-4 pl-4 border-l border-slate-200">
                <Link
                  to="/login"
                  className="px-5 py-2 text-sm font-medium text-slate-700 hover:text-primary-600 transition-colors"
                >
                  Log in
                </Link>
                <Link
                  to="/register"
                  className="px-5 py-2 text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 rounded-full shadow-md hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200"
                >
                  Sign up
                </Link>
              </div>
            )}
          </div>

          {/* Mobile menu button */}
          <div className="flex items-center md:hidden">
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="inline-flex items-center justify-center p-2 rounded-lg text-slate-500 hover:text-primary-600 hover:bg-slate-100 focus:outline-none transition-colors"
            >
              <span className="sr-only">Open main menu</span>
              {isOpen ? (
                <XMarkIcon className="block h-6 w-6" aria-hidden="true" />
              ) : (
                <Bars3Icon className="block h-6 w-6" aria-hidden="true" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {isOpen && (
        <div className="md:hidden bg-white border-t border-slate-100 shadow-lg animate-slide-up">
          <div className="px-4 pt-2 pb-3 space-y-1">
            <MobileNavLink 
              to="/" 
              icon={<HomeIcon className="w-5 h-5" />} 
              label="Home" 
              active={isActive('/')} 
            />
            <MobileNavLink 
              to="/hospitals" 
              icon={<MagnifyingGlassIcon className="w-5 h-5" />} 
              label="Find Hospitals" 
              active={isActive('/hospitals')} 
            />
            
            {isAuthenticated ? (
              <>
                <div className="border-t border-slate-100 my-2 pt-2">
                  <div className="px-3 py-2 flex items-center space-x-3">
                    <div className="w-10 h-10 rounded-full bg-primary-50 flex items-center justify-center text-primary-600">
                      <UserCircleIcon className="w-6 h-6" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-slate-900">
                        {user.firstName} {user.lastName}
                      </p>
                      <p className="text-xs text-slate-500">
                        {getRoleDisplayName(user.role)}
                      </p>
                    </div>
                  </div>
                </div>
                
                <MobileNavLink 
                  to={getDashboardLink()} 
                  icon={<ChartBarIcon className="w-5 h-5" />} 
                  label="Dashboard" 
                  active={isActive(getDashboardLink())} 
                />
                <MobileNavLink 
                  to="/profile" 
                  icon={<UserCircleIcon className="w-5 h-5" />} 
                  label="Profile" 
                  active={isActive('/profile')} 
                />
                
                <button
                  onClick={handleLogout}
                  className="flex w-full items-center px-3 py-2.5 rounded-lg text-base font-medium text-danger-600 hover:bg-danger-50 transition-colors"
                >
                  <ArrowRightOnRectangleIcon className="w-5 h-5 mr-3" />
                  Sign out
                </button>
              </>
            ) : (
              <div className="mt-4 space-y-2 border-t border-slate-100 pt-4">
                <Link
                  to="/login"
                  className="block w-full text-center px-4 py-2.5 rounded-lg text-slate-700 font-medium hover:bg-slate-50 transition-colors border border-slate-200"
                >
                  Log in
                </Link>
                <Link
                  to="/register"
                  className="block w-full text-center px-4 py-2.5 rounded-lg text-white font-medium bg-primary-600 hover:bg-primary-700 shadow-md transition-all"
                >
                  Sign up
                </Link>
              </div>
            )}
          </div>
        </div>
      )}
    </nav>
  );
};

// Helper Components
const NavLink = ({ to, icon, label, active }) => (
  <Link
    to={to}
    className={`flex items-center px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 ${
      active
        ? 'text-primary-700 bg-primary-50 shadow-sm ring-1 ring-primary-100'
        : 'text-slate-600 hover:text-primary-600 hover:bg-slate-50'
    }`}
  >
    <span className={`mr-2 ${active ? 'text-primary-600' : 'text-slate-400 group-hover:text-primary-500'}`}>
      {icon}
    </span>
    {label}
  </Link>
);

const MobileNavLink = ({ to, icon, label, active }) => (
  <Link
    to={to}
    className={`flex items-center px-3 py-2.5 rounded-lg text-base font-medium transition-colors ${
      active
        ? 'bg-primary-50 text-primary-700'
        : 'text-slate-600 hover:bg-slate-50 hover:text-primary-600'
    }`}
  >
    <span className={`mr-3 ${active ? 'text-primary-600' : 'text-slate-400'}`}>
      {icon}
    </span>
    {label}
  </Link>
);

export default Navbar;
