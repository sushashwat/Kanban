import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { fetchBoards, createBoard, deleteBoardThunk } from '../redux/slices/boardSlice';
import { logout } from '../redux/slices/authSlice';

const Dashboard = () => {
  const [newTitle, setNewTitle] = useState('');
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { boards, loading } = useSelector((state) => state.board);
  const { userInfo } = useSelector((state) => state.auth);

  useEffect(() => {
    dispatch(fetchBoards());
  }, [dispatch]);

  const handleCreate = (e) => {
    e.preventDefault();
    if (!newTitle.trim()) return;
    dispatch(createBoard(newTitle.trim()));
    setNewTitle('');
  };

  const handleDelete = (e, boardId) => {
    e.stopPropagation();
    if (window.confirm('Delete this board?')) {
      dispatch(deleteBoardThunk(boardId));
    }
  };

  return (
    <div>
      <header>
        <h2>Boardroom</h2>
        <span>{userInfo?.name}</span>
        <button onClick={() => dispatch(logout())}>Log out</button>
      </header>

      <form onSubmit={handleCreate}>
        <input
          value={newTitle}
          onChange={(e) => setNewTitle(e.target.value)}
          placeholder="New board title"
        />
        <button type="submit">Create</button>
      </form>

      {loading && <p>Loading...</p>}

      <div>
        {boards.map((b) => (
          <div key={b._id} onClick={() => navigate(`/board/${b._id}`)} style={{ cursor: 'pointer', border: '1px solid gray', padding: 10, margin: 8 }}>
            <h3>{b.title}</h3>
            {b.owner?._id === userInfo?._id && (
              <button onClick={(e) => handleDelete(e, b._id)}>Delete</button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default Dashboard;