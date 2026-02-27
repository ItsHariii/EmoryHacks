import React from 'react'
import ReactDOM from 'react-dom/client'
import { PostHogProvider } from 'posthog-js/react'
import { posthog } from './lib/posthog'
import App from './App'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <PostHogProvider client={posthog}>
      <App />
    </PostHogProvider>
  </React.StrictMode>,
)
