import { Draggable } from '@hello-pangea/dnd';

const PRIORITY_COLORS = { low: '#3FB950', medium: '#F0883E', high: '#F85149' };

const CardItem = ({ card, index, onClick }) => {
  return (
    <Draggable draggableId={card._id} index={index}>
      {(provided, snapshot) => (
        <div
          ref={provided.innerRef}
          {...provided.draggableProps}
          {...provided.dragHandleProps}
          onClick={() => onClick(card)}
          style={{
             ...styles.card,
            boxShadow: snapshot.isDragging ? '0 8px 20px rgba(0,0,0,0.4)' : 'none',
            ...provided.draggableProps.style,
          }}
        >
           <div style={{ ...styles.priorityBar, background: PRIORITY_COLORS[card.priority] }} />
          <div style={styles.body}>
            <p style={styles.title}>{card.title}</p>
          </div>
        </div>
      )}
    </Draggable>
  );
};

const styles = {
  card: {
    background: 'var(--bg-raised)',
    border: '1px solid var(--border-subtle)',
    borderRadius: 6,
    marginBottom: 8,
    cursor: 'pointer',
    display: 'flex',
    overflow: 'hidden',
  },
  priorityBar: { width: 4, flexShrink: 0 },
  body: { padding: '10px 12px', flex: 1 },
  title: { fontSize: 13.5, lineHeight: 1.4, color: 'var(--text-primary)' },
};


export default CardItem;