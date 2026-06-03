import React, { useState } from "react";
import { NavLink } from "react-router-dom";
import { useAppContext } from "../../context/AppContext";
import {
  HomeIcon,
  TicketIcon,
  HistoryIcon,
  LogOutIcon,
  BarChartIcon,
  BuildingIcon,
  UsersIcon,
  UserIcon,
  CloseIcon,
} from "../common/Icons";
import { Role } from "../../types";

const PRIMARY = "#0A4DBF"; // <-- YOUR BUTTON BLUE 🎯

/* ----------------------------------------------
   NAV ITEM (DESKTOP SIDEBAR)
---------------------------------------------- */
const NavItem = ({
  to,
  icon,
  label,
}: {
  to: string;
  icon: React.ReactNode;
  label: string;
}) => (
  <NavLink
    to={to}
    className={({ isActive }) =>
      `
      flex items-center gap-3 px-4 py-3 rounded-lg transition font-medium
      ${
        isActive
          ? `bg-[${PRIMARY}] text-white shadow-sm`
          : "text-[#C7CEDB] hover:bg-white/10 hover:text-white"
      }
    `
    }
  >
    {icon}
    <span>{label}</span>
  </NavLink>
);

/* ----------------------------------------------
   BOTTOM NAV ITEM (MOBILE)
---------------------------------------------- */
const BottomNavItem = ({
  to,
  icon,
  label,
}: {
  to: string;
  icon: React.ReactNode;
  label: string;
}) => (
  <NavLink
    to={to}
    className={({ isActive }) =>
      `flex flex-col items-center justify-center h-full w-full gap-1 transition-colors ${
        isActive ? "text-[#0A4DBF]" : "text-[#94A3B8] hover:text-slate-500"
      }`
    }
  >
    {React.cloneElement(icon as React.ReactElement, { 
      className: "w-6 h-6",
      strokeWidth: "2"
    })}
    <span className="text-[10px] font-medium tracking-wide">{label}</span>
  </NavLink>
);


