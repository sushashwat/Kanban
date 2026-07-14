import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../utils/axios';

export const fetchBoards = createAsyncThunk('board/fetchBoards', async (_, { rejectWithValue }) => {
    try {
        const { data } = await api.get('/boards');
        return data;
    } catch (error) {
        return rejectWithValue(error.response?.data?.message || 'Failed to fetch boards');
    }
});

export const createBoard = createAsyncThunk('board/createBoard', async (title, { rejectWithValue }) => {
    try {
        const { data } = await api.post('/boards', { title });
        return data;
    } catch (error) {
        return rejectWithValue(error.response?.data?.message || 'Failed to create board');
    }
});

export const deleteBoardThunk = createAsyncThunk('board/deleteBoard', async (boardId, { rejectWithValue }) => {
    try {
        await api.delete(`/boards/${boardId}`);
        return boardId;
    } catch (error) {
        return rejectWithValue(error.response?.data?.message || 'Failed to delete board');
    }
});

export const fetchBoardDetail = createAsyncThunk('board/fetchDetail', async (boardId, { rejectWithValue }) => {
    try {
        const { data } = await api.get(`/boards/${boardId}`);
        return data; // { board, lists, cards }
    } catch (error) {
        return rejectWithValue(error.response?.data?.message || 'Failed to fetch board');
    }
});

export const createListThunk = createAsyncThunk('board/createList', async ({ title, boardId }, { rejectWithValue }) => {
    try {
        const { data } = await api.post('/lists', { title, board: boardId });
        return data;
    } catch (error) {
        return rejectWithValue(error.response?.data?.message || 'Failed to create list');
    }
});

export const deleteListThunk = createAsyncThunk('board/deleteList', async (listId, { rejectWithValue }) => {
    try {
        await api.delete(`/lists/${listId}`);
        return listId;
    } catch (error) {
        return rejectWithValue(error.response?.data?.message || 'Failed to delete list');
    }
});

export const createCardThunk = createAsyncThunk('board/createCard', async (cardData, { rejectWithValue }) => {
    try {
        const { data } = await api.post('/cards', cardData);
        return data;
    } catch (error) {
        return rejectWithValue(error.response?.data?.message || 'Failed to create card');
    }
});

export const moveCardThunk = createAsyncThunk(
    'board/moveCard',
    async ({ cardId, destListId, destIndex }, { rejectWithValue }) => {
        try {
            const { data } = await api.put(`/cards/${cardId}/move`, { destListId, destIndex });
            return data;
        } catch (error) {
            return rejectWithValue(error.response?.data?.message || 'Failed to move card');
        }
    }
);

export const updateCardThunk = createAsyncThunk(
    'board/updateCard',
    async ({ cardId, updates }, { rejectWithValue }) => {
        try {
            const { data } = await api.put(`/cards/${cardId}`, updates);
            return data;
        } catch (error) {
            return rejectWithValue(error.response?.data?.message || 'Failed to update card');
        }
    }
);

export const updateBoardThunk = createAsyncThunk('board/updateBoard', async ({ boardId, title }, { rejectWithValue }) => {
    try {
        const { data } = await api.put(`/boards/${boardId}`, { title });
        return data;
    } catch (error) {
        return rejectWithValue(error.response?.data?.message || 'Failed to update board');
    }
});

export const deleteCardThunk = createAsyncThunk('board/deleteCard', async (cardId, { rejectWithValue }) => {
    try {
        await api.delete(`/cards/${cardId}`);
        return cardId;
    } catch (error) {
        return rejectWithValue(error.response?.data?.message || 'Failed to delete card');
    }
});

export const addMemberThunk = createAsyncThunk('board/addMember', async ({ boardId, email }, { rejectWithValue }) => {
    try {
        const { data } = await api.post(`/boards/${boardId}/members`, { email });
        return data;
    } catch (error) {
        return rejectWithValue(error.response?.data?.message || 'Failed to add member');
    }
});

export const leaveBoardThunk = createAsyncThunk('board/leaveBoard', async (boardId, { rejectWithValue }) => {
    try {
        await api.post(`/boards/${boardId}/leave`);
        return boardId;
    } catch (error) {
        return rejectWithValue(error.response?.data?.message || 'Failed to leave board');
    }
});

export const removeMemberThunk = createAsyncThunk('board/removeMember', async ({ boardId, memberId }, { rejectWithValue }) => {
    try {
        const { data } = await api.delete(`/boards/${boardId}/members/${memberId}`);
        return data;
    } catch (error) {
        return rejectWithValue(error.response?.data?.message || 'Failed to remove member');
    }
});

const boardSlice = createSlice({
    name: 'board',
    initialState: {
        boards: [],
        currentBoard: null,
        lists: [],
        cards: [],
        loading: false,
        error: null,
    },
    reducers: {
        clearCurrentBoard: (state) => {
            state.currentBoard = null;
            state.lists = [];
            state.cards = [];
        },
        // Drag hote hi turant UI update
        reorderCardsLocally: (state, action) => {
            const { cardId, destListId, destIndex } = action.payload;
            const card = state.cards.find((c) => c._id === cardId);
            if (!card) return;

            const sourceListId = card.list;
            card.list = destListId;

            const destCards = state.cards
                .filter((c) => c.list === destListId && c._id !== cardId)
                .sort((a, b) => a.order - b.order);
            destCards.splice(destIndex, 0, card);
            destCards.forEach((c, idx) => { c.order = idx; });

            if (sourceListId !== destListId) {
                const sourceCards = state.cards
                    .filter((c) => c.list === sourceListId)
                    .sort((a, b) => a.order - b.order);
                sourceCards.forEach((c, idx) => { c.order = idx; });
            }
        },
        socketListCreated: (state, action) => {
            if (!state.lists.some((l) => l._id === action.payload._id)) {
                state.lists.push(action.payload);
            }
        },
        socketCardCreated: (state, action) => {
            if (!state.cards.some((c) => c._id === action.payload._id)) {
                state.cards.push(action.payload);
            }
        },
        socketCardUpdated: (state, action) => {
            const idx = state.cards.findIndex((c) => c._id === action.payload._id);
            if (idx !== -1) state.cards[idx] = action.payload;
        },
        socketCardMoved: (state, action) => {
            const idx = state.cards.findIndex((c) => c._id === action.payload._id);
            if (idx !== -1) state.cards[idx] = action.payload;
        },
        socketListDeleted: (state, action) => {
            state.lists = state.lists.filter((l) => l._id !== action.payload);
            state.cards = state.cards.filter((c) => c.list !== action.payload);
        },
        socketCardDeleted: (state, action) => {
            state.cards = state.cards.filter((c) => c._id !== action.payload);
        },
    },
    extraReducers: (builder) => {
        builder
            .addCase(fetchBoards.pending, (state) => {
                state.loading = true;
            })
            .addCase(fetchBoards.fulfilled, (state, action) => {
                state.loading = false;
                state.boards = action.payload;
            })
            .addCase(fetchBoards.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload;
            })
            .addCase(createBoard.fulfilled, (state, action) => {
                state.boards.unshift(action.payload);
            })
            .addCase(deleteBoardThunk.fulfilled, (state, action) => {
                state.boards = state.boards.filter((b) => b._id !== action.payload);
            })
            .addCase(fetchBoardDetail.fulfilled, (state, action) => {
                state.currentBoard = action.payload.board;
                state.lists = action.payload.lists;
                state.cards = action.payload.cards;
            })
            .addCase(createListThunk.fulfilled, (state, action) => {
                state.lists.push(action.payload);
            })
            .addCase(createCardThunk.fulfilled, (state, action) => {
                state.cards.push(action.payload);
            })
            .addCase(moveCardThunk.fulfilled, (state, action) => {
                const idx = state.cards.findIndex((c) => c._id === action.payload._id);
                if (idx !== -1) state.cards[idx] = action.payload;
            })
            .addCase(updateCardThunk.fulfilled, (state, action) => {
                const idx = state.cards.findIndex((c) => c._id === action.payload._id);
                if (idx !== -1) state.cards[idx] = action.payload;
            })
            .addCase(updateBoardThunk.fulfilled, (state, action) => {
                state.currentBoard = action.payload;
                const idx = state.boards.findIndex((b) => b._id === action.payload._id);
                if (idx !== -1) state.boards[idx] = action.payload;
            })
            .addCase(deleteListThunk.fulfilled, (state, action) => {
                state.lists = state.lists.filter((l) => l._id !== action.payload);
                state.cards = state.cards.filter((c) => c.list !== action.payload);
            })
            .addCase(deleteCardThunk.fulfilled, (state, action) => {
                state.cards = state.cards.filter((c) => c._id !== action.payload);
            })
            .addCase(addMemberThunk.fulfilled, (state, action) => {
                state.currentBoard = action.payload;
            })
            .addCase(leaveBoardThunk.fulfilled, (state, action) => {
                state.boards = state.boards.filter((b) => b._id !== action.payload);
            })
            .addCase(removeMemberThunk.fulfilled, (state, action) => {
                state.currentBoard = action.payload;
            })
    },
});

export const { clearCurrentBoard, reorderCardsLocally, socketListCreated, socketCardCreated, socketCardUpdated, socketCardMoved, socketListDeleted, socketCardDeleted } = boardSlice.actions;
export default boardSlice.reducer;