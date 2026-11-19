import { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, NavLink, Navigate } from 'react-router-dom';
import { api } from './api';
import { Home, Auth, Dashboard, NewRequest, Admin, Info } from './pages';

export default function App() {
  const [user, setUser] = useState(null), [ready, setReady] = useState(false);
  useEffect(() => {
    if (!localStorage.getItem('token')) return setReady(true);
    api('/auth/me').then(setUser).catch(() => localStorage.removeItem('token')).finally(() => setReady(true));
  }, []);
  const login = d => { localStorage.setItem('token', d.token); setUser(d.user); };
  const logout = () => { localStorage.removeItem('token'); setUser(null); };
  if (!ready) return null;
  const home = user ? (user.role === 'admin' ? '/admin' : '/dashboard') : '/login';
  const guard = (el, role) => !user ? <Navigate to="/login" /> : role && user.role !== role ? <Navigate to={home} /> : el;
  return (
    <BrowserRouter>
      <header><NavLink to="/" className="brand">EcoCircuit</NavLink>
        <nav>
          {!user && <><NavLink to="/login">Log in</NavLink><NavLink to="/register">Sign up</NavLink></>}
          {user?.role === 'user' && <><NavLink to="/dashboard">My requests</NavLink><NavLink to="/new">New request</NavLink></>}
          {user?.role === 'admin' && <><NavLink to="/admin">Admin panel</NavLink><NavLink to="/new">New request</NavLink></>}
          {user && <button className="link" onClick={logout}>Log out</button>}
        </nav></header>
      <main>
        <Routes>
          <Route path="/" element={<Home user={user} home={home} />} />
          <Route path="/learn/:slug" element={<Info user={user} />} />
          <Route path="/login" element={user ? <Navigate to={home} /> : <Auth onAuth={login} />} />
          <Route path="/register" element={user ? <Navigate to={home} /> : <Auth register onAuth={login} />} />
          <Route path="/dashboard" element={guard(<Dashboard user={user} />, 'user')} />
          <Route path="/new" element={guard(<NewRequest user={user} />)} />
          <Route path="/admin" element={guard(<Admin />, 'admin')} />
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </main>
      <footer>EcoCircuit · E-Waste Collection and Disposal Management System</footer>
    </BrowserRouter>
  );
}
