import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import {
  Bell,
  MessageCircle,
  Heart,
  UserPlus,
  Check,
  Share2,
  UserCheck,
  Users,
  Radio,
} from 'lucide-react';
import { getNotifications, markNotificationRead, markAllNotificationsRead } from '@/lib/api/notifications';
import { formatPostTime } from '@/lib/utils/dateUtils';
import { NotificationsListSkeleton } from '@/components/ui/NotificationsListSkeleton';

const ICON_BY_TYPE = {
  LIKE: Heart,
  COMMENT: MessageCircle,
  SHARE: Share2,
  FRIEND_REQUEST: UserPlus,
  FRIEND_ACCEPT: UserCheck,
  FOLLOW: UserPlus,
  COMMUNITY_INVITE: Users,
  LIVE_STARTED: Radio,
  SYSTEM: Bell,
};

function linkForNotification(n) {
  if (n.type === 'FOLLOW' && n.actor?.id) return `/app/profile/${n.actor.id}`;
  if (n.type === 'FRIEND_REQUEST' || n.type === 'FRIEND_ACCEPT') return '/app/friends';
  if (n.type === 'COMMUNITY_INVITE' && n.entityId) return `/app/groups/${n.entityId}`;
  if (n.type === 'LIVE_STARTED' && n.entityId) return `/app/live/${n.entityId}`;
  if ((n.type === 'LIKE' || n.type === 'COMMENT' || n.type === 'SHARE') && n.entityId) return `/app`;
  if (n.type === 'SYSTEM') return '/app';
  return '/app';
}

function NotificationAvatar({ actor, type }) {
  const Icon = ICON_BY_TYPE[type] || Bell;
  if (actor?.profilePic) {
    return (
      <span className="notif-item-avatar">
        <img src={actor.profilePic} alt="" />
      </span>
    );
  }
  const initial = actor?.name ? actor.name.charAt(0).toUpperCase() : '?';
  return (
    <span className="notif-item-avatar notif-item-avatar-placeholder">
      {initial}
    </span>
  );
}

function NotificationItem({ item, onMarkRead }) {
  const link = linkForNotification(item);
  const actorName = item.actor?.name || 'Someone';

  return (
    <Link
      to={link}
      className={`notif-item ${item.isRead ? 'read' : ''}`}
      onClick={() => onMarkRead(item.id)}
    >
      <NotificationAvatar actor={item.actor} type={item.type} />
      <div className="notif-item-body">
        <span className="notif-item-message">{item.message}</span>
        <span className="notif-item-time">{formatPostTime(item.createdAt)}</span>
      </div>
      {!item.isRead && <span className="notif-item-dot" aria-hidden />}
    </Link>
  );
}

export default function Notifications() {
  const queryClient = useQueryClient();
  const [filter, setFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState(''); // '', 'LIKE', 'COMMENT', 'FOLLOW'

  const { data: notifs = [], isLoading: loading } = useQuery({
    queryKey: ['notifications', typeFilter],
    queryFn: () => getNotifications({ page: 0, size: 50, ...(typeFilter && { type: typeFilter }) }),
    select: (res) => res?.content ?? [],
  });

  const markRead = async (id) => {
    queryClient.setQueryData(['notifications', typeFilter], (prev = []) =>
      prev.map((n) => (n.id === id ? { ...n, isRead: true } : n))
    );
    try {
      await markNotificationRead(id);
    } catch (_) {}
  };

  const markAllRead = async () => {
    queryClient.setQueryData(['notifications', typeFilter], (prev = []) =>
      prev.map((n) => ({ ...n, isRead: true }))
    );
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
            : "You're all caught up"}
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
            <button
              type="button"
              className={`notif-filter-btn ${typeFilter === 'LIKE' ? 'active' : ''}`}
              onClick={() => setTypeFilter(typeFilter === 'LIKE' ? '' : 'LIKE')}
            >
              Likes
            </button>
            <button
              type="button"
              className={`notif-filter-btn ${typeFilter === 'COMMENT' ? 'active' : ''}`}
              onClick={() => setTypeFilter(typeFilter === 'COMMENT' ? '' : 'COMMENT')}
            >
              Comments
            </button>
            <button
              type="button"
              className={`notif-filter-btn ${typeFilter === 'FOLLOW' ? 'active' : ''}`}
              onClick={() => setTypeFilter(typeFilter === 'FOLLOW' ? '' : 'FOLLOW')}
            >
              Follows
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
            Notification settings
          </Link>
        </div>
      </header>

      <section className="user-app-card settings-section notif-list-section">
        {loading ? (
          <NotificationsListSkeleton rows={8} />
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
