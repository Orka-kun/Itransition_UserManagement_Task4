import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { LockClosedIcon, LockOpenIcon, TrashIcon, ArrowRightOnRectangleIcon } from '@heroicons/react/24/outline';

const UserManagement = () => {
  const [users, setUsers] = useState([]);
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const username = localStorage.getItem('username') || 'User';

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
  try {
    const res = await axios.get(process.env.REACT_APP_API_URL + '/users', {
      headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
    });
    if (Array.isArray(res.data)) {
      setUsers(res.data);
    } else {
      setError(res.data.error || 'Server error');
    }
  } catch (err) {
    if (err.response?.status === 403) {
      localStorage.removeItem('token');
      navigate('/login');
    } else {
      setError(err.response?.data?.error || 'Server error');
    }
  }
};

  const handleSelectAll = (e) => {
    if (e.target.checked) {
      setSelectedUsers(users.map((user) => user.id));
    } else {
      setSelectedUsers([]);
    }
  };

  const handleSelectUser = (id) => {
    setSelectedUsers((prev) =>
      prev.includes(id) ? prev.filter((userId) => userId !== id) : [...prev, id]
    );
  };

  const handleBlock = async () => {
    try {
      const res = await axios.post(
        process.env.REACT_APP_API_URL + '/block',
        { userIds: selectedUsers },
        { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } }
      );
      setMessage(res.data.message);
      setSelectedUsers([]);
      fetchUsers();
    } catch (err) {
      if (err.response?.status === 403) {
        localStorage.removeItem('token');
        navigate('/login');
      } else {
        setError(err.response?.data?.error || 'Server error');
      }
    }
  };

  const handleUnblock = async () => {
    try {
      const res = await axios.post(
        process.env.REACT_APP_API_URL + '/unblock',
        { userIds: selectedUsers },
        { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } }
      );
      setMessage(res.data.message);
      setSelectedUsers([]);
      fetchUsers();
    } catch (err) {
      setError(err.response?.data?.error || 'Server error');
    }
  };

  const handleDelete = async () => {
    try {
      const res = await axios.post(
        process.env.REACT_APP_API_URL + '/delete',
        { userIds: selectedUsers },
        { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } }
      );
      setMessage(res.data.message);
      setSelectedUsers([]);
      fetchUsers();
    } catch (err) {
      if (err.response?.status === 403) {
        localStorage.removeItem('token');
        navigate('/login');
      } else {
        setError(err.response?.data?.error || 'Server error');
      }
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('username');
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-gray-100 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-6">
          <div className="flex justify-between items-center">
            <h1 className="text-3xl mx-auto font-bold text-black">Registered Users Details</h1>
            <button
              onClick={handleLogout}
              className="bg-red-600 text-white px-2 py-2 rounded-lg hover:bg-red-700 transition duration-200"
            >
              <ArrowRightOnRectangleIcon className="h-5 w-5 inline mr-2" />
              Logout
            </button>
          </div>
          <p className="text-gray-600 mt-2 text-right">Signed In as: <span className="font-semibold text-black">{username}</span></p>
        </div>
        <div className="mb-6 flex justify-between items-center">
          <div className="space-x-3">
            <button
              onClick={handleBlock}
              disabled={!selectedUsers.length}
              className="bg-blue-600 text-white px-3 py-2 rounded-lg hover:bg-blue-700 transition duration-200"
              title="Block selected users"
            >
              <LockClosedIcon className="h-5 w-5 inline mr-2" />
              Block
            </button>
            <button
              onClick={handleUnblock}
              disabled={!selectedUsers.length}
              className="bg-green-600 text-white px-3 py-2 rounded-lg hover:bg-green-700 transition duration-200"
              title="Unblock selected users"
            >
              <LockOpenIcon className="h-5 w-5 inline mr-2" />
              Unblock
            </button>
            <button
              onClick={handleDelete}
              disabled={!selectedUsers.length}
              className="bg-red-600 text-white px-3 py-2 rounded-lg hover:bg-red-700 transition duration-200"
              title="Delete selected users"
            >
              <TrashIcon className="h-5 w-5 inline mr-2" />
              Delete
            </button>
          </div>
        </div>
        {message && <p className="text-green-500 mb-4">{message}</p>}
        {error && <p className="text-red-500 mb-4">{error}</p>}
        <table className="min-w-full divide-y divide-gray-200">
          <thead>
            <tr>
              <th className="px-4 py-3 text-center">
                <input
                  type="checkbox"
                  checked={selectedUsers.length === users.length && users.length > 0}
                  onChange={handleSelectAll}
                />
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-black uppercase tracking-wider">
                Name
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-black uppercase tracking-wider">
                Email
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-black uppercase tracking-wider">
                Last Seen
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {Array.isArray(users) ? users.map((user) => (
              <tr key={user.id} className="text-black">
                <td className="px-4 py-4 text-center">
                  <input
                    type="checkbox"
                    checked={selectedUsers.includes(user.id)}
                    onChange={() => handleSelectUser(user.id)}
                    className="align-middle"
                  />
                </td>
                <td className="px-4 py-4 text-left text-sm font-medium">
                  {user.name}
                  <span className={`ml-2 text-xs ${
                    user.status === 'active' ? 'text-green-600' : 'text-red-600'
                  }`}>
                    ({user.status})
                  </span>
                </td>
                <td className="px-4 py-4 text-left text-sm">{user.email}</td>
                <td className="px-4 py-4 text-left text-sm">
                  {user.last_login ? new Date(user.last_login).toLocaleString() : 'Never logged in'}
                </td>
              </tr>
            )) : <tr><td colSpan="4">No users found or error occurred.</td></tr>}
          </tbody>
        </table>
      </div>
   
