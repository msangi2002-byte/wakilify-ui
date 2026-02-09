import { Link } from 'react-router-dom';
import { Users, ChevronRight } from 'lucide-react';
import '@/styles/user-app.css';

export default function Groups() {
  return (
    <div className="groups-feed">
      <div className="groups-feed-header">
        <h1 className="groups-feed-title">Your groups</h1>
        <p className="groups-feed-subtitle">
          Select a group from the list to see its posts and info.
        </p>
      </div>
      <div className="groups-feed-placeholder">
        <div className="groups-feed-placeholder-icon">
          <Users size={48} />
        </div>
        <p className="groups-feed-placeholder-text">
          Click a group on the left to view its posts and details.
        </p>
        <Link to="/app/groups/create" className="groups-feed-placeholder-link">
          Create a group
          <ChevronRight size={18} />
        </Link>
      </div>
    </div>
  );
}
