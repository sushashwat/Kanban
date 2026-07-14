const timeAgo = (date) => {
  const diff = Math.floor((Date.now() - new Date(date)) / 1000);
  if (diff < 60) return 'just now';
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
};

const ActivityPanel = ({ activities }) => {
  if (!activities?.length) {
    return <p style={{ fontSize: 12, color: 'var(--text-secondary)', padding: '8px 4px' }}>No activity yet.</p>;
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10, maxHeight: 400, overflowY: 'auto' }}>
      {activities.map((a) => (
        <div key={a._id} style={{ fontSize: 12.5, color: 'var(--text-secondary)', lineHeight: 1.5 }}>
          <span style={{ color: 'var(--text-primary)', fontWeight: 600 }}>{a.user?.name || 'Someone'}</span>
          {' '}{a.action}{a.details && <> — <span style={{ color: 'var(--accent)' }}>{a.details}</span></>}
          <div style={{ fontSize: 11, opacity: 0.6 }}>{timeAgo(a.createdAt)}</div>
        </div>
      ))}
    </div>
  );
};

export default ActivityPanel;