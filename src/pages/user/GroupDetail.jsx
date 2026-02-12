import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Users, LogOut, Loader2, Settings, X, ImagePlus, ArrowLeft, Pin, PinOff, UserPlus, Search } from 'lucide-react';
import { GroupPost } from '@/components/social/GroupPost';
import { getCommunity, joinCommunity, leaveCommunity, updateCommunitySettings, pinPost, unpinPost, inviteUsers } from '@/lib/api/communities';
import { searchUsers } from '@/lib/api/users';
import { getPostsByCommunity, createPost, uploadChunked, CHUNK_THRESHOLD_BYTES } from '@/lib/api/posts';
import { UploadProgressBar } from '@/components/ui/UploadProgressBar';
import { getApiErrorMessage } from '@/lib/utils/apiError';
import { formatPostTime } from '@/lib/utils/dateUtils';
import '@/styles/user-app.css';

function mapPostToGroupPost(post, groupName) {
  const media = post.media ?? [];
  const images = media.map((m) => ({ url: m?.url ?? m?.thumbnailUrl ?? null }));
  return {
    id: post.id,
    author: post.author ?? { name: 'User' },
    groupName: groupName ?? null,
    time: formatPostTime(post.createdAt),
    description: post.caption ?? '',
    images,
    likesCount: post.reactionsCount ?? 0,
    commentsCount: post.commentsCount ?? 0,
    sharesCount: post.sharesCount ?? 0,
    isPinned: !!post.isPinned,
    pinnedAt: post.pinnedAt,
  };
}

