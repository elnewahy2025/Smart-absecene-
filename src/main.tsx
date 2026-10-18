import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import { ErrorBoundary } from './components/ErrorBoundary';
import './index.css';

// After a new deployment the hashed chunk names change, so a tab that is still
// running the previous index.html fails when it lazily imports a screen that no
// longer exists. Reload once to pick up the new build instead of showing an error.
const RELOAD_FLAG = 'app_chunk_reload_attempted';
window.addEventListener('vite:preloadError', () => {
  if (sessionStorage.getItem(RELOAD_FLAG)) return;
  sessionStorage.setItem(RELOAD_FLAG, '1');
  window.location.reload();
});
window.addEventListener('load', () => sessionStorage.removeItem(RELOAD_FLAG));

createRoot(document.getElementById('root')!).render(
  <ErrorBoundary>
    <App />
  </ErrorBoundary>
);
