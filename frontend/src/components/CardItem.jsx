import { Draggable } from '@hello-pangea/dnd';

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
            border: '1px solid gray',
            borderRadius: 4,
            padding: 8,
            marginBottom: 6,
            background: snapshot.isDragging ? '#eef' : 'white',
            cursor: 'pointer',
            ...provided.draggableProps.style,
          }}
        >
          <p>{card.title}</p>
          {card.priority && <small>{card.priority}</small>}
        </div>
      )}
    </Draggable>
  );
};

export default CardItem;