export default function GroupDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [group, setGroup] = useState(null);
  const [groupLoading, setGroupLoading] = useState(true);
  const [groupError, setGroupError] = useState(null);
  const [posts, setPosts] = useState([]);
  const [postsLoading, setPostsLoading] = useState(true);
  const [postsError, setPostsError] = useState(null);
  const [joinLeaveLoading, setJoinLeaveLoading] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [settingsSaving, setSettingsSaving] = useState(false);
  const [allowMemberPosts, setAllowMemberPosts] = useState(true);
  const [createCaption, setCreateCaption] = useState('');
  const [createFiles, setCreateFiles] = useState([]);
  const [createSubmitting, setCreateSubmitting] = useState(false);
  const [createUploadProgress, setCreateUploadProgress] = useState(0);
  const [createError, setCreateError] = useState('');
  const [inviteOpen, setInviteOpen] = useState(false);
  const [inviteSearchQuery, setInviteSearchQuery] = useState('');
  const [inviteSearchResults, setInviteSearchResults] = useState([]);
  const [inviteSelected, setInviteSelected] = useState([]);
  const [inviteSubmitting, setInviteSubmitting] = useState(false);
  const [inviteError, setInviteError] = useState('');

  useEffect(() => {
    if (!id) return;
    let cancelled = false;
    setGroupLoading(true);
    setGroupError(null);
    getCommunity(id)
      .then((data) => {
        if (!cancelled) {
          setGroup(data);
          setAllowMemberPosts(data?.allowMemberPosts !== false);
        }
      })
      .catch((err) => {
        if (!cancelled) {
          const status = err?.response?.status;
          const msg = getApiErrorMessage(err, 'Failed to load group');
          setGroupError(status === 404 ? 'Group not found.' : msg);
        }
      })
      .finally(() => { if (!cancelled) setGroupLoading(false); });
    return () => { cancelled = true; };
  }, [id]);

  useEffect(() => {
    if (!id) return;
    let cancelled = false;
    setPostsLoading(true);
    setPostsError(null);
    getPostsByCommunity(id, { size: 50 })
      .then((list) => {
        if (!cancelled) setPosts(Array.isArray(list) ? list : []);
      })
      .catch((err) => {
        if (!cancelled) setPostsError(err?.response?.data?.message ?? 'Failed to load posts');
      })
      .finally(() => { if (!cancelled) setPostsLoading(false); });
    return () => { cancelled = true; };
  }, [id]);

  const handleJoinLeave = async () => {
    if (!group || joinLeaveLoading) return;
    setJoinLeaveLoading(true);
    try {
      if (group.isMember) {
        await leaveCommunity(id);
        setGroup((g) => ({ ...g, isMember: false, membersCount: Math.max(0, (g.membersCount ?? 1) - 1) }));
      } else {
        await joinCommunity(id);
        setGroup((g) => ({ ...g, isMember: true, membersCount: (g.membersCount ?? 0) + 1 }));
      }
    } catch (_) {
      // keep state unchanged
    } finally {
      setJoinLeaveLoading(false);
    }
  };

  const handleSaveSettings = async () => {
    const admin = group?.isAdmin === true || group?.admin === true;
    if (!admin || settingsSaving) return;
    setSettingsSaving(true);
    try {
      const updated = await updateCommunitySettings(id, { allowMemberPosts });
      setGroup((g) => ({ ...g, allowMemberPosts: updated?.allowMemberPosts !== false }));
      setSettingsOpen(false);
    } catch (_) {
      // keep modal open
    } finally {
      setSettingsSaving(false);
    }
  };

  useEffect(() => {
    if (!inviteOpen || !inviteSearchQuery.trim()) {
      setInviteSearchResults([]);
      return;
    }
    let cancelled = false;
    const timer = setTimeout(() => {
      searchUsers(inviteSearchQuery.trim(), { page: 0, size: 20 })
        .then((res) => {
          const content = res?.content ?? [];
          if (!cancelled) setInviteSearchResults(Array.isArray(content) ? content : []);
        })
        .catch(() => { if (!cancelled) setInviteSearchResults([]); });
    }, 300);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [inviteOpen, inviteSearchQuery]);

  const handleInviteUsers = async () => {
    if (!id || inviteSelected.length === 0 || inviteSubmitting) return;
    setInviteError('');
    setInviteSubmitting(true);
    try {
      await inviteUsers(id, inviteSelected.map((u) => u.id));
      setInviteOpen(false);
      setInviteSelected([]);
      setInviteSearchQuery('');
      setInviteSearchResults([]);
      const updated = await getCommunity(id);
      setGroup(updated);
    } catch (err) {
      setInviteError(getApiErrorMessage(err, 'Failed to invite users'));
    } finally {
      setInviteSubmitting(false);
    }
  };

  const toggleInviteUser = (u) => {
    const isSelected = inviteSelected.some((s) => s.id === u.id);
    if (isSelected) setInviteSelected((prev) => prev.filter((s) => s.id !== u.id));
    else setInviteSelected((prev) => [...prev, u]);
  };

  const handlePinPost = async (postId, currentlyPinned) => {
    if (!id || !postId || !isAdmin) return;
    try {
      if (currentlyPinned) await unpinPost(id, postId);
      else await pinPost(id, postId);
      const list = await getPostsByCommunity(id, { size: 50 });
      setPosts(Array.isArray(list) ? list : []);
    } catch (_) {}
  };

  const handleCreatePost = async (e) => {
    e.preventDefault();
    if (!id || !createCaption.trim() || createSubmitting) return;
    setCreateError('');
    setCreateSubmitting(true);
    setCreateUploadProgress(0);
    try {
      const hasLargeFile = createFiles.some((f) => f.size > CHUNK_THRESHOLD_BYTES);
      if (hasLargeFile && createFiles.length > 0) {
        const mediaUrls = [];
        const total = createFiles.length;
        for (let i = 0; i < createFiles.length; i++) {
          const url = await uploadChunked(createFiles[i], 'posts', (pct) =>
            setCreateUploadProgress(((i + pct / 100) / total) * 100)
          );
          mediaUrls.push(url);
        }
        await createPost({
          caption: createCaption.trim(),
          communityId: id,
          mediaUrls,
        });
      } else {
        await createPost({
          caption: createCaption.trim(),
          communityId: id,
          files: createFiles,
        });
      }
      setCreateCaption('');
      setCreateFiles([]);
      const list = await getPostsByCommunity(id, { size: 50 });
      setPosts(Array.isArray(list) ? list : []);
    } catch (err) {
      setCreateError(getApiErrorMessage(err, 'Failed to post'));
    } finally {
      setCreateSubmitting(false);
      setCreateUploadProgress(0);
    }
  };

  // Backend may send "admin"/"member" (Jackson) or "isAdmin"/"isMember"
  const isAdmin = group?.isAdmin === true || group?.admin === true;
  const isMember = group?.isMember === true || group?.member === true;
  const canPostInGroup = isMember && (group?.allowMemberPosts !== false || isAdmin);

  if (groupLoading) {
    return (
      <div className="groups-feed">
        <div className="group-detail-loading">
          <Loader2 size={32} className="spin" />
          <p>Loading group…</p>
        </div>
      </div>
    );
  }

  if (groupError || !group) {
    return (
      <div className="groups-feed">
        <div className="groups-feed-header">
          <h1 className="groups-feed-title">Group</h1>
          <p className="groups-feed-empty">{groupError || 'Group not found.'}</p>
        </div>
      </div>
    );
  }

  const groupName = group.name;

  return (
    <div className="groups-feed">
      <div className="groups-detail-mobile-bar">
        <button
          type="button"
          className="groups-detail-back"
          onClick={() => navigate('/app/groups')}
          aria-label="Back to groups"
        >
          <ArrowLeft size={24} />
        </button>
        <span className="groups-detail-mobile-title">{group.name}</span>
      </div>
      <div className="group-detail-header">
        <div
          className="group-detail-cover"
          style={{
            backgroundImage: group.coverImage ? `url(${group.coverImage})` : undefined,
          }}
        />
        <div className="group-detail-info">
          <h1 className="group-detail-name">{group.name}</h1>
          {group.description && (
            <p className="group-detail-description">{group.description}</p>
          )}
          <div className="group-detail-meta">
            <span className="group-detail-members">
              <Users size={18} />
              {(group.membersCount ?? 0).toLocaleString()} members
            </span>
            {group.creatorName && (
              <span className="group-detail-creator">
                Created by {group.creatorName}
              </span>
            )}
          </div>
          <div className="group-detail-actions">
            {isAdmin && (
              <>
                <button
                  type="button"
                  className="group-detail-btn group-detail-btn-join"
                  onClick={() => setInviteOpen(true)}
                  title="Invite members"
                >
                  <UserPlus size={18} />
                  Invite members
                </button>
                <button
                  type="button"
                  className="group-detail-btn group-detail-btn-settings"
                  onClick={() => setSettingsOpen(true)}
                  title="Group settings"
                >
                  <Settings size={18} />
                  Settings
                </button>
              </>
            )}
            {isMember ? (
              <button
                type="button"
                className="group-detail-btn group-detail-btn-leave"
                onClick={handleJoinLeave}
                disabled={joinLeaveLoading}
              >
                {joinLeaveLoading ? (
                  <Loader2 size={18} className="spin" />
                ) : (
                  <LogOut size={18} />
                )}
                Leave group
              </button>
            ) : (
              <button
                type="button"
                className="group-detail-btn group-detail-btn-join"
                onClick={handleJoinLeave}
                disabled={joinLeaveLoading}
              >
                {joinLeaveLoading ? (
                  <Loader2 size={18} className="spin" />
                ) : (
                  <Users size={18} />
                )}
                Join group
              </button>
            )}
          </div>
        </div>
      </div>

      {inviteOpen && (
        <div className="group-settings-overlay" onClick={() => !inviteSubmitting && setInviteOpen(false)}>
          <div className="group-settings-modal group-invite-modal" onClick={(e) => e.stopPropagation()}>
            <div className="group-settings-header">
              <h3>Invite members</h3>
              <button type="button" className="group-settings-close" onClick={() => setInviteOpen(false)} aria-label="Close">
                <X size={20} />
              </button>
            </div>
            <div className="group-invite-body">
              <div className="group-invite-search">
                <Search size={18} className="group-invite-search-icon" />
                <input
                  type="text"
                  placeholder="Search users by name..."
                  value={inviteSearchQuery}
                  onChange={(e) => setInviteSearchQuery(e.target.value)}
                  className="group-invite-search-input"
                />
              </div>
              {inviteError && <p className="group-invite-error" role="alert">{inviteError}</p>}
              <div className="group-invite-results">
                {inviteSearchQuery.trim() ? (
                  inviteSearchResults.length === 0 ? (
                    <p className="group-invite-hint">No users found. Try a different search.</p>
                  ) : (
                    <ul className="group-invite-list">
                      {inviteSearchResults.map((u) => {
                        const isSelected = inviteSelected.some((s) => s.id === u.id);
                        return (
                          <li key={u.id}>
                            <button
                              type="button"
                              className={`group-invite-item ${isSelected ? 'selected' : ''}`}
                              onClick={() => toggleInviteUser(u)}
                            >
                              <div className="group-invite-avatar">
                                {u.profilePic ? (
                                  <img src={u.profilePic} alt="" />
                                ) : (
                                  <span>{(u.name || 'U').charAt(0).toUpperCase()}</span>
                                )}
                              </div>
                              <span className="group-invite-name">{u.name ?? u.username ?? 'User'}</span>
                              {isSelected ? (
                                <span className="group-invite-check">✓</span>
                              ) : (
                                <span className="group-invite-add">+ Add</span>
                              )}
                            </button>
                          </li>
                        );
                      })}
                    </ul>
                  )
                ) : (
                  <p className="group-invite-hint">Type to search for users to invite.</p>
                )}
              </div>
              {inviteSelected.length > 0 && (
                <p className="group-invite-selected">
                  {inviteSelected.length} selected
                </p>
              )}
            </div>
            <div className="group-settings-footer">
              <button type="button" className="settings-btn settings-btn-secondary" onClick={() => setInviteOpen(false)}>
                Cancel
              </button>
              <button
                type="button"
                className="settings-btn settings-btn-primary"
                onClick={handleInviteUsers}
                disabled={inviteSubmitting || inviteSelected.length === 0}
              >
                {inviteSubmitting ? <Loader2 size={18} className="spin" /> : <UserPlus size={18} />}
                Invite {inviteSelected.length > 0 ? `(${inviteSelected.length})` : ''}
              </button>
            </div>
          </div>
        </div>
      )}

      {settingsOpen && (
        <div className="group-settings-overlay" onClick={() => !settingsSaving && setSettingsOpen(false)}>
          <div className="group-settings-modal" onClick={(e) => e.stopPropagation()}>
            <div className="group-settings-header">
              <h3>Group settings</h3>
              <button type="button" className="group-settings-close" onClick={() => setSettingsOpen(false)} aria-label="Close">
                <X size={20} />
              </button>
            </div>
            <div className="group-settings-body">
              <label className="group-settings-toggle-row">
                <span className="group-settings-toggle-label">Allow members to post</span>
                <span className="group-settings-toggle-desc">When off, only you and admins can post in this group.</span>
                <button
                  type="button"
                  role="switch"
                  aria-checked={allowMemberPosts}
                  className={`group-settings-toggle ${allowMemberPosts ? 'on' : ''}`}
                  onClick={() => setAllowMemberPosts((v) => !v)}
                >
                  <span className="group-settings-toggle-thumb" />
                </button>
              </label>
            </div>
            <div className="group-settings-footer">
              <button type="button" className="settings-btn settings-btn-secondary" onClick={() => setSettingsOpen(false)}>
                Cancel
              </button>
              <button type="button" className="settings-btn settings-btn-primary" onClick={handleSaveSettings} disabled={settingsSaving}>
                {settingsSaving ? <Loader2 size={18} className="spin" /> : null}
                Save
              </button>
            </div>
          </div>
        </div>
      )}

      {canPostInGroup && (
        <div className="group-create-post-section">
          <form onSubmit={handleCreatePost} className="group-create-post-form">
            {createError && <p className="group-create-post-error" role="alert">{createError}</p>}
            {createSubmitting && createUploadProgress > 0 && createUploadProgress < 100 && (
              <UploadProgressBar progress={createUploadProgress} label="Uploading…" />
            )}
            <textarea
              placeholder="Write something to the group..."
              value={createCaption}
              onChange={(e) => setCreateCaption(e.target.value)}
              className="group-create-post-input"
              rows={3}
              disabled={createSubmitting}
            />
            <div className="group-create-post-actions">
              <label className="group-create-post-file-label">
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={(e) => setCreateFiles(Array.from(e.target.files || []))}
                  className="group-create-post-file-input"
                />
                <ImagePlus size={20} />
                Photo
              </label>
              <button type="submit" className="group-detail-btn group-detail-btn-join" disabled={createSubmitting || !createCaption.trim()}>
                {createSubmitting ? (
                  createUploadProgress > 0 && createUploadProgress < 100 ? (
                    `${Math.round(createUploadProgress)}%`
                  ) : (
                    <Loader2 size={18} className="spin" />
                  )
                ) : null}
                Post
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="groups-feed-header">
        <h2 className="groups-feed-title">Posts</h2>
        <p className="groups-feed-subtitle">Posts in this group</p>
      </div>
      <div className="groups-feed-list">
        {postsLoading ? (
          <p className="groups-feed-empty">Loading posts…</p>
        ) : postsError ? (
          <p className="groups-feed-empty">{postsError}</p>
        ) : posts.length === 0 ? (
          <p className="groups-feed-empty">No posts in this group yet.</p>
        ) : (
          posts.map((post) => {
            const mapped = mapPostToGroupPost(post, groupName);
            return (
              <div key={mapped.id} className="group-detail-post-wrap">
                <div className="group-detail-post-meta">
                  {mapped.isPinned && (
                    <span className="group-detail-pinned-badge">
                      <Pin size={14} />
                      Pinned
                    </span>
                  )}
                  {isAdmin && (
                    <button
                      type="button"
                      className="group-detail-pin-btn"
                      onClick={() => handlePinPost(post.id, mapped.isPinned)}
                      title={mapped.isPinned ? 'Unpin post' : 'Pin post'}
                    >
                      {mapped.isPinned ? <PinOff size={16} /> : <Pin size={16} />}
                      {mapped.isPinned ? 'Unpin' : 'Pin'}
                    </button>
                  )}
                </div>
                <GroupPost
                  postId={post.id}
                  author={mapped.author}
                  groupName={mapped.groupName}
                  time={mapped.time}
                  description={mapped.description}
                  images={mapped.images}
                  likesCount={mapped.likesCount}
                  commentsCount={mapped.commentsCount}
                  sharesCount={mapped.sharesCount}
                  showGroupContext
                  initialLiked={!!post.userReaction}
                />
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
