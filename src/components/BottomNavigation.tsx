import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  PlusCircle,
  Wallet,
  Tags,
  Settings,
  Target
} from 'lucide-react';
import { useScrollDirection } from '../hooks/useScrollDirection';

export function BottomNavigation() {
  const navigate = useNavigate();
  const location = useLocation();
  const isVisible = useScrollDirection();

  const navigation = [
    { name: 'Dashboard', icon: LayoutDashboard, path: '/dashboard' },
    { name: 'Lançamentos', icon: PlusCircle, path: '/transactions' },
    { name: 'Contas', icon: Wallet, path: '/accounts' },
    { name: 'Categorias', icon: Tags, path: '/categories' },
    { name: 'Objetivos', icon: Target, path: '/goals' },
    { name: 'Configurações', icon: Settings, path: '/settings' }
  ];

  return (
    <nav 
      className={`fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-50 transition-transform duration-300 ${
        isVisible ? 'translate-y-0' : 'translate-y-full'
      }`}
    >
      <div className="max-w-screen-xl mx-auto px-4">
        <div className="flex justify-between">
          {navigation.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <button
                key={item.name}
                onClick={() => navigate(item.path)}
                className={`flex flex-col items-center py-3 px-2 md:px-4 ${
                  isActive
                    ? 'text-green-500'
                    : 'text-gray-500 hover:text-gray-900'
                }`}
              >
                <item.icon className="h-6 w-6" />
                <span className="text-xs mt-1 hidden md:block">{item.name}</span>
              </button>
            );
          })}
        </div>
      </div>
    </nav>
  );
}