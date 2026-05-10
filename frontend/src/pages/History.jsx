import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import api from '../api/axios'
import { FiSearch, FiEye, FiFileText, FiFilter } from 'react-icons/fi'

export default function History() {
  const [sales, setSales]     = useState([])
  const [total, setTotal]     = useState(0)
  const [page, setPage]       = useState(1)
  const [filters, setFilters] = useState({ tipo: '', desde: '', hasta: '' })
  const LIMIT = 20

  const load = () => {
    const params = new URLSearchParams({
      page, limit: LIMIT,
      ...(filters.tipo  && { tipo: filters.tipo }),
      ...(filters.desde && { desde: filters.desde }),
      ...(filters.hasta && { hasta: filters.hasta }),
    })
    api.get(`/sales?${params}`).then(r => {
      setSales(r.data.data)
      setTotal(r.data.total)
    })
  }

  useEffect(() => { load() }, [page, filters])

  const totalPages  = Math.ceil(total / LIMIT)
  const totalMonto  = sales.reduce((s, v) => s + Number(v.total), 0)

  const handleFilter = (field, val) => {
    setFilters(f => ({ ...f, [field]: val }))
    setPage(1)
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Historial de Ventas</h1>
          <p className="text-gray-500 text-sm">{total} comprobantes registrados</p>
        </div>
        <Link to="/sales/new" className="btn-primary">
          <FiFileText /> Nueva Venta
        </Link>
      </div>

      {/* Filtros */}
      <div className="card mb-5 p-4">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2 text-gray-500">
            <FiFilter className="w-4 h-4" />
            <span className="text-sm font-medium">Filtros:</span>
          </div>

          {/* Tipo */}
          <select
            className="input-field w-40"
            value={filters.tipo}
            onChange={e => handleFilter('tipo', e.target.value)}
          >
            <option value="">Todos</option>
            <option value="Boleta">Boleta</option>
            <option value="Factura">Factura</option>
          </select>

          {/* Desde */}
          <div className="flex items-center gap-1">
            <label className="text-xs text-gray-500 whitespace-nowrap">Desde:</label>
            <input
              type="date" className="input-field w-40"
              value={filters.desde}
              onChange={e => handleFilter('desde', e.target.value)}
            />
          </div>

          {/* Hasta */}
          <div className="flex items-center gap-1">
            <label className="text-xs text-gray-500 whitespace-nowrap">Hasta:</label>
            <input
              type="date" className="input-field w-40"
              value={filters.hasta}
              onChange={e => handleFilter('hasta', e.target.value)}
            />
          </div>

          {/* Limpiar */}
          {(filters.tipo || filters.desde || filters.hasta) && (
            <button
              onClick={() => { setFilters({ tipo:'', desde:'', hasta:'' }); setPage(1) }}
              className="btn-secondary text-xs py-1.5"
            >
              Limpiar filtros
            </button>
          )}
        </div>
      </div>

      {/* Resumen rápido */}
      {sales.length > 0 && (
        <div className="grid grid-cols-3 gap-4 mb-5">
          <div className="card text-center py-3">
            <p className="text-xs text-gray-500">Total ventas (página)</p>
            <p className="text-2xl font-bold text-gray-800">{sales.length}</p>
          </div>
          <div className="card text-center py-3">
            <p className="text-xs text-gray-500">Monto total (página)</p>
            <p className="text-2xl font-bold text-green-700">S/. {totalMonto.toFixed(2)}</p>
          </div>
          <div className="card text-center py-3">
            <p className="text-xs text-gray-500">Ticket promedio</p>
            <p className="text-2xl font-bold text-blue-700">S/. {(totalMonto / sales.length).toFixed(2)}</p>
          </div>
        </div>
      )}

      {/* Tabla */}
      <div className="card p-0 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr>
                {['Comprobante','Tipo','Cliente','Documento','Vendedor','Fecha','Total','Acción'].map(h => (
                  <th key={h} className="table-th">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {sales.map(v => (
                <tr key={v.id_venta} className="hover:bg-gray-50 transition-colors">
                  <td className="table-td">
                    <span className="font-mono font-semibold text-gray-800">{v.comprobante}</span>
                  </td>
                  <td className="table-td">
                    <span className={v.tipo_comprobante === 'Boleta' ? 'badge-blue' : 'badge-purple'}>
                      {v.tipo_comprobante}
                    </span>
                  </td>
                  <td className="table-td font-medium max-w-[180px] truncate">{v.cliente}</td>
                  <td className="table-td font-mono text-xs text-gray-500">{v.doc_cliente}</td>
                  <td className="table-td text-xs text-gray-500">{v.vendedor}</td>
                  <td className="table-td text-xs text-gray-400 whitespace-nowrap">
                    {new Date(v.fecha_hora).toLocaleString('es-PE', {
                      day:'2-digit', month:'2-digit', year:'numeric',
                      hour:'2-digit', minute:'2-digit'
                    })}
                  </td>
                  <td className="table-td font-bold text-green-700 whitespace-nowrap">
                    S/. {Number(v.total).toFixed(2)}
                  </td>
                  <td className="table-td">
                    <Link
                      to={`/sales/${v.id_venta}`}
                      className="flex items-center gap-1 text-blue-500 hover:text-blue-700 text-xs font-medium transition-colors"
                    >
                      <FiEye className="w-4 h-4" /> Ver
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {!sales.length && (
            <p className="text-center py-10 text-gray-400 text-sm">
              No se encontraron ventas con los filtros aplicados
            </p>
          )}
        </div>

        {/* Paginación */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100">
            <p className="text-xs text-gray-500">
              Página {page} de {totalPages} · {total} registros
            </p>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                className="btn-secondary text-xs py-1 px-3 disabled:opacity-40"
              >
                ← Anterior
              </button>
              {/* Páginas visibles */}
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                const pg = Math.max(1, Math.min(page - 2, totalPages - 4)) + i
                return (
                  <button
                    key={pg}
                    onClick={() => setPage(pg)}
                    className={`w-8 h-8 rounded-lg text-xs font-semibold transition-all
                      ${pg === page ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
                  >
                    {pg}
                  </button>
                )
              })}
              <button
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="btn-secondary text-xs py-1 px-3 disabled:opacity-40"
              >
                Siguiente →
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
