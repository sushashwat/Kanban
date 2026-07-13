import { useState } from 'react';
import { useDispatch } from 'react-redux';
import { addMemberThunk } from '../redux/slices/boardSlice';

const AddMemberModal = ({ boardId, onClose }) => {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const dispatch = useDispatch();

  const handleSubmit = async (e) => {
    e.preventDefault();
    const result = await dispatch(addMemberThunk({ boardId, email }));
    if (addMemberThunk.fulfilled.match(result)) {
      onClose();
    } else {
      setError(result.payload || 'Failed to add member');
    }
  };

  return (
    <div style={styles.overlay} onClick={onClose}>
      <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
        <h3 style={{ marginBottom: 16 }}>Add member</h3>
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <input
            className="input"
            type="email"
            placeholder="Member's email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoFocus
            required
          />
          {error && <p className="error-text">{error}</p>}
          <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
            <button className="btn-ghost" type="button" onClick={onClose}>Cancel</button>
            <button className="btn" type="submit">Add</button>
          </div>
        </form>
      </div>
    </div>
  );
};

const styles = {
  overlay: {
    position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)',
    display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100,
  },
  modal: {
    background: 'var(--bg-panel)', border: '1px solid var(--border-subtle)', borderRadius: 10,
    width: 360, padding: 24,
  },
};

export default AddMemberModal;