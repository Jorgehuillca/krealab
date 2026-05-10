import { useEffect, useState } from 'react'
import api from '../api/axios'
import { FiShoppingBag, FiBox, FiUsers, FiAlertTriangle, FiTrendingUp } from 'react-icons/fi'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts'
import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

const KPI = ({ label, value, sub, icon: Icon, color }) => (
  <div className="card flex items-center gap-4">
    <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${color}`}>
      <Icon className="w-6 h-6 text-white" />
    </div>
    <div>
      <p className="text-xs text-gray-500 font-medium">{label}</p>
      <p className="text-2xl font-bold text-gray-800">{value}</p>
      {sub && <p className="text-xs text-gray-400">{sub}</p>}
    </div>
  </div>
)

export default function Dashboard() {
  const { user } = useAuth()
  const [data, setData]     = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.get('/dashboard').then(r => setData(r.data)).finally(() => setLoading(false))
  }, [])

  if (loading) return <div className="flex items-center justify-center h-full"><div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600"/></div>

  const chartData = (data?.ventasSemana || []).map(v => ({
    fecha: new Date(v.fecha).toLocaleDateString('es-PE', { weekday:'short', day:'2-digit' }),
    ventas: Number(v.cantidad),
    monto: Number(v.monto),
  }))

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Dashboard</h1>
          <p className="text-gray-500 text-sm">Bienvenido, <strong>{user?.nombre}</strong></p>
        </div>
        <Link to="/sales/new" className="btn-primary">+ Nueva Venta</Link>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KPI label="Ventas Hoy" icon={FiShoppingBag} color="bg-blue-600"
          value={data?.ventasHoy.cantidad || 0}
          sub={`S/. ${Number(data?.ventasHoy.monto || 0).toFixed(2)}`} />
        <KPI label="Ventas del Mes" icon={FiTrendingUp} color="bg-green-600"
          value={data?.ventasMes.cantidad || 0}
          sub={`S/. ${Number(data?.ventasMes.monto || 0).toFixed(2)}`} />
        <KPI label="Productos" icon={FiBox} color="bg-purple-600"
          value={data?.total_productos || 0} />
        <KPI label="Clientes" icon={FiUsers} color="bg-amber-500"
          value={data?.total_clientes || 0} />
      </div>

      {/* Alertas stock */}
      {data?.alertas_stock > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-center gap-3">
          <FiAlertTriangle className="w-5 h-5 text-amber-500 shrink-0" />
          <p className="text-amber-700 text-sm font-medium">
            {data.alertas_stock} producto(s) con stock bajo o agotado.
          </p>
        </div>
      )}

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Gráfico ventas semana */}
        <div className="card">
          <h3 className="font-semibold text-gray-700 mb-4">Ventas – Últimos 7 días</h3>
          {chartData.length ? (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="fecha" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip formatter={(v) => [`S/. ${v}`, 'Monto']} />
                <Bar dataKey="monto" fill="#3b82f6" radius={[4,4,0,0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : <p className="text-gray-400 text-sm text-center py-8">Sin ventas registradas esta semana</p>}
        </div>

        {/* Top productos */}
        <div className="card">
          <h3 className="font-semibold text-gray-700 mb-4">Figuras más vendidas</h3>
          <div className="space-y-3">
            {data?.topProductos?.length ? data.topProductos.map((p, i) => (
              <div key={i} className="flex items-center gap-3">
                <span className="w-6 h-6 bg-blue-100 text-blue-700 text-xs font-bold rounded-full flex items-center justify-center">{i+1}</span>
                <div className="flex-1 text-sm text-gray-700">{p.nombre_comercial}</div>
                <span className="badge-blue">{p.total_vendido} uds.</span>
              </div>
            )) : <p className="text-gray-400 text-sm">Sin ventas aún</p>}
          </div>
        </div>
      </div>

      {/* Últimas ventas */}
      <div className="card">
        <div className="flex justify-between items-center mb-4">
          <h3 className="font-semibold text-gray-700">Últimas Ventas</h3>
          <Link to="/history" className="text-blue-600 text-sm hover:underline">Ver todo →</Link>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead><tr>
              {['Comprobante','Cliente','Total','Fecha'].map(h =>
                <th key={h} className="table-th first:rounded-tl-lg last:rounded-tr-lg">{h}</th>)}
            </tr></thead>
            <tbody>
              {data?.ultimasVentas?.map(v => (
                <tr key={v.id_venta} className="hover:bg-gray-50 transition-colors">
                  <td className="table-td"><span className="badge-blue">{v.comprobante}</span></td>
                  <td className="table-td font-medium">{v.cliente}</td>
                  <td className="table-td font-bold text-green-700">S/. {Number(v.total).toFixed(2)}</td>
                  <td className="table-td text-gray-400">{new Date(v.fecha_hora).toLocaleString('es-PE')}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {!data?.ultimasVentas?.length && <p className="text-center text-gray-400 py-6 text-sm">Sin ventas registradas</p>}
        </div>
      </div>
    </div>
  )
}
