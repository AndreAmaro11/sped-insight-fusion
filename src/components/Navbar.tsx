
import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { getCurrentUser, logout } from '@/utils/authUtils';

const Navbar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const currentUser = getCurrentUser();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  
  // Navigation items
  const navItems = [
    { name: 'Dashboard', path: '/dashboard' },
    { name: 'Upload SPED', path: '/sped-upload' },
    { name: 'Empresas', path: '/company-registration' },
  ];

  const toggleMobileMenu = () => {
    setMobileMenuOpen(!mobileMenuOpen);
  };

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <nav className="bg-white border-b border-gray-200 fixed w-full z-30">
      <div className="px-4 mx-auto max-w-7xl sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo and brand name */}
          <div className="flex items-center">
            <Link to="/dashboard" className="flex items-center gap-2 text-primary">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
                <line x1="9" y1="3" x2="9" y2="21"/>
                <line x1="3" y1="9" x2="21" y2="9"/>
              </svg>
              <span className="font-bold text-lg hidden md:block">SPED Insight</span>
            </Link>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:block">
            <div className="ml-4 flex items-center md:ml-6">
              <div className="hidden md:flex items-center space-x-4">
                {navItems.map((item) => (
                  <Link
                    key={item.name}
                    to={item.path}
                    className={`px-3 py-2 text-sm font-medium rounded-md ${
                      location.pathname === item.path
                        ? 'text-primary bg-primary/10'
                        : 'text-gray-600 hover:text-primary hover:bg-primary/5'
                    }`}
                  >
                    {item.name}
                  </Link>
                ))}
                
                {currentUser?.role === 'admin' && (
                  <Link
                    to="/administration"
                    className={`px-3 py-2 text-sm font-medium rounded-md ${
                      location.pathname === '/administration'
                        ? 'text-primary bg-primary/10'
                        : 'text-gray-600 hover:text-primary hover:bg-primary/5'
                    }`}
                  >
                    Administração
                  </Link>
                )}
              </div>
              
              {/* User dropdown */}
              <div className="ml-4">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="relative rounded-full">
                      <span className="sr-only">Abrir menu do usuário</span>
                      <div className="h-8 w-8 rounded-full bg-primary/10 text-primary flex items-center justify-center">
                        {currentUser?.name?.charAt(0).toUpperCase() || 'U'}
                      </div>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-56">
                    <DropdownMenuLabel>Minha Conta</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem>
                      <span>{currentUser?.name}</span>
                    </DropdownMenuItem>
                    <DropdownMenuItem>
                      <span>{currentUser?.email}</span>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onSelect={handleLogout}>
                      Sair
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          </div>

          {/* Mobile menu button */}
          <div className="flex md:hidden">
            <button
              type="button"
              className="inline-flex items-center justify-center p-2 rounded-md text-gray-400 hover:text-primary hover:bg-primary/10"
              aria-controls="mobile-menu"
              aria-expanded="false"
              onClick={toggleMobileMenu}
            >
              <span className="sr-only">Abrir menu principal</span>
              {mobileMenuOpen ? (
                <svg
                  className="block h-6 w-6"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  aria-hidden="true"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              ) : (
                <svg
                  className="block h-6 w-6"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  aria-hidden="true"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M4 6h16M4 12h16m-7 6h7"
                  />
                </svg>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      {mobileMenuOpen && (
        <div className="md:hidden" id="mobile-menu">
          <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
            {navItems.map((item) => (
              <Link
                key={item.name}
                to={item.path}
                className={`block px-3 py-2 rounded-md text-base font-medium ${
                  location.pathname === item.path
                    ? 'text-primary bg-primary/10'
                    : 'text-gray-600 hover:text-primary hover:bg-primary/5'
                }`}
                onClick={() => setMobileMenuOpen(false)}
              >
                {item.name}
              </Link>
            ))}
            
            {currentUser?.role === 'admin' && (
              <Link
                to="/administration"
                className={`block px-3 py-2 rounded-md text-base font-medium ${
                  location.pathname === '/administration'
                    ? 'text-primary bg-primary/10'
                    : 'text-gray-600 hover:text-primary hover:bg-primary/5'
                }`}
                onClick={() => setMobileMenuOpen(false)}
              >
                Administração
              </Link>
            )}
            
            <div className="border-t border-gray-200 pt-2">
              <div className="px-3 py-2 text-base font-medium text-gray-600">
                {currentUser?.name}
              </div>
              <div className="px-3 py-2 text-sm text-gray-500">
                {currentUser?.email}
              </div>
              <Button
                variant="ghost"
                className="w-full text-left px-3 py-2 rounded-md text-base font-medium text-gray-600 hover:text-primary hover:bg-primary/5"
                onClick={handleLogout}
              >
                Sair
              </Button>
            </div>
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
