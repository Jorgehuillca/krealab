import { useState, useEffect } from 'react'
import api from '../api/axios'
import toast from 'react-hot-toast'
import { FiPlus, FiEdit2, FiTrash2, FiSearch, FiAlertTriangle } from 'react-icons/fi'

const EMPTY = { nombre_comercial:'', descripcion:'', color:'', stock_actual:0, stock_minimo:3, id_categoria:'', id_material:'', precio_venta:'' }

export default function Products() {
  const [products, setProducts]   = useState([])
  const [categories, setCategories] = useState([])
  const [materials, setMaterials] = useState([])
  const [search, setSearch]       = useState('')
  const [total, setTotal]         = useState(0)
  const [page, setPage]           = useState(1)
  const [showModal, setShowModal] = useState(false)
  const [form, setForm]           = useState(EMPTY)
  const [editing, setEditing]     = useState(null)
  const [loading, setLoading]     = useState(false)

  const load = () => {
    api.get(`/products?search=${search}&page=${page}&limit=15`)
      .then(r => { setProducts(r.data.data); setTotal(r.data.total) })
  }

  useEffect(() => { load() }, [search, page])
  useEffect(() => {
    api.get('/categories').then(r => setCategories(r.data))
    api.get('/materials').then(r => setMaterials(r.data))
  }, [])

  const openNew = () => { setForm(EMPTY); setEditing(null); setShowModal(true) }
  const openEdit = p => {
    setForm({ nombre_comercial:p.nombre_comercial, descripcion:p.descripcion||'', color:p.color||'',
              stock_actual:p.stock_actual, stock_minimo:p.stock_minimo,
              id_categoria:p.id_categoria||'', id_material:p.id_material||'', precio_venta:p.precio_venta })
    setEditing(p.id_producto); setShowModal(true)
  }

  const handleSave = async () => {
    if (!form.nombre_comercial || !form.precio_venta) { toast.error('Completa los campos obligatorios'); return }
    setLoading(true)
    try {
      if (editing) { await api.put(`/products/${editing}`, form); toast.success('Producto actualizado') }
      else         { await api.post('/products', form); toast.success('Producto creado') }
      setShowModal(false); load()
    } catch (err) { toast.error(err.response?.data?.message || 'Error') }
    finally { setLoading(false) }
  }

  const handleDelete = async id => {
    if (!confirm('¿Eliminar este producto?')) return
    try { await api.delete(`/products/${id}`); toast.success('Eliminado'); load() }
    catch (err) { toast.error(err.response?.data?.message || 'No se puede eliminar') }
  }

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div><h1 className="text-2xl font-bold text-gray-800">Productos / Figuras</h1><p className="text-gray-500 text-sm">{total} productos registrados</p></div>
        <button onClick={openNew} className="btn-primary"><FiPlus /> Nuevo Producto</button>
      </div>

      {/* Search */}
      <div className="relative mb-4 max-w-sm">
        <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
        <input className="input-field pl-9" placeholder="Buscar figura..." value={search}
          onChange={e => { setSearch(e.target.value); setPage(1) }} />
      </div>

      {/* Table */}
      <div className="card p-0 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead><tr>
              {['Figura','Material','Color','Categoría','Precio','Stock','Acciones'].map(h =>
                <th key={h} className="table-th">{h}</th>)}
            </tr></thead>
            <tbody>
              {products.map(p => (
                <tr key={p.id_producto} className="hover:bg-gray-50 transition-colors">
                  <td className="table-td font-medium">{p.nombre_comercial}</td>
                  <td className="table-td"><span className="badge-blue">{p.nombre_material}</span></td>
                  <td className="table-td">{p.color || '—'}</td>
                  <td className="table-td text-xs text-gray-500">{p.nombre_categoria}</td>
                  <td className="table-td font-semibold text-green-700">S/. {Number(p.precio_venta).toFixed(2)}</td>
                  <td className="table-td">
                    <span className={`badge-${p.alerta_stock ? 'red' : 'green'} flex items-center gap-1 w-fit`}>
                      {p.alerta_stock && <FiAlertTriangle className="w-3 h-3" />}
                      {p.stock_actual}
                    </span>
                  </td>
                  <td className="table-td">
                    <div className="flex gap-2">
                      <button onClick={() => openEdit(p)} className="text-blue-500 hover:text-blue-700"><FiEdit2 /></button>
                      <button onClick={() => handleDelete(p.id_producto)} className="text-red-400 hover:text-red-600"><FiTrash2 /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {!products.length && <p className="text-center py-8 text-gray-400">No se encontraron productos</p>}
        </div>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg p-6">
            <h2 className="text-lg font-bold mb-4">{editing ? 'Editar' : 'Nuevo'} Producto</h2>
            <div className="grid grid-cols-2 gap-3">
              <div className="col-span-2">
                <label className="text-xs text-gray-500 mb-1 block">Nombre *</label>
                <input className="input-field" value={form.nombre_comercial} onChange={e => setForm({...form, nombre_comercial:e.target.value})} />
              </div>
              <div className="col-span-2">
                <label className="text-xs text-gray-500 mb-1 block">Descripción</label>
                <textarea className="input-field" rows={2} value={form.descripcion} onChange={e => setForm({...form, descripcion:e.target.value})} />
              </div>
              <div>
                <label className="text-xs text-gray-500 mb-1 block">Color</label>
                <input className="input-field" placeholder="Bronce, Rosa..." value={form.color} onChange={e => setForm({...form, color:e.target.value})} />
              </div>
              <div>
                <label className="text-xs text-gray-500 mb-1 block">Precio sin IGV *</label>
                <input className="input-field" type="number" step="0.01" value={form.precio_venta} onChange={e => setForm({...form, precio_venta:e.target.value})} />
              </div>
              <div>
                <label className="text-xs text-gray-500 mb-1 block">Stock actual</label>
                <input className="input-field" type="number" value={form.stock_actual} onChange={e => setForm({...form, stock_actual:e.target.value})} />
              </div>
              <div>
                <label className="text-xs text-gray-500 mb-1 block">Stock mínimo</label>
                <input className="input-field" type="number" value={form.stock_minimo} onChange={e => setForm({...form, stock_minimo:e.target.value})} />
              </div>
              <div>
                <label className="text-xs text-gray-500 mb-1 block">Categoría</label>
                <select className="input-field" value={form.id_categoria} onChange={e => setForm({...form, id_categoria:e.target.value})}>
                  <option value="">Seleccionar</option>
                  {categories.map(c => <option key={c.id_categoria} value={c.id_categoria}>{c.nombre_categoria}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs text-gray-500 mb-1 block">Material</label>
                <select className="input-field" value={form.id_material} onChange={e => setForm({...form, id_material:e.target.value})}>
                  <option value="">Seleccionar</option>
                  {materials.map(m => <option key={m.id_material} value={m.id_material}>{m.nombre_material}</option>)}
                </select>
              </div>
            </div>
            <div className="flex gap-3 justify-end mt-6">
              <button onClick={() => setShowModal(false)} className="btn-secondary">Cancelar</button>
              <button onClick={handleSave} disabled={loading} className="btn-primary">
                {loading ? '...' : 'Guardar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
