import React, { useState } from 'react';
import Sidebar from './components/Sidebar';
import Timetable from './components/Timetable';
import YearlyTargets from './components/YearlyTargets';
import Finance from './components/Finance';
import MoneyFlow from './components/MoneyFlow';
import Wishlist from './components/Wishlist';
import Blueprint from './components/Blueprint';
import { NavSection } from './types';

const App: React.FC = () => {
  const [activeSection, setActiveSection] = useState<NavSection>(NavSection.TIMETABLE);

  const renderSection = () => {
    switch (activeSection) {
      case NavSection.TIMETABLE:
        return <Timetable />;
      case NavSection.TARGETS:
        return <YearlyTargets />;
      case NavSection.FINANCE_INSIGHTS:
        return <Finance />;
      case NavSection.MONEY_FLOW:
        return <MoneyFlow />;
      case NavSection.WISHLIST:
        return <Wishlist />;
      case NavSection.BLUEPRINT:
        return <Blueprint />;
      default:
        return <Timetable />;
    }
  };

  return (
    <div className="flex h-screen w-full overflow-hidden p-2 lg:p-4 gap-4 lg:gap-8">
      <Sidebar activeSection={activeSection} onNavigate={setActiveSection} />
      
      <main className="flex-1 h-full relative">
        <div className="absolute inset-0 overflow-hidden rounded-[2.5rem] p-1">
             {/* Main Content Area */}
            <div className="h-full w-full transition-all duration-500 ease-in-out">
                {renderSection()}
            </div>
        </div>
      </main>
    </div>
  );
};

export default App;