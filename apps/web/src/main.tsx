import { createRoot } from 'react-dom/client';
import { App } from './App';
import './styles/global.css';
import './config/firebase'; // Initialize Firebase

const container = document.getElementById('root');

if (!container) {
  throw new Error('Root container #root was not found');
}

createRoot(container).render(<App />);
