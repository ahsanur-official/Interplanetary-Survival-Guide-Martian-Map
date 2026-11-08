// Ensure window.fetch has both a getter and a setter so external scripts or polyfills
// that reassign window.fetch do not encounter "Cannot set property fetch of #<Window> which has only a getter"
try {
  if (typeof window !== 'undefined' && typeof window.fetch === 'function') {
    let _activeFetch = window.fetch.bind(window);
    const desc = Object.getOwnPropertyDescriptor(window, 'fetch');
    if (!desc || !desc.set) {
      try {
        Object.defineProperty(window, 'fetch', {
          get() {
            return typeof _activeFetch === 'function' ? _activeFetch.bind(window) : _activeFetch;
          },
          set(newFetch) {
            _activeFetch = typeof newFetch === 'function' ? newFetch.bind(window) : newFetch;
          },
          configurable: true,
          enumerable: true,
        });
      } catch {
        // Fallback for Window prototype
        if (typeof Window !== 'undefined' && Window.prototype) {
          try {
            Object.defineProperty(Window.prototype, 'fetch', {
              get() {
                return typeof _activeFetch === 'function' ? _activeFetch.bind(window) : _activeFetch;
              },
              set(newFetch) {
                _activeFetch = typeof newFetch === 'function' ? newFetch.bind(window) : newFetch;
              },
              configurable: true,
              enumerable: true,
            });
          } catch {}
        }
      }
    }
  }
} catch {
  // Silent fallback
}

import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import { ErrorBoundary } from './components/common/ErrorBoundary';
import './index.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </StrictMode>,
);
