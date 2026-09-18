// Ensure window.fetch has both a getter and a setter so external scripts or polyfills
// that reassign window.fetch do not encounter "Cannot set property fetch of #<Window> which has only a getter"
try {
  if (typeof window !== 'undefined') {
    let _activeFetch = window.fetch;
    const desc = Object.getOwnPropertyDescriptor(window, 'fetch');
    if (!desc || !desc.set) {
      try {
        Object.defineProperty(window, 'fetch', {
          get() {
            return _activeFetch;
          },
          set(newFetch) {
            _activeFetch = newFetch;
          },
          configurable: true,
          enumerable: true,
        });
      } catch {
        // Fallback for Window prototype
        if (typeof Window !== 'undefined' && Window.prototype) {
          Object.defineProperty(Window.prototype, 'fetch', {
            get() {
              return _activeFetch;
            },
            set(newFetch) {
              _activeFetch = newFetch;
            },
            configurable: true,
            enumerable: true,
          });
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
import './index.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
