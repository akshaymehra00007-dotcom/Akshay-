import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { AdminDashboard } from './AdminDashboard';
import { StudentManagement } from './StudentManagement';
import { FeeManagement } from './FeeManagement';
import { MembershipManagement } from './MembershipManagement';
import { ReminderCenter } from './ReminderCenter';
import { CoursesAndBatches } from './CoursesAndBatches';
import { ReportsAndAnalytics } from './ReportsAndAnalytics';
import { SettingsPage } from './SettingsPage';
import { AdminNotifications } from './AdminNotifications';
import { Modal } from '../common/Modal';
import {
  LayoutDashboard,
  Users,
  CreditCard,
  Shield,
  Send,
  Music,
  BarChart3,
  Settings,
  Bell,
  Sun,
  Moon,
  LogOut,
  Menu,
  X,
  Sparkles,
  ChevronRight,
  Search,
  CheckCircle2,
} from 'lucide-react';

export const AdminLayout: React.FC = () => {
  const {
    currentUser,
    logout,
    settings,
    darkMode,
    setDarkMode,
    notifications,
    stats,
  } = useApp();

  const [activeTab, setActiveTab] = useState<string>('dashboard');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const unreadCount = notifications.filter(
    (n) => (n.targetRole === 'admin' || n.targetRole === 'all') && !n.read
  ).length;

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'students', label: 'Students', icon: Users, badge: stats.totalStudents },
    { id: 'fees', label: 'Fee Management', icon: CreditCard, alert: stats.totalOverdue > 0 },
    { id: 'memberships', label: 'Memberships', icon: Shield, badge: stats.expiringSoonMemberships > 0 ? stats.expiringSoonMemberships : undefined },
    { id: 'reminders', label: 'Reminder Hub', icon: Send, highlight: true },
    { id: 'courses', label: 'Courses & Batches', icon: Music },
    { id: 'reports', label: 'Reports & Analytics', icon: BarChart3 },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return <AdminDashboard onNavigate={(tab) => setActiveTab(tab)} />;
      case 'students':
        return <StudentManagement />;
      case 'fees':
        return <FeeManagement />;
      case 'memberships':
        return <MembershipManagement />;
      case 'reminders':
        return <ReminderCenter />;
      case 'courses':
        return <CoursesAndBatches />;
      case 'reports':
        return <ReportsAndAnalytics />;
      case 'settings':
        return <SettingsPage />;
      default:
        return <AdminDashboard onNavigate={(tab) => setActiveTab(tab)} />;
    }
  };

  return (
    <div className="min-h-screen bg-[#0A0A0B] text-zinc-100 flex flex-col font-sans selection:bg-amber-500 selection:text-zinc-950">
      {/* EDITORIAL TOP NAVIGATION BAR */}
      <nav className="h-16 border-b border-zinc-800/90 flex items-center justify-between px-4 sm:px-8 bg-[#0A0A0B] sticky top-0 z-40">
        {/* Brand Zone */}
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>

          <div className="w-8 h-8 bg-gradient-to-br from-amber-400 to-amber-700 rounded-lg flex items-center justify-center shadow-md shadow-amber-500/20 shrink-0">
            <span className="text-zinc-950 font-black text-xs font-serif">S</span>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-lg sm:text-xl tracking-tight font-serif italic text-amber-500 whitespace-nowrap">
              {settings.instituteName}
            </span>
            <span className="hidden sm:inline-block text-[9px] uppercase tracking-[0.28em] text-zinc-500 font-mono">
              Admin Portal
            </span>
          </div>
        </div>

        {/* Middle Search & Quick Stat Pill */}
        <div className="hidden lg:flex items-center gap-6">
          <div className="relative h-9 w-72 bg-zinc-900/90 border border-zinc-800 rounded-full flex items-center px-3.5 gap-2 text-xs text-zinc-400 focus-within:border-amber-500/60 transition-colors">
            <Search className="w-3.5 h-3.5 text-zinc-500" />
            <input
              type="text"
              placeholder="Search students, invoices, batches..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-transparent border-none outline-none text-xs text-zinc-200 placeholder:text-zinc-600 w-full"
            />
          </div>

          <div className="flex items-center gap-3 text-xs text-zinc-400 font-mono">
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>{stats.activeStudents} Active</span>
            </span>
            <span>•</span>
            <span className="text-amber-500">{stats.expiringSoonMemberships} Expiring</span>
          </div>
        </div>

        {/* User & Actions Zone */}
        <div className="flex items-center gap-3 sm:gap-4">
          <button
            type="button"
            onClick={() => setNotificationsOpen(true)}
            className="relative p-2 rounded-xl text-zinc-400 hover:text-zinc-100 hover:bg-zinc-900 border border-transparent hover:border-zinc-800 transition-colors cursor-pointer"
            title="Notifications"
          >
            <Bell className="w-4 h-4" />
            {unreadCount > 0 && (
              <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-amber-500 shadow-sm" />
            )}
          </button>

          <button
            type="button"
            onClick={() => setDarkMode(!darkMode)}
            className="p-2 rounded-xl text-zinc-400 hover:text-zinc-100 hover:bg-zinc-900 border border-transparent hover:border-zinc-800 transition-colors cursor-pointer"
            title="Toggle Theme"
          >
            {darkMode ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4" />}
          </button>

          <div className="h-6 w-px bg-zinc-800 hidden sm:block" />

          <div className="flex items-center gap-2.5">
            <div className="text-right hidden sm:block">
              <p className="text-xs font-semibold text-zinc-200">{currentUser?.fullName || 'Elena Vance'}</p>
              <p className="text-[9px] text-zinc-500 uppercase tracking-widest font-mono">Senior Registrar</p>
            </div>
            <img
              src={currentUser?.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80'}
              alt={currentUser?.fullName}
              className="w-9 h-9 rounded-full object-cover border-2 border-amber-500/30 ring-1 ring-zinc-800 shadow-md"
            />
            <button
              type="button"
              onClick={logout}
              className="p-1.5 rounded-lg text-zinc-500 hover:text-rose-400 hover:bg-rose-950/30 transition-colors ml-1"
              title="Sign Out"
            >
              <LogOut className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </nav>

      {/* MAIN CONTAINER: SIDEBAR + CONTENT */}
      <div className="flex-1 flex overflow-hidden">
        {/* DESKTOP ASIDE NAVIGATION */}
        <aside className="hidden md:flex w-60 border-r border-zinc-800/90 flex-col py-5 px-3 bg-[#0C0C0E] shrink-0 justify-between">
          <div className="space-y-1">
            <div className="px-3 pb-2 mb-2 border-b border-zinc-800/60">
              <p className="text-[10px] uppercase tracking-[0.25em] text-zinc-500 font-mono font-semibold">
                Institute Navigation
              </p>
            </div>

            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;

              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setActiveTab(item.id)}
                  className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-medium transition-all cursor-pointer ${
                    isActive
                      ? 'bg-zinc-900 border border-zinc-700 text-amber-400 font-semibold shadow-sm'
                      : 'text-zinc-400 hover:bg-zinc-900/60 hover:text-zinc-200 border border-transparent'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`p-1.5 rounded-lg ${
                        isActive
                          ? 'bg-amber-500/15 text-amber-400'
                          : item.highlight
                          ? 'bg-emerald-500/10 text-emerald-400'
                          : 'text-zinc-500'
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                    </div>
                    <span>{item.label}</span>
                  </div>

                  {item.badge !== undefined && (
                    <span
                      className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-full ${
                        isActive
                          ? 'bg-amber-500 text-zinc-950'
                          : 'bg-zinc-800 text-zinc-400'
                      }`}
                    >
                      {item.badge}
                    </span>
                  )}

                  {item.alert && !isActive && (
                    <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
                  )}
                </button>
              );
            })}
          </div>

          {/* Quick Academic Footnote */}
          <div className="p-3 rounded-2xl bg-zinc-900/60 border border-zinc-800/80 text-xs space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[10px] uppercase tracking-wider text-zinc-500 font-mono">Academic Term</span>
              <span className="text-[10px] font-bold text-amber-500 font-mono">2026 / Q3</span>
            </div>
            <p className="text-[11px] text-zinc-400 font-serif italic">
              "Music is the silence between the notes."
            </p>
          </div>
        </aside>

        {/* MOBILE MENU MODAL OVERLAY */}
        {mobileMenuOpen && (
          <div className="md:hidden fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex">
            <div className="w-72 bg-[#0C0C0E] border-r border-zinc-800 h-full p-4 flex flex-col justify-between shadow-2xl">
              <div className="space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 bg-gradient-to-br from-amber-400 to-amber-700 rounded-lg flex items-center justify-center font-bold text-zinc-950 text-xs">
                      S
                    </div>
                    <span className="font-serif italic text-amber-500 font-bold text-sm">
                      {settings.instituteName}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setMobileMenuOpen(false)}
                    className="p-1 rounded-lg text-zinc-400 hover:text-white"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <div className="space-y-1">
                  {navItems.map((item) => {
                    const Icon = item.icon;
                    const isActive = activeTab === item.id;

                    return (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => {
                          setActiveTab(item.id);
                          setMobileMenuOpen(false);
                        }}
                        className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs ${
                          isActive
                            ? 'bg-zinc-900 border border-zinc-700 text-amber-400 font-bold'
                            : 'text-zinc-400 hover:bg-zinc-900/60'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <Icon className="w-4 h-4" />
                          <span>{item.label}</span>
                        </div>
                        {item.badge !== undefined && (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-zinc-800 text-zinc-400">
                            {item.badge}
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>

              <button
                type="button"
                onClick={logout}
                className="w-full py-2.5 px-3 rounded-xl bg-rose-950/40 border border-rose-800/60 text-rose-300 text-xs font-bold flex items-center justify-center gap-2"
              >
                <LogOut className="w-4 h-4" />
                <span>Sign Out</span>
              </button>
            </div>
            <div className="flex-1" onClick={() => setMobileMenuOpen(false)} />
          </div>
        )}

        {/* MAIN EDITORIAL VIEWPORT */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 bg-[#0A0A0B]">
          <div className="max-w-7xl mx-auto space-y-8">
            {renderContent()}
          </div>
        </main>
      </div>

      {/* EDITORIAL STATUS FOOTER */}
      <footer className="h-10 bg-[#0C0C0E] border-t border-zinc-800/90 px-4 sm:px-8 flex items-center justify-between text-[10px] text-zinc-500 tracking-wider font-mono shrink-0">
        <div className="flex items-center gap-2">
          <span>SYSTEM STATUS:</span>
          <span className="text-emerald-500 font-semibold flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block" />
            SYNCHRONIZED
          </span>
        </div>
        <div className="flex items-center gap-6 uppercase">
          <span className="hidden sm:inline">Cloud Registry v4.2.0</span>
          <span className="text-zinc-400">{new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
        </div>
      </footer>

      {/* Notifications Drawer Modal */}
      <Modal
        isOpen={notificationsOpen}
        onClose={() => setNotificationsOpen(false)}
        maxWidth="md"
        showCloseButton={true}
      >
        <AdminNotifications onClose={() => setNotificationsOpen(false)} />
      </Modal>
    </div>
  );
};

