import { useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import { FiUser, FiLock, FiEye, FiEyeOff } from 'react-icons/fi'

export default function Login() {
  const { login } = useAuth()
  const navigate  = useNavigate()
  const [form, setForm]       = useState({ username: '', password: '' })
  const [showPwd, setShowPwd] = useState(false)
  const [loading, setLoading] = useState(false)

  const handleSubmit = async e => {
    e.preventDefault()
    if (!form.username || !form.password) { toast.error('Completa todos los campos'); return }
    setLoading(true)
    try {
      await login(form.username, form.password)
      toast.success('¡Bienvenido!')
      navigate('/')
    } catch (err) {
      toast.error(err.response?.data?.message || 'Error al iniciar sesión')
    } finally { setLoading(false) }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-950 to-gray-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-600 rounded-2xl mb-4 shadow-lg">
            <span className="text-white font-bold text-2xl">K</span>
          </div>
          <h1 className="text-3xl font-bold text-white">KreaLab</h1>
          <p className="text-blue-300 text-sm mt-1">Sistema de Ventas · Impresiones 3D</p>
        </div>

        {/* Card */}
        <div className="bg-white rounded-2xl shadow-2xl p-8">
          <h2 className="text-xl font-bold text-gray-800 mb-6">Iniciar Sesión</h2>
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Usuario</label>
              <div className="relative">
                <FiUser className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input className="input-field pl-9" placeholder="tu.usuario" value={form.username}
                  onChange={e => setForm({ ...form, username: e.target.value })} />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Contraseña</label>
              <div className="relative">
                <FiLock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input className="input-field pl-9 pr-9" placeholder="••••••••"
                  type={showPwd ? 'text' : 'password'} value={form.password}
                  onChange={e => setForm({ ...form, password: e.target.value })} />
                <button type="button" onClick={() => setShowPwd(!showPwd)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                  {showPwd ? <FiEyeOff className="w-4 h-4" /> : <FiEye className="w-4 h-4" />}
                </button>
              </div>
            </div>
            <button type="submit" disabled={loading}
              className="w-full btn-primary justify-center py-2.5 text-base">
              {loading ? <span className="animate-spin border-2 border-white border-t-transparent rounded-full w-4 h-4"/> : 'Ingresar'}
            </button>
          </form>
          <p className="text-center text-xs text-gray-400 mt-6">
            Usuario por defecto: <strong>maria.quispe</strong> / <strong>admin</strong>
          </p>
        </div>
      </div>
    </div>
  )
}
