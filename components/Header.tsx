import React from 'react';
import { PlusIcon } from './icons';
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
          onClick={() => setView('create-quotation')}
          className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        >
            Generate Quotation
        </button>
        <button 
          onClick={() => setView('create-invoice')}
          className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 shadow-sm"
        >
            <PlusIcon className="w-4 h-4 mr-2" />
            Create Invoice
        </button>
        <button 
          onClick={handleLogout}
          className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
        >
            Logout
        </button>
      </div>
    </header>
  );
};