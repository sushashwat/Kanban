import { useState } from 'react';
import { useDispatch } from 'react-redux';
import api from '../utils/axios';

const CardDetailModal = ({ card, onClose, socket, boardId, onUpdated }) => {
  const [title, setTitle] = useState(card.title);
  const [description, setDescription] = useState(card.description || '');
  const [priority, setPriority] = useState(card.priority);

  const handleSave = async () => {
    const { data } = await api.put(`/cards/${card._id}`, { title, description, priority });
    onUpdated(data);
    socket.emit('cardUpdated', { boardId, card: data });
    onClose();
  };

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ background: 'white', padding: 20, borderRadius: 8, width: 400 }}>
        <input value={title} onChange={(e) => setTitle(e.target.value)} style={{ width: '100%', marginBottom: 10 }} />
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Description..."
          style={{ width: '100%', marginBottom: 10 }}
        />
        <select value={priority} onChange={(e) => setPriority(e.target.value)}>
          <option value="low">Low</option>
          <option value="medium">Medium</option>
          <option value="high">High</option>
        </select>
        <div style={{ marginTop: 12 }}>
          <button onClick={handleSave}>Save</button>
          <button onClick={onClose}>Cancel</button>
        </div>
      </div>
    </div>
  );
};

export default CardDetailModal;