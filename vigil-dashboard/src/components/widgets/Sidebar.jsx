import { NavLink } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { Activity, AlertTriangle, Brain, LayoutDashboard, LogOut, MessagesSquare, Settings, Wrench } from 'lucide-react';

const NAV_ITEMS = [
  { path: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { path: '/sessions', label: 'Sessions', icon: MessagesSquare },
  { path: '/tools', label: 'Tools', icon: Wrench },
  { path: '/ai', label: 'AI Interactions', icon: Brain },
  { path: '/errors', label: 'Errors', icon: AlertTriangle },
];

export function Sidebar() {
  const { logout } = useAuth();

  return (
    <aside className="flex flex-col h-screen bg-[#0A0A0A] border-r border-[#1A1A1A] w-[280px] sticky top-0">
      <div className="flex items-center h-28 px-5 border-b border-[#1A1A1A]">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-vigil flex items-center justify-center">
            <Activity className="w-5 h-5 text-white" strokeWidth={2.5} />
          </div>
          <div>
            <h1 className="text-white font-bold text-lg leading-none">Vigil</h1>
            <p className="text-gray-500 text-[11px] mt-0.5">AI Assistant</p>
          </div>
        </div>
      </div>

      <nav className="flex-1 px-3 py-4 overflow-y-auto scrollbar-hide">
        <ul className="space-y-1">
          {NAV_ITEMS.map(item => {
            const Icon = item.icon;
            return (
              <li key={item.path}>
                <NavLink to={item.path} end={item.path === '/dashboard'} className="block">
                  {({ isActive }) => (
                    <div className={`flex items-center px-3 py-2.5 rounded text-sm font-medium transition-all duration-200 ${
                      isActive ? 'bg-[#1A1A1A] text-white' : 'text-gray-400 hover:text-white hover:bg-[#1A1A1A]'
                    }`}>
                      <Icon className={`w-5 h-5 mr-3 flex-shrink-0 transition-colors duration-200 ${
                        isActive ? 'text-vigil' : 'text-gray-500'
                      }`} strokeWidth={2} />
                      {item.label}
                    </div>
                  )}
                </NavLink>
              </li>
            );
          })}
        </ul>
      </nav>

      <div className="px-3 py-4 border-t border-[#1A1A1A]">
        <button onClick={logout} className="flex items-center w-full px-3 py-2 rounded text-sm font-medium text-gray-400 hover:text-white hover:bg-[#1A1A1A] transition-all duration-200">
          <LogOut className="w-5 h-5 mr-3 text-gray-500" strokeWidth={2} />
          Logout
        </button>
      </div>
    </aside>
  );
}
