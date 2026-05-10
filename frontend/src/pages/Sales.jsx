import { useState, useEffect, useRef } from 'react'
import api from '../api/axios'
import toast from 'react-hot-toast'
import { FiSearch, FiTrash2, FiPrinter, FiCheck } from 'react-icons/fi'
import { useNavigate } from 'react-router-dom'

const IGV = 0.18

export default function Sales() {
  const navigate = useNavigate()
  // Comprobante & cliente
  const [comprobantes, setComprobantes]   = useState([])
  const [tipoComp, setTipoComp]           = useState('')
  const [docCliente, setDocCliente]       = useState('')
  const [cliente, setCliente]             = useState(null)
  const [clienteNombre, setClienteNombre] = useState('')
  const [clienteDireccion, setClienteDireccion] = useState('')
  // Productos
  const [busqueda, setBusqueda]           = useState('')
  const [sugerencias, setSugerencias]     = useState([])
  const [items, setItems]                 = useState([])
  // Base personalizada
  const [baseInfo, setBaseInfo]           = useState(null)
  const [loading, setLoading]             = useState(false)
  const searchRef                         = useRef(null)

  useEffect(() => {
    api.get('/sales/comprobantes').then(r => {
      setComprobantes(r.data)
      if (r.data.length) setTipoComp(r.data[0].id_tipo_comprobante)
    })
    api.get('/sales/base').then(r => { if (r.data.length) setBaseInfo(r.data[0]) })
  }, [])

  // Buscar cliente por doc
  const buscarCliente = async () => {
    if (!docCliente) return
    try {
      const { data } = await api.get(`/clients/doc/${docCliente}`)
      setCliente(data)
      setClienteNombre(data.nombres_razon_social)
      setClienteDireccion(data.direccion || '')
    } catch {
      setCliente(null)
      toast('Cliente no encontrado, puedes ingresar el nombre manualmente', { icon: 'ℹ️' })
    }
  }

  // Buscar productos
  useEffect(() => {
    if (busqueda.length < 2) { setSugerencias([]); return }
    const timer = setTimeout(() => {
      api.get(`/products/search?q=${busqueda}`).then(r => setSugerencias(r.data))
    }, 300)
    return () => clearTimeout(timer)
  }, [busqueda])

  const agregarProducto = (prod) => {
    setBusqueda(''); setSugerencias([])
    setItems(prev => {
      const existe = prev.find(i => i.id_producto === prod.id_producto)
      if (existe) return prev.map(i => i.id_producto === prod.id_producto
        ? { ...i, cantidad: i.cantidad + 1 } : i)
      return [...prev, {
        id_producto: prod.id_producto,
        id_producto_precio: prod.id_producto_precio,
        nombre_comercial: prod.nombre_comercial,
        color: prod.color,
        valor: Number(prod.precio_venta),
        cantidad: 1,
        stock_actual: prod.stock_actual,
        conBase: false,
        texto_base: '',
        id_base: null,
        precio_base: 0,
      }]
    })
  }

  const updateItem = (idx, field, value) => {
    setItems(prev => prev.map((it, i) => {
      if (i !== idx) return it
      if (field === 'conBase') {
        return { ...it, conBase: value,
          id_base: value ? baseInfo?.id_base : null,
          precio_base: value ? Number(baseInfo?.precio_adicional || 0) : 0,
          texto_base: value ? it.texto_base : '' }
      }
      return { ...it, [field]: value }
    }))
  }

  const removeItem = idx => setItems(prev => prev.filter((_, i) => i !== idx))

  // Totales
  const opGravadas  = items.reduce((s, i) => s + (i.valor + i.precio_base) * i.cantidad, 0)
  const igvTotal    = Math.round(opGravadas * IGV * 100) / 100
  const totalFinal  = Math.round((opGravadas + igvTotal) * 100) / 100

  const handleVender = async () => {
    if (!tipoComp) { toast.error('Selecciona tipo de comprobante'); return }
    if (!clienteNombre) { toast.error('Ingresa los datos del cliente'); return }
    if (!items.length) { toast.error('Agrega al menos un producto'); return }

    setLoading(true)
    try {
      // Crear cliente si no existe
      let id_cliente = cliente?.id_cliente
      if (!id_cliente) {
        if (!docCliente) { toast.error('Ingresa el número de documento del cliente'); setLoading(false); return }
        const { data } = await api.post('/clients', {
          numero_documento: docCliente, nombres_razon_social: clienteNombre,
          direccion: clienteDireccion, telefono: '',
        })
        id_cliente = data.id
      }

      const payload = {
        id_tipo_comprobante: tipoComp,
        id_cliente,
        items: items.map(i => ({
          id_producto: i.id_producto,
          id_producto_precio: i.id_producto_precio,
          id_base: i.id_base,
          texto_base: i.texto_base || null,
          cantidad: i.cantidad,
          valor: i.valor,
          precio_base: i.precio_base,
        })),
      }

      const { data } = await api.post('/sales', payload)
      toast.success(`Venta registrada: ${data.comprobante}`)
      navigate(`/sales/${data.id_venta}`)
    } catch (err) {
      toast.error(err.response?.data?.message || 'Error al registrar venta')
    } finally { setLoading(false) }
  }

  const tipoSeleccionado = comprobantes.find(c => c.id_tipo_comprobante == tipoComp)

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Nueva Venta</h1>
          <p className="text-gray-500 text-sm">Registrar comprobante de pago</p>
        </div>
        <div className="flex gap-2">
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="radio" name="tipo" checked={comprobantes.find(c=>c.id_tipo_comprobante==tipoComp)?.nombre_documento==='Boleta'}
              onChange={() => { const b = comprobantes.find(c=>c.nombre_documento==='Boleta'); if(b) setTipoComp(b.id_tipo_comprobante) }}
              className="accent-blue-600" />
            <span className="text-sm font-medium">Boleta</span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="radio" name="tipo" checked={comprobantes.find(c=>c.id_tipo_comprobante==tipoComp)?.nombre_documento==='Factura'}
              onChange={() => { const f = comprobantes.find(c=>c.nombre_documento==='Factura'); if(f) setTipoComp(f.id_tipo_comprobante) }}
              className="accent-blue-600" />
            <span className="text-sm font-medium">Factura</span>
          </label>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-5">
        {/* Columna izquierda */}
        <div className="lg:col-span-2 space-y-4">

          {/* COMPROBANTE */}
          <div className="card overflow-hidden p-0">
            <div className="section-header">
              <span>Comprobante de Pago</span>
              {tipoSeleccionado && <span className="text-blue-200 text-xs">{tipoSeleccionado.serie_actual}-{String(tipoSeleccionado.correlativo_actual+1).padStart(8,'0')}</span>}
            </div>
            <div className="grid grid-cols-3 gap-4 p-4">
              <div><p className="text-xs text-gray-500 mb-1">Empresa Emisora</p><p className="text-sm font-semibold">KREALAB STUDIO E.I.R.L.</p></div>
              <div><p className="text-xs text-gray-500 mb-1">Fecha Emisión</p><p className="text-sm font-semibold">{new Date().toLocaleDateString('es-PE')}</p></div>
              <div><p className="text-xs text-gray-500 mb-1">Moneda</p><p className="text-sm font-semibold">PEN - SOLES</p></div>
            </div>
          </div>

          {/* DATOS DEL CLIENTE */}
          <div className="card overflow-hidden p-0">
            <div className="section-header"><span>Datos del Cliente</span></div>
            <div className="p-4 grid grid-cols-2 gap-3">
              <div className="col-span-2 flex gap-2">
                <div className="flex-1">
                  <label className="text-xs text-gray-500 mb-1 block">N° Documento (DNI/RUC)</label>
                  <input className="input-field" placeholder="12345678" value={docCliente}
                    onChange={e => setDocCliente(e.target.value)} onKeyDown={e => e.key==='Enter' && buscarCliente()} />
                </div>
                <button onClick={buscarCliente} className="btn-secondary mt-5"><FiSearch /></button>
              </div>
              <div className="col-span-2">
                <label className="text-xs text-gray-500 mb-1 block">Nombre / Razón Social</label>
                <input className="input-field" placeholder="Nombre del cliente" value={clienteNombre}
                  onChange={e => setClienteNombre(e.target.value)} />
              </div>
              <div>
                <label className="text-xs text-gray-500 mb-1 block">Dirección</label>
                <input className="input-field" placeholder="Dirección" value={clienteDireccion}
                  onChange={e => setClienteDireccion(e.target.value)} />
              </div>
            </div>
          </div>

          {/* PRODUCTOS */}
          <div className="card overflow-hidden p-0">
            <div className="section-header"><span>Listado de Productos</span></div>
            <div className="p-4">
              <div className="relative mb-4" ref={searchRef}>
                <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input className="input-field pl-9" placeholder="Buscar figura por nombre..."
                  value={busqueda} onChange={e => setBusqueda(e.target.value)} />
                {sugerencias.length > 0 && (
                  <div className="absolute z-20 w-full mt-1 bg-white border border-gray-200 rounded-xl shadow-xl overflow-hidden">
                    {sugerencias.map(p => (
                      <button key={p.id_producto} onClick={() => agregarProducto(p)}
                        className="w-full flex items-center justify-between px-4 py-2.5 hover:bg-blue-50 transition-colors text-left">
                        <div>
                          <p className="text-sm font-medium">{p.nombre_comercial}</p>
                          <p className="text-xs text-gray-400">{p.nombre_material} {p.color ? `· ${p.color}` : ''} · Stock: {p.stock_actual}</p>
                        </div>
                        <span className="text-blue-600 font-semibold text-sm">S/. {Number(p.precio_venta).toFixed(2)}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Tabla items */}
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead><tr>
                    {['Producto','Valor','Cant.','Base +S/.20','Subtotal',''].map(h => <th key={h} className="table-th text-center first:text-left">{h}</th>)}
                  </tr></thead>
                  <tbody>
                    {items.map((it, idx) => {
                      const sub = (it.valor + it.precio_base) * it.cantidad
                      return (
                        <tr key={idx} className="border-b border-gray-100">
                          <td className="table-td">
                            <p className="font-medium">{it.nombre_comercial}</p>
                            {it.color && <p className="text-xs text-gray-400">{it.color}</p>}
                            {it.conBase && (
                              <input className="input-field mt-1 text-xs py-1" placeholder="Texto para la base..."
                                value={it.texto_base} onChange={e => updateItem(idx, 'texto_base', e.target.value)} />
                            )}
                          </td>
                          <td className="table-td text-center">S/. {it.valor.toFixed(2)}</td>
                          <td className="table-td text-center">
                            <div className="flex items-center justify-center gap-1">
                              <button onClick={() => updateItem(idx,'cantidad',Math.max(1,it.cantidad-1))} className="w-6 h-6 bg-gray-100 rounded text-gray-600 hover:bg-gray-200">-</button>
                              <span className="w-8 text-center font-semibold">{it.cantidad}</span>
                              <button onClick={() => updateItem(idx,'cantidad',Math.min(it.stock_actual,it.cantidad+1))} className="w-6 h-6 bg-gray-100 rounded text-gray-600 hover:bg-gray-200">+</button>
                            </div>
                          </td>
                          <td className="table-td text-center">
                            {baseInfo && <label className="flex items-center justify-center gap-1 cursor-pointer">
                              <input type="checkbox" checked={it.conBase} className="accent-blue-600"
                                onChange={e => updateItem(idx,'conBase',e.target.checked)} />
                              <span className="text-xs text-gray-500">Filamento</span>
                            </label>}
                          </td>
                          <td className="table-td text-center font-semibold">S/. {sub.toFixed(2)}</td>
                          <td className="table-td text-center">
                            <button onClick={() => removeItem(idx)} className="text-red-400 hover:text-red-600"><FiTrash2 /></button>
                          </td>
                        </tr>
                      )
                    })}
                    {!items.length && (
                      <tr><td colSpan={6} className="py-8 text-center text-gray-400 text-sm">Busca y agrega figuras a la venta</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>

        {/* RESUMEN */}
        <div className="space-y-4">
          <div className="card overflow-hidden p-0 sticky top-6">
            <div className="section-header"><span>Resumen</span></div>
            <div className="p-4 space-y-3">
              {[
                { label:'OP. GRAVADAS',   val: opGravadas },
                { label:'OP. INAFECTAS',  val: 0 },
                { label:'OP. EXONERADAS', val: 0 },
                { label:'SUBTOTAL',       val: opGravadas },
                { label:'IGV (18%)',      val: igvTotal },
              ].map(row => (
                <div key={row.label} className="flex justify-between items-center border-b border-gray-100 pb-2">
                  <span className="text-xs text-gray-500">{row.label}</span>
                  <span className="text-sm font-medium">S/. {row.val.toFixed(2)}</span>
                </div>
              ))}
              <div className="flex justify-between items-center pt-2">
                <span className="text-base font-bold text-gray-800">TOTAL</span>
                <span className="text-xl font-bold text-blue-700">S/. {totalFinal.toFixed(2)}</span>
              </div>
            </div>
            <div className="px-4 pb-4 grid grid-cols-2 gap-2">
              <button onClick={() => { setItems([]); setCliente(null); setClienteNombre(''); setDocCliente('') }}
                className="btn-danger justify-center text-xs py-2">Cancelar</button>
              <button onClick={handleVender} disabled={loading || !items.length}
                className="btn-success justify-center text-xs py-2">
                {loading ? <span className="animate-spin border-2 border-white border-t-transparent rounded-full w-3 h-3"/> : <><FiCheck/> VENDER</>}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
