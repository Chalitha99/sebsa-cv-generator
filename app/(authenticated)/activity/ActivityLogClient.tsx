'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { PageWrapper } from '../../components/PageWrapper';
import { NotificationList } from '../../components/NotificationList';
import { markNotificationReadAction, markAllNotificationsReadAction } from '../notifications/actions';
import type { AppNotification } from '@/services/notification-service';
import { ArrowLeft, History } from 'lucide-react';

interface ActivityLogClientProps {
  initialNotifications: AppNotification[];
}

export default function ActivityLogClient({ initialNotifications }: ActivityLogClientProps) {
  const router = useRouter();
  const [notifications, setNotifications] = useState(initialNotifications);
  const unreadCount = notifications.filter((n) => !n.isRead).length;

  const handleItemClick = async (n: AppNotification) => {
    if (!n.isRead) {
      setNotifications((prev) => prev.map((x) => (x.id === n.id ? { ...x, isRead: true } : x)));
      markNotificationReadAction(n.id).catch((err) => console.error('Failed to mark notification read:', err));
    }
    if (n.link) router.push(n.link);
  };

  const handleMarkAllRead = async () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    try {
      await markAllNotificationsReadAction();
    } catch (err) {
      console.error('Failed to mark all notifications read:', err);
    }
  };

  return (
    <PageWrapper className="p-8">
      <button
        onClick={() => router.back()}
        className="flex items-center gap-2 text-xs font-black text-slate-500 hover:text-slate-900 uppercase tracking-wider mb-6 group cursor-pointer"
      >
        <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-1" />
        <span>Back</span>
      </button>

      <div className="mb-8 flex items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-black tracking-tight text-slate-900 font-sans leading-none flex items-center gap-2.5">
            <History className="w-6 h-6 text-indigo-600" />
            Full Activity Log
          </h2>
          <p className="text-sm font-medium text-slate-500 mt-2">
            Your notification history, most recent first.
          </p>
        </div>
        {unreadCount > 0 && (
          <button
            type="button"
            onClick={handleMarkAllRead}
            className="text-xs font-black text-indigo-600 hover:text-indigo-700 uppercase tracking-wide transition-colors cursor-pointer shrink-0"
          >
            Mark all read
          </button>
        )}
      </div>

      <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm">
        <NotificationList notifications={notifications} onItemClick={handleItemClick} />
      </div>
    </PageWrapper>
  );
}
