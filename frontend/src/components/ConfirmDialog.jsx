const ConfirmDialog = ({ title, message, onConfirm, onCancel, danger = true }) => {
  return (
    <div style={styles.overlay} onClick={onCancel}>
      <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
        <h3 style={styles.title}>{title}</h3>
        <p style={styles.message}>{message}</p>
        <div style={styles.actions}>
          <button className="btn-ghost" onClick={onCancel}>Cancel</button>
          <button
            className="btn"
            style={danger ? { background: 'var(--danger)', color: '#fff' } : {}}
            onClick={onConfirm}
          >
            {danger ? 'Delete' : 'Confirm'}
          </button>
        </div>
      </div>
    </div>
  );
};

const styles = {
  overlay: {
    position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)',
    display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 200,
  },
  modal: {
    background: 'var(--bg-panel)', border: '1px solid var(--border-subtle)', borderRadius: 10,
    width: 360, padding: 24,
  },
  title: { fontSize: 16, fontWeight: 700, marginBottom: 8 },
  message: { fontSize: 14, color: 'var(--text-secondary)', marginBottom: 20 },
  actions: { display: 'flex', justifyContent: 'flex-end', gap: 10 },
};

export default ConfirmDialog;