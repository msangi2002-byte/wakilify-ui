/**
 * Input or textarea with @ mention support: typing @ triggers live user search dropdown.
 * Parent gets display value (with @Name); on submit use getSubmitContent(displayValue) for content + taggedUserIds.
 * Dropdown is rendered in a portal so it is not hidden by overflow in comment sections.
 */
import { useState, useRef, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { Link } from 'react-router-dom';
import { searchUsers } from '@/lib/api/users';

const MENTION_PATTERN = /@([^\s@(]+)/g;
const SUBMIT_MENTION_PATTERN = /@\(([a-f0-9-]{36})\)/gi;

/** Build submit content: replace @Name with @(id) in order. */
export function getSubmitContent(displayValue, mentionOrder) {
  if (!displayValue || !mentionOrder?.length) return { content: displayValue || '', taggedUserIds: [] };
  let i = 0;
  const content = displayValue.replace(MENTION_PATTERN, () => {
    if (i < mentionOrder.length) {
      const id = mentionOrder[i].id;
      i += 1;
      return `@(${id})`;
    }
    return arguments[0];
  });
  const taggedUserIds = mentionOrder.map((m) => m.id);
  return { content, taggedUserIds };
}

/** Parse content that may contain @(uuid) and return { parts: [{ type: 'text'|'mention', text, user? }], taggedUsers }. */
export function parseMentionContent(content, taggedUsers = []) {
  if (!content) return { parts: [], taggedUsers: [] };
  const usersById = new Map((taggedUsers || []).map((u) => [u.id, u]));
  const parts = [];
  let lastIndex = 0;
  let m;
  const re = new RegExp(SUBMIT_MENTION_PATTERN.source, 'gi');
  while ((m = re.exec(content)) !== null) {
    if (m.index > lastIndex) {
      parts.push({ type: 'text', text: content.slice(lastIndex, m.index) });
    }
    const id = m[1];
    const user = usersById.get(id);
    parts.push({ type: 'mention', id, name: user?.name ?? 'User', profilePic: user?.profilePic });
    lastIndex = re.lastIndex;
  }
  if (lastIndex < content.length) {
    parts.push({ type: 'text', text: content.slice(lastIndex) });
  }
  return { parts, taggedUsers };
}

const DEBOUNCE_MS = 250;

export function MentionInput({
  value,
  onChange,
  placeholder = '',
  multiline = false,
  maxLength = 2000,
  className = '',
  inputClassName = '',
  disabled = false,
  mentionOrderRef,
  rows,
  'aria-label': ariaLabel,
}) {
  const [query, setQuery] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [dropdownIndex, setDropdownIndex] = useState(0);
  const [dropdownPosition, setDropdownPosition] = useState({ top: 0, left: 0, width: 200, above: false });
  const inputRef = useRef(null);
  const dropdownRef = useRef(null);
  const searchTimeoutRef = useRef(null);
  const orderRef = useRef([]);

  const DROPDOWN_MAX_HEIGHT = 240;

  const updateDropdownPosition = useCallback(() => {
    const el = inputRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const spaceBelow = typeof window !== 'undefined' ? window.innerHeight - rect.bottom : 300;
    const above = spaceBelow < DROPDOWN_MAX_HEIGHT + 8 && rect.top > DROPDOWN_MAX_HEIGHT + 8;
    setDropdownPosition({
      top: above ? rect.top - DROPDOWN_MAX_HEIGHT - 2 : rect.bottom + 2,
      left: rect.left,
      width: Math.max(rect.width, 200),
      above,
    });
  }, []);

  const triggerSearch = useCallback((q) => {
    if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
    if (!q || q.length < 1) {
      setUsers([]);
      setShowDropdown(false);
      return;
    }
    searchTimeoutRef.current = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await searchUsers(q, { size: 10, page: 0 });
        const list = res?.content ?? res ?? [];
        setUsers(Array.isArray(list) ? list : []);
        setShowDropdown(true);
        setDropdownIndex(0);
      } catch {
        setUsers([]);
      } finally {
        setLoading(false);
      }
    }, DEBOUNCE_MS);
  }, []);

  const handleChange = useCallback(
    (e) => {
      const v = e.target.value;
      onChange(v);

      const selStart = e.target.selectionStart ?? v.length;
      const beforeCursor = v.slice(0, selStart);
      const lastAt = beforeCursor.lastIndexOf('@');
      if (lastAt === -1) {
        setShowDropdown(false);
        setQuery('');
        return;
      }
      const afterAt = beforeCursor.slice(lastAt + 1);
      if (/\s/.test(afterAt) || afterAt.includes('(')) {
        setShowDropdown(false);
        setQuery('');
        return;
      }
      setQuery(afterAt);
      triggerSearch(afterAt);
    },
    [onChange, triggerSearch]
  );

  const insertMention = useCallback(
    (user) => {
      const input = inputRef.current;
      const v = value || '';
      const selStart = input?.selectionStart ?? v.length;
      const beforeCursor = v.slice(0, selStart);
      const lastAt = beforeCursor.lastIndexOf('@');
      const before = lastAt >= 0 ? v.slice(0, lastAt) : v;
      const after = v.slice(selStart);
      const name = user.name || 'User';
      const insert = `@${name} `;
      const newValue = (before + insert + after).slice(0, maxLength);
      onChange(newValue);

      orderRef.current = [...orderRef.current, { id: user.id, name }];
      if (mentionOrderRef) mentionOrderRef.current = orderRef.current;

      setShowDropdown(false);
      setQuery('');
      setUsers([]);
      setDropdownIndex(0);
      setTimeout(() => {
        if (input) {
          const pos = before.length + insert.length;
          input.focus();
          input.setSelectionRange(pos, pos);
        }
      }, 0);
    },
    [value, onChange, maxLength, mentionOrderRef]
  );

  const handleKeyDown = useCallback(
    (e) => {
      if (!showDropdown || users.length === 0) return;
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setDropdownIndex((i) => (i + 1) % users.length);
        return;
      }
      if (e.key === 'ArrowUp') {
        e.preventDefault();
        setDropdownIndex((i) => (i - 1 + users.length) % users.length);
        return;
      }
      if (e.key === 'Enter' && users[dropdownIndex]) {
        e.preventDefault();
        insertMention(users[dropdownIndex]);
        return;
      }
      if (e.key === 'Escape') {
        setShowDropdown(false);
      }
    },
    [showDropdown, users, dropdownIndex, insertMention]
  );

  useEffect(() => {
    if (mentionOrderRef) mentionOrderRef.current = orderRef.current;
    return () => {
      if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
    };
  }, [mentionOrderRef]);

  useEffect(() => {
    if (!value || value.trim() === '') {
      orderRef.current = [];
      if (mentionOrderRef) mentionOrderRef.current = [];
    }
  }, [value, mentionOrderRef]);

  useEffect(() => {
    if (!showDropdown) return;
    updateDropdownPosition();
    const onScrollOrResize = () => updateDropdownPosition();
    window.addEventListener('scroll', onScrollOrResize, true);
    window.addEventListener('resize', onScrollOrResize);
    return () => {
      window.removeEventListener('scroll', onScrollOrResize, true);
      window.removeEventListener('resize', onScrollOrResize);
    };
  }, [showDropdown, updateDropdownPosition, users.length, loading]);

  const InputComponent = multiline ? 'textarea' : 'input';
  const inputProps = {
    ref: inputRef,
    value: value ?? '',
    onChange: handleChange,
    onKeyDown: handleKeyDown,
    placeholder,
    maxLength,
    disabled,
    className: inputClassName || undefined,
    'aria-label': ariaLabel,
  };
  if (multiline) inputProps.rows = rows ?? 4;

  const dropdownEl = showDropdown ? (
    <div
      ref={dropdownRef}
      className="mention-input-dropdown"
      role="listbox"
      style={{
        position: 'fixed',
        top: dropdownPosition.top,
        left: dropdownPosition.left,
        width: dropdownPosition.width,
        maxHeight: DROPDOWN_MAX_HEIGHT,
        background: '#fff',
        border: '1px solid #e5e7eb',
        borderRadius: 8,
        boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
        overflow: 'auto',
        zIndex: 10000,
        color: '#111',
      }}
    >
      {loading ? (
        <div style={{ padding: 12, color: '#374151' }}>Searching…</div>
      ) : users.length === 0 ? (
        <div style={{ padding: 12, color: '#374151' }}>No users found</div>
      ) : (
        users.map((u, i) => (
          <button
            key={u.id}
            type="button"
            role="option"
            aria-selected={i === dropdownIndex}
            className="mention-input-option"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              width: '100%',
              padding: '10px 12px',
              border: 'none',
              background: i === dropdownIndex ? '#f3f4f6' : 'transparent',
              cursor: 'pointer',
              textAlign: 'left',
              fontSize: 14,
              color: '#111',
            }}
            onMouseDown={(e) => {
              e.preventDefault();
              insertMention(u);
            }}
          >
            {u.profilePic ? (
              <img
                src={u.profilePic}
                alt=""
                style={{ width: 32, height: 32, borderRadius: '50%', objectFit: 'cover' }}
              />
            ) : (
              <div
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: '50%',
                  background: '#e5e7eb',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 14,
                  color: '#6b7280',
                }}
              >
                {(u.name || '?')[0]}
              </div>
            )}
            <span style={{ color: '#111' }}>{u.name || 'User'}</span>
          </button>
        ))
      )}
    </div>
  ) : null;

  return (
    <div className={`mention-input-wrap ${className}`} style={{ position: 'relative' }}>
      <InputComponent {...inputProps} />
      {typeof document !== 'undefined' && dropdownEl && createPortal(dropdownEl, document.body)}
    </div>
  );
}

/**
 * Renders post/comment content with @(uuid) turned into profile links.
 * Mentions are highlighted ("lighted") and clickable → go to user profile.
 * taggedUsers: [{ id, name, profilePic }]
 */
export function MentionContent({ content, taggedUsers = [], className = '', linkClass = '' }) {
  const { parts } = parseMentionContent(content, taggedUsers);
  if (!parts.length) return <span className={className} />;
  return (
    <span className={className}>
      {parts.map((p, i) => {
        if (p.type === 'text') return <span key={i}>{p.text}</span>;
        return (
          <Link
            key={i}
            to={`/app/profile/${p.id}`}
            className={linkClass || 'mention-link mention-lighted'}
            title={`Go to ${p.name}'s profile`}
          >
            @{p.name}
          </Link>
        );
      })}
    </span>
  );
}

export default MentionInput;
