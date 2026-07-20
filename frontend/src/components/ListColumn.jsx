import { useState } from 'react';
import { Droppable } from '@hello-pangea/dnd';
import { useDispatch } from 'react-redux';
import CardItem from './CardItem';
import { createCardThunk, deleteListThunk } from '../redux/slices/boardSlice';
import ConfirmDialog from './ConfirmDialog';

const ListColumn = ({ list, cards, onCardClick, socket, boardId }) => {
  const [addingCard, setAddingCard] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [cardTitle, setCardTitle] = useState('');
  const dispatch = useDispatch();

  const sortedCards = [...cards].sort((a, b) => a.order - b.order);

  const handleAddCard = async (e) => {
    e.preventDefault();
    if (!cardTitle.trim()) return;

    const result = await dispatch(
      createCardThunk({ title: cardTitle.trim(), list: list._id, board: boardId })
    );

    if (createCardThunk.fulfilled.match(result)) {
      socket.emit('cardCreated', { boardId, card: result.payload });
    }

    setCardTitle('');
    setAddingCard(false);
  };

  const handleDeleteList = async () => {
  const result = await dispatch(deleteListThunk(list._id));
  if (deleteListThunk.fulfilled.match(result)) {
    socket.emit('listDeleted', { boardId, listId: list._id });
  }
  setConfirmDelete(false);
};

  return (
    <div style={styles.column}>
      <div style={styles.header}>
        <h4 style={styles.title}>{list.title}</h4>
        <span style={styles.count}>{sortedCards.length}</span>
        <button style={styles.deleteBtn} onClick={() => setConfirmDelete(true)} title="Delete list">×</button>
      </div>

      <Droppable droppableId={list._id}>
        {(provided, snapshot) => (
          <div
            ref={provided.innerRef}
            {...provided.droppableProps}
            style={{
              ...styles.cardList,
              background: snapshot.isDraggingOver ? 'var(--accent-dim)' : 'transparent',
            }}
          >
            {sortedCards.map((card, index) => (
              <CardItem key={card._id} card={card} index={index} onClick={onCardClick} />
            ))}
            {provided.placeholder}
          </div>
        )}
      </Droppable>

      {addingCard ? (
        <form onSubmit={handleAddCard} style={styles.addForm}>
          <input
            className="input"
            autoFocus
            placeholder="Card title..."
            value={cardTitle}
            onChange={(e) => setCardTitle(e.target.value)}
            onBlur={() => !cardTitle && setAddingCard(false)}
          />
          <div style={{ display: 'flex', gap: 6, marginTop: 6 }}>
            <button className="btn" type="submit" style={{ padding: '6px 14px', fontSize: 13 }}>Add</button>
            <button className="btn-ghost" type="button" style={{ padding: '6px 14px', fontSize: 13 }} onClick={() => setAddingCard(false)}>Cancel</button>
          </div>
        </form>
      ) : (
        <button style={styles.addCardBtn} onClick={() => setAddingCard(true)}>+ Add a card</button>
      )}
      {confirmDelete && (
        <ConfirmDialog
          title="Delete list?"
          message={`This will permanently delete "${list.title}" and all its cards.`}
          onConfirm={handleDeleteList}
          onCancel={() => setConfirmDelete(false)}
        />
      )}
    </div>
  );
};

const styles = {
  column: {
    background: 'var(--bg-panel)', borderRadius: 8, width: 280, flexShrink: 0,
    padding: '12px 10px', maxHeight:500, display: 'flex', flexDirection: 'column',
  },
  header: { display: 'flex', alignItems: 'center', gap: 8, padding: '2px 6px 10px' },
  title: { fontSize: 14, fontWeight: 600, flex: 1 },
  count: { fontSize: 11, color: 'var(--text-secondary)', background: 'var(--bg-raised)', padding: '1px 7px', borderRadius: 10 },
  deleteBtn: { background: 'none', color: 'var(--text-secondary)', fontSize: 16 },
  cardList: { flex: 1, overflowY: 'auto', minHeight: 20, padding: '2px 6px', borderRadius: 6 },
  addForm: { padding: '4px 6px' },
  addCardBtn: {
    background: 'none', color: 'var(--text-secondary)', textAlign: 'left',
    padding: '8px 8px', fontSize: 13, borderRadius: 6,
  },
};

export default ListColumn;