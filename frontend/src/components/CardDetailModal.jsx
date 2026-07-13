import { useState } from 'react';
import { useDispatch } from 'react-redux';
import { updateCardThunk, deleteCardThunk } from '../redux/slices/boardSlice';
import ConfirmDialog from './ConfirmDialog';


const CardDetailModal = ({ card, onClose, socket, boardId }) => {
  const [title, setTitle] = useState(card.title);
  const [description, setDescription] = useState(card.description || '');
  const [priority, setPriority] = useState(card.priority);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const dispatch = useDispatch();

  const handleSave = async () => {
    const result = await dispatch(
      updateCardThunk({ cardId: card._id, updates: { title, description, priority } })
    );
    if (updateCardThunk.fulfilled.match(result)) {
      socket.emit('cardUpdated', { boardId, card: result.payload });
    }
    onClose();
  };

  const handleDelete = async () => {
    const result = await dispatch(deleteCardThunk(card._id));
    if (deleteCardThunk.fulfilled.match(result)) {
      socket.emit('cardDeleted', { boardId, cardId: card._id });
    }
    onClose();
  };

  return (
    <div style={styles.overlay} onClick={onClose}>
      <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
        <input className="input" style={styles.titleInput} value={title} onChange={(e) => setTitle(e.target.value)} />

        <div>
          <label style={styles.label}>Priority</label>
          <select className="input" value={priority} onChange={(e) => setPriority(e.target.value)}>
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
          </select>
        </div>

        <div>
          <label style={styles.label}>Description</label>
          <textarea
            className="input"
            rows={4}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            style={{ resize: 'vertical' }}
          />
        </div>

        <div style={styles.actions}>
          <button className="btn-ghost" style={{ color: 'var(--danger)' }} onClick={() => setConfirmDelete(true)}>
            Delete card
          </button>
          <div style={{ display: 'flex', gap: 10 }}></div>
          <button className="btn-ghost" onClick={onClose}>Cancel</button>
          <button className="btn" onClick={handleSave}>Save changes</button>
        </div>
      </div>
      {confirmDelete && (
        <ConfirmDialog
          title="Delete card?"
          message={`This will permanently delete "${card.title}".`}
          onConfirm={handleDelete}
          onCancel={() => setConfirmDelete(false)}
        />
      )}
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
    width: 480, maxWidth: '90vw', padding: 24, display: 'flex', flexDirection: 'column', gap: 16,
  },
  titleInput: { fontSize: 17, fontWeight: 600, padding: '8px 10px' },
  label: { display: 'block', fontSize: 12, color: 'var(--text-secondary)', marginBottom: 6 },
  actions: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 4 },
};

export default CardDetailModal;