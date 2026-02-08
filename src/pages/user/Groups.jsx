import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Users, ChevronRight, Plus, Search } from 'lucide-react';
import { GroupPost } from '@/components/social/GroupPost';
import '@/styles/user-app.css';

const dummyGroups = [
  { id: '1', name: 'Wakilfy Traders', memberCount: 1240, cover: null },
  { id: '2', name: 'Bidii Jumuiya', memberCount: 580, cover: null },
  { id: '3', name: 'Soko Biashara', memberCount: 3200, cover: null },
  { id: '4', name: 'Duka Lishe', memberCount: 890, cover: null },
];

const dummyFeed = [
  {
    id: '1',
    author: { name: 'Wakilfy Official' },
    groupName: 'Wakilfy Traders',
    time: '29 hrs',
    description:
      'Connect, trade, and earn in one place. Discover products from your feed and support local businesses.',
    images: [],
    likesCount: 1400,
    commentsCount: 34,
    sharesCount: 2,
  },
  {
    id: '2',
    author: { name: 'Juma M.' },
    groupName: 'Bidii Jumuiya',
    time: '5h',
    description: 'Nimepata bidhaa nzuri sana hapa! Asante sana wadau.',
    images: [
      { url: null },
      { url: null },
    ],
    likesCount: 48,
    commentsCount: 12,
    sharesCount: 3,
  },
  {
    id: '3',
    author: { name: 'Fatuma K.' },
    groupName: 'Soko Biashara',
    time: '1d',
    description: 'Mdogo wangu amefanikiwa kufungua duka jipya. Karibu nyote!',
    images: [
      { url: null },
      { url: null },
      { url: null },
      { url: null },
    ],
    likesCount: 256,
    commentsCount: 56,
    sharesCount: 28,
  },
  {
    id: '4',
    author: { name: 'Peter O.' },
    groupName: 'Duka Lishe',
    time: '3h',
    description: 'Maonyesho ya bidhaa za lishe. Pata bei nzuri hapa.',
    images: [{ url: null }],
    likesCount: 89,
    commentsCount: 18,
    sharesCount: 5,
  },
];

export default function Groups() {
  const [groupSearch, setGroupSearch] = useState('');
  const filteredGroups = dummyGroups.filter((g) =>
    g.name.toLowerCase().includes(groupSearch.trim().toLowerCase())
  );

  return (
    <div className="groups-page">
      <div className="groups-layout">
        <aside className="groups-sidebar">
          <div className="groups-sidebar-header">
            <h2 className="groups-sidebar-title">Groups</h2>
            <Link to="/app/groups/discover" className="groups-sidebar-see-all">
              See all
              <ChevronRight size={18} />
            </Link>
          </div>
          <div className="groups-sidebar-search">
            <Search size={18} className="groups-search-icon" />
            <input
              type="text"
              placeholder="Search groups"
              aria-label="Search groups"
              value={groupSearch}
              onChange={(e) => setGroupSearch(e.target.value)}
            />
          </div>
          <ul className="groups-list">
            {filteredGroups.length === 0 ? (
              <li className="groups-list-empty">
                {groupSearch.trim() ? 'No groups match your search.' : 'No groups yet.'}
              </li>
            ) : (
              filteredGroups.map((g) => (
                <li key={g.id}>
                  <Link to={`/app/groups/${g.id}`} className="groups-list-item">
                    <div className="groups-list-avatar">
                      <Users size={24} />
                    </div>
                    <div className="groups-list-info">
                      <span className="groups-list-name">{g.name}</span>
                      <span className="groups-list-meta">{g.memberCount.toLocaleString()} members</span>
                    </div>
                    <ChevronRight size={18} className="groups-list-chevron" />
                  </Link>
                </li>
              ))
            )}
          </ul>
          <Link to="/app/groups/create" className="groups-create-btn">
            <Plus size={20} />
            Create group
          </Link>
        </aside>

        <main className="groups-feed">
          <div className="groups-feed-header">
            <h1 className="groups-feed-title">Your groups</h1>
            <p className="groups-feed-subtitle">Posts from groups you've joined</p>
          </div>
          <div className="groups-feed-list">
            {dummyFeed.map((post) => (
              <GroupPost
                key={post.id}
                author={post.author}
                groupName={post.groupName}
                time={post.time}
                description={post.description}
                images={post.images}
                likesCount={post.likesCount}
                commentsCount={post.commentsCount}
                sharesCount={post.sharesCount}
                showGroupContext
              />
            ))}
          </div>
        </main>
      </div>
    </div>
  );
}
