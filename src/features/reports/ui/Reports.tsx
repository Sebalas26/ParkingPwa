import React, { useState } from 'react';
import * as XLSX from 'xlsx';
import { FileSpreadsheet, Calendar, TrendingUp, Filter } from 'lucide-react';
import './Reports.css';

// Consolidado mock data
const consolidatedData = {
  diario: { periodo: 'Hoy (24 Oct 2025)', vehiculos: 64, ingresos: 4280000 },
  semanal: { periodo: 'Esta Semana', vehiculos: 450, ingresos: 30500000 },
  mensual: { periodo: 'Este Mes (Octubre)', vehiculos: 1850, ingresos: 125000000 }
};

// Generamos una base de datos falsa más grande para probar los filtros
const allMockData = [
  // HOY (Dia)
  { Fecha: '24/10/2025 14:30', Placa: 'TX-998A', Tipo_Vehiculo: 'Auto', Duracion: '0h 0m', Convenio: 'Sin Convenio', Ingreso_COP: 0, Forma_Pago: '--', Usuario: 'System Auto' },
  { Fecha: '24/10/2025 14:28', Placa: 'CA-442B', Tipo_Vehiculo: 'Moto', Duracion: '1h 15m', Convenio: 'Gimnasio Fit', Ingreso_COP: 6000, Forma_Pago: 'Efectivo', Usuario: 'Vance.M' },
  { Fecha: '24/10/2025 14:15', Placa: 'FL-8820', Tipo_Vehiculo: 'Auto', Duracion: '3h 45m', Convenio: 'Sin Convenio', Ingreso_COP: 15000, Forma_Pago: 'Tarjeta', Usuario: 'Jenkins.T' },
  
  // OTRA FECHA EN LA SEMANA
  { Fecha: '22/10/2025 10:00', Placa: 'CO-7711', Tipo_Vehiculo: 'Camioneta', Duracion: '2h 10m', Convenio: 'Supermercado X', Ingreso_COP: 8000, Forma_Pago: 'Transferencia', Usuario: 'Vance.M' },
  { Fecha: '20/10/2025 09:15', Placa: 'TX-1002', Tipo_Vehiculo: 'Auto', Duracion: '0h 45m', Convenio: 'Sin Convenio', Ingreso_COP: 4000, Forma_Pago: 'Efectivo', Usuario: 'System Auto' },
  
  // OTRO MES (SEPTIEMBRE)
  { Fecha: '15/09/2025 13:22', Placa: 'CA-9092', Tipo_Vehiculo: 'Camioneta', Duracion: '4h 05m', Convenio: 'Hotel Plaza', Ingreso_COP: 18000, Forma_Pago: 'Tarjeta', Usuario: 'Jenkins.T' },
  { Fecha: '02/09/2025 16:02', Placa: 'TX-7761', Tipo_Vehiculo: 'Moto', Duracion: '1h 50m', Convenio: 'Sin Convenio', Ingreso_COP: 8000, Forma_Pago: 'Efectivo', Usuario: 'Vance.M' },
  
  // OTRO AÑO (2024)
  { Fecha: '10/12/2024 11:22', Placa: 'ZZ-9092', Tipo_Vehiculo: 'Auto', Duracion: '5h 00m', Convenio: 'Sin Convenio', Ingreso_COP: 25000, Forma_Pago: 'Tarjeta', Usuario: 'Admin' },
  { Fecha: '05/01/2024 08:02', Placa: 'AA-7761', Tipo_Vehiculo: 'Moto', Duracion: '2h 50m', Convenio: 'Gimnasio Fit', Ingreso_COP: 12000, Forma_Pago: 'Transferencia', Usuario: 'Admin' },
];

