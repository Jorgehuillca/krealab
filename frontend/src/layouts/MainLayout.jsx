import { Outlet, NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { FiHome, FiBox, FiUsers, FiShoppingCart, FiClock, FiUserCheck,
         FiLogOut, FiAlertCircle, FiMenu, FiX } from 'react-icons/fi'
import { useState } from 'react'

const nav = [
  { to: '/',         label: 'Dashboard',  icon: FiHome },
  { to: '/sales/new',label: 'Nueva Venta',icon: FiShoppingCart },
  { to: '/history',  label: 'Historial',  icon: FiClock },
  { to: '/products', label: 'Productos',  icon: FiBox },
  { to: '/clients',  label: 'Clientes',   icon: FiUsers },
  { to: '/users',    label: 'Usuarios',   icon: FiUserCheck, admin: true },
]

export default function MainLayout() {
  const { user, logout, isAdmin } = useAuth()
  const navigate = useNavigate()
  const [collapsed, setCollapsed] = useState(false)

  const handleLogout = () => { logout(); navigate('/login') }

  return (
    <div className="flex h-screen overflow-hidden bg-gray-50">
      {/* Sidebar */}
      <aside className={`${collapsed ? 'w-16' : 'w-60'} bg-gray-900 flex flex-col transition-all duration-300 shrink-0`}>
        {/* Logo */}
        <div className="flex items-center gap-3 px-4 py-5 border-b border-gray-700">
          <div className="w-9 h-9 bg-blue-600 rounded-lg flex items-center justify-center text-white font-bold text-lg shrink-0">K</div>
          {!collapsed && <div><p className="text-white font-bold text-base leading-tight">KreaLab</p><p className="text-gray-400 text-xs">Sistema de Ventas</p></div>}
        </div>

        {/* Nav */}
        <nav className="flex-1 px-2 py-4 space-y-1 overflow-y-auto">
          {nav.filter(n => !n.admin || isAdmin).map(({ to, label, icon: Icon }) => (
            <NavLink key={to} to={to} end={to === '/'}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150
                 ${isActive ? 'bg-blue-600 text-white' : 'text-gray-400 hover:bg-gray-800 hover:text-white'}`
              }>
              <Icon className="w-5 h-5 shrink-0" />
              {!collapsed && label}
            </NavLink>
          ))}
        </nav>

        {/* User */}
        <div className="px-3 py-4 border-t border-gray-700">
          {!collapsed && (
            <div className="mb-3 px-2">
              <p className="text-white text-sm font-semibold truncate">{user?.nombre}</p>
              <p className="text-gray-400 text-xs">{user?.rol}</p>
            </div>
          )}
          <button onClick={handleLogout}
            className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-gray-400 hover:bg-red-600 hover:text-white transition-all">
            <FiLogOut className="w-5 h-5 shrink-0" />
            {!collapsed && 'Cerrar Sesión'}
          </button>
        </div>

        {/* Collapse btn */}
        <button onClick={() => setCollapsed(!collapsed)}
          className="absolute top-4 -right-3 w-6 h-6 bg-gray-700 border border-gray-600 rounded-full flex items-center justify-center text-gray-300 hover:bg-blue-600 hover:text-white transition-all z-10">
          {collapsed ? <FiMenu className="w-3 h-3" /> : <FiX className="w-3 h-3" />}
        </button>
      </aside>

      {/* Main */}
      <main className="flex-1 overflow-y-auto">
        <Outlet />
      </main>
    </div>
  )
}
