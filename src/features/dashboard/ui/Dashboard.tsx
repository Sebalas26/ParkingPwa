import React, { useEffect, useState } from 'react';
import { dashboardService } from '../data/dashboardService';
import type { DailySummaryDto, OccupancyStatsDto, RecentTicketDto } from '../model/DashboardContracts';
import { formatTime, calculateDuration } from '../../../shared/utils/dateUtils';
import { useParqueaderoContext } from '../../../shared/context/ParqueaderoContext';
import { ModalPortal } from '../../../shared/ui/ModalPortal';
import { cajaService } from '../../caja/data/cajaService';
import type { WorkShiftDto } from '../../caja/model/CajaContracts';
import { usuariosService } from '../../settings/data/usuariosService';
import type { UserDto } from '../../settings/model/UsuariosContracts';
import { mediosPagoService } from '../../settings/data/mediosPagoService';
import type { PaymentMethodDto } from '../../settings/model/MediosPagoContracts';
import { resolucionesService } from '../../settings/data/resolucionesService';
import type { BillingResolutionDto } from '../../settings/model/ResolucionesContracts';
import { vehiculosConfigService } from '../../settings/data/vehiculosConfigService';
import type { VehiculoConfigDto } from '../../settings/model/VehiculosConfigContracts';
import { branchesService } from '../../settings/data/branchesService';
import {
  Car,
  Bike,
  Truck,
  DollarSign,
  Activity,
  RefreshCw,
  Clock,
  ParkingCircle,
  TrendingUp,
  ShieldCheck,
  Eye,
  CreditCard,
  Wallet,
  QrCode,
  Building,
  Tag,
  Receipt,
  PieChart as PieIcon,
  Calendar,
  User
} from 'lucide-react';
import './Dashboard.css';

// Componente SVG Donut Chart interactivo
const SvgDonutChart: React.FC<{
  data: { label: string; value: number; color: string }[];
  centerLabel?: string;
  centerSublabel?: string;
  size?: number;
}> = ({ data, centerLabel, centerSublabel, size = 180 }) => {
  const total = data.reduce((acc, item) => acc + item.value, 0);
  const r = 38;
  const c = 2 * Math.PI * r; // ~238.76
  let cumulativeOffset = 0;

  return (
    <div style={{ position: 'relative', width: size, height: size, margin: '0 auto' }}>
      <svg width={size} height={size} viewBox="0 0 100 100" style={{ transform: 'rotate(-90deg)' }}>
        {total === 0 ? (
          <circle
            cx="50"
            cy="50"
            r={r}
            fill="none"
            stroke="rgba(100, 116, 139, 0.2)"
            strokeWidth="14"
            strokeDasharray="6 4"
          />
        ) : (
          data.map((item, i) => {
            const pct = item.value / total;
            const strokeLength = pct * c;
            const strokeOffset = -cumulativeOffset;
            cumulativeOffset += strokeLength;

            return (
              <circle
                key={i}
                cx="50"
                cy="50"
                r={r}
                fill="none"
                stroke={item.color}
                strokeWidth="14"
                strokeDasharray={`${strokeLength} ${c - strokeLength}`}
                strokeDashoffset={strokeOffset}
                style={{ transition: 'all 0.6s ease' }}
              />
            );
          })
        )}
      </svg>
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          pointerEvents: 'none',
          textAlign: 'center',
          padding: '0 10px',
        }}
      >
        <span style={{ fontWeight: 800, fontSize: total === 0 ? '1.05rem' : '0.98rem', color: 'var(--text-primary)', lineHeight: 1.1 }}>
          {centerLabel || (total === 0 ? '$0' : '')}
        </span>
        <span style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', fontWeight: 600, marginTop: '2px' }}>
          {centerSublabel || (total === 0 ? 'Sin recaudos' : 'Total')}
        </span>
      </div>
    </div>
  );
};

