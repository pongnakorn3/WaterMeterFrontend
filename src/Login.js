import React, { useState } from 'react';
import axios from 'axios';

const API_BASE_URL = 'https://watermeterbackend-production.up.railway.app';

function Login({ onLoginSuccess }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      // ยิงไปที่ Server
      const res = await axios.post(`${API_BASE_URL}/api/login`, { username, password });
      if (res.data.success) {
        onLoginSuccess(res.data.user);
      }
    } catch (err) {
      setError('ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง');
    }
  };

  return (
    <div style={{ height: '100vh', display: 'flex', justifyContent: 'center', alignItems: 'center', background: '#eef2f3' }}>
      <div style={{ background: '#fff', padding: '40px', borderRadius: '15px', boxShadow: '0 10px 25px rgba(0,0,0,0.1)', width: '320px', textAlign: 'center' }}>
        <h2 style={{ color: '#333', marginBottom: '20px' }}>🔐 เข้าสู่ระบบหอพัก</h2>
        <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
          <input 
            type="text" placeholder="ชื่อผู้ใช้" 
            value={username} onChange={e => setUsername(e.target.value)}
            style={{ padding: '12px', border: '1px solid #ddd', borderRadius: '8px' }}
          />
          <input 
            type="password" placeholder="รหัสผ่าน" 
            value={password} onChange={e => setPassword(e.target.value)}
            style={{ padding: '12px', border: '1px solid #ddd', borderRadius: '8px' }}
          />
          <button type="submit" style={{ background: '#007bff', color: 'white', padding: '12px', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}>
            เข้าใช้งาน
          </button>
        </form>
        {error && <p style={{ color: 'red', marginTop: '15px' }}>{error}</p>}
      </div>
    </div>
  );
}

export default Login;