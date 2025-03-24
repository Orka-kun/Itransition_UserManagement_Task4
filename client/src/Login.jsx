import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import axios from 'axios';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const navigate = useNavigate();
  const location = useLocation();
  useEffect(() => {
    console.log('Login component mounted or route changed:', location.pathname);
    setEmail('');
    setPassword('');
    setError('');
    setMessage('');

    // Reset Axios headers to avoid stale token
    delete axios.defaults.headers.common['Authorization'];
  }, [location]); // Depend on location to reset state on route change

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await axios.post('http://localhost:5000/login', { email, password });
      localStorage.setItem('token', res.data.token);
      localStorage.setItem('username', res.data.user.name); // Store the username
      setMessage('Login successful');
      navigate('/users');
    } catch (err) {
      setError(err.response?.data?.error || 'Server error');
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
    <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Sign in to your account
        </h2>
        
        {error && <p className="text-red-500 mb-4 text-center">{error}</p>}
        {message && <p className="text-green-500 mb-4 text-center">{message}</p>}
    </div>
    <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
            <form onSubmit={handleSubmit} className="space-y-6" >
                <div>
                    <label htmlFor="email" className="block text-sm font-medium text-black text-left">
                        Email address
                    </label>
                    <div className="mt-1">
                        <input value={email} onChange={(e) => setEmail(e.target.value)} id="email" name="email" type="email" autoComplete="email" required
                            className="appearance-none rounded-md relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-black focus:border-black focus:z-10 sm:text-sm "
                            placeholder="Enter your email address"/>
                    </div>
                </div>
                <div>
                    <label htmlFor="password" className="block text-sm font-medium text-black text-left">
                        Password
                    </label>
                    <div className="mt-1">
                        <input value={password} onChange={(e) => setPassword(e.target.value)} id="password" name="password" type="password" autoComplete="current-password" required
                            className="appearance-none rounded-md relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-black focus:border-black focus:z-10 sm:text-sm"
                            placeholder="Enter your password"/>
                    </div>
                </div>
                <div className="flex items-center justify-between">
                    <div className="text-sm mx-auto">
                        <a href="/register" className="font-medium text-black hover:text-pink-700">
                        Don't have an account? Sign up
                        </a>
                    </div>
                </div>
                <div>
                    <button type="submit"
                        className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-black hover:bg-pink-700">Sign in
                    </button>
                </div>
            </form>
        </div>
    </div>
</div>
    
  );
};
export default Login;
