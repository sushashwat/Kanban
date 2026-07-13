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
    socketListDeleted,
    socketCardDeleted
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
    const [addingList, setAddingList] = useState(false);

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
        const onListDeleted = (listId) => dispatch(socketListDeleted(listId));
        const onCardDeleted = (cardId) => dispatch(socketCardDeleted(cardId));

        s.on('listCreated', onListCreated);
        s.on('cardCreated', onCardCreated);
        s.on('cardUpdated', onCardUpdated);
        s.on('cardMoved', onCardMoved);
        s.on('cardDeleted', onCardDeleted)
        s.on('listDeleted', onListDeleted);

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

    if (loading || !currentBoard) {
        return <div style={styles.loadingWrap}>Loading board...</div>;
    }

    const sortedLists = [...lists].sort((a, b) => a.order - b.order);

    return (
        <div style={styles.wrap}>
            <header style={styles.header}>
                <button className="btn-ghost" onClick={() => navigate('/dashboard')}>← Boards</button>
                <h2 style={styles.boardTitle}>{currentBoard.title}</h2>
            </header>

            <DragDropContext onDragEnd={handleDragEnd}>
                <div style={styles.board}>
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

                    <div style={styles.addListWrap}>
                        {addingList ? (
                            <form onSubmit={handleAddList}>
                                <input
                                    className="input"
                                    autoFocus
                                    placeholder="List title..."
                                    value={listTitle}
                                    onChange={(e) => setListTitle(e.target.value)}
                                    onBlur={() => !listTitle && setAddingList(false)}
                                />
                                <div style={{ display: 'flex', gap: 6, marginTop: 8 }}>
                                    <button className="btn" type="submit" style={{ padding: '6px 14px', fontSize: 13 }}>Add list</button>
                                    <button className="btn-ghost" type="button" style={{ padding: '6px 14px', fontSize: 13 }} onClick={() => setAddingList(false)}>Cancel</button>
                                </div>
                            </form>
                        ) : (
                            <button style={styles.addListBtn} onClick={() => setAddingList(true)}>+ Add another list</button>
                        )}
                    </div>
                </div>
            </DragDropContext>

            {selectedCard && (
                <CardDetailModal
                    card={cards.find((c) => c._id === selectedCard._id) || selectedCard}
                    onClose={() => setSelectedCard(null)}
                    socket={socket}
                    boardId={boardId}
                />
            )}
        </div>
    );
};

const styles = {
    wrap: { minHeight: '100vh', background: 'var(--bg-void)', display: 'flex', flexDirection: 'column' },
    loadingWrap: { minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-secondary)' },
    header: { display: 'flex', alignItems: 'center', gap: 16, padding: '14px 24px', borderBottom: '1px solid var(--border-subtle)' },
    boardTitle: { fontSize: 17, fontWeight: 700, flex: 1 },
    board: { display: 'flex', gap: 14, padding: '20px 24px', overflowX: 'auto', flex: 1, alignItems: 'flex-start' },
    addListWrap: { width: 260, flexShrink: 0 },
    addListBtn: {
        background: 'var(--bg-panel)', border: '1px dashed var(--border-subtle)', color: 'var(--text-secondary)',
        borderRadius: 8, padding: '12px 14px', width: '100%', textAlign: 'left', fontSize: 13.5,
    },
};


export default BoardPage;