export const Reports: React.FC = () => {
  const [isExporting, setIsExporting] = useState(false);
  
  // Estados para los filtros UI
  const [filterPeriod, setFilterPeriod] = useState('dia'); // dia, semana, mes, año, personalizado
  const [selectedMonth, setSelectedMonth] = useState('10'); // Octubre por defecto
  const [selectedYear, setSelectedYear] = useState('2025'); // 2025 por defecto
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  // Estado para la tabla filtrada real
  const [appliedData, setAppliedData] = useState(allMockData.filter(d => d.Fecha.includes('24/10/2025'))); // Inicia mostrando solo hoy

  // Función para aplicar los filtros a la tabla
  const handleApplyFilters = () => {
    let filtered = [...allMockData];
    
    if (filterPeriod === 'dia') {
      filtered = allMockData.filter(d => d.Fecha.includes('24/10/2025')); // Mock para "Hoy"
    } 
    else if (filterPeriod === 'semana') {
      // Mock para la semana actual (Octubre)
      filtered = allMockData.filter(d => d.Fecha.includes('/10/2025')); 
    } 
    else if (filterPeriod === 'mes') {
      // Filtrar por mes y año seleccionado
      const monthStr = selectedMonth.padStart(2, '0');
      filtered = allMockData.filter(d => d.Fecha.includes(`/${monthStr}/${selectedYear}`));
    }
    else if (filterPeriod === 'año') {
      // Filtrar solo por año
      filtered = allMockData.filter(d => d.Fecha.includes(`/${selectedYear} `));
    }
    else if (filterPeriod === 'personalizado') {
      // Si usáramos fechas reales, haríamos parse de dateFrom y dateTo.
      // Como es un mock, mostraremos toda la base si seleccionan fechas, o algo representativo.
      if (dateFrom && dateTo) {
        filtered = allMockData; // Mostrar todo como si abarcaran todo el rango
      } else {
        alert("Por favor selecciona ambas fechas");
        return;
      }
    }
    
    setAppliedData(filtered);
  };

  const handleExportExcel = () => {
    setIsExporting(true);
    
    setTimeout(() => {
      const wb = XLSX.utils.book_new();
      
      // Hoja 1: Resumen Consolidado
      const resumenList = [
        { Periodo: 'Diario', Descripción: consolidatedData.diario.periodo, Vehiculos: consolidatedData.diario.vehiculos, Ingresos_COP: consolidatedData.diario.ingresos },
        { Periodo: 'Semanal', Descripción: consolidatedData.semanal.periodo, Vehiculos: consolidatedData.semanal.vehiculos, Ingresos_COP: consolidatedData.semanal.ingresos },
        { Periodo: 'Mensual', Descripción: consolidatedData.mensual.periodo, Vehiculos: consolidatedData.mensual.vehiculos, Ingresos_COP: consolidatedData.mensual.ingresos },
      ];
      const wsResumen = XLSX.utils.json_to_sheet(resumenList);
      wsResumen['!cols'] = [{ wch: 15 }, { wch: 25 }, { wch: 15 }, { wch: 20 }];
      XLSX.utils.book_append_sheet(wb, wsResumen, "Resumen_Consolidado");

      // Hoja 2: Ingresos por Convenio
      const conveniosMap: { [key: string]: { Vehiculos: number, Ingresos_COP: number } } = {};
      appliedData.forEach(d => {
        if (!conveniosMap[d.Convenio]) {
          conveniosMap[d.Convenio] = { Vehiculos: 0, Ingresos_COP: 0 };
        }
        conveniosMap[d.Convenio].Vehiculos += 1;
        conveniosMap[d.Convenio].Ingresos_COP += d.Ingreso_COP;
      });
      const conveniosList = Object.keys(conveniosMap).map(c => ({
        Convenio: c,
        Vehiculos: conveniosMap[c].Vehiculos,
        Ingresos_COP: conveniosMap[c].Ingresos_COP
      }));
      const wsConvenios = XLSX.utils.json_to_sheet(conveniosList);
      wsConvenios['!cols'] = [{ wch: 25 }, { wch: 15 }, { wch: 20 }];
      XLSX.utils.book_append_sheet(wb, wsConvenios, "Resumen_Convenios");

      // Hoja 3: Detalle (Filtros aplicados que ves en la tabla)
      const wsDetalle = XLSX.utils.json_to_sheet(appliedData);
      wsDetalle['!cols'] = [
        { wch: 18 }, // Fecha
        { wch: 12 }, // Placa
        { wch: 15 }, // Tipo_Vehiculo
        { wch: 15 }, // Duracion
        { wch: 20 }, // Convenio
        { wch: 15 }, // Ingreso_COP
        { wch: 15 }, // Forma_Pago
        { wch: 15 }  // Usuario
      ];
      XLSX.utils.book_append_sheet(wb, wsDetalle, `Detalle_${filterPeriod.toUpperCase()}`);
      
      XLSX.writeFile(wb, "Reporte_Contabilidad_ParkControl.xlsx");
      setIsExporting(false);
    }, 800);
  };

  const totalRevenue = appliedData.reduce((acc, curr) => acc + curr.Ingreso_COP, 0);

  return (
    <div className="reports-container">
      <div className="reports-header-card card-shadow">
        <div className="reports-info">
          <h2>Consolidados de Operación</h2>
          <p className="text-muted">Revisa las métricas de vehículos ingresados y recaudo. Exporta la información a Excel para contabilidad.</p>
        </div>
        <button
          className="btn-primary btn-export"
          onClick={handleExportExcel}
          disabled={isExporting}
        >
          {isExporting ? <RefreshCw size={18} className="spin" /> : <FileSpreadsheet size={18} />}
          {isExporting ? 'Generando...' : 'Exportar Consolidado Excel'}
        </button>
      </div>

      <div className="consolidated-grid">
        <div className="stat-box">
          <div className="stat-header">
            <span className="stat-title">DIARIO (HOY)</span>
            <Calendar size={16} className="text-muted" />
          </div>
          <div className="stat-value">{consolidatedData.diario.vehiculos} <span className="text-sm">vehículos</span></div>
          <div className="stat-desc font-bold text-primary">$ {consolidatedData.diario.ingresos.toLocaleString()} COP</div>
        </div>

        <div className="stat-box">
          <div className="stat-header">
            <span className="stat-title">SEMANAL</span>
            <Calendar size={16} className="text-muted" />
          </div>
          <div className="stat-value">{consolidatedData.semanal.vehiculos} <span className="text-sm">vehículos</span></div>
          <div className="stat-desc font-bold text-primary">$ {consolidatedData.semanal.ingresos.toLocaleString()} COP</div>
        </div>

        <div className="stat-box">
          <div className="stat-header">
            <span className="stat-title">MENSUAL</span>
            <Calendar size={16} className="text-muted" />
          </div>
          <div className="stat-value">{consolidatedData.mensual.vehiculos} <span className="text-sm">vehículos</span></div>
          <div className="stat-desc font-bold text-primary">$ {consolidatedData.mensual.ingresos.toLocaleString()} COP</div>
        </div>
      </div>

      <div className="reports-preview card-shadow">
        <div className="preview-header-section">
          <div className="preview-header-top">
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <h3>Detalle de Operaciones</h3>
              <TrendingUp size={18} className="text-muted" />
            </div>
            <span className="badge badge-success">
              Total Generado en Tabla: $ {totalRevenue.toLocaleString()} COP
            </span>
          </div>

          <div className="reports-filters">
            <div className="filter-group">
              <label>Fecha a consultar</label>
              <div className="pill-group">
                <button className={`filter-pill ${filterPeriod === 'dia' ? 'active' : ''}`} onClick={() => setFilterPeriod('dia')}>Día</button>
                <button className={`filter-pill ${filterPeriod === 'semana' ? 'active' : ''}`} onClick={() => setFilterPeriod('semana')}>Semana</button>
                <button className={`filter-pill ${filterPeriod === 'mes' ? 'active' : ''}`} onClick={() => setFilterPeriod('mes')}>Mes</button>
                <button className={`filter-pill ${filterPeriod === 'año' ? 'active' : ''}`} onClick={() => setFilterPeriod('año')}>Año</button>
                <button className={`filter-pill ${filterPeriod === 'personalizado' ? 'active' : ''}`} onClick={() => setFilterPeriod('personalizado')}>Desde - Hasta</button>
              </div>
            </div>

            {/* Opciones Adicionales para MES */}
            {filterPeriod === 'mes' && (
              <>
                <div className="filter-group custom-selects">
                  <label>Mes</label>
                  <select className="input-field" value={selectedMonth} onChange={e => setSelectedMonth(e.target.value)}>
                    <option value="1">Enero</option>
                    <option value="2">Febrero</option>
                    <option value="3">Marzo</option>
                    <option value="4">Abril</option>
                    <option value="5">Mayo</option>
                    <option value="6">Junio</option>
                    <option value="7">Julio</option>
                    <option value="8">Agosto</option>
                    <option value="9">Septiembre</option>
                    <option value="10">Octubre</option>
                    <option value="11">Noviembre</option>
                    <option value="12">Diciembre</option>
                  </select>
                </div>
                <div className="filter-group custom-selects">
                  <label>Año</label>
                  <select className="input-field" value={selectedYear} onChange={e => setSelectedYear(e.target.value)}>
                    <option value="2024">2024</option>
                    <option value="2025">2025</option>
                  </select>
                </div>
              </>
            )}

            {/* Opciones Adicionales para AÑO */}
            {filterPeriod === 'año' && (
              <div className="filter-group custom-selects">
                <label>Año</label>
                <select className="input-field" value={selectedYear} onChange={e => setSelectedYear(e.target.value)}>
                  <option value="2024">2024</option>
                  <option value="2025">2025</option>
                </select>
              </div>
            )}

            {/* Opciones Adicionales para PERSONALIZADO */}
            {filterPeriod === 'personalizado' && (
              <div className="filter-group custom-dates">
                <div>
                  <label>Desde</label>
                  <input type="date" className="input-field" value={dateFrom} onChange={e => setDateFrom(e.target.value)} />
                </div>
                <div>
                  <label>Hasta</label>
                  <input type="date" className="input-field" value={dateTo} onChange={e => setDateTo(e.target.value)} />
                </div>
              </div>
            )}

            <div className="filter-group" style={{ marginLeft: 'auto', alignSelf: 'flex-end' }}>
              <button className="btn-outline" onClick={handleApplyFilters}>
                <Filter size={16} /> Aplicar Filtros
              </button>
            </div>
          </div>
        </div>

        <table className="data-table">
          <thead>
            <tr>
              <th>FECHA</th>
              <th>PLACA</th>
              <th>TIPO</th>
              <th>TIEMPO QUE DURÓ</th>
              <th>CONVENIO</th>
              <th>PAGO</th>
              <th>USUARIO</th>
              <th className="text-right">INGRESO</th>
            </tr>
          </thead>
          <tbody>
            {appliedData.length > 0 ? (
              appliedData.map((row, idx) => (
                <tr key={idx}>
                  <td className="text-muted font-bold">{row.Fecha}</td>
                  <td className="font-bold">{row.Placa}</td>
                  <td>{row.Tipo_Vehiculo}</td>
                  <td>{row.Duracion}</td>
                  <td>
                    <span className={`badge ${row.Convenio === 'Sin Convenio' ? 'badge-warning' : 'badge-success'}`} style={{ fontWeight: 500 }}>
                      {row.Convenio}
                    </span>
                  </td>
                  <td>{row.Forma_Pago}</td>
                  <td className="text-muted">{row.Usuario}</td>
                  <td className="text-right font-bold text-primary">
                    {row.Ingreso_COP > 0 ? `$ ${row.Ingreso_COP.toLocaleString()} COP` : '--'}
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={6} style={{ textAlign: 'center', padding: '32px', color: 'var(--text-secondary)' }}>
                  No se encontraron registros para los filtros seleccionados.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

// Simple Refresh Icon for loading state
const RefreshCw = ({ size = 24, className = "" }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <polyline points="23 4 23 10 17 10"></polyline>
    <polyline points="1 20 1 14 7 14"></polyline>
    <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"></path>
  </svg>
);
