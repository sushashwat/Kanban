import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { fetchBoards, createBoard, deleteBoardThunk, leaveBoardThunk } from '../redux/slices/boardSlice';
import { logout } from '../redux/slices/authSlice';
import ConfirmDialog from '../components/ConfirmDialog';

const COLORS = ['#F0883E', '#3FB950', '#58A6FF', '#DB61A2', '#A371F7'];

const Dashboard = () => {
  const [newTitle, setNewTitle] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [confirmDeleteId, setConfirmDeleteId] = useState(null);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { boards, loading } = useSelector((state) => state.board);
  const { userInfo } = useSelector((state) => state.auth);

  useEffect(() => {
    dispatch(fetchBoards());
  }, [dispatch]);

  const handleCreate = (e) => {
    e.preventDefault();
    if (!newTitle.trim()) return;
    dispatch(createBoard(newTitle.trim()));
    setNewTitle('');
  };

  const handleDelete = (e, boardId) => {
    e.stopPropagation();
    setConfirmDeleteId(boardId);
  };

  const confirmDelete = () => {
    dispatch(deleteBoardThunk(confirmDeleteId));
    setConfirmDeleteId(null);
  };

  const handleLeave = (e, boardId) => {
    e.stopPropagation();
    if (window.confirm('Leave this board?')) {
      dispatch(leaveBoardThunk(boardId));
    }
  };

  return (
    <div style={styles.wrap}>
      <header style={styles.header}>
        <div className="mono" style={styles.logo}>▣ boardroom</div>
        <div style={styles.userArea}>
          <div style={{ ...styles.avatar, background: userInfo?.avatarColor || 'var(--accent)' }}>
            {userInfo?.name?.[0]?.toUpperCase()}
          </div>
          <span style={{ color: 'var(--text-secondary)', fontSize: 14 }}>{userInfo?.name}</span>
          <button className="btn-ghost" onClick={() => dispatch(logout())}>Log out</button>
        </div>
      </header>

      <main style={styles.main}>
        <div style={styles.titleRow}>
          <h1 style={styles.h1}>Your boards</h1>
          <button className="btn" onClick={() => setShowForm(!showForm)}>+ New board</button>
        </div>

        {showForm && (
          <form onSubmit={handleCreate} style={styles.createForm}>
            <input
              className="input"
              autoFocus
              placeholder="Board title"
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              style={{ maxWidth: 320 }}
            />
            <button className="btn" type="submit">Create</button>
            <button className="btn-ghost" type="button" onClick={() => setShowForm(false)}>Cancel</button>
          </form>
        )}

        {loading && <p style={{ color: 'var(--text-secondary)' }}>Loading boards...</p>}

        {!loading && boards.length === 0 && (
          <div style={styles.empty}>
            <p style={{ color: 'var(--text-secondary)' }}>
              No boards yet. Create one to get started.
            </p>
          </div>
        )}

        <div style={styles.grid}>
          {boards.map((b, i) => (
            <div
              key={b._id}
              style={{ ...styles.boardCard, borderTop: `3px solid ${COLORS[i % COLORS.length]}` }}
              onClick={() => navigate(`/board/${b._id}`)}
            >
              <div style={styles.boardCardTop}>
                <h3 style={styles.boardTitle}>{b.title}</h3>
                {b.owner?._id === userInfo?._id ? (
                  <button onClick={(e) => handleDelete(e, b._id)} style={styles.deleteBtn} title="Delete board">×</button>
                ) : (
                  <button onClick={(e) => handleLeave(e, b._id)} style={{ ...styles.deleteBtn, fontSize: 12 }} title="Leave board">Leave</button>
                )}
              </div>
              <p style={styles.memberCount}>
                {b.members?.length || 1} member{b.members?.length !== 1 ? 's' : ''}
              </p>
            </div>
          ))}
        </div>
      </main>
      {confirmDeleteId && (
        <ConfirmDialog
          title="Delete board?"
          message="This will permanently delete the board and all its lists and cards."
          onConfirm={confirmDelete}
          onCancel={() => setConfirmDeleteId(null)}
        />
      )}
    </div>
  );
};

const styles = {
  wrap: { minHeight: '100vh', background: 'var(--bg-void)' },
  header: {
    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
    padding: '16px 32px', borderBottom: '1px solid var(--border-subtle)',
  },
  logo: { fontSize: 18, fontWeight: 700, color: 'var(--accent)' },
  userArea: { display: 'flex', alignItems: 'center', gap: 12 },
  avatar: {
    width: 30, height: 30, borderRadius: '50%', display: 'flex',
    alignItems: 'center', justifyContent: 'center', fontSize: 13,
    fontWeight: 700, color: '#0d1117',
  },
  main: { maxWidth: 1100, margin: '0 auto', padding: '40px 32px' },
  titleRow: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 },
  h1: { fontSize: 24, fontWeight: 700 },
  createForm: { display: 'flex', gap: 10, marginBottom: 28, alignItems: 'center' },
  empty: { border: '1px dashed var(--border-subtle)', borderRadius: 10, padding: 40, textAlign: 'center' },
  grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 16 },
  boardCard: {
    background: 'var(--bg-panel)', border: '1px solid var(--border-subtle)',
    borderRadius: 8, padding: '18px 16px', cursor: 'pointer',
  },
  boardCardTop: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' },
  boardTitle: { fontSize: 15, fontWeight: 600 },
  deleteBtn: { background: 'none', color: 'var(--text-secondary)', fontSize: 18, lineHeight: 1 },
  memberCount: { fontSize: 12, color: 'var(--text-secondary)', marginTop: 8 },
};


export default Dashboard;