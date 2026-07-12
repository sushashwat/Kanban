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

const boardSlice = createSlice({
  name: 'board',
  initialState: {
    boards: [],
    loading: false,
    error: null,
  },
  reducers: {},
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
      });
  },
});

export default boardSlice.reducer;