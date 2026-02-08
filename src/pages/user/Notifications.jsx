import { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Bell,
  MessageCircle,
  Heart,
  ShoppingBag,
  UserPlus,
  Settings,
  Check,
} from 'lucide-react';

const MOCK_NOTIFICATIONS = [
  {
    id: '1',
    type: 'like',
    icon: Heart,
    title: 'Someone liked your post',
    body: 'Alex and 3 others liked your photo.',
    time: '2m ago',
    read: false,
    link: '/app',
  },
  {
    id: '2',
    type: 'message',
    icon: MessageCircle,
    title: 'New message',
    body: 'Jordan: Hey, is this still available?',
    time: '15m ago',
    read: false,
    link: '/app/messages',
  },
  {
    id: '3',
    type: 'order',
    icon: ShoppingBag,
    title: 'Order shipped',
    body: 'Your order #2847 has been shipped.',
    time: '1h ago',
    read: true,
    link: '/app/shop',
  },
  {
    id: '4',
    type: 'follow',
    icon: UserPlus,
    title: 'New follower',
    body: 'Sam started following you.',
    time: '3h ago',
    read: true,
    link: '/app/profile',
  },
  {
    id: '5',
    type: 'like',
    icon: Heart,
    title: 'Comment on your post',
    body: 'Morgan commented: "Love this!"',
    time: 'Yesterday',
    read: true,
    link: '/app',
  },
];

function NotificationItem({ item, onMarkRead }) {
  const Icon = item.icon;
  return (
    <Link
      to={item.link}
      className={`notif-item ${item.read ? 'read' : ''}`}
      onClick={() => onMarkRead(item.id)}
    >
      <span className="notif-item-icon">
        <Icon size={22} />
      </span>
      <div className="notif-item-body">
        <span className="notif-item-title">{item.title}</span>
        <span className="notif-item-desc">{item.body}</span>
        <span className="notif-item-time">{item.time}</span>
      </div>
      {!item.read && <span className="notif-item-dot" aria-hidden />}
    </Link>
  );
}

export default function Notifications() {
  const [notifs, setNotifs] = useState(MOCK_NOTIFICATIONS);
  const [filter, setFilter] = useState('all'); // all | unread

  const markRead = (id) => {
    setNotifs((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    );
  };

  const markAllRead = () => {
    setNotifs((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  const filtered =
    filter === 'unread' ? notifs.filter((n) => !n.read) : notifs;
  const unreadCount = notifs.filter((n) => !n.read).length;

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
        {filtered.length === 0 ? (
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
