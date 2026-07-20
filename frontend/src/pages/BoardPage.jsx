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
    socketListCreated,
    socketCardCreated,
    socketCardUpdated,
    socketCardMoved,
    socketListDeleted,
    socketCardDeleted
} from '../redux/slices/boardSlice';
import { useBoardRoom, getSocket } from '../hooks/useSocket';
import ListColumn from '../components/ListColumn';
import CardDetailModal from '../components/CardDetailModal';
import AddMemberModal from '../components/AddMemberModal';
import MemberListModal from '../components/MemberListModal';
import { updateBoardThunk } from '../redux/slices/boardSlice';
import ActivityPanel from '../components/ActivityPanel';
import { fetchActivityThunk } from '../redux/slices/boardSlice';

const BoardPage = () => {
    const { id: boardId } = useParams();
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const socket = useBoardRoom(boardId);

    const { currentBoard, lists, cards, loading } = useSelector((state) => state.board);

    const [selectedCard, setSelectedCard] = useState(null);
    const [editingTitle, setEditingTitle] = useState(false);
    const [titleDraft, setTitleDraft] = useState('');
    const [listTitle, setListTitle] = useState('');
    const [addingList, setAddingList] = useState(false);
    const [showAddMember, setShowAddMember] = useState(false);
    const [showMembers, setShowMembers] = useState(false);
    const [titleHovered, setTitleHovered] = useState(false);
    const [showActivity, setShowActivity] = useState(false);
    const { activities } = useSelector((state) => state.board);
    const { userInfo } = useSelector((state) => state.auth);

    useEffect(() => {
        dispatch(fetchBoardDetail(boardId));
        return () => dispatch(clearCurrentBoard());
    }, [dispatch, boardId]);

    useEffect(() => {
        if (showActivity) dispatch(fetchActivityThunk(boardId));
    }, [showActivity, dispatch, boardId]);

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
            s.off('cardDeleted', onCardDeleted);
            s.off('listDeleted', onListDeleted);
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
    const startEditTitle = () => {
        setTitleDraft(currentBoard.title);
        setEditingTitle(true);
    };

    const saveTitle = () => {
        if (titleDraft.trim() && titleDraft.trim() !== currentBoard.title) {
            dispatch(updateBoardThunk({ boardId, title: titleDraft.trim() }));
        }
        setEditingTitle(false);
    };

    if (loading || !currentBoard) {
        return (
            <div style={styles.wrap}>
                <div style={styles.blob1} /><div style={styles.blob2} /><div style={styles.blob3} />
                <div style={styles.loadingWrap}>
                    <div className="mono" style={{ color: 'var(--accent)', fontSize: 14 }}>Loading board...</div>
                </div>
            </div>
        );
    }

    const sortedLists = [...lists].sort((a, b) => a.order - b.order);

    return (
        <div style={styles.wrap}>
            <div style={styles.blob1} />
            <div style={styles.blob2} />
            <div style={styles.blob3} />
            <header style={styles.header}>
                <button className="btn-ghost" onClick={() => navigate('/dashboard')}>← Boards</button>
                {editingTitle ? (
                    <input
                        className="input"
                        autoFocus
                        value={titleDraft}
                        onChange={(e) => setTitleDraft(e.target.value)}
                        onBlur={saveTitle}
                        onKeyDown={(e) => e.key === 'Enter' && saveTitle()}
                        style={{ ...styles.boardTitle, maxWidth: 300, padding: '4px 8px' }}
                    />
                ) : (
                    <h2
                        style={{ ...styles.boardTitle, display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}
                        onClick={startEditTitle}
                        onMouseEnter={() => setTitleHovered(true)}
                        onMouseLeave={() => setTitleHovered(false)}
                        title="Click to rename"
                    >
                        {currentBoard.title}
                        <span style={{ fontSize: 13, color: 'var(--text-secondary)', opacity: titleHovered ? 0.8 : 0 }}>✎</span>
                    </h2>
                )}
                <div style={{ display: 'flex', alignItems: 'center', marginLeft: 'auto' }}>
                    <div style={{ display: 'flex', cursor: 'pointer' }} onClick={() => setShowMembers(true)}>
                        {currentBoard.members?.slice(0, 5).map((m) => (
                            <div
                                key={m._id}
                                style={{
                                    width: 28, height: 28, borderRadius: '50%', display: 'flex',
                                    alignItems: 'center', justifyContent: 'center', fontSize: 12,
                                    fontWeight: 700, color: '#0d1117', marginLeft: -8,
                                    border: '2px solid var(--bg-void)', background: m.avatarColor,
                                }}
                                title={m.name}
                            >
                                {m.name?.[0]?.toUpperCase()}
                            </div>
                        ))}
                    </div>
                    <button className="btn-ghost" style={{ marginLeft: 10 }} onClick={() => setShowAddMember(true)}>
                        + Invite
                    </button>
                    <button className="btn-ghost" style={{ marginLeft: 8 }} onClick={() => setShowActivity(!showActivity)}>
                        Activity
                    </button>
                </div>
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

            {showActivity && (
                <div style={{ position: 'fixed', top: 70, right: 24, width: 320, background: 'var(--bg-panel)', border: '1px solid var(--border-subtle)', borderRadius: 10, padding: 18, zIndex: 50, maxHeight: '70vh' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
                        <h4 style={{ fontSize: 14, fontWeight: 700 }}>Activity</h4>
                        <button onClick={() => setShowActivity(false)} style={{ background: 'none', color: 'var(--text-secondary)', fontSize: 16 }}>×</button>
                    </div>
                    <ActivityPanel activities={activities} />
                </div>
            )}

            {selectedCard && (
                <CardDetailModal
                    card={cards.find((c) => c._id === selectedCard._id) || selectedCard}
                    onClose={() => setSelectedCard(null)}
                    socket={socket}
                    boardId={boardId}
                />
            )}
            {showAddMember && <AddMemberModal boardId={boardId} onClose={() => setShowAddMember(false)} />}
            {showMembers && (
                <MemberListModal board={currentBoard} currentUserId={userInfo._id} onClose={() => setShowMembers(false)} />
            )}
        </div>
    );
};

const styles = {
    wrap: {
        minHeight: '100vh', display: 'flex', flexDirection: 'column', position: 'relative', overflow: 'hidden',
    },
    loadingWrap: { minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-secondary)' },
    header: { display: 'flex', alignItems: 'center', gap: 16, padding: '14px 24px', borderBottom: '1px solid var(--border-subtle)', position: 'relative', zIndex: 1, },
    boardTitle: { fontSize: 17, fontWeight: 700, flex: 1 },
    board: { display: 'flex', flexWrap:'wrap',gap: 14, padding: '20px 24px', overflowX: 'auto', flex: 1, alignItems: 'flex-start', position: 'relative', zIndex: 1,},
    addListWrap: { width: 260, flexShrink: 0 },
    addListBtn: {
        background: 'var(--bg-panel)', border: '1px dashed var(--border-subtle)', color: 'var(--text-secondary)',
        borderRadius: 8, padding: '12px 14px', width: '100%', textAlign: 'left', fontSize: 13.5,
    },
    blob1: {
        position: 'fixed', top: '10%', left: '5%', width: 380, height: 380,
        borderRadius: '50%', background: 'radial-gradient(circle, rgba(240,136,62,0.16), transparent 70%)',
        filter: 'blur(20px)', animation: 'float1 18s ease-in-out infinite',
        pointerEvents: 'none', zIndex: 0, willChange: 'transform',
    },
    blob2: {
        position: 'fixed', top: '50%', right: '8%', width: 320, height: 320,
        borderRadius: '50%', background: 'radial-gradient(circle, rgba(163,113,247,0.13), transparent 70%)',
        filter: 'blur(20px)', animation: 'float2 22s ease-in-out infinite',
        pointerEvents: 'none', zIndex: 0, willChange: 'transform',
    },
    blob3: {
        position: 'fixed', bottom: '5%', left: '35%', width: 280, height: 280,
        borderRadius: '50%', background: 'radial-gradient(circle, rgba(63,185,80,0.13), transparent 70%)',
        filter: 'blur(20px)', animation: 'float3 25s ease-in-out infinite',
        pointerEvents: 'none', zIndex: 0, willChange: 'transform',
    },
};


export default BoardPage;