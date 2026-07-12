import { useState } from 'react';
import { Droppable } from '@hello-pangea/dnd';
import { useDispatch } from 'react-redux';
import CardItem from './CardItem';
import { createCardThunk } from '../redux/slices/boardSlice';

const ListColumn = ({ list, cards, onCardClick, socket, boardId }) => {
  const [addingCard, setAddingCard] = useState(false);
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

  return (
    <div style={{ width: 260, background: '#f4f4f4', padding: 10, borderRadius: 6 }}>
      <h4>{list.title} ({sortedCards.length})</h4>

      <Droppable droppableId={list._id}>
        {(provided, snapshot) => (
          <div
            ref={provided.innerRef}
            {...provided.droppableProps}
            style={{
              minHeight: 20,
              background: snapshot.isDraggingOver ? '#dde' : 'transparent',
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
        <form onSubmit={handleAddCard}>
          <input
            autoFocus
            value={cardTitle}
            onChange={(e) => setCardTitle(e.target.value)}
            placeholder="Card title..."
          />
          <button type="submit">Add</button>
          <button type="button" onClick={() => setAddingCard(false)}>Cancel</button>
        </form>
      ) : (
        <button onClick={() => setAddingCard(true)}>+ Add a card</button>
      )}
    </div>
  );
};

export default ListColumn;