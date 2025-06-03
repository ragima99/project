import React from 'react';
import { Truck, Users, Package, Home } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';

const Navbar: React.FC = () => {
  const location = useLocation();
  
  const isActive = (path: string) => {
    return location.pathname === path;
  };
  
  const navItems = [
    { path: '/', label: 'Dashboard', icon: <Home size={20} /> },
    { path: '/customers', label: 'Customers', icon: <Users size={20} /> },
    { path: '/orders', label: 'Orders', icon: <Package size={20} /> },
    { path: '/vehicles', label: 'Vehicles', icon: <Truck size={20} /> },
  ];

  return (
    <nav className="bg-[#1E3A8A] text-white shadow-md">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center">
            <div className="flex-shrink-0 flex items-center">
              <Truck className="h-8 w-8 text-[#0D9488]" />
              <span className="ml-2 text-xl font-bold">LogiFlow</span>
            </div>
          </div>
          
          <div className="hidden md:block">
            <div className="flex items-center space-x-4">
              {navItems.map((item) => (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`flex items-center px-3 py-2 rounded-md text-sm font-medium transition-colors duration-200 ${
                    isActive(item.path)
                      ? 'bg-[#0D9488] text-white'
                      : 'text-gray-300 hover:bg-[#0D9488]/20 hover:text-white'
                  }`}
                >
                  <span className="mr-2">{item.icon}</span>
                  {item.label}
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>
      
      {/* Mobile menu */}
      <div className="md:hidden border-t border-[#1E3A8A]/30">
        <div className="grid grid-cols-4 text-xs">
          {navItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={`flex flex-col items-center justify-center py-2 ${
                isActive(item.path)
                  ? 'bg-[#0D9488] text-white'
                  : 'text-gray-300 hover:bg-[#0D9488]/20 hover:text-white'
              }`}
            >
              {item.icon}
              <span className="mt-1">{item.label}</span>
            </Link>
          ))}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;