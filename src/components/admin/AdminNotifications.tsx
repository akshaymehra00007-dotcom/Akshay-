import React from 'react';
import { useApp } from '../../context/AppContext';
import { Bell, CheckCheck, Clock, CreditCard, Shield, AlertTriangle, Sparkles } from 'lucide-react';
import { formatDate } from '../../utils/dateUtils';

interface AdminNotificationsProps {
  onClose?: () => void;
}

export const AdminNotifications: React.FC<AdminNotificationsProps> = () => {
  const { notifications, markNotificationAsRead, markAllNotificationsAsRead } = useApp();

  const adminNotifs = notifications.filter(
    (n) => n.targetRole === 'admin' || n.targetRole === 'all'
  );

  const unreadCount = adminNotifs.filter((n) => !n.read).length;

  return (
    <div className="space-y-4 font-sans">
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-amber-500/10 text-amber-400 flex items-center justify-center border border-amber-500/20">
            <Bell className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-serif italic text-zinc-100">
              Academy Dispatch Center
            </h3>
            <p className="text-[10px] font-mono text-zinc-500">
              {unreadCount} unread system & dispatch alerts
            </p>
          </div>
        </div>

        {unreadCount > 0 && (
          <button
            type="button"
            onClick={() => markAllNotificationsAsRead('admin')}
            className="text-xs font-mono text-amber-400 hover:text-amber-300 flex items-center gap-1 cursor-pointer"
          >
            <CheckCheck className="w-3.5 h-3.5" />
            <span>Mark All Read</span>
          </button>
        )}
      </div>

      {/* List */}
      <div className="space-y-2.5 max-h-[420px] overflow-y-auto pr-1">
        {adminNotifs.length === 0 ? (
          <div className="py-12 text-center text-zinc-500 font-mono">
            <Bell className="w-8 h-8 mx-auto mb-2 opacity-30 text-amber-500" />
            <p className="text-xs">No active dispatches or notifications.</p>
          </div>
        ) : (
          adminNotifs.map((notif) => {
            let icon = <Sparkles className="w-4 h-4 text-amber-400" />;
            if (notif.type === 'payment') {
              icon = <CreditCard className="w-4 h-4 text-emerald-400" />;
            } else if (notif.type === 'membership') {
              icon = <Shield className="w-4 h-4 text-amber-400" />;
            } else if (notif.type === 'fee') {
              icon = <AlertTriangle className="w-4 h-4 text-rose-400" />;
            }

            return (
              <div
                key={notif.id}
                onClick={() => !notif.read && markNotificationAsRead(notif.id)}
                className={`p-3.5 rounded-xl border transition-all cursor-pointer flex items-start gap-3 ${
                  notif.read
                    ? 'bg-zinc-900/40 border-zinc-800 opacity-70'
                    : 'bg-zinc-900 border-amber-500/30 shadow-md'
                }`}
              >
                <div className="mt-0.5 shrink-0 p-2 rounded-lg bg-zinc-800 border border-zinc-700/50">
                  {icon}
                </div>
                <div className="flex-1 min-w-0 font-mono">
                  <div className="flex items-center justify-between gap-2">
                    <h4
                      className={`text-xs truncate font-sans ${
                        notif.read
                          ? 'font-medium text-zinc-400'
                          : 'font-bold text-zinc-100'
                      }`}
                    >
                      {notif.title}
                    </h4>
                    {!notif.read && (
                      <span className="w-2 h-2 rounded-full bg-amber-400 shrink-0" />
                    )}
                  </div>
                  <p className="text-[11px] text-zinc-400 mt-0.5 leading-relaxed font-sans">
                    {notif.message}
                  </p>
                  <div className="flex items-center gap-1 text-[10px] text-zinc-500 mt-1.5 font-mono">
                    <Clock className="w-3 h-3 text-zinc-500" />
                    <span>{formatDate(notif.createdAt)}</span>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
