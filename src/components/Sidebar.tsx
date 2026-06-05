import React from 'react';
import { 
  Home, 
  Compass, 
  ShoppingBag, 
  Hammer, 
  User, 
  MessageSquare, 
  RefreshCw, 
  Archive,
  ChevronLeft,
  ChevronRight,
  ShieldAlert,
  HelpCircle,
  Users,
  Rss,
  Zap
} from 'lucide-react';

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  collapsed: boolean;
  setCollapsed: (collapsed: boolean) => void;
  unreadCount?: number;
  pendingTradeCount?: number;
}

export default function Sidebar({
  activeTab,
  setActiveTab,
  collapsed,
  setCollapsed,
  unreadCount = 1,
  pendingTradeCount = 1
}: SidebarProps) {
  
  const menuItems = [
    { id: 'home', label: 'Home', icon: Home },
    { id: 'discover', label: 'Discover', icon: Compass },
    { id: 'short-games', label: 'Short Games ⚡', icon: Zap },
    { id: 'avatar-shop', label: 'Avatar Shop', icon: ShoppingBag },
    { id: 'bloxiter', label: 'Bloxiter Feed', icon: Rss },
    { id: 'clans', label: 'Clans & Guilds', icon: Users },
    { id: 'create', label: 'Create', icon: Hammer, highlight: true },
    { id: 'avatar', label: 'Avatar', icon: User },
    { id: 'messages', label: 'Messages', icon: MessageSquare, badge: unreadCount },
    { id: 'trade', label: 'Trade', icon: RefreshCw, badge: pendingTradeCount },
    { id: 'inventory', label: 'Inventory', icon: Archive }
  ];

  return (
    <aside 
      className={`fixed top-12 left-0 h-[calc(100vh-3rem)] z-30 flex flex-col justify-between border-r border-[#393B3D] bg-[#232527] text-gray-200 transition-all duration-300 ease-in-out ${
        collapsed ? 'w-16' : 'w-60'
      }`}
    >
      {/* Top Navigation Items */}
      <div className="flex-1 overflow-y-auto py-3">
        <div className="px-3 flex justify-between items-center mb-2">
          {!collapsed && (
            <span className="text-xs font-semibold uppercase tracking-wider text-gray-400 px-3">
              Navigation
            </span>
          )}
          <button 
            onClick={() => setCollapsed(!collapsed)}
            className="p-1 px-2 rounded hover:bg-[#323436] text-gray-400 hover:text-white transition-colors cursor-pointer mx-auto block"
            title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            {collapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
          </button>
        </div>

        <nav className="space-y-1 px-2">
          {menuItems.map((item) => {
            const IconComponent = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`w-full flex items-center rounded-md px-3 py-2.5 text-sm font-medium transition-all duration-150 cursor-pointer group ${
                  isActive 
                    ? 'bg-[#393B3D] text-white shadow-md' 
                    : item.highlight 
                      ? 'text-gray-300 hover:text-white hover:bg-[#323436]'
                      : 'text-gray-300 hover:text-white hover:bg-[#323436]'
                }`}
              >
                <div className={`flex items-center justify-center ${collapsed ? 'mx-auto' : 'mr-3'}`}>
                  <IconComponent size={18} className={`transition-transform duration-200 ${!isActive && 'group-hover:scale-105'}`} />
                </div>
                
                {!collapsed && (
                  <span className="flex-1 text-left truncate">{item.label}</span>
                )}
                
                {!collapsed && item.badge && item.badge > 0 && (
                  <span className="ml-2 inline-flex items-center justify-center px-1.5 py-0.5 text-[10px] font-bold leading-none text-white bg-red-600 rounded">
                    {item.badge}
                  </span>
                )}

                {collapsed && item.badge && item.badge > 0 && (
                  <div className="absolute left-10 mt-[-14px] w-2.5 h-2.5 bg-red-600 rounded-full border border-[#232527]" />
                )}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Sidebar Footer Info */}
      <div className="p-3 border-t border-[#393B3D] bg-[#111214]">
        {!collapsed ? (
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-xs text-gray-500">
              <ShieldAlert size={14} className="text-gray-400" />
              <span>Security & Moderation</span>
            </div>
            <div className="text-[11px] text-gray-500">
              © 2026 Voxel Web Clone.<br />All resources mock-simulated.
            </div>
          </div>
        ) : (
          <div className="flex justify-center text-gray-500 cursor-help" title="Voxel simulated platform">
            <HelpCircle size={16} />
          </div>
        )}
      </div>
    </aside>
  );
}
