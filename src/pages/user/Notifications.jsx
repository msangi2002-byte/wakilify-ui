import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Bell,
  MessageCircle,
  Heart,
  ShoppingBag,
  UserPlus,
  Settings,
  Check,
  Share2,
  UserCheck,
} from 'lucide-react';
import { getNotifications, markNotificationRead, markAllNotificationsRead } from '@/lib/api/notifications';

const ICON_BY_TYPE = {
  LIKE: Heart,
  COMMENT: MessageCircle,
  SHARE: Share2,
  FRIEND_REQUEST: UserPlus,
  FRIEND_ACCEPT: UserCheck,
  FOLLOW: UserPlus,
  SYSTEM: Bell,
};

function formatNotifTime(createdAt) {
  if (!createdAt) return '';
  const date = new Date(createdAt);
  const now = new Date();
  const diffMs = now - date;
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);
  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString();
}

function linkForNotification(n) {
  if (n.type === 'FOLLOW' && n.actor?.id) return `/app/profile/${n.actor.id}`;
  if (n.type === 'LIKE' || n.type === 'COMMENT') return n.entityId ? `/app` : '/app';
  if (n.type === 'FRIEND_REQUEST' || n.type === 'FRIEND_ACCEPT') return '/app/friends';
  if (n.type === 'SYSTEM') return '/app';
  return '/app';
}

function NotificationItem({ item, onMarkRead }) {
  const Icon = ICON_BY_TYPE[item.type] || Bell;
  const link = linkForNotification(item);
  return (
    <Link
      to={link}
      className={`notif-item ${item.isRead ? 'read' : ''}`}
      onClick={() => onMarkRead(item.id)}
    >
      <span className="notif-item-icon">
        <Icon size={22} />
      </span>
      <div className="notif-item-body">
        <span className="notif-item-title">
          {item.type === 'FOLLOW' && item.actor?.name ? `${item.actor.name} started following you` : item.message}
        </span>
        {item.actor?.name && item.type !== 'FOLLOW' && (
          <span className="notif-item-desc">{item.actor.name}</span>
        )}
        <span className="notif-item-time">{formatNotifTime(item.createdAt)}</span>
      </div>
      {!item.isRead && <span className="notif-item-dot" aria-hidden />}
    </Link>
  );
}

export default function Notifications() {
  const [notifs, setNotifs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    let cancelled = false;
    getNotifications({ page: 0, size: 50 })
      .then((res) => {
        if (!cancelled && res?.content) setNotifs(res.content);
      })
      .catch(() => {
        if (!cancelled) setNotifs([]);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => { cancelled = true; };
  }, []);

  const markRead = async (id) => {
    setNotifs((prev) => prev.map((n) => (n.id === id ? { ...n, isRead: true } : n)));
    try {
      await markNotificationRead(id);
    } catch (_) {}
  };

  const markAllRead = async () => {
    setNotifs((prev) => prev.map((n) => ({ ...n, isRead: true })));
    try {
      await markAllNotificationsRead();
    } catch (_) {}
  };

  const filtered = filter === 'unread' ? notifs.filter((n) => !n.isRead) : notifs;
  const unreadCount = notifs.filter((n) => !n.isRead).length;

  return (
    <div className="settings-page notif-page">
      <header className="settings-header notif-header">
        <h1 className="settings-title">Notifications</h1>
        <p className="settings-subtitle">
          {unreadCount > 0
            ? `${unreadCount} unread notification${unreadCount !== 1 ? 's' : ''}`
            : 'You’re all caught up'}
        </p>
        <div className="notif-header-actions">
          <div className="notif-filter" role="group" aria-label="Filter">
            <button
              type="button"
              className={`notif-filter-btn ${filter === 'all' ? 'active' : ''}`}
              onClick={() => setFilter('all')}
            >
              All
            </button>
            <button
              type="button"
              className={`notif-filter-btn ${filter === 'unread' ? 'active' : ''}`}
              onClick={() => setFilter('unread')}
            >
              Unread
            </button>
          </div>
          {unreadCount > 0 && (
            <button
              type="button"
              className="settings-btn settings-btn-secondary notif-mark-all"
              onClick={markAllRead}
            >
              <Check size={16} />
              Mark all read
            </button>
          )}
          <Link
            to="/app/settings"
            className="settings-btn settings-btn-secondary notif-settings-link"
          >
            <Settings size={16} />
            Notification settings
          </Link>
        </div>
      </header>

      <section className="user-app-card settings-section notif-list-section">
        {loading ? (
          <div className="notif-empty">
            <p className="notif-empty-desc">Loading notifications…</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="notif-empty">
            <Bell size={48} className="notif-empty-icon" />
            <p className="notif-empty-title">No notifications</p>
            <p className="notif-empty-desc">
              {filter === 'unread'
                ? "You don't have any unread notifications."
                : "You haven't received any notifications yet."}
            </p>
          </div>
        ) : (
          <ul className="notif-list" role="list">
            {filtered.map((item) => (
              <li key={item.id}>
                <NotificationItem item={item} onMarkRead={markRead} />
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
