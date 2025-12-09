import React, { useState } from "react";
import { NavLink } from "react-router-dom";
import { useAppContext } from "../../context/AppContext";
import {
  HomeIcon,
  TicketIcon,
  HistoryIcon,
  LogOutIcon,
  MenuIcon,
  CloseIcon,
  BarChartIcon,
  BuildingIcon,
  UsersIcon,
} from "../common/Icons";
import { Role } from "../../types";

const PRIMARY = "#0A4DBF"; // <-- YOUR BUTTON BLUE 🎯


/* ----------------------------------------------
   NAV ITEM
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
   SIDEBAR
---------------------------------------------- */
const Sidebar = ({ onClose }: { onClose: () => void }) => {
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
        <h1 className="text-2xl font-bold tracking-wide">KL SmartQ</h1>
        <button onClick={onClose} className="lg:hidden text-white">
          <CloseIcon className="w-6 h-6" />
        </button>
      </div>

      <nav className="flex-1 space-y-2">{renderLinks()}</nav>

      {/* Logout button unchanged */}
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
   HEADER
---------------------------------------------- */
const Header = ({ onMenuClick }: { onMenuClick: () => void }) => {
  const { currentUser } = useAppContext();

  return (
    <header
      className="
        bg-[#1F2837] text-white          /* MOBILE */
        lg:bg-white lg:text-gray-900     /* DESKTOP */
        shadow-sm border-b border-gray-200
        p-4 flex items-center justify-between w-full
      "
    >
      {/* Mobile menu button */}
      <button onClick={onMenuClick} className="lg:hidden text-white">
        <MenuIcon className="w-6 h-6" />
      </button>

      {/* Profile */}
      <div className="ml-auto flex items-center gap-3">
        <div className="text-right">
          <p className="font-semibold">{currentUser?.name}</p>
          <p className="text-sm opacity-80 lg:text-gray-500 text-white">
            {currentUser?.role}
          </p>
        </div>

        <div
          className="
            w-10 h-10 rounded-full flex items-center justify-center font-bold
            text-white
          "
          style={{ backgroundColor: "#0A4DBF" }}  // same blue as your button
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
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="flex h-screen bg-[#F6F7FB]">
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/40 lg:hidden z-20"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <div
        className={`fixed inset-y-0 left-0 z-30 transition-transform duration-300 lg:translate-x-0 ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <Sidebar onClose={() => setSidebarOpen(false)} />
      </div>

      <div className="flex-1 flex flex-col lg:ml-64">
        <Header onMenuClick={() => setSidebarOpen(true)} />
        <main className="p-8 overflow-y-auto">{children}</main>
      </div>
    </div>
  );
};

export default MainLayout;
