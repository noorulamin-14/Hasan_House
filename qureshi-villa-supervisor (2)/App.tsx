
import React, { useState } from 'react';
import { Menu } from 'lucide-react';
import { Sidebar } from './components/app-sidebar';
import { GreyStructureView } from './views/grey-structure';
import { FinishingView } from './views/finishing';
import { MEPView } from './views/mep';
import { SalaryView } from './views/salary';
import { DashboardView } from './views/dashboard';
import { LaborView } from './views/labor';
import { TabId } from './types';
import { ProjectProvider } from './ProjectContext';
import { DataProvider } from './DataContext';

function App() {
  const [activeTab, setActiveTab] = useState<TabId>('dashboard');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard': return <DashboardView />;
      case 'grey': return <GreyStructureView />;
      case 'finishing': return <FinishingView />;
      case 'mep': return <MEPView />;
      case 'labor': return <LaborView />;
      case 'salary': return <SalaryView />;
      default: return <DashboardView />;
    }
  };

  return (
    <ProjectProvider>
      <DataProvider>
        <div className="flex h-screen bg-slate-50 text-slate-900 font-sans overflow-hidden">
          {/* Sidebar Navigation */}
          <Sidebar 
            activeTab={activeTab} 
            setActiveTab={setActiveTab} 
            isOpen={isSidebarOpen}
            setIsOpen={setIsSidebarOpen}
          />

          {/* Main Content Area */}
          <div className="flex-1 flex flex-col h-full overflow-hidden w-full">
            {/* Mobile Header - Dark Theme for better contrast */}
            <header className="bg-[#0B1120] border-b border-slate-800 p-4 md:hidden flex items-center justify-between sticky top-0 z-20 shadow-xl shadow-slate-900/20">
              <div className="flex items-center gap-3">
                 <div className="flex items-center gap-2">
                   {/* Main logo icon - Matching the Sidebar design (Mini Version) */}
                   <svg width="36" height="36" viewBox="0 0 52 52" fill="none" xmlns="http://www.w3.org/2000/svg" className="flex-shrink-0">
                      {/* 1. Foundation Line */}
                      <path 
                        d="M10 42H42" 
                        stroke="#64748B" 
                        strokeWidth="2" 
                        strokeLinecap="round" 
                        className="draw-path draw-delay-1"
                      />
                      
                      {/* 2. Main Structure */}
                      <defs>
                        <linearGradient id="wallGradientMob" x1="14" y1="20" x2="14" y2="42" gradientUnits="userSpaceOnUse">
                          <stop stopColor="#2DD4BF" />
                          <stop offset="1" stopColor="#0F766E" />
                        </linearGradient>
                      </defs>
                      <path 
                        d="M14 42V22L26 14L38 22V42" 
                        stroke="url(#wallGradientMob)" 
                        strokeWidth="2.5" 
                        strokeLinecap="round" 
                        strokeLinejoin="round"
                        fill="none"
                        className="draw-path draw-delay-2"
                      />

                      {/* 3. Roof */}
                      <path 
                        d="M10 24L26 12L42 24" 
                        stroke="#1E293B" 
                        strokeWidth="2" 
                        strokeLinecap="round" 
                        strokeLinejoin="round"
                        className="draw-path draw-delay-3"
                      />

                      {/* 4. Window */}
                      <rect 
                        x="22" y="28" width="8" height="8" rx="1" 
                        fill="#F59E0B" 
                        className="pop-in"
                      />
                    </svg>
                    <div className="flex flex-col">
                      <h1 className="text-base font-black leading-none brand-text uppercase tracking-tight">QURESHI VILLA</h1>
                      <p className="text-[9px] text-teal-400 font-bold uppercase tracking-widest mt-0.5">Supervisor App</p>
                    </div>
                 </div>
              </div>
              <button 
                onClick={() => setIsSidebarOpen(true)}
                className="p-2 text-slate-200 hover:bg-slate-800 hover:text-white rounded-xl transition-colors active:scale-95 transform"
              >
                <Menu size={24} />
              </button>
            </header>

            {/* Scrollable Content */}
            <main className="flex-1 overflow-y-auto p-4 md:p-8 relative scroll-smooth">
               <div className="max-w-7xl mx-auto pb-24 md:pb-10">
                 {renderContent()}
               </div>
            </main>
          </div>
        </div>
      </DataProvider>
    </ProjectProvider>
  );
}

export default App;
