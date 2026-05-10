import { useState, useEffect } from 'react'
import api from '../api/axios'
import toast from 'react-hot-toast'
import { FiPlus, FiEdit2, FiTrash2, FiUser, FiShield, FiLock } from 'react-icons/fi'
import { useAuth } from '../context/AuthContext'
import { Navigate } from 'react-router-dom'

const EMPTY = {
  username: '', password: '', nombres: '', apellidos: '', dni: '', id_cargo: '',
}

export default function Users() {
  const { isAdmin }           = useAuth()
  const [users, setUsers]     = useState([])
  const [cargos, setCargos]   = useState([])
  const [showModal, setShowModal] = useState(false)
  const [form, setForm]       = useState(EMPTY)
  const [editing, setEditing] = useState(null)
  const [loading, setLoading] = useState(false)
  const [idEmpleado, setIdEmpleado] = useState(null)

  if (!isAdmin) return <Navigate to="/" replace />

  const load = () => { api.get('/users').then(r => setUsers(r.data)) }

  useEffect(() => {
    load()
    api.get('/users/cargos').then(r => setCargos(r.data))
  }, [])

  const openNew = () => {
    setForm(EMPTY); setEditing(null); setIdEmpleado(null); setShowModal(true)
  }

  const openEdit = u => {
    setForm({
      username: u.username, password: '',
      nombres: u.nombres, apellidos: u.apellidos,
      dni: u.dni, id_cargo: u.id_cargo || '',
    })
    setEditing(u.id_usuario)
    setIdEmpleado(u.id_empleado)
    setShowModal(true)
  }

  const handleSave = async () => {
    const required = ['username', 'nombres', 'apellidos', 'dni', 'id_cargo']
    if (required.some(k => !form[k])) { toast.error('Completa todos los campos obligatorios'); return }
    if (!editing && !form.password)   { toast.error('La contraseña es obligatoria para nuevos usuarios'); return }

    setLoading(true)
    try {
      if (editing) {
        await api.put(`/users/${editing}`, { ...form, id_empleado: idEmpleado })
        toast.success('Usuario actualizado')
      } else {
        await api.post('/users', form)
        toast.success('Usuario creado')
      }
      setShowModal(false)
      load()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Error al guardar')
    } finally { setLoading(false) }
  }

  const handleDelete = async id => {
    if (!confirm('¿Eliminar este usuario?')) return
    try {
      await api.delete(`/users/${id}`)
      toast.success('Usuario eliminado')
      load()
    } catch (err) {
      toast.error(err.response?.data?.message || 'No se puede eliminar')
    }
  }

  const rolColor = rol => {
    if (rol === 'Administrador') return 'badge-red'
    if (rol === 'Vendedor')      return 'badge-blue'
    return 'badge-green'
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Usuarios</h1>
          <p className="text-gray-500 text-sm">{users.length} usuarios registrados</p>
        </div>
        <button onClick={openNew} className="btn-primary">
          <FiPlus /> Nuevo Usuario
        </button>
      </div>

      {/* Aviso admin */}
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-5 flex items-center gap-3">
        <FiShield className="w-5 h-5 text-blue-500 shrink-0" />
        <p className="text-blue-700 text-sm">
          Solo los administradores pueden ver y gestionar usuarios del sistema.
        </p>
      </div>

      {/* Tabla */}
      <div className="card p-0 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr>
                {['Usuario','Empleado','DNI','Rol','Acciones'].map(h => (
                  <th key={h} className="table-th">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {users.map(u => (
                <tr key={u.id_usuario} className="hover:bg-gray-50 transition-colors">
                  <td className="table-td">
                    <div className="flex items-center gap-2">
                      <div className="w-9 h-9 bg-gradient-to-br from-blue-500 to-blue-700 rounded-full flex items-center justify-center text-white font-bold text-sm">
                        {u.nombres?.[0]}{u.apellidos?.[0]}
                      </div>
                      <div>
                        <p className="font-semibold text-sm">{u.username}</p>
                        <p className="text-xs text-gray-400 flex items-center gap-1">
                          <FiLock className="w-3 h-3" /> contraseña oculta
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="table-td font-medium">
                    {u.nombres} {u.apellidos}
                  </td>
                  <td className="table-td font-mono text-sm text-gray-600">{u.dni}</td>
                  <td className="table-td">
                    <span className={rolColor(u.rol)}>{u.rol}</span>
                  </td>
                  <td className="table-td">
                    <div className="flex gap-2">
                      <button
                        onClick={() => openEdit(u)}
                        className="text-blue-500 hover:text-blue-700 transition-colors"
                      >
                        <FiEdit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(u.id_usuario)}
                        className="text-red-400 hover:text-red-600 transition-colors"
                      >
                        <FiTrash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {!users.length && (
            <p className="text-center py-10 text-gray-400 text-sm">No hay usuarios registrados</p>
          )}
        </div>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg p-6">
            <h2 className="text-lg font-bold text-gray-800 mb-5">
              {editing ? 'Editar Usuario' : 'Nuevo Usuario'}
            </h2>

            <div className="grid grid-cols-2 gap-4">
              {/* Datos empleado */}
              <div>
                <label className="text-xs font-medium text-gray-500 mb-1 block">Nombres *</label>
                <input
                  className="input-field"
                  value={form.nombres}
                  onChange={e => setForm({ ...form, nombres: e.target.value })}
                />
              </div>
              <div>
                <label className="text-xs font-medium text-gray-500 mb-1 block">Apellidos *</label>
                <input
                  className="input-field"
                  value={form.apellidos}
                  onChange={e => setForm({ ...form, apellidos: e.target.value })}
                />
              </div>
              <div>
                <label className="text-xs font-medium text-gray-500 mb-1 block">DNI *</label>
                <input
                  className="input-field"
                  placeholder="12345678"
                  value={form.dni}
                  disabled={!!editing}
                  onChange={e => setForm({ ...form, dni: e.target.value })}
                />
              </div>
              <div>
                <label className="text-xs font-medium text-gray-500 mb-1 block">Cargo *</label>
                <select
                  className="input-field"
                  value={form.id_cargo}
                  onChange={e => setForm({ ...form, id_cargo: e.target.value })}
                >
                  <option value="">Seleccionar cargo</option>
                  {cargos.map(c => (
                    <option key={c.id_cargo} value={c.id_cargo}>{c.nombre_cargo}</option>
                  ))}
                </select>
              </div>

              {/* Divisor */}
              <div className="col-span-2 border-t border-gray-100 pt-3">
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">
                  Credenciales de Acceso
                </p>
              </div>

              <div className="col-span-2">
                <label className="text-xs font-medium text-gray-500 mb-1 block">Username *</label>
                <input
                  className="input-field"
                  placeholder="ana.torres"
                  value={form.username}
                  onChange={e => setForm({ ...form, username: e.target.value })}
                />
              </div>
              <div className="col-span-2">
                <label className="text-xs font-medium text-gray-500 mb-1 block">
                  Contraseña {editing ? '(dejar en blanco para no cambiar)' : '*'}
                </label>
                <input
                  className="input-field"
                  type="password"
                  placeholder={editing ? '••••••••' : 'Mínimo 6 caracteres'}
                  value={form.password}
                  onChange={e => setForm({ ...form, password: e.target.value })}
                />
              </div>
            </div>

            <div className="flex gap-3 justify-end mt-6">
              <button onClick={() => setShowModal(false)} className="btn-secondary">
                Cancelar
              </button>
              <button onClick={handleSave} disabled={loading} className="btn-primary">
                {loading
                  ? <span className="animate-spin border-2 border-white border-t-transparent rounded-full w-4 h-4" />
                  : 'Guardar Usuario'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
