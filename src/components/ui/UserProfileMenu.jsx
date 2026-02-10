/**
 * Facebook/Instagram-style: click on user avatar/name → dropdown with "View Profile".
 * Use on posts, stories, chat, etc.
 */
import { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { User } from 'lucide-react';
import '@/styles/user-app.css';

function Avatar({ user, size = 40, className = '' }) {
  const src = user?.profilePic;
  const name = user?.name || 'User';
  const initial = name.charAt(0).toUpperCase();
  return (
    <div
      className={className}
      style={{
        width: size,
        height: size,
        borderRadius: '50%',
        overflow: 'hidden',
        background: 'linear-gradient(135deg, #7c3aed, #d946ef)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: '#fff',
        fontWeight: 600,
        fontSize: size * 0.4,
        flexShrink: 0,
      }}
    >
      {src ? <img src={src} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : initial}
    </div>
  );
}

export function UserProfileMenu({
  user,
  avatarSize = 40,
  className = '',
  children,
  showAvatar = true,
  showName = true,
  alignMenu = 'left',
}) {
  const [open, setOpen] = useState(false);
  const menuRef = useRef(null);
  const navigate = useNavigate();
  const userId = user?.id;

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) setOpen(false);
    };
    if (open) {
      document.addEventListener('click', handleClickOutside);
      return () => document.removeEventListener('click', handleClickOutside);
    }
  }, [open]);

  if (!userId) {
    return children ?? (
      <div className={className} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        {showAvatar && <Avatar user={user} size={avatarSize} />}
        {showName && <span>{user?.name || 'User'}</span>}
      </div>
    );
  }

  const handleViewProfile = () => {
    setOpen(false);
    navigate(`/app/profile/${userId}`);
  };

  return (
    <div ref={menuRef} className={`user-profile-menu-wrap ${className}`} style={{ position: 'relative' }}>
      <button
        type="button"
        className="user-profile-menu-trigger"
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          setOpen((o) => !o);
        }}
        aria-haspopup="menu"
        aria-expanded={open}
      >
        {children ?? (
          <>
            {showAvatar && <Avatar user={user} size={avatarSize} />}
            {showName && <span className="user-profile-menu-name">{user?.name || 'User'}</span>}
          </>
        )}
      </button>
      {open && (
        <div
          className={`user-profile-menu ${alignMenu === 'right' ? 'user-profile-menu-right' : ''}`}
          role="menu"
        >
          <button type="button" className="user-profile-menu-item" onClick={handleViewProfile} role="menuitem">
            <User size={18} />
            View Profile
          </button>
        </div>
      )}
    </div>
  );
}