/* ----------------------------------------------
   SIDEBAR (DESKTOP ONLY)
---------------------------------------------- */
const Sidebar = () => {
  const { currentUser, logout } = useAppContext();
  const [loading, setLoading] = useState(false);

  const handleLogout = async () => {
    setLoading(true);
    try {
      await logout();
    } catch {
      setLoading(false);
    }
  };

  const renderLinks = () => {
    switch (currentUser?.role) {
      case Role.STUDENT:
        return (
          <>
            <NavItem to="/dashboard" icon={<HomeIcon />} label="Dashboard" />
            <NavItem to="/book-token" icon={<TicketIcon />} label="Book Token" />
            <NavItem to="/history" icon={<HistoryIcon />} label="History" />
          </>
        );
      case Role.STAFF:
        return <NavItem to="/dashboard" icon={<HomeIcon />} label="Queue Dashboard" />;
      case Role.ADMIN:
        return (
          <>
            <NavItem to="/dashboard" icon={<BarChartIcon />} label="Analytics" />
            <NavItem to="/offices" icon={<BuildingIcon />} label="Offices" />
            <NavItem to="/users" icon={<UsersIcon />} label="Users" />
            <NavItem to="/staff-view" icon={<HomeIcon />} label="Staff View" />
          </>
        );
    }
  };

  return (
    <aside className="w-64 bg-[#1F2837] text-white h-full p-6 flex flex-col border-r border-black/10">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-2xl font-bold tracking-wide">SmartQ</h1>
      </div>

      <nav className="flex-1 space-y-2">{renderLinks()}</nav>

      <button
        onClick={handleLogout}
        disabled={loading}
        className="
          mt-6 flex items-center justify-center gap-2 py-3 rounded-lg
          bg-[#E74C3C] hover:bg-[#c0392b] transition font-semibold
        "
      >
        <LogOutIcon className="w-5 h-5" />
        {loading ? "Logging out..." : "Logout"}
      </button>
    </aside>
  );
};


/* ----------------------------------------------
   BOTTOM NAV (MOBILE ONLY)
---------------------------------------------- */
const BottomNav = ({ onProfileClick }: { onProfileClick: () => void }) => {
  const { currentUser } = useAppContext();

  const renderLinks = () => {
    switch (currentUser?.role) {
      case Role.STUDENT:
        return (
          <>
            <BottomNavItem to="/dashboard" icon={<HomeIcon />} label="Home" />
            <BottomNavItem to="/book-token" icon={<TicketIcon />} label="Book" />
            <BottomNavItem to="/history" icon={<HistoryIcon />} label="History" />
          </>
        );
      case Role.STAFF:
        return <BottomNavItem to="/dashboard" icon={<HomeIcon />} label="Queue" />;
      case Role.ADMIN:
        return (
          <>
            <BottomNavItem to="/staff-view" icon={<HomeIcon />} label="Staff View" />
            <BottomNavItem to="/offices" icon={<BuildingIcon />} label="Offices" />
            <BottomNavItem to="/users" icon={<UsersIcon />} label="Users" />
          </>
        );
    }
  };

  return (
    <nav className="lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 flex justify-between items-center h-16 pb-safe px-2 z-40">
      {renderLinks()}
      
      {/* Profile Tab */}
      <button
        onClick={onProfileClick}
        className="flex flex-col items-center justify-center h-full w-full gap-1 text-[#94A3B8] hover:text-slate-500 transition-colors"
      >
        <UserIcon className="w-6 h-6" strokeWidth="2" />
        <span className="text-[10px] font-medium tracking-wide">Profile</span>
      </button>
    </nav>
  );
};


/* ----------------------------------------------
   HEADER
---------------------------------------------- */
const Header = () => {
  const { currentUser, offices } = useAppContext();

  const officeName =
    currentUser?.role === "Staff"
      ? offices.find((o) => currentUser?.assignedOfficeIds?.includes(o.id))?.name
      : null;

  return (
    <header
      className="
        bg-white text-gray-900
        shadow-sm border-b border-gray-200
        p-4 flex items-center justify-between w-full relative z-30
      "
    >
      {/* Mobile Title */}
      <div className="lg:hidden font-bold text-xl tracking-tight text-[#0A4DBF]">
        SmartQ
      </div>

      {/* Desktop empty spacer for flex-between */}
      <div className="hidden lg:block"></div>

      {/* Profile */}
      <div className="flex items-center gap-4 lg:gap-3">
        <div className="text-right">
          <p className="text-[14px] lg:text-[15px] font-semibold leading-tight">
            {currentUser?.name}
          </p>

          {officeName && (
            <p className="text-[10px] lg:text-xs text-gray-400 uppercase tracking-wide">
              {officeName}
            </p>
          )}
        </div>

        <div
          className="
            w-9 h-9 lg:w-10 lg:h-10 rounded-full flex items-center justify-center font-bold
            text-white shadow-sm
          "
          style={{ backgroundColor: "#0A4DBF" }}
        >
          {currentUser?.name?.[0]}
        </div>
      </div>
    </header>
  );
};


/* ----------------------------------------------
   MAIN LAYOUT
---------------------------------------------- */
const MainLayout = ({ children }: { children: React.ReactNode }) => {
  const { currentUser, logout } = useAppContext();
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);

  const handleMobileLogout = async () => {
    setLoggingOut(true);
    try {
      await logout();
    } catch {
      setLoggingOut(false);
    }
  };

  return (
    <div className="flex h-screen bg-[#F6F7FB] overflow-hidden">
      {/* Desktop Sidebar */}
      <div className="hidden lg:flex fixed inset-y-0 left-0 z-30 w-64">
        <Sidebar />
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col lg:ml-64 relative h-full">
        <Header />
        
        {/* Scrollable Main Area */}
        <main className="flex-1 overflow-y-auto p-4 lg:p-8 pb-24 lg:pb-8">
          {children}
        </main>
        
        {/* Mobile Bottom Navigation */}
        <BottomNav onProfileClick={() => setIsProfileOpen(true)} />
      </div>

      {/* Mobile Profile Bottom Sheet */}
      {isProfileOpen && (
        <div className="fixed inset-0 z-50 flex flex-col justify-end lg:hidden">
          {/* Backdrop */}
          <div 
            className="absolute inset-0 bg-black/40 backdrop-blur-sm" 
            onClick={() => setIsProfileOpen(false)}
          />
          
          {/* Sheet */}
          <div className="relative bg-white w-full rounded-t-3xl p-6 pb-safe animate-in slide-in-from-bottom-full duration-300">
            <div className="w-12 h-1.5 bg-gray-200 rounded-full mx-auto mb-6" />
            
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-slate-800">My Profile</h2>
              <button 
                onClick={() => setIsProfileOpen(false)}
                className="p-2 bg-slate-50 rounded-full text-slate-400 hover:bg-slate-100 transition-colors"
              >
                <CloseIcon className="w-4 h-4" />
              </button>
            </div>

            <div className="flex items-center gap-4 mb-8">
              <div className="w-12 h-12 bg-slate-100 text-[#0A4DBF] rounded-full flex items-center justify-center text-lg font-bold border border-slate-200 flex-shrink-0">
                 {currentUser?.name?.[0]}
              </div>
              <div className="overflow-hidden">
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="text-lg font-bold text-slate-800 leading-tight truncate max-w-full">{currentUser?.name}</p>
                  {currentUser?.role === Role.ADMIN && <span className="px-2 py-0.5 bg-red-100 text-red-700 text-[10px] font-bold uppercase rounded-md">Admin</span>}
                  {currentUser?.role === Role.STAFF && <span className="px-2 py-0.5 bg-yellow-100 text-yellow-700 text-[10px] font-bold uppercase rounded-md">Staff</span>}
                  {currentUser?.role === Role.STUDENT && <span className="px-2 py-0.5 bg-green-100 text-green-700 text-[10px] font-bold uppercase rounded-md">Student</span>}
                </div>
                <p className="text-slate-500 text-sm mt-0.5 truncate w-full">{currentUser?.email}</p>
              </div>
            </div>

            <button 
              onClick={handleMobileLogout} 
              disabled={loggingOut} 
              className="w-full bg-white text-red-500 border border-red-200 hover:bg-red-50 active:scale-[0.98] transition-all font-semibold py-3.5 rounded-xl flex items-center justify-center gap-2 mb-4 shadow-sm"
            >
              <LogOutIcon className="w-4 h-4"/> 
              {loggingOut ? "Logging out..." : "Log Out"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default MainLayout;
