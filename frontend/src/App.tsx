import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { useAuthStore } from './store/authStore'
import AuthPage from './pages/AuthPage'
import ChatPage from './pages/ChatPage'
import AdminPage from './pages/AdminPage'

function ProtectedRoute({
  children,
  requireAdmin = false,
}: {
  children: React.ReactNode
  requireAdmin?: boolean
}) {
  const { user, isAuthenticated } = useAuthStore()

  if (!isAuthenticated) return <Navigate to="/auth" replace />
  if (requireAdmin && user?.role !== 'admin') return <Navigate to="/chat" replace />

  return <>{children}</>
}

export default function App() {
  const { isAuthenticated, user } = useAuthStore()

  const defaultPath = isAuthenticated
    ? user?.role === 'admin'
      ? '/admin'
      : '/chat'
    : '/auth'

  return (
    <Router>
      <Routes>
        <Route
          path="/auth"
          element={
            isAuthenticated ? (
              <Navigate to={defaultPath} replace />
            ) : (
              <AuthPage />
            )
          }
        />
        <Route
          path="/chat"
          element={
            <ProtectedRoute>
              <ChatPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/*"
          element={
            <ProtectedRoute requireAdmin>
              <AdminPage />
            </ProtectedRoute>
          }
        />
        <Route path="/" element={<Navigate to={defaultPath} replace />} />
        <Route path="*" element={<Navigate to={defaultPath} replace />} />
      </Routes>
    </Router>
  )
}