export const Dashboard: React.FC = () => {
  const { parqueaderosList, selectedParqueaderoId, setSelectedParqueaderoId } = useParqueaderoContext();
  const [summary, setSummary] = useState<DailySummaryDto | null>(null);
  const [occupancy, setOccupancy] = useState<OccupancyStatsDto | null>(null);
  const [activeTickets, setActiveTickets] = useState<RecentTicketDto[]>([]);
  const [realShifts, setRealShifts] = useState<WorkShiftDto[]>([]);
  const [realUsers, setRealUsers] = useState<UserDto[]>([]);
  const [mediosPagoList, setMediosPagoList] = useState<PaymentMethodDto[]>([]);
  const [resolutionsList, setResolutionsList] = useState<BillingResolutionDto[]>([]);
  const [vehicleTypesList, setVehicleTypesList] = useState<VehiculoConfigDto[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<string>('');
  const [selectedTicket, setSelectedTicket] = useState<RecentTicketDto | null>(null);

  // Filtros de la barra Slicers
  const [periodFilter, setPeriodFilter] = useState<'hoy' | 'ayer' | 'mes'>('hoy');
  const [selectedOperatorId, setSelectedOperatorId] = useState<string | null>(null);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [sum, occ, tickets, shifts, users, resolutions, vehicleTypes] = await Promise.all([
        dashboardService.getDailySummary(),
        dashboardService.getOccupancyStats(),
        dashboardService.getActiveTickets(),
        cajaService.getHistory(),
        usuariosService.getUsers(),
        resolucionesService.getAllResolutions(),
        vehiculosConfigService.getConfigs(selectedParqueaderoId),
      ]);

      // Cargar medios de pago específicos de la sede o globales
      let paymentMethods: PaymentMethodDto[] = [];
      if (selectedParqueaderoId) {
        try {
          const branchPm = await branchesService.getBranchPaymentMethods(selectedParqueaderoId);
          if (branchPm && branchPm.length > 0) {
            paymentMethods = branchPm.map((bpm) => ({
              id: bpm.paymentMethodId,
              name: bpm.paymentMethod?.name || bpm.name || 'Medio de Pago',
              code: bpm.paymentMethod?.name || 'CUSTOM',
              icon: bpm.paymentMethod?.icon || bpm.icon || '💳',
              requiresReference: false,
              isActive: bpm.isEnabled ?? true,
            }));
          }
        } catch {
          // Fallback a métodos globales
        }
      }
      if (!paymentMethods || paymentMethods.length === 0) {
        paymentMethods = await mediosPagoService.getPaymentMethods();
      }

      setSummary(sum);
      setOccupancy(occ);
      setActiveTickets(tickets || []);
      setRealShifts(shifts || []);
      setRealUsers(users || []);
      setMediosPagoList(paymentMethods || []);
      setResolutionsList(resolutions || []);
      setVehicleTypesList(vehicleTypes || []);
      setLastUpdated(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
    } catch (err) {
      console.error('Error al cargar datos del dashboard:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 20000);
    return () => clearInterval(interval);
  }, [selectedParqueaderoId]);

  // Métricas reales provenientes estrictamente de la BD y la API
  const totalCapacity = occupancy?.totalCapacity || (parqueaderosList.length > 0 ? parqueaderosList.length * 120 : 100);
  const occupiedSpots = occupancy?.occupiedSpots ?? activeTickets.length ?? 0;
  const availableSpots = occupancy?.availableSpots ?? Math.max(0, totalCapacity - occupiedSpots);
  const occupancyRate = occupancy?.occupancyRate ?? (totalCapacity > 0 ? Math.round((occupiedSpots * 1000) / totalCapacity) / 10 : 0);

  const activeVehiclesCount = summary?.activeVehiclesCount ?? activeTickets.length;
  const completedCount = summary?.completedTransactionsToday ?? 0;

  // Filtrado de turnos de caja por sede y período
  const filteredShifts = (realShifts || []).filter((s) => {
    const shiftTime = s.startTimeUtc || s.openedAtUtc || s.createdAtUtc;
    if (!shiftTime) return true;
    const shiftDate = new Date(shiftTime);
    const now = new Date();
    if (periodFilter === 'hoy') {
      return shiftDate.toDateString() === now.toDateString();
    } else if (periodFilter === 'ayer') {
      const yesterday = new Date();
      yesterday.setDate(now.getDate() - 1);
      return shiftDate.toDateString() === yesterday.toDateString();
    } else if (periodFilter === 'mes') {
      return shiftDate.getMonth() === now.getMonth() && shiftDate.getFullYear() === now.getFullYear();
    }
    return true;
  });

  const shiftsCash = filteredShifts.reduce((acc, s) => acc + (s.totalCashCollected || s.initialCashAmount || 0), 0);
  const shiftsCard = filteredShifts.reduce((acc, s) => acc + (s.totalCardCollected || 0), 0);
  const shiftsTransfer = filteredShifts.reduce((acc, s) => acc + (s.totalTransferCollected || 0), 0);
  const shiftsTotalRevenue = filteredShifts.reduce((acc, s) => acc + (s.totalCollected || ((s.totalCashCollected || 0) + (s.totalCardCollected || 0) + (s.totalTransferCollected || 0))), 0);

  // Venta del Día y N° Autos (Strict API/DB Data con respaldo de turnos de caja)
  const totalRevenueToday = (summary?.totalRevenueToday || summary?.totalRevenue || 0) || shiftsTotalRevenue;
  const totalVehiclesEnteredToday = summary?.totalTickets || (activeVehiclesCount + completedCount);

  // Ticket Promedio
  const averageTicketAmount = summary?.averageTicketAmount || (completedCount > 0 ? Math.round(totalRevenueToday / completedCount) : (totalVehiclesEnteredToday > 0 ? Math.round(totalRevenueToday / totalVehiclesEnteredToday) : 0));

  // Convenios (Cantidad y Dinero)
  const conveniosCount = summary?.conveniosCount || 0;
  const conveniosRevenue = summary?.conveniosRevenue || 0;

  const activeMediosPago = (mediosPagoList || []).filter(
    (pm) => pm.isActive !== false && (pm.status === undefined || pm.status === true || pm.status === 'Activo' || pm.status === 'Active')
  );

  // Medios de Pago Dinámicos de la BD y la API
  const paymentBreakdown = summary?.revenueByPaymentMethod || {};
  const cashAmount = (paymentBreakdown['Cash'] ?? paymentBreakdown['0'] ?? paymentBreakdown['Efectivo']) || shiftsCash || (totalRevenueToday > 0 && activeMediosPago.length === 1 ? totalRevenueToday : 0);
  const cardAmount = (paymentBreakdown['CreditCard'] || 0) + (paymentBreakdown['DebitCard'] || 0) + (paymentBreakdown['1'] || 0) + (paymentBreakdown['2'] || 0) || shiftsCard;
  const transferAmount = paymentBreakdown['Transfer'] || paymentBreakdown['3'] || shiftsTransfer || 0;

  const PAYMENT_COLORS = ['#10b981', '#3b82f6', '#8b5cf6', '#f59e0b', '#ec4899', '#06b6d4', '#14b8a6', '#6366f1'];

  const renderPaymentIcon = (iconName?: string, name?: string) => {
    const icon = iconName || name || '💳';
    const hasEmoji = /\p{Extended_Pictographic}/u.test(icon);
    if (hasEmoji) {
      return <span style={{ fontSize: '1.05rem', lineHeight: 1 }}>{icon}</span>;
    }
    switch (icon.toLowerCase()) {
      case 'efectivo':
      case 'cash':
      case 'banknote':
        return <Wallet size={15} style={{ color: '#10b981' }} />;
      case 'tarjeta':
      case 'tarjeta debito':
      case 'tarjeta credito':
      case 'creditcard':
      case 'debitcard':
        return <CreditCard size={15} style={{ color: '#3b82f6' }} />;
      default:
        return <QrCode size={15} style={{ color: '#8b5cf6' }} />;
    }
  };

  // Generación de datos reales para Gráfica de Torta 1: Métodos de Pago
  const paymentDonutData = activeMediosPago.map((pm, index) => {
    let val = 0;
    const nameLower = (pm.name || '').toLowerCase();

    if (paymentBreakdown[pm.name] !== undefined) {
      val = Number(paymentBreakdown[pm.name]);
    } else if (paymentBreakdown[String(pm.id)] !== undefined) {
      val = Number(paymentBreakdown[String(pm.id)]);
    } else if (nameLower.includes('efectivo') || nameLower === 'cash') {
      val = cashAmount;
    } else if (nameLower.includes('tarjeta') || nameLower.includes('card') || nameLower.includes('debito') || nameLower.includes('credito')) {
      val = cardAmount;
    } else if (nameLower.includes('transfer') || nameLower.includes('nequi') || nameLower.includes('daviplata') || nameLower.includes('pse') || nameLower.includes('bancolombia')) {
      val = transferAmount;
    }

    if (val === 0 && activeMediosPago.length === 1 && totalRevenueToday > 0) {
      val = totalRevenueToday;
    }

    return {
      label: pm.name,
      icon: pm.icon,
      value: val,
      color: PAYMENT_COLORS[index % PAYMENT_COLORS.length],
    };
  });

  // Datos para Gráfica de Torta 2: Resoluciones de Facturación Dinámicas de la BD
  const RESOLUTION_COLORS = ['#07665e', '#3b82f6', '#8b5cf6', '#f59e0b', '#ec4899', '#10b981', '#06b6d4', '#6366f1'];
  const activeResolutions = (resolutionsList || []).filter((r) => r.isActive !== false);
  const resolutionBreakdown = summary?.countByResolution || {};

  const resolutionsDonutData = activeResolutions.map((res, index) => {
    let docCount = 0;
    const name = res.name || 'Resolución';
    const prefix = res.prefix || '';

    if (resolutionBreakdown[name] !== undefined) {
      docCount = Number(resolutionBreakdown[name]);
    } else if (resolutionBreakdown[String(res.resolutionId)] !== undefined) {
      docCount = Number(resolutionBreakdown[String(res.resolutionId)]);
    } else if (prefix && resolutionBreakdown[prefix] !== undefined) {
      docCount = Number(resolutionBreakdown[prefix]);
    }

    return {
      label: `${name}${prefix ? ` (${prefix})` : ''}`,
      value: docCount,
      color: RESOLUTION_COLORS[index % RESOLUTION_COLORS.length],
    };
  });

  const totalDocumentsIssued = resolutionsDonutData.reduce((acc, curr) => acc + curr.value, 0);

  // Tipos de vehículos activos en la BD
  const activeVehicleTypes = (vehicleTypesList || []).filter((v) => v.isActive !== false);

  const normalizeType = (t: string | number | undefined): string => {
    const str = String(t ?? '').toLowerCase().trim();
    if (str === '0' || str === 'car' || str === 'auto' || str === 'automovil' || str === 'automóvil') return '0';
    if (str === '1' || str === 'motorcycle' || str === 'moto' || str === 'motocicleta') return '1';
    if (str === '2' || str === 'truck' || str === 'camion' || str === 'camión' || str === 'pesado') return '2';
    if (str === '3' || str === 'van' || str === 'furgon' || str === 'furgón') return '3';
    if (str === '4' || str === 'bicycle' || str === 'bici' || str === 'bicicleta') return '4';
    if (str === '5' || str === 'suv' || str === 'camioneta') return '5';
    return str;
  };

  const findMatchingConfig = (type: string | number | undefined): VehiculoConfigDto | undefined => {
    const norm = normalizeType(type);
    return activeVehicleTypes.find((v) => {
      const vNorm = normalizeType(v.vehicleType);
      if (vNorm === norm) return true;
      const catLower = (v.category || '').toLowerCase();
      if (catLower.includes('moto') && norm === '1') return true;
      if ((catLower.includes('camion') || catLower.includes('pesado')) && norm === '2') return true;
      if ((catLower.includes('furgon') || catLower.includes('van')) && norm === '3') return true;
      if ((catLower.includes('bici') || catLower.includes('cicla')) && norm === '4') return true;
      if ((catLower.includes('suv') || catLower.includes('camioneta')) && norm === '5') return true;
      if ((catLower.includes('auto') || catLower.includes('car')) && norm === '0') return true;
      return false;
    });
  };

  const getVehicleTypeLabel = (type: string | number | undefined) => {
    const match = findMatchingConfig(type);
    if (match && match.category) return match.category;

    const norm = normalizeType(type);
    switch (norm) {
      case '1': return 'Motocicleta';
      case '2': return 'Vehículo Pesado / Camión';
      case '3': return 'Furgón / Van';
      case '4': return 'Bicicleta';
      case '5': return 'Camioneta / SUV';
      case '0': return 'Automóvil / Sedán';
      default: return String(type || 'Automóvil / Sedán');
    }
  };

  const getVehicleIconMeta = (type: string | number | undefined, categoryName?: string) => {
    const match = findMatchingConfig(type);
    const label = (categoryName || match?.category || getVehicleTypeLabel(type)).toLowerCase();
    const iconKey = (match?.iconKey || '').toLowerCase();

    if (iconKey.includes('moto') || iconKey.includes('bike') || label.includes('moto') || label.includes('bici') || label.includes('cicla')) {
      return { Icon: Bike, color: '#3b82f6' };
    }
    if (iconKey.includes('truck') || iconKey.includes('van') || label.includes('camion') || label.includes('camión') || label.includes('pesado') || label.includes('furgon') || label.includes('van')) {
      return { Icon: Truck, color: '#8b5cf6' };
    }
    if (label.includes('suv') || label.includes('camioneta')) {
      return { Icon: Truck, color: '#f59e0b' };
    }
    return { Icon: Car, color: '#10b981' };
  };

  const renderVehicleIcon = (type: string | number | undefined, size = 16) => {
    const { Icon, color } = getVehicleIconMeta(type);
    return <Icon size={size} style={{ color }} />;
  };

  // Conteo dinámico de vehículos activos por cada tipo configurado en la BD
  const activeDistribution = activeVehicleTypes.map((vType) => {
    const count = activeTickets.filter((t) => {
      const match = findMatchingConfig(t.vehicleType);
      if (match) {
        return match.rateId === vType.rateId || normalizeType(match.vehicleType) === normalizeType(vType.vehicleType);
      }
      return normalizeType(t.vehicleType) === normalizeType(vType.vehicleType);
    }).length;

    const { Icon, color } = getVehicleIconMeta(vType.vehicleType, vType.category);

    return {
      rateId: vType.rateId || String(vType.vehicleType),
      category: vType.category,
      vehicleType: vType.vehicleType,
      count,
      Icon,
      color,
    };
  });

  const recentActiveTickets = activeTickets.slice(0, 7);

  return (
    <div className="dashboard-container">
      {/* Hero Header */}
      <div className="dashboard-hero-header">
        <div className="dashboard-hero-title">
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <h1>Dashboard General</h1>
            <span className="dashboard-status-badge">
              <span className="status-dot-pulse" />
              EN LÍNEA
            </span>
          </div>
          <p style={{ margin: 0, fontSize: '0.92rem', color: '#ffffff', fontWeight: 700 }}>
            Monitoreo en tiempo real de ventas, recaudación por medios de pago, convenios aplicados y facturación electrónica.
          </p>
        </div>

        <div className="dashboard-hero-actions">
          <button className="btn-glass" onClick={loadData} disabled={isLoading}>
            <RefreshCw size={15} className={isLoading ? 'spin' : ''} />
            <span>{lastUpdated ? `Actualizado ${lastUpdated}` : 'Actualizar'}</span>
          </button>
        </div>
      </div>

      {/* Slicers / Filtros Rápidos Estilo Excel */}
      <div className="slicers-bar-container">
        <div className="slicers-group">
          <span className="slicer-label">
            <Building size={14} /> Punto / Parqueadero:
          </span>
          <div className="slicers-pills-row">
            <button
              className={`slicer-pill ${selectedParqueaderoId === null ? 'active' : ''}`}
              onClick={() => setSelectedParqueaderoId(null)}
            >
              🌐 Todos los Puntos
            </button>
            {parqueaderosList.map((p) => (
              <button
                key={p.id}
                className={`slicer-pill ${selectedParqueaderoId === p.id ? 'active' : ''}`}
                onClick={() => setSelectedParqueaderoId(p.id)}
              >
                📍 {p.name}
              </button>
            ))}
          </div>
        </div>

        <div className="slicers-group">
          <span className="slicer-label">
            <Calendar size={14} /> Período:
          </span>
          <div className="slicers-pills-row">
            <button
              className={`slicer-pill ${periodFilter === 'hoy' ? 'active' : ''}`}
              onClick={() => setPeriodFilter('hoy')}
            >
              Hoy
            </button>
            <button
              className={`slicer-pill ${periodFilter === 'ayer' ? 'active' : ''}`}
              onClick={() => setPeriodFilter('ayer')}
            >
              Ayer
            </button>
            <button
              className={`slicer-pill ${periodFilter === 'mes' ? 'active' : ''}`}
              onClick={() => setPeriodFilter('mes')}
            >
              Este Mes
            </button>
          </div>
        </div>
      </div>

      {/* 4 Tarjetas KPI Principales Solicadas */}
      <div className="dashboard-kpi-grid">
        {/* Card 1: VENTA DEL DÍA */}
        <div className="kpi-card green">
          <div className="kpi-header">
            <span className="kpi-title">VENTA DEL DÍA</span>
            <div className="kpi-icon-wrapper green">
              <DollarSign size={20} />
            </div>
          </div>
          <div className="kpi-value-row">
            <span className="kpi-value">$ {totalRevenueToday.toLocaleString()}</span>
          </div>
          <div className="kpi-subtext">
            <TrendingUp size={13} style={{ color: '#10b981' }} />
            <span>Recaudación bruta total registrada</span>
          </div>
        </div>

        {/* Card 2: N° DE AUTOS */}
        <div className="kpi-card blue">
          <div className="kpi-header">
            <span className="kpi-title">N° DE AUTOS (INGRESOS)</span>
            <div className="kpi-icon-wrapper blue">
              <Car size={20} />
            </div>
          </div>
          <div className="kpi-value-row">
            <span className="kpi-value">{totalVehiclesEnteredToday.toLocaleString()}</span>
            <span className="pulse-badge">
              <span className="dot" /> {activeVehiclesCount} En Sitio
            </span>
          </div>
          <div className="kpi-subtext">
            <ShieldCheck size={13} />
            <span>{completedCount} vehículos ya liquidados hoy</span>
          </div>
        </div>

        {/* Card 3: TICKET PROMEDIO */}
        <div className="kpi-card purple">
          <div className="kpi-header">
            <span className="kpi-title">TICKET PROMEDIO</span>
            <div className="kpi-icon-wrapper purple">
              <Clock size={20} />
            </div>
          </div>
          <div className="kpi-value-row">
            <span className="kpi-value">$ {averageTicketAmount.toLocaleString()}</span>
            <span style={{ fontSize: '0.8rem', fontWeight: 600, color: '#8b5cf6' }}>/ Veh</span>
          </div>
          <div className="kpi-subtext">
            <Activity size={13} />
            <span>Valor medio cobrado por tiquete</span>
          </div>
        </div>

        {/* Card 4: CONVENIOS (CANTIDAD Y MONTO) */}
        <div className="kpi-card indigo">
          <div className="kpi-header">
            <span className="kpi-title">CONVENIOS APLICADOS</span>
            <div className="kpi-icon-wrapper indigo">
              <Tag size={20} />
            </div>
          </div>
          <div className="kpi-value-row">
            <span className="kpi-value">{conveniosCount.toLocaleString()}</span>
            <span style={{ fontSize: '0.78rem', color: '#6366f1', fontWeight: 700 }}>Convenios</span>
          </div>
          <div className="kpi-subtext" style={{ gap: '6px' }}>
            <DollarSign size={13} style={{ color: '#6366f1' }} />
            <span>Monto sumado: <strong>$ {conveniosRevenue.toLocaleString()}</strong></span>
          </div>
        </div>
      </div>

      {/* Sección Gráficas de Torta Solicitadas */}
      <div className="pie-charts-grid">
        {/* Gráfica de Torta 1: Métodos de Pago */}
        <div className="pie-card-container">
          <div className="pie-card-header">
            <h3>
              <PieIcon size={18} style={{ color: '#10b981' }} />
              Distribución por Métodos de Pago
            </h3>
            <span className="badge badge-success" style={{ fontSize: '0.75rem' }}>Recaudación hoy</span>
          </div>

          <div className="pie-chart-body">
            {paymentDonutData.length > 0 ? (
              <>
                <SvgDonutChart
                  data={paymentDonutData}
                  centerLabel={totalRevenueToday >= 1000000 ? `$ ${(totalRevenueToday / 1000000).toFixed(1)}M` : `$ ${totalRevenueToday.toLocaleString()}`}
                  centerSublabel="Total Recaudado"
                  size={170}
                />

                <div className="pie-legend-list">
                  {paymentDonutData.map((item, index) => {
                    const pct = totalRevenueToday > 0 ? Math.round((item.value / totalRevenueToday) * 100) : 0;
                    return (
                      <div key={index} className="pie-legend-item">
                        <div className="pie-legend-left">
                          {renderPaymentIcon(item.icon, item.label)}
                          <span className="pie-legend-label">{item.label}</span>
                        </div>
                        <div style={{ textAlign: 'right' }}>
                          <span className="pie-legend-val">$ {item.value.toLocaleString()}</span>
                          <small style={{ display: 'block', fontSize: '0.72rem', color: 'var(--text-secondary)', fontWeight: 600 }}>
                            {pct}% del total
                          </small>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </>
            ) : (
              <div style={{ width: '100%', textAlign: 'center', padding: '24px 16px', color: '#64748b' }}>
                <CreditCard size={28} style={{ color: '#94a3b8', margin: '0 auto 8px auto', display: 'block' }} />
                <p style={{ fontWeight: 600, fontSize: '0.88rem', margin: '0 0 4px 0', color: '#334155' }}>
                  Sin medios de pago registrados
                </p>
                <span style={{ fontSize: '0.78rem', color: '#64748b' }}>
                  Crea los medios de pago en <strong>Configuración &gt; Medios de Pago</strong> para visualizar su recaudación aquí.
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Gráfica de Torta 2: Resoluciones de Facturación Dinámicas */}
        <div className="pie-card-container">
          <div className="pie-card-header">
            <h3>
              <Receipt size={18} style={{ color: '#07665e' }} />
              Distribución por Resoluciones de Facturación
            </h3>
            <span className="badge badge-success" style={{ background: 'rgba(7, 102, 94, 0.1)', color: '#07665e', fontSize: '0.75rem' }}>
              Documentación
            </span>
          </div>

          <div className="pie-chart-body">
            {resolutionsDonutData.length > 0 ? (
              <>
                <SvgDonutChart
                  data={resolutionsDonutData}
                  centerLabel={`${totalDocumentsIssued > 0 ? totalDocumentsIssued : totalVehiclesEnteredToday}`}
                  centerSublabel="Total Emitidos"
                  size={170}
                />

                <div className="pie-legend-list">
                  {resolutionsDonutData.map((item, index) => {
                    const pct = totalDocumentsIssued > 0 ? Math.round((item.value / totalDocumentsIssued) * 100) : 0;
                    return (
                      <div key={index} className="pie-legend-item">
                        <div className="pie-legend-left">
                          <div className="pie-legend-dot" style={{ background: item.color }} />
                          <span className="pie-legend-label">{item.label}</span>
                        </div>
                        <div style={{ textAlign: 'right' }}>
                          <span className="pie-legend-val">{item.value.toLocaleString()} doc(s)</span>
                          <small style={{ display: 'block', fontSize: '0.72rem', color: 'var(--text-secondary)', fontWeight: 600 }}>
                            {pct}% de emisión
                          </small>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </>
            ) : (
              <div style={{ width: '100%', textAlign: 'center', padding: '24px 16px', color: '#64748b' }}>
                <Receipt size={28} style={{ color: '#94a3b8', margin: '0 auto 8px auto', display: 'block' }} />
                <p style={{ fontWeight: 600, fontSize: '0.88rem', margin: '0 0 4px 0', color: '#334155' }}>
                  Sin resoluciones registradas
                </p>
                <span style={{ fontSize: '0.78rem', color: '#64748b' }}>
                  Configura las resoluciones en <strong>Configuración &gt; Resoluciones</strong> para visualizar su emisión aquí.
                </span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Sección 1: Consolidado General de Todos los Parqueaderos */}
      <div style={{ marginBottom: '24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
          <h2 style={{ fontSize: '1.1rem', fontWeight: 700, margin: 0, display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-primary)' }}>
            <Building size={20} style={{ color: 'var(--primary-color)' }} />
            Consolidado General de Todos los Parqueaderos
          </h2>
          <span style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
            {parqueaderosList.length} punto(s) de operación registrados
          </span>
        </div>

        <div className="consolidated-summary-card">
          <div className="consolidated-summary-grid">
            <div style={{ background: 'var(--bg-secondary, #f8fafc)', padding: '12px 16px', borderRadius: '10px', border: '1px solid var(--border-color, #e2e8f0)' }}>
              <span style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 600, display: 'block' }}>OCUPACIÓN GLOBAL</span>
              <strong style={{ fontSize: '1.15rem', color: 'var(--text-primary)' }}>{occupiedSpots} / {totalCapacity}</strong>
              <small style={{ display: 'block', fontSize: '0.75rem', color: '#10b981', fontWeight: 600 }}>{occupancyRate}% capacidad ocupada</small>
            </div>

            <div style={{ background: 'var(--bg-secondary, #f8fafc)', padding: '12px 16px', borderRadius: '10px', border: '1px solid var(--border-color, #e2e8f0)' }}>
              <span style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 600, display: 'block' }}>VENTA TOTAL GLOBAL</span>
              <strong style={{ fontSize: '1.15rem', color: '#07665e' }}>$ {totalRevenueToday.toLocaleString()}</strong>
              <small style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Recaudados hoy</small>
            </div>

            <div style={{ background: 'var(--bg-secondary, #f8fafc)', padding: '12px 16px', borderRadius: '10px', border: '1px solid var(--border-color, #e2e8f0)' }}>
              <span style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 600, display: 'block' }}>INGRESOS TOTALES</span>
              <strong style={{ fontSize: '1.15rem', color: '#3b82f6' }}>{totalVehiclesEnteredToday.toLocaleString()}</strong>
              <small style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Vehículos procesados hoy</small>
            </div>

            <div style={{ background: 'var(--bg-secondary, #f8fafc)', padding: '12px 16px', borderRadius: '10px', border: '1px solid var(--border-color, #e2e8f0)' }}>
              <span style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 600, display: 'block' }}>OPERADORES REGISTRADOS</span>
              <strong style={{ fontSize: '1.15rem', color: '#8b5cf6' }}>
                {realUsers.filter(u => u.roleId !== 1 && String(u.userRole?.roleName || u.roleName || '').toLowerCase() !== 'administrador').length} Operador(es)
              </strong>
              <small style={{ display: 'block', fontSize: '0.75rem', color: '#10b981', fontWeight: 600 }}>Excluye perfil Admin</small>
            </div>
          </div>
        </div>
      </div>

      {/* Sección 2: Resumen y Filtro de Cajas por Usuario Operador (Estrictamente de la BD y API) */}
      {(() => {
        const nonAdminUsers = realUsers.filter((u) => {
          const rId = u.roleId ?? u.userRole?.idUserRol;
          const rName = String(u.userRole?.roleName || u.roleName || u.role || '').toLowerCase();
          return rId !== 1 && rName !== 'administrador' && rName !== 'admin';
        });

        const realOperatorShifts = nonAdminUsers.length > 0
          ? nonAdminUsers.map((u) => {
            const uId = u.id ?? u.idUser;
            const uName = u.fullName || u.name || u.username || `Operador ${uId}`;
            const shift = realShifts.find((s) => s.userId === uId || (s.operatorName && s.operatorName.toLowerCase().includes((u.username || u.name || '').toLowerCase())));

            const isOpen = shift && (shift.status === 'Open' || shift.status === 1 || String(shift.status).toLowerCase() === 'open');
            const cashCol = shift?.totalCashCollected || 0;
            const cardCol = (shift?.totalCardCollected || 0) + (shift?.totalTransferCollected || 0);
            const totalCol = shift?.totalCollected || (cashCol + cardCol);
            const ticketsProc = shift?.totalTicketsProcessed || 0;

            return {
              id: String(uId),
              operatorName: uName,
              role: u.userRole?.roleName || u.roleName || 'Operador / Cajero',
              parqueaderoName: 'Punto de Operación',
              status: isOpen ? 'Abierta' : 'Cerrada',
              startTime: shift?.startTimeUtc || shift?.openedAtUtc ? formatTime(shift.startTimeUtc || shift.openedAtUtc!) : 'Sin turno activo',
              endTime: shift?.endTimeUtc || shift?.closedAtUtc ? formatTime(shift.endTimeUtc || shift.closedAtUtc!) : undefined,
              baseAmount: shift?.baseAmount || shift?.initialCashAmount || 0,
              cashCollected: cashCol,
              digitalCollected: cardCol,
              totalCollected: totalCol,
              ticketsProcessed: ticketsProc,
            };
          })
          : realShifts
            .filter((s) => !String(s.operatorName || '').toLowerCase().includes('admin'))
            .map((s, idx) => ({
              id: s.shiftId || String(idx + 1),
              operatorName: s.operatorName || `Operador ${idx + 1}`,
              role: 'Operador / Cajero',
              parqueaderoName: 'Punto de Operación',
              status: (s.status === 'Open' || s.status === 1 || String(s.status).toLowerCase() === 'open') ? 'Abierta' : 'Cerrada',
              startTime: s.startTimeUtc || s.openedAtUtc ? formatTime(s.startTimeUtc || s.openedAtUtc!) : 'Sin turno activo',
              endTime: s.endTimeUtc || s.closedAtUtc ? formatTime(s.endTimeUtc || s.closedAtUtc!) : undefined,
              baseAmount: s.baseAmount || s.initialCashAmount || 0,
              cashCollected: s.totalCashCollected || 0,
              digitalCollected: (s.totalCardCollected || 0) + (s.totalTransferCollected || 0),
              totalCollected: s.totalCollected || ((s.totalCashCollected || 0) + (s.totalCardCollected || 0) + (s.totalTransferCollected || 0)),
              ticketsProcessed: s.totalTicketsProcessed || 0,
            }));

        const filteredShifts = selectedOperatorId
          ? realOperatorShifts.filter((op) => op.id === selectedOperatorId)
          : realOperatorShifts;

        return (
          <div style={{ marginBottom: '24px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '10px', marginBottom: '14px' }}>
              <h2 style={{ fontSize: '1.1rem', fontWeight: 700, margin: 0, display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-primary)' }}>
                <Wallet size={20} style={{ color: 'var(--primary-color)' }} />
                Cajas por Usuario
              </h2>

              {/* Slicers de Filtro por Operador */}
              {realOperatorShifts.length > 0 && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                  <span style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-secondary)' }}>Filtro Operador:</span>
                  <button
                    className={`slicer-pill ${selectedOperatorId === null ? 'active' : ''}`}
                    onClick={() => setSelectedOperatorId(null)}
                    style={{ fontSize: '0.75rem', padding: '4px 10px' }}
                  >
                    🌐 Todos los Operadores ({realOperatorShifts.length})
                  </button>
                  {realOperatorShifts.map((op) => (
                    <button
                      key={op.id}
                      className={`slicer-pill ${selectedOperatorId === op.id ? 'active' : ''}`}
                      onClick={() => setSelectedOperatorId(op.id)}
                      style={{ fontSize: '0.75rem', padding: '4px 10px' }}
                    >
                      👤 {op.operatorName.split(' ')[0]}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {filteredShifts.length === 0 ? (
              <div style={{ background: 'var(--bg-card, #ffffff)', padding: '24px', borderRadius: '12px', textAlign: 'center', border: '1px dashed var(--border-color, #cbd5e1)', color: 'var(--text-secondary)' }}>
                <User size={32} style={{ color: '#94a3b8', marginBottom: '8px' }} />
                <p style={{ margin: 0, fontSize: '0.9rem', fontWeight: 600 }}>No hay turnos ni cajas abiertas registradas para operadores en la base de datos hoy.</p>
                <small style={{ fontSize: '0.78rem', color: '#64748b' }}>Los turnos de caja se sincronizan automáticamente al abrir o cerrar caja desde el módulo correspondiente.</small>
              </div>
            ) : (
              <div className="operator-shifts-grid">
                {filteredShifts.map((caja) => (
                  <div
                    key={caja.id}
                    style={{
                      background: 'var(--bg-card, #ffffff)',
                      border: caja.status === 'Abierta' ? '2px solid var(--primary-color, #07665e)' : '1px solid var(--border-color, #e2e8f0)',
                      borderRadius: '14px',
                      padding: '18px',
                      boxShadow: '0 4px 12px rgba(0,0,0,0.04)',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '14px',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <div
                          style={{
                            width: '40px',
                            height: '40px',
                            borderRadius: '10px',
                            background: caja.status === 'Abierta' ? 'rgba(7, 102, 94, 0.1)' : 'rgba(100, 116, 139, 0.1)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: caja.status === 'Abierta' ? '#07665e' : '#64748b',
                          }}
                        >
                          <User size={20} />
                        </div>
                        <div>
                          <h4 style={{ margin: 0, fontSize: '0.98rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                            {caja.operatorName}
                          </h4>
                          <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontWeight: 600 }}>
                            👤 {caja.role} • 🕒 {caja.startTime} {caja.endTime ? `- ${caja.endTime}` : ''}
                          </span>
                        </div>
                      </div>

                      <span
                        className="badge"
                        style={{
                          background: caja.status === 'Abierta' ? 'rgba(16, 185, 129, 0.12)' : 'rgba(100, 116, 139, 0.12)',
                          color: caja.status === 'Abierta' ? '#10b981' : '#64748b',
                          fontSize: '0.75rem',
                          fontWeight: 700,
                        }}
                      >
                        {caja.status === 'Abierta' ? '🟢 Caja Abierta' : '⚪ Caja Cerrada'}
                      </span>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', background: 'var(--bg-secondary, #f8fafc)', padding: '12px', borderRadius: '10px', border: '1px solid var(--border-color, #e2e8f0)' }}>
                      <div>
                        <span style={{ fontSize: '0.72rem', color: '#64748b', fontWeight: 600, display: 'block' }}>BASE INICIAL</span>
                        <strong style={{ fontSize: '0.95rem', color: 'var(--text-primary)' }}>$ {caja.baseAmount.toLocaleString()}</strong>
                      </div>
                      <div>
                        <span style={{ fontSize: '0.72rem', color: '#64748b', fontWeight: 600, display: 'block' }}>RECAUDO EFECTIVO</span>
                        <strong style={{ fontSize: '0.95rem', color: '#10b981' }}>$ {caja.cashCollected.toLocaleString()}</strong>
                      </div>
                      <div>
                        <span style={{ fontSize: '0.72rem', color: '#64748b', fontWeight: 600, display: 'block' }}>RECAUDO DIGITAL</span>
                        <strong style={{ fontSize: '0.95rem', color: '#3b82f6' }}>$ {caja.digitalCollected.toLocaleString()}</strong>
                      </div>
                      <div>
                        <span style={{ fontSize: '0.72rem', color: '#64748b', fontWeight: 600, display: 'block' }}>TIQUETES ATENDIDOS</span>
                        <strong style={{ fontSize: '0.95rem', color: 'var(--primary-color)' }}>{caja.ticketsProcessed.toLocaleString()} vehs</strong>
                      </div>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '4px', borderTop: '1px dashed var(--border-color, #cbd5e1)' }}>
                      <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)' }}>Total Generado en Turno</span>
                      <span style={{ fontSize: '1.05rem', fontWeight: 800, color: '#07665e' }}>
                        $ {caja.totalCollected.toLocaleString()}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        );
      })()}

      {/* Grid Principal: Ocupación vs Stream Vehicular */}
      <div className="dashboard-main-grid">
        {/* Columna Izquierda: Ocupación + Medios de Pago Desglosados */}
        <div className="dashboard-card">
          <div className="dashboard-card-header">
            <div>
              <h3>
                <ParkingCircle size={18} style={{ color: 'var(--primary-color)' }} />
                Ocupación y Capacidad de Instalaciones
              </h3>
              <p>Estado en tiempo real de parqueo general y distribución por tipo de vehículo.</p>
            </div>
          </div>

          {/* Medidor visual */}
          <div className="occupancy-meter-container">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontWeight: 700, fontSize: '0.95rem' }}>Nivel de Ocupación General</span>
              <span style={{ fontWeight: 800, fontSize: '1.1rem', color: occupancyRate > 85 ? '#ef4444' : '#10b981' }}>
                {occupancyRate}%
              </span>
            </div>

            <div className="occupancy-bar-wrapper">
              <div
                className="occupancy-bar-fill"
                style={{
                  width: `${Math.min(occupancyRate, 100)}%`,
                  background:
                    occupancyRate > 85
                      ? 'linear-gradient(90deg, #f59e0b, #ef4444)'
                      : 'linear-gradient(90deg, #10b981, #3b82f6)',
                }}
              />
            </div>

            <div className="occupancy-stats-pills">
              <div className="occ-pill">
                <span className="occ-pill-label">Capacidad Total</span>
                <span className="occ-pill-value">{totalCapacity} Plazas</span>
              </div>
              <div className="occ-pill">
                <span className="occ-pill-label">Ocupadas</span>
                <span className="occ-pill-value" style={{ color: '#3b82f6' }}>{occupiedSpots}</span>
              </div>
              <div className="occ-pill">
                <span className="occ-pill-label">Disponibles</span>
                <span className="occ-pill-value" style={{ color: '#10b981' }}>{availableSpots}</span>
              </div>
            </div>
          </div>

          {/* Desglose de Medios de Pago del Día */}
          <div>
            <h4 style={{ margin: '0 0 10px 0', fontSize: '0.88rem', fontWeight: 700, color: 'var(--text-secondary)' }}>
              MEDIOS DE PAGO UTILIZADOS HOY
            </h4>
            {paymentDonutData.length > 0 ? (
              <div className="revenue-breakdown-list">
                {paymentDonutData.map((item, index) => {
                  const pct = totalRevenueToday > 0 ? Math.round((item.value * 100) / totalRevenueToday) : 0;
                  return (
                    <div key={index} className="revenue-item">
                      <div className="revenue-item-header">
                        <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          {renderPaymentIcon(item.icon, item.label)}
                          {item.label}
                        </span>
                        <span style={{ fontWeight: 700 }}>$ {item.value.toLocaleString()} ({pct}%)</span>
                      </div>
                      <div className="revenue-item-bar">
                        <div
                          className="revenue-item-fill"
                          style={{
                            width: `${Math.min(pct, 100)}%`,
                            background: item.color,
                          }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div style={{ padding: '14px', background: '#f8fafc', borderRadius: '8px', fontSize: '0.82rem', color: '#64748b', textAlign: 'center' }}>
                No hay medios de pago registrados en el sistema.
              </div>
            )}
          </div>

          {/* Distribución por Categoría de Vehículo */}
          <div style={{ marginTop: '0.5rem' }}>
            <h4 style={{ margin: '0 0 10px 0', fontSize: '0.88rem', fontWeight: 700, color: 'var(--text-secondary)' }}>
              DISTRIBUCIÓN DE VEHÍCULOS ACTIVOS EN SITIO
            </h4>
            {activeDistribution.length > 0 ? (
              <div className="category-breakdown-grid">
                {activeDistribution.map((item) => (
                  <div key={item.rateId} className="category-mini-card">
                    <div className="category-mini-header">
                      <span title={item.category} style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {item.category}
                      </span>
                      <item.Icon size={14} style={{ color: item.color, flexShrink: 0 }} />
                    </div>
                    <div className="category-mini-count">{item.count}</div>
                  </div>
                ))}
              </div>
            ) : (
              <div style={{ padding: '14px', background: '#f8fafc', borderRadius: '8px', fontSize: '0.82rem', color: '#64748b', textAlign: 'center' }}>
                No hay tipos de vehículos configurados para esta compañía.
              </div>
            )}
          </div>
        </div>

        {/* Columna Derecha: Stream de Vehículos Activos */}
        <div className="dashboard-card">
          <div className="dashboard-card-header">
            <div>
              <h3>
                <Activity size={18} style={{ color: '#3b82f6' }} />
                Resumen de Vehículos Activos ({activeTickets.length})
              </h3>
              <p>Últimos vehículos ingresados en parqueadero.</p>
            </div>
          </div>

          {/* Tabla Stream */}
          <div className="stream-table-wrapper">
            <table className="active-stream-table">
              <thead>
                <tr>
                  <th>PLACA / TIQUETE</th>
                  <th>CATEGORÍA</th>
                  <th>INGRESO</th>
                  <th>ESTANCIA</th>
                  <th style={{ textAlign: 'right' }}>VER</th>
                </tr>
              </thead>
              <tbody>
                {recentActiveTickets.length > 0 ? (
                  recentActiveTickets.map((t) => (
                    <tr key={t.ticketId}>
                      <td>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                          <span className="plate-badge-styled">{t.plateNumber}</span>
                          <small style={{ fontSize: '0.72rem', color: 'var(--text-secondary)' }}>{t.ticketNumber}</small>
                        </div>
                      </td>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.82rem' }}>
                          {renderVehicleIcon(t.vehicleType, 14)}
                          <span>{getVehicleTypeLabel(t.vehicleType)}</span>
                        </div>
                      </td>
                      <td style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
                        {formatTime(t.entryTimeUtc || (t as any).entryTime || (t as any).createdAtUtc)}
                      </td>
                      <td>
                        <span style={{ fontWeight: 700, fontSize: '0.85rem' }}>
                          {calculateDuration(t.entryTimeUtc || (t as any).entryTime || (t as any).createdAtUtc)}
                        </span>
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        <button
                          onClick={() => setSelectedTicket(t)}
                          style={{
                            background: 'transparent',
                            border: '1px solid var(--border-color)',
                            borderRadius: '6px',
                            padding: '4px 8px',
                            color: 'var(--primary-color)',
                            cursor: 'pointer',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px',
                            fontSize: '0.75rem',
                          }}
                          title="Ver detalle de tiquete"
                        >
                          <Eye size={12} />
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={5} style={{ textAlign: 'center', padding: '28px', color: 'var(--text-secondary)' }}>
                      {isLoading ? (
                        <div className="loader-container">
                          <div className="spinner"></div>
                          <span>Cargando stream vehicular...</span>
                        </div>
                      ) : 'No hay vehículos activos que coincidan con la búsqueda.'}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Modal Vista Rápida de Tiquete */}
      {selectedTicket && (
        <ModalPortal>
          <div className="modal-overlay">
            <div className="modal-card" style={{ maxWidth: '420px' }}>
              <div className="modal-header">
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <span className="plate-badge-styled" style={{ fontSize: '1.2rem' }}>{selectedTicket.plateNumber}</span>
                  <span className="pulse-badge"><span className="dot" /> Activo</span>
                </div>
              </div>

              <div className="modal-body" style={{ gap: '1rem' }}>
                <div style={{ padding: '12px', background: 'var(--bg-body)', borderRadius: '10px', border: '1px solid var(--border-color)', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div>
                    <span style={{ fontSize: '0.72rem', textTransform: 'uppercase', color: 'var(--text-secondary)', fontWeight: 600 }}>Tiquete ID</span>
                    <p style={{ margin: '2px 0 0 0', fontWeight: 700, fontSize: '0.9rem' }}>{selectedTicket.ticketNumber}</p>
                  </div>
                  <div>
                    <span style={{ fontSize: '0.72rem', textTransform: 'uppercase', color: 'var(--text-secondary)', fontWeight: 600 }}>Categoría</span>
                    <p style={{ margin: '2px 0 0 0', fontWeight: 700, fontSize: '0.9rem' }}>{getVehicleTypeLabel(selectedTicket.vehicleType)}</p>
                  </div>
                  <div>
                    <span style={{ fontSize: '0.72rem', textTransform: 'uppercase', color: 'var(--text-secondary)', fontWeight: 600 }}>Hora de Ingreso</span>
                    <p style={{ margin: '2px 0 0 0', fontWeight: 600, fontSize: '0.88rem' }}>
                      {formatTime(selectedTicket.entryTimeUtc || (selectedTicket as any).entryTime || (selectedTicket as any).createdAtUtc)}
                    </p>
                  </div>
                  <div>
                    <span style={{ fontSize: '0.72rem', textTransform: 'uppercase', color: 'var(--text-secondary)', fontWeight: 600 }}>Tiempo Transcurrido</span>
                    <p style={{ margin: '2px 0 0 0', fontWeight: 800, fontSize: '0.95rem', color: 'var(--primary-color)' }}>
                      {calculateDuration(selectedTicket.entryTimeUtc || (selectedTicket as any).entryTime || (selectedTicket as any).createdAtUtc)}
                    </p>
                  </div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 14px', background: 'rgba(16, 185, 129, 0.08)', borderRadius: '8px', border: '1px solid rgba(16, 185, 129, 0.2)' }}>
                  <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)' }}>Tarifa Base Configurada</span>
                  <span style={{ fontSize: '1rem', fontWeight: 800, color: '#10b981' }}>
                    ${(selectedTicket.hourlyRate || 4000).toLocaleString()} /hr
                  </span>
                </div>
              </div>

              <div className="modal-footer">
                <button className="btn-cancel" onClick={() => setSelectedTicket(null)}>
                  Cerrar
                </button>
              </div>
            </div>
          </div>
        </ModalPortal>
      )}
    </div>
  );
};
