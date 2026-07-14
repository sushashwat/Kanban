import { useState } from 'react';
import { useDispatch } from 'react-redux';
import { removeMemberThunk } from '../redux/slices/boardSlice';
import ConfirmDialog from './ConfirmDialog';

const MemberListModal = ({ board, currentUserId, onClose }) => {
  const dispatch = useDispatch();
  const isOwner = board.owner._id === currentUserId;
  const [removeTarget, setRemoveTarget] = useState(null);

  const confirmRemove = () => {
    dispatch(removeMemberThunk({ boardId: board._id, memberId: removeTarget }));
    setRemoveTarget(null);
  };

 return (
    <div style={styles.overlay} onClick={onClose}>
      <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
        <h3 style={{ marginBottom: 16 }}>Board members</h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {board.members.map((m) => (
            <div key={m._id} style={styles.row}>
              <div style={styles.left}>
                <div style={{ ...styles.avatar, background: m.avatarColor }}>
                  {m.name?.[0]?.toUpperCase()}
                </div>
                <div>
                  <p style={{ fontSize: 14 }}>{m.name}{m._id === board.owner._id && ' (owner)'}</p>
                  <p style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{m.email}</p>
                </div>
              </div>
              {isOwner && m._id !== board.owner._id && (
                <button className="btn-ghost" style={{ color: 'var(--danger)', padding: '4px 10px', fontSize: 12 }} onClick={() => setRemoveTarget(m._id)}>
                  Remove
                </button>
              )}
            </div>
          ))}
        </div>
        <button className="btn-ghost" style={{ marginTop: 20, width: '100%' }} onClick={onClose}>Close</button>
      </div>

      {removeTarget && (
        <ConfirmDialog
          title="Remove member?"
          message="This member will lose access to the board immediately."
          onConfirm={confirmRemove}
          onCancel={() => setRemoveTarget(null)}
        />
      )}
    </div>
  );
};

const styles = {
  overlay: { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 },
  modal: { background: 'var(--bg-panel)', border: '1px solid var(--border-subtle)', borderRadius: 10, width: 380, padding: 24 },
  row: { display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  left: { display: 'flex', alignItems: 'center', gap: 10 },
  avatar: { width: 32, height: 32, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 700, color: '#0d1117' },
};

export default MemberListModal;