import { useState, useEffect } from 'react'
import api from '../api/axios'
import toast from 'react-hot-toast'
import { FiPlus, FiEdit2, FiTrash2, FiSearch, FiUser } from 'react-icons/fi'

const EMPTY = { numero_documento: '', nombres_razon_social: '', direccion: '', telefono: '' }

export default function Clients() {
  const [clients, setClients]   = useState([])
  const [total, setTotal]       = useState(0)
  const [search, setSearch]     = useState('')
  const [page, setPage]         = useState(1)
  const [showModal, setShowModal] = useState(false)
  const [form, setForm]         = useState(EMPTY)
  const [editing, setEditing]   = useState(null)
  const [loading, setLoading]   = useState(false)
  const LIMIT = 15

  const load = () => {
    api.get(`/clients?search=${search}&page=${page}&limit=${LIMIT}`)
      .then(r => { setClients(r.data.data); setTotal(r.data.total) })
  }

  useEffect(() => { load() }, [search, page])

  const openNew  = () => { setForm(EMPTY); setEditing(null); setShowModal(true) }
  const openEdit = c => {
    setForm({
      numero_documento:     c.numero_documento,
      nombres_razon_social: c.nombres_razon_social,
      direccion:            c.direccion || '',
      telefono:             c.telefono  || '',
    })
    setEditing(c.id_cliente)
    setShowModal(true)
  }

  const handleSave = async () => {
    if (!form.numero_documento || !form.nombres_razon_social) {
      toast.error('Documento y nombre son obligatorios')
      return
    }
    setLoading(true)
    try {
      if (editing) {
        await api.put(`/clients/${editing}`, form)
        toast.success('Cliente actualizado')
      } else {
        await api.post('/clients', form)
        toast.success('Cliente creado')
      }
      setShowModal(false)
      load()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Error al guardar cliente')
    } finally { setLoading(false) }
  }

  const handleDelete = async id => {
    if (!confirm('¿Eliminar este cliente?')) return
    try {
      await api.delete(`/clients/${id}`)
      toast.success('Cliente eliminado')
      load()
    } catch (err) {
      toast.error(err.response?.data?.message || 'No se puede eliminar (tiene ventas asociadas)')
    }
  }

  const totalPages = Math.ceil(total / LIMIT)

  // Determinar tipo de documento por longitud
  const docType = (doc) => {
    if (!doc) return ''
    if (doc.length === 8)  return 'DNI'
    if (doc.length === 11) return 'RUC'
    return doc.length > 8 ? 'RUC' : 'DNI'
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Clientes</h1>
          <p className="text-gray-500 text-sm">{total} clientes registrados</p>
        </div>
        <button onClick={openNew} className="btn-primary">
          <FiPlus /> Nuevo Cliente
        </button>
      </div>

      {/* Búsqueda */}
      <div className="relative mb-5 max-w-sm">
        <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
        <input
          className="input-field pl-9"
          placeholder="Buscar por documento o nombre..."
          value={search}
          onChange={e => { setSearch(e.target.value); setPage(1) }}
        />
      </div>

      {/* Tabla */}
      <div className="card p-0 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr>
                {['Tipo','N° Documento','Nombre / Razón Social','Dirección','Teléfono','Acciones'].map(h => (
                  <th key={h} className="table-th">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {clients.map(c => (
                <tr key={c.id_cliente} className="hover:bg-gray-50 transition-colors">
                  <td className="table-td">
                    <span className={c.numero_documento?.length === 11 ? 'badge-purple' : 'badge-blue'}>
                      {docType(c.numero_documento)}
                    </span>
                  </td>
                  <td className="table-td font-mono font-medium">{c.numero_documento}</td>
                  <td className="table-td font-medium">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                        <FiUser className="w-4 h-4 text-blue-600" />
                      </div>
                      {c.nombres_razon_social}
                    </div>
                  </td>
                  <td className="table-td text-gray-500 text-sm">{c.direccion || '—'}</td>
                  <td className="table-td text-gray-500 text-sm">{c.telefono  || '—'}</td>
                  <td className="table-td">
                    <div className="flex gap-2">
                      <button onClick={() => openEdit(c)} className="text-blue-500 hover:text-blue-700 transition-colors">
                        <FiEdit2 className="w-4 h-4" />
                      </button>
                      <button onClick={() => handleDelete(c.id_cliente)} className="text-red-400 hover:text-red-600 transition-colors">
                        <FiTrash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {!clients.length && (
            <p className="text-center py-10 text-gray-400 text-sm">No se encontraron clientes</p>
          )}
        </div>

        {/* Paginación */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100">
            <p className="text-xs text-gray-500">Página {page} de {totalPages} · {total} registros</p>
            <div className="flex gap-2">
              <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
                className="btn-secondary text-xs py-1 px-3 disabled:opacity-40">
                ← Anterior
              </button>
              <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}
                className="btn-secondary text-xs py-1 px-3 disabled:opacity-40">
                Siguiente →
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6">
            <h2 className="text-lg font-bold text-gray-800 mb-5">
              {editing ? 'Editar Cliente' : 'Nuevo Cliente'}
            </h2>

            <div className="space-y-4">
              <div>
                <label className="text-xs font-medium text-gray-500 mb-1 block">
                  N° Documento (DNI 8 dígitos / RUC 11 dígitos) *
                </label>
                <input
                  className="input-field"
                  placeholder="12345678"
                  value={form.numero_documento}
                  disabled={!!editing}
                  onChange={e => setForm({ ...form, numero_documento: e.target.value })}
                />
              </div>

              <div>
                <label className="text-xs font-medium text-gray-500 mb-1 block">
                  Nombre / Razón Social *
                </label>
                <input
                  className="input-field"
                  placeholder="Nombre completo o razón social"
                  value={form.nombres_razon_social}
                  onChange={e => setForm({ ...form, nombres_razon_social: e.target.value })}
                />
              </div>

              <div>
                <label className="text-xs font-medium text-gray-500 mb-1 block">Dirección</label>
                <input
                  className="input-field"
                  placeholder="Av. Lima 123, Miraflores"
                  value={form.direccion}
                  onChange={e => setForm({ ...form, direccion: e.target.value })}
                />
              </div>

              <div>
                <label className="text-xs font-medium text-gray-500 mb-1 block">Teléfono</label>
                <input
                  className="input-field"
                  placeholder="987 654 321"
                  value={form.telefono}
                  onChange={e => setForm({ ...form, telefono: e.target.value })}
                />
              </div>
            </div>

            <div className="flex gap-3 justify-end mt-6">
              <button onClick={() => setShowModal(false)} className="btn-secondary">Cancelar</button>
              <button onClick={handleSave} disabled={loading} className="btn-primary">
                {loading
                  ? <span className="animate-spin border-2 border-white border-t-transparent rounded-full w-4 h-4" />
                  : 'Guardar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
