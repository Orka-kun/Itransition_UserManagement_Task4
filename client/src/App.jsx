import { useState } from 'react'
import reactLogo from './assets/react.svg'
import viteLogo from '/vite.svg'
import './App.css'
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './Login';
import Register from './Register';
import UserManagement from './UserManagement';
function App() {

  const token = localStorage.getItem('token');

  return (
    <>
      <Router>
      <Routes>
      <Route path="/login" element={<Login key={Date.now()} />} />
        <Route path="/register" element={<Register />} />
        <Route path="/users" element={token ? <UserManagement /> : <Navigate to="/login" />} />
        <Route path="/" element={<Login key={Date.now()} />} />
      </Routes>
    </Router>
    </>
  )
}

export default App
