import { useEffect, useState, useRef } from 'react'
import { useParams, Link } from 'react-router-dom'
import api from '../api/axios'
import { FiPrinter, FiArrowLeft } from 'react-icons/fi'

export default function SaleDetail() {
  const { id }              = useParams()
  const [venta, setVenta]   = useState(null)
  const [loading, setLoading] = useState(true)
  const printRef            = useRef()

  useEffect(() => {
    api.get(`/sales/${id}`).then(r => setVenta(r.data)).finally(() => setLoading(false))
  }, [id])

  const handlePrint = () => window.print()

  if (loading) return <div className="flex items-center justify-center h-full"><div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600"/></div>
  if (!venta)  return <div className="p-6 text-red-500">Venta no encontrada</div>

  return (
    <div className="p-6">
      {/* Actions */}
      <div className="flex items-center justify-between mb-6 print:hidden">
        <Link to="/history" className="btn-secondary"><FiArrowLeft /> Volver</Link>
        <button onClick={handlePrint} className="btn-primary"><FiPrinter /> Imprimir</button>
      </div>

      {/* Comprobante */}
      <div ref={printRef} className="bg-white rounded-2xl shadow-sm border border-gray-100 max-w-2xl mx-auto p-8 print:shadow-none print:border-none">
        {/* Header */}
        <div className="flex items-start justify-between mb-6 pb-6 border-b border-gray-200">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-white font-bold">K</div>
              <span className="text-xl font-bold text-gray-800">KreaLab</span>
            </div>
            <p className="text-xs text-gray-500">KREALAB STUDIO E.I.R.L.</p>
            <p className="text-xs text-gray-500">Tienda de Impresiones 3D</p>
          </div>
          <div className="text-right">
            <span className={`inline-block px-3 py-1 rounded-lg text-sm font-bold mb-2 ${venta.tipo_comprobante==='Boleta' ? 'bg-blue-100 text-blue-700' : 'bg-purple-100 text-purple-700'}`}>
              {venta.tipo_comprobante.toUpperCase()}
            </span>
            <p className="text-lg font-bold text-gray-800">{venta.comprobante}</p>
            <p className="text-xs text-gray-400">{new Date(venta.fecha_hora).toLocaleString('es-PE')}</p>
          </div>
        </div>

        {/* Cliente */}
        <div className="grid grid-cols-2 gap-4 mb-6 p-4 bg-gray-50 rounded-xl">
          <div>
            <p className="text-xs text-gray-400 mb-0.5">Cliente</p>
            <p className="text-sm font-semibold">{venta.cliente}</p>
          </div>
          <div>
            <p className="text-xs text-gray-400 mb-0.5">Documento</p>
            <p className="text-sm font-semibold">{venta.doc_cliente}</p>
          </div>
          {venta.direccion && <div className="col-span-2">
            <p className="text-xs text-gray-400 mb-0.5">Dirección</p>
            <p className="text-sm">{venta.direccion}</p>
          </div>}
          <div>
            <p className="text-xs text-gray-400 mb-0.5">Vendedor</p>
            <p className="text-sm">{venta.vendedor}</p>
          </div>
        </div>

        {/* Tabla detalles */}
        <table className="w-full mb-6 text-sm">
          <thead className="bg-blue-600 text-white">
            <tr>
              <th className="px-3 py-2 text-left rounded-tl-lg">Descripción</th>
              <th className="px-3 py-2 text-center">Cant.</th>
              <th className="px-3 py-2 text-right">Valor</th>
              <th className="px-3 py-2 text-right">IGV</th>
              <th className="px-3 py-2 text-right rounded-tr-lg">Importe</th>
            </tr>
          </thead>
          <tbody>
            {venta.detalles.map((d, i) => (
              <tr key={i} className={i % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                <td className="px-3 py-2">
                  <p className="font-medium">{d.nombre_comercial}</p>
                  {d.color && <p className="text-xs text-gray-400">Color: {d.color}</p>}
                  {d.desc_base && <p className="text-xs text-blue-500">+ {d.desc_base}</p>}
                  {d.texto_base && <p className="text-xs text-gray-500 italic">"{d.texto_base}"</p>}
                </td>
                <td className="px-3 py-2 text-center">{d.cantidad}</td>
                <td className="px-3 py-2 text-right">S/. {Number(d.subtotal).toFixed(2)}</td>
                <td className="px-3 py-2 text-right">S/. {Number(d.igv).toFixed(2)}</td>
                <td className="px-3 py-2 text-right font-semibold">S/. {Number(d.importe).toFixed(2)}</td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Totales */}
        <div className="flex justify-end">
          <div className="w-64 space-y-2">
            {[
              { label:'OP. GRAVADAS',   val: venta.op_gravadas },
              { label:'OP. INAFECTAS',  val: venta.op_inafectas },
              { label:'OP. EXONERADAS', val: venta.op_exoneradas },
              { label:'SUBTOTAL',       val: venta.subtotal },
              { label:'IGV (18%)',      val: venta.igv },
            ].map(r => (
              <div key={r.label} className="flex justify-between text-sm border-b border-gray-100 pb-1">
                <span className="text-gray-500">{r.label}</span>
                <span>S/. {Number(r.val).toFixed(2)}</span>
              </div>
            ))}
            <div className="flex justify-between font-bold text-lg pt-2 border-t-2 border-blue-600">
              <span>TOTAL</span>
              <span className="text-blue-700">S/. {Number(venta.total).toFixed(2)}</span>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-8 pt-4 border-t border-gray-200 text-center text-xs text-gray-400">
          <p>¡Gracias por su compra en KreaLab!</p>
          <p>Impresiones 3D de calidad · www.krealab.com.pe</p>
        </div>
      </div>
    </div>
  )
}
