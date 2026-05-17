import React from 'react';
import { View } from '../App';
import { useAuth } from '../hooks/useAuth';
import { useNavigate } from 'react-router-dom';

interface HeaderProps {
  setView: (view: View) => void;
}

export const Header: React.FC<HeaderProps> = ({ setView }) => {
  const { userEmail, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-6">
      <div className="flex items-center">
        {userEmail && (
          <span className="text-sm text-gray-600">
            Welcome, <span className="font-medium">{userEmail}</span>
          </span>
        )}
      </div>
      <div className="flex items-center space-x-4">
        <button 
          onClick={handleLogout}
          className="px-4 py-2 text-sm font-medium text-white bg-red-600 border border-transparent rounded-lg hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-colors shadow-sm"
        >
            Logout
        </button>
      </div>
    </header>
  );
};