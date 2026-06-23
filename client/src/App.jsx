import { useState, useEffect, useRef } from 'react';
import DishCard from './DishCard';

const API = 'http://localhost:3001';

export default function App() {
  const [dishes, setDishes] = useState([]);
  const [wsConnected, setWsConnected] = useState(false);
  const [toasts, setToasts] = useState([]);
  const wsRef = useRef(null);

  const addToast = (msg) => {
    const id = Date.now();
    setToasts(t => [...t, { id, msg }]);
    setTimeout(() => setToasts(t => t.filter(x => x.id !== id)), 3000);
  };

  useEffect(() => {
    fetch(`${API}/dishes`).then(r => r.json()).then(setDishes);

    const connect = () => {
      const ws = new WebSocket('ws://localhost:3001');
      ws.onopen = () => setWsConnected(true);
      ws.onclose = () => { setWsConnected(false); setTimeout(connect, 2000); };
      ws.onmessage = (e) => {
        const msg = JSON.parse(e.data);
        if (msg.type === 'DISHES_UPDATED') setDishes(msg.dishes);
      };
      wsRef.current = ws;
    };
    connect();
    return () => wsRef.current?.close();
  }, []);

  const toggle = (id, name, isPublished) => {
    fetch(`${API}/dishes/${id}/toggle`, { method: 'PATCH' });
    addToast(`${name} ${isPublished ? 'disabled' : 'enabled'}`);
  };

  const simulate = (id, name) => {
    fetch(`${API}/dishes/${id}/simulate`, { method: 'POST' });
    addToast(`Simulated DB change for ${name}`);
  };

  return (
    <>
      <nav className="navbar">
        <h1><span>Nosh</span> — Dish Control Panel</h1>
        <div className="navbar-right">
          <div className="ws-status">
            <div className={`ws-dot ${wsConnected ? 'connected' : 'disconnected'}`} />
            {wsConnected ? 'Live' : 'Reconnecting...'}
          </div>
        </div>
      </nav>
      <div className="grid">
        {dishes.map(d => (
          <DishCard key={d.dishId} dish={d} onToggle={() => toggle(d.dishId, d.dishName, d.isPublished)} onSimulate={() => simulate(d.dishId, d.dishName)} />
        ))}
      </div>
      <div className="toast-container">
        {toasts.map(t => <div key={t.id} className="toast">{t.msg}</div>)}
      </div>
    </>
  );
}
