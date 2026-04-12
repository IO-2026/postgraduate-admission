import { useCallback, useState } from 'react'
import { Navigate, Route, Routes } from 'react-router-dom'
import AuthPage from './pages/AuthPage'
import HomePage from './pages/HomePage'
import './App.css'

const AUTH_STORAGE_KEY = 'pg-admission-auth'

function getInitialAuthState() {
  try {
    const savedAuth = localStorage.getItem(AUTH_STORAGE_KEY)
    if (!savedAuth) {
      return false
    }

    const parsedAuth = JSON.parse(savedAuth)
    return Boolean(parsedAuth?.isLoggedIn)
  } catch {
    return false
  }
}

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(getInitialAuthState)

  const handleAuthSuccess = useCallback((user) => {
    localStorage.setItem(
      AUTH_STORAGE_KEY,
      JSON.stringify({
        isLoggedIn: true,
        user,
      }),
    )
    setIsLoggedIn(true)
  }, [])

  const handleLogout = useCallback(() => {
    localStorage.removeItem(AUTH_STORAGE_KEY)
    setIsLoggedIn(false)
  }, [])

  return (
    <div className="app-shell">
      <Routes>
        <Route
          path="/"
          element={<HomePage isLoggedIn={isLoggedIn} onLogout={handleLogout} />}
        />
        <Route
          path="/auth"
          element={
            isLoggedIn ? (
              <Navigate to="/" replace />
            ) : (
              <AuthPage onAuthSuccess={handleAuthSuccess} />
            )
          }
        />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </div>
  )
}

export default App
