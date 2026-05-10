import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from './context/AuthContext'
import MainLayout from './layouts/MainLayout'
import Login     from './pages/Login'
import Dashboard from './pages/Dashboard'
import Products  from './pages/Products'
import Clients   from './pages/Clients'
import Sales     from './pages/Sales'
import SaleDetail from './pages/SaleDetail'
import History   from './pages/History'
import Users     from './pages/Users'

const PrivateRoute = ({ children }) => {
  const { user, loading } = useAuth()
  if (loading) return <div className="flex items-center justify-center h-screen"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"/></div>
  return user ? children : <Navigate to="/login" replace />
}

export default function App() {
  const { user } = useAuth()
  return (
    <Routes>
      <Route path="/login" element={user ? <Navigate to="/" /> : <Login />} />
      <Route path="/" element={<PrivateRoute><MainLayout /></PrivateRoute>}>
        <Route index             element={<Dashboard />} />
        <Route path="products"   element={<Products />} />
        <Route path="clients"    element={<Clients />} />
        <Route path="sales/new"  element={<Sales />} />
        <Route path="sales/:id"  element={<SaleDetail />} />
        <Route path="history"    element={<History />} />
        <Route path="users"      element={<Users />} />
      </Route>
      <Route path="*" element={<Navigate to="/" />} />
    </Routes>
  )
}
