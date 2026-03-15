
import React from 'react';
import { PaintBucket, Wrench, Banknote, BrickWall, X, LayoutDashboard, Camera, User, Pickaxe } from 'lucide-react';
import { TabId } from '../types';
import { useProject } from '../ProjectContext';

interface SidebarProps {
  activeTab: TabId;
  setActiveTab: (tab: TabId) => void;
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
}

// ==========================================
// THE ANIMATED LOGO COMPONENT
// ==========================================
const AnimatedVillaLogo = () => (
  <svg width="52" height="52" viewBox="0 0 52 52" fill="none" xmlns="http://www.w3.org/2000/svg" className="flex-shrink-0">
    {/* 1. Foundation Line (Draws first) - Slate */}
    <path 
      d="M10 42H42" 
      stroke="#64748B" 
      strokeWidth="2" 
      strokeLinecap="round" 
      className="draw-path draw-delay-1"
    />
    
    {/* 2. Main Structure (Draws second) - Teal Gradient */}
    <defs>
      <linearGradient id="wallGradient" x1="14" y1="20" x2="14" y2="42" gradientUnits="userSpaceOnUse">
        <stop stopColor="#2DD4BF" />
        <stop offset="1" stopColor="#0F766E" />
      </linearGradient>
    </defs>
    <path 
      d="M14 42V22L26 14L38 22V42" 
      stroke="url(#wallGradient)" 
      strokeWidth="2.5" 
      strokeLinecap="round" 
      strokeLinejoin="round"
      fill="none"
      className="draw-path draw-delay-2"
    />

    {/* 3. The Modern Roof (Draws third) - Minimal Slate */}
    <path 
      d="M10 24L26 12L42 24" 
      stroke="#1E293B" 
      strokeWidth="2" 
      strokeLinecap="round" 
      strokeLinejoin="round"
      className="draw-path draw-delay-3"
    />

    {/* 4. The Golden Window (Pops in last) - Solid Gold */}
    <rect 
      x="22" y="28" width="8" height="8" rx="1" 
      fill="#F59E0B" 
      className="pop-in"
    />
    {/* Subtle details inside window */}
    <path d="M26 28V36" stroke="#B45309" strokeWidth="1" className="pop-in" />
    <path d="M22 32H30" stroke="#B45309" strokeWidth="1" className="pop-in" />
  </svg>
);

export const Sidebar: React.FC<SidebarProps> = ({ activeTab, setActiveTab, isOpen, setIsOpen }) => {
  const { profileImage, setProfileImage } = useProject();

  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'grey', label: 'Grey Structure', icon: BrickWall },
    { id: 'mep', label: 'MEP Works', icon: Wrench },
    { id: 'finishing', label: 'Finishing Works', icon: PaintBucket },
    { id: 'labor', label: 'Other Expenses', icon: Pickaxe },
    { id: 'salary', label: 'My Salary', icon: Banknote },
  ];

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        if (typeof reader.result === 'string') {
          setProfileImage(reader.result);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-20 md:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Sidebar Container */}
      <div className={`
        fixed top-0 left-0 h-full bg-[#0B1120] text-slate-300 w-72 transform transition-transform duration-300 ease-in-out z-30 border-r border-slate-800/50
        ${isOpen ? 'translate-x-0' : '-translate-x-full'}
        md:translate-x-0 md:static md:flex-shrink-0 flex flex-col shadow-2xl
      `}>
        {/* Header with Animation */}
        <div className="p-6 flex items-center justify-between pb-8">
          <div className="flex items-center gap-2">
            <AnimatedVillaLogo />
            <div className="flex flex-col">
              <h1 className="text-xl leading-none brand-text uppercase tracking-tight">QURESHI VILLA</h1>
              <p className="text-[9px] font-semibold text-slate-500 mt-1.5 tracking-[0.25em] uppercase pl-0.5">Construction Tracker</p>
            </div>
          </div>
          <button 
            onClick={() => setIsOpen(false)}
            className="md:hidden text-slate-400 hover:text-white transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-4 py-2 space-y-1 overflow-y-auto">
          {menuItems.map((item) => {
            if (item.id === 'expenses') return null;
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => {
                  setActiveTab(item.id as TabId);
                  setIsOpen(false);
                }}
                className={`
                  w-full flex items-center gap-3 px-4 py-3.5 rounded-xl text-sm font-medium transition-all duration-300 group
                  ${isActive 
                    ? 'bg-gradient-to-r from-teal-500/10 to-transparent text-teal-400 border-l-2 border-teal-500 pl-5' 
                    : 'text-slate-300 hover:bg-slate-800/50 hover:text-white hover:pl-5 border-l-2 border-transparent'
                  }
                `}
              >
                <Icon size={20} className={`transition-colors duration-300 ${isActive ? 'text-teal-400 drop-shadow-[0_0_8px_rgba(45,212,191,0.5)]' : 'text-slate-400 group-hover:text-white'}`} />
                {item.label}
              </button>
            );
          })}
        </nav>

        {/* User Profile Footer */}
        <div className="p-4 bg-gradient-to-t from-[#060a12] to-transparent">
          <div className="bg-[#1e293b]/50 border border-slate-700/50 rounded-xl p-4 flex items-center gap-3 backdrop-blur-sm hover:border-teal-500/30 transition-colors">
            <div className="relative group cursor-pointer flex-shrink-0">
               <input 
                  type="file" 
                  accept="image/*" 
                  onChange={handleImageUpload}
                  className="absolute inset-0 w-full h-full opacity-0 z-10 cursor-pointer"
                  title="Click to upload profile photo"
               />
               <div className="w-10 h-10 rounded-full bg-slate-700 flex items-center justify-center overflow-hidden border border-slate-600 group-hover:border-teal-500 transition-colors shadow-lg relative">
                 {profileImage ? (
                   <img src={profileImage} alt="Profile" className="w-full h-full object-cover" />
                 ) : (
                   <User size={20} className="text-slate-400" />
                 )}
                 <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                   <Camera size={14} className="text-white" />
                 </div>
               </div>
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="text-sm font-bold text-white truncate">NOOR UL AMIN</h3>
              <p className="text-xs text-teal-500 truncate font-medium">Supervisor</p>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};
