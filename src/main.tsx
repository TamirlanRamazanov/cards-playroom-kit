import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'

// Временно отключен StrictMode для отладки ошибки React #310
// StrictMode может вызывать двойной рендер компонентов, что может усугублять проблемы с хуками
createRoot(document.getElementById('root')!).render(
  <App />
)
