import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { fetchBoards, createBoard, deleteBoardThunk, updateBoardThunk } from '../redux/slices/boardSlice';
import { logout } from '../redux/slices/authSlice';
import ConfirmDialog from '../components/ConfirmDialog';

const COLORS = ['#F0883E', '#3FB950', '#58A6FF', '#DB61A2', '#A371F7', '#F0883E', '#3FB950', '#58A6FF'];

const Dashboard = () => {
  const [newTitle, setNewTitle] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [hoveredId, setHoveredId] = useState(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState(null);
  const [editingId, setEditingId] = useState(null);
  const [editTitle, setEditTitle] = useState('');
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
    setShowForm(false);
  };

  const handleDelete = (e, boardId) => {
    e.stopPropagation();
    setConfirmDeleteId(boardId);
  };

  const startEdit = (e, board) => {
    e.stopPropagation();
    setEditingId(board._id);
    setEditTitle(board.title);
  };

  const saveEdit = (e, boardId) => {
    e?.stopPropagation();
    if (editTitle.trim()) {
      dispatch(updateBoardThunk({ boardId, title: editTitle.trim() }));
    }
    setEditingId(null);
  };

  const confirmDelete = () => {
    dispatch(deleteBoardThunk(confirmDeleteId));
    setConfirmDeleteId(null);
  };
  const filteredBoards = boards.filter((b) =>
    b.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

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

        <div style={{ marginBottom: 20 }}>
          <input
            className="input"
            placeholder="Search your boards..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{ maxWidth: 320 }}
          />
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

        {!loading && filteredBoards.length === 0 && (
          <div style={styles.empty}>
            <p style={{ color: 'var(--text-secondary)' }}>
              {searchQuery ? 'No boards match your search.' : 'No boards yet. Create one to get started.'}
            </p>
          </div>
        )}

        <div style={styles.grid}>
          {filteredBoards.map((b, i) => {
            const accent = COLORS[i % COLORS.length];
            const isHovered = hoveredId === b._id;
            return (
              <div
                key={b._id}
                style={{
                  ...styles.boardCard,
                  transform: isHovered ? 'translateY(-3px)' : 'translateY(0)',
                  borderColor: isHovered ? accent + '80' : 'var(--border-subtle)',
                  boxShadow: isHovered ? `0 10px 30px -8px ${accent}40` : '0 1px 2px rgba(0,0,0,0.2)',
                }}
                onMouseEnter={() => setHoveredId(b._id)}
                onMouseLeave={() => setHoveredId(null)}
                onClick={() => navigate(`/board/${b._id}`)}
              >
                <div style={styles.boardCardTop}>
                  <div style={{ ...styles.iconSquare, background: accent }}>
                    {b.title?.[0]?.toUpperCase()}
                  </div>
                  <div style={{ display: 'flex', gap: 4 }}>
                    {b.owner?._id === userInfo?._id && (
                      <button
                        onClick={(e) => startEdit(e, b)}
                        style={{ ...styles.deleteBtn, fontSize: 13 }}
                        title="Rename board"
                      >
                        ✎
                      </button>
                    )}
                    {b.owner?._id === userInfo?._id && (
                      <button onClick={(e) => handleDelete(e, b._id)} style={styles.deleteBtn} title="Delete board">×</button>
                    )}
                  </div>
                </div>

                {editingId === b._id ? (
                  <input
                    className="input"
                    autoFocus
                    value={editTitle}
                    onChange={(e) => setEditTitle(e.target.value)}
                    onClick={(e) => e.stopPropagation()}
                    onBlur={(e) => saveEdit(e, b._id)}
                    onKeyDown={(e) => e.key === 'Enter' && saveEdit(e, b._id)}
                    style={{ marginBottom: 4, padding: '4px 8px', fontSize: 15 }}
                  />
                ) : (
                  <h3 style={styles.boardTitle}>{b.title}</h3>
                )}

                <p style={styles.memberCount}>{b.members?.length || 1} member{b.members?.length !== 1 ? 's' : ''}</p>
              </div>
            );
          })}
        </div>

        {!loading && boards.length > 0 && (
          <p style={{ marginTop: 40, fontSize: 12, color: 'var(--text-secondary)', textAlign: 'center' }}>
            {boards.length} board{boards.length !== 1 ? 's' : ''} · real-time sync via Socket.io
          </p>
        )}
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
  wrap: { minHeight: '100vh' },
  header: {
    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
    padding: '16px 32px', borderBottom: '1px solid var(--border-subtle)',
  },
  logo: {
    fontSize: 18, fontWeight: 700,
    background: 'linear-gradient(135deg, #F0883E, #DB61A2)',
    WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
    backgroundClip: 'text',
  },
  userArea: { display: 'flex', alignItems: 'center', gap: 12 },
  avatar: {
    width: 30, height: 30, borderRadius: '50%', display: 'flex',
    alignItems: 'center', justifyContent: 'center', fontSize: 13,
    fontWeight: 700, color: '#0d1117',
  },
  main: { maxWidth: 1100, margin: '0 auto', padding: '40px 32px' },
  titleRow: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 },
  h1: { fontSize: 26, fontWeight: 700 },
  createForm: { display: 'flex', gap: 10, marginBottom: 28, alignItems: 'center' },
  empty: { border: '1px dashed var(--border-subtle)', borderRadius: 10, padding: 40, textAlign: 'center' },
  grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 18 },
  boardCard: {
    background: 'linear-gradient(155deg, var(--bg-raised) 0%, var(--bg-panel) 60%)',
    border: '1px solid var(--border-subtle)',
    borderRadius: 12, cursor: 'pointer', overflow: 'hidden', display: 'flex',
    flexDirection: 'column', padding: '20px 18px', gap: 6,
    transition: 'transform 0.15s ease, border-color 0.15s ease, box-shadow 0.15s ease',
    position: 'relative',
  },
  iconSquare: {
    width: 32, height: 32, borderRadius: 7, marginBottom: 10,
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontSize: 14, fontWeight: 700, color: '#0d1117',
  },
  boardCardTop: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' },
  boardTitle: { fontSize: 15.5, fontWeight: 600 },
  deleteBtn: { background: 'none', color: 'var(--text-secondary)', fontSize: 18, lineHeight: 1 },
  memberCount: { fontSize: 12, color: 'var(--text-secondary)', marginTop: 8 },
};

export default Dashboard;