import { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { DragDropContext } from '@hello-pangea/dnd';
import {
    fetchBoardDetail,
    clearCurrentBoard,
    createListThunk,
    moveCardThunk,
    reorderCardsLocally,
} from '../redux/slices/boardSlice';
import { useBoardRoom, getSocket } from '../hooks/useSocket';
import ListColumn from '../components/ListColumn';
import CardDetailModal from '../components/CardDetailModal';

const BoardPage = () => {
    const { id: boardId } = useParams();
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const socket = useBoardRoom(boardId);

    const { currentBoard, lists, cards, loading } = useSelector((state) => state.board);

    const [selectedCard, setSelectedCard] = useState(null);
    const [listTitle, setListTitle] = useState('');

    useEffect(() => {
        dispatch(fetchBoardDetail(boardId));
        return () => dispatch(clearCurrentBoard());
    }, [dispatch, boardId]);

    // --- Real-time listeners: doosre users ke actions yahan reflect hote hain ---
    useEffect(() => {
        const s = getSocket();

        const onListCreated = (list) => dispatch(socketListCreated(list));
        const onCardCreated = (card) => dispatch(socketCardCreated(card));
        const onCardUpdated = (card) => dispatch(socketCardUpdated(card));
        const onCardMoved = (card) => dispatch(socketCardMoved(card));

        s.on('listCreated', onListCreated);
        s.on('cardCreated', onCardCreated);
        s.on('cardUpdated', onCardUpdated);
        s.on('cardMoved', onCardMoved);

        return () => {
            s.off('listCreated', onListCreated);
            s.off('cardCreated', onCardCreated);
            s.off('cardUpdated', onCardUpdated);
            s.off('cardMoved', onCardMoved);
        };
    }, [dispatch]);

    // --- Drag-and-drop handler ---
    const handleDragEnd = useCallback(
        async (result) => {
            const { source, destination, draggableId } = result;
            if (!destination) return;
            if (source.droppableId === destination.droppableId && source.index === destination.index) return;

            // Immediately updating UI
            dispatch(reorderCardsLocally({
                cardId: draggableId,
                destListId: destination.droppableId,
                destIndex: destination.index,
            }));

            //Persisting Server
            const res = await dispatch(moveCardThunk({
                cardId: draggableId,
                destListId: destination.droppableId,
                destIndex: destination.index,
            }));

            if (moveCardThunk.fulfilled.match(res)) {
                socket.emit('cardMoved', { boardId, card: res.payload });
            }
        },
        [dispatch, socket, boardId]
    );

    const handleAddList = async (e) => {
        e.preventDefault();
        if (!listTitle.trim()) return;
        const result = await dispatch(createListThunk({ title: listTitle.trim(), boardId }));
        if (createListThunk.fulfilled.match(result)) {
            socket.emit('listCreated', { boardId, list: result.payload });
        }
        setListTitle('');
    };

    if (loading || !currentBoard) return <div>Loading board...</div>;

    const sortedLists = [...lists].sort((a, b) => a.order - b.order);

    return (
        <div style={{ padding: 20 }}>
            <button onClick={() => navigate('/dashboard')}>← Boards</button>
            <h2>{currentBoard.title}</h2>

            <DragDropContext onDragEnd={handleDragEnd}>
                <div style={{ display: 'flex', gap: 12, overflowX: 'auto' }}>
                    {sortedLists.map((list) => (
                        <ListColumn
                            key={list._id}
                            list={list}
                            cards={cards.filter((c) => c.list === list._id)}
                            onCardClick={setSelectedCard}
                            socket={socket}
                            boardId={boardId}
                        />
                    ))}

                    <form onSubmit={handleAddList}>
                        <input
                            value={listTitle}
                            onChange={(e) => setListTitle(e.target.value)}
                            placeholder="+ Add list"
                        />
                        <button type="submit">Add</button>
                    </form>
                </div>
            </DragDropContext>

            {selectedCard && (
                <CardDetailModal
                    card={cards.find((c) => c._id === selectedCard._id) || selectedCard}
                    onClose={() => setSelectedCard(null)}
                    socket={socket}
                    boardId={boardId}
                    onUpdated={() => { }}
                />
            )}
        </div>
    );
};

export default BoardPage;