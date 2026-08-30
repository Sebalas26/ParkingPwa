import React, { useState, useEffect } from 'react';
import { Car, Bike, Truck, Plus, CheckCircle, Search, Building, LogOut, Receipt } from 'lucide-react';
import { vehicleService } from '../data/vehicleService';
import { vehiculosConfigService } from '../../settings/data/vehiculosConfigService';
import { mediosPagoService } from '../../settings/data/mediosPagoService';
import type { VehiculoConfigDto } from '../../settings/model/VehiculosConfigContracts';
import type { PaymentMethodDto } from '../../settings/model/MediosPagoContracts';
import type { TicketDto } from '../model/VehicleContracts';
import { formatTime, calculateDuration } from '../../../shared/utils/dateUtils';
import { useParqueaderoContext } from '../../../shared/context/ParqueaderoContext';
import { authService } from '../../auth/data/authService';
import { ModalPortal } from '../../../shared/ui/ModalPortal';
import './Vehicles.css';

export const Vehicles: React.FC = () => {
  const { selectedParqueadero, selectedParqueaderoId } = useParqueaderoContext();
  const [vehicles, setVehicles] = useState<TicketDto[]>([]);
  const [vehicleTypesList, setVehicleTypesList] = useState<VehiculoConfigDto[]>([]);
  const [mediosPagoList, setMediosPagoList] = useState<PaymentMethodDto[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingVehicleTypes, setIsLoadingVehicleTypes] = useState(true);
  const [filterType, setFilterType] = useState('Todos');
  const [searchTerm, setSearchTerm] = useState('');

  // Modal Ingreso Rápido
  const [isCheckInModalOpen, setIsCheckInModalOpen] = useState(false);
  const [plateNumber, setPlateNumber] = useState('');
  const [vehicleType, setVehicleType] = useState<number>(0);
  const [phoneNumber, setPhoneNumber] = useState('');
  const [notes, setNotes] = useState('');

  // Modal Salida / Check-Out
  const [isCheckOutModalOpen, setIsCheckOutModalOpen] = useState(false);
  const [selectedVehicleForCheckOut, setSelectedVehicleForCheckOut] = useState<TicketDto | null>(null);
  const [paymentMethodId, setPaymentMethodId] = useState<number>(0);
  const [amountPaidInput, setAmountPaidInput] = useState<string>('');
  const [isSubmittingCheckOut, setIsSubmittingCheckOut] = useState(false);
  const [checkOutSuccessInfo, setCheckOutSuccessInfo] = useState<{ plate: string; total: number; change: number; ticketNumber: string } | null>(null);

  useEffect(() => {
    loadActiveVehicles();
    loadVehicleTypes();
    loadMediosPago();
  }, [selectedParqueaderoId]);

  const loadVehicleTypes = async () => {
    setIsLoadingVehicleTypes(true);
    try {
      const data = await vehiculosConfigService.getConfigs(selectedParqueaderoId);
      const active = (data || []).filter((t) => t.isActive ?? true);
      setVehicleTypesList(active);
      if (active.length > 0) {
        setVehicleType((prev) => {
          const exists = active.some((a) => Number(a.vehicleType) === Number(prev));
          return exists ? prev : (Number(active[0].vehicleType) || 0);
        });
      }
    } catch (err) {
      console.error('Error al cargar tipos de vehículos configurados:', err);
    } finally {
      setIsLoadingVehicleTypes(false);
    }
  };

  const handleOpenCheckIn = async () => {
    setPlateNumber('');
    setPhoneNumber('');
    setNotes('');
    setIsCheckInModalOpen(true);
    await loadVehicleTypes();
  };

  const loadMediosPago = async () => {
    try {
      const data = await mediosPagoService.getPaymentMethods();
      const active = (data || []).filter((m) => m.isActive ?? true);
      setMediosPagoList(active);
      if (active.length > 0) {
        setPaymentMethodId(active[0].id);
      }
    } catch (err) {
      console.error('Error al cargar medios de pago:', err);
    }
  };

  const loadActiveVehicles = async () => {
    setIsLoading(true);
    try {
      const data = await vehicleService.getActiveVehicles();
      setVehicles(data || []);
    } catch (err) {
      console.error('Error al cargar vehículos activos:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCheckIn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!plateNumber.trim()) return;

    try {
      await vehicleService.checkIn({
        plateNumber: plateNumber.trim().toUpperCase(),
        vehicleType: Number(vehicleType),
        phoneNumber: phoneNumber.trim() || undefined,
        notes: notes.trim() || undefined,
      });
      setPlateNumber('');
      setPhoneNumber('');
      setNotes('');
      setIsCheckInModalOpen(false);
      await loadActiveVehicles();
    } catch (err: any) {
      alert(err?.message || 'Error al registrar ingreso del vehículo.');
    }
  };

  const calculateCheckOutDetails = (ticket: TicketDto) => {
    const entry = new Date(ticket.entryTimeUtc || (ticket as any).entryTime || (ticket as any).createdAtUtc || new Date());
    const now = new Date();
    const totalMinutes = Math.max(0, Math.floor((now.getTime() - entry.getTime()) / 60000));
    const billableHours = Math.max(1, Math.ceil(totalMinutes / 60));
    const rate = ticket.hourlyRate || 3000;
    const totalAmount = billableHours * rate;
    return { entry, now, totalMinutes, billableHours, rate, totalAmount };
  };

  const handleOpenCheckOut = (ticket: TicketDto) => {
    setSelectedVehicleForCheckOut(ticket);
    const details = calculateCheckOutDetails(ticket);
    setAmountPaidInput(String(details.totalAmount));
    if (mediosPagoList.length > 0) {
      setPaymentMethodId(mediosPagoList[0].id);
    } else {
      setPaymentMethodId(0);
    }
    setIsCheckOutModalOpen(true);
  };

  const handleConfirmCheckOut = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedVehicleForCheckOut) return;

    const details = calculateCheckOutDetails(selectedVehicleForCheckOut);
    const amountPaid = parseFloat(amountPaidInput) || details.totalAmount;

    if (amountPaid < details.totalAmount) {
      alert(`El monto recibido ($${amountPaid.toLocaleString()}) no puede ser menor al total a cobrar ($${details.totalAmount.toLocaleString()}).`);
      return;
    }

    setIsSubmittingCheckOut(true);
    try {
      await vehicleService.checkOut({
        ticketId: selectedVehicleForCheckOut.ticketId,
        paymentMethod: Number(paymentMethodId),
        amountPaid: amountPaid,
        discountAmount: 0,
      });

      const changeGiven = Math.max(0, amountPaid - details.totalAmount);
      setCheckOutSuccessInfo({
        plate: selectedVehicleForCheckOut.plateNumber,
        ticketNumber: selectedVehicleForCheckOut.ticketNumber,
        total: details.totalAmount,
        change: changeGiven,
      });

      setIsCheckOutModalOpen(false);
      setSelectedVehicleForCheckOut(null);
      await loadActiveVehicles();
    } catch (err: any) {
      alert(err?.message || 'Error al procesar la salida del vehículo.');
    } finally {
      setIsSubmittingCheckOut(false);
    }
  };

  const getVehicleTypeName = (type: number | string) => {
    const found = vehicleTypesList.find((v) => String(v.vehicleType) === String(type));
    if (found && found.category) return found.category;
    switch (String(type)) {
      case '1':
      case 'Motorcycle':
        return 'Motocicleta';
      case '2':
      case 'Truck':
        return 'Camión';
      case '3':
      case 'Van':
        return 'Camioneta';
      case '4':
      case 'Bicycle':
        return 'Bicicleta';
      case '5':
      case 'Suv':
        return 'SUV';
      default:
        return 'Auto';
    }
  };

  const dynamicFilterCategories = [
    'Todos',
    ...Array.from(new Set(vehicleTypesList.map((v) => v.category).filter(Boolean))),
  ];
  const filterOptions = dynamicFilterCategories.length > 1
    ? dynamicFilterCategories
    : ['Todos', 'Auto', 'Camioneta', 'Motocicleta', 'Camión'];

  const displayedVehicles = vehicles.filter((v) => {
    const typeName = getVehicleTypeName(v.vehicleType);
    const matchType = filterType === 'Todos' || typeName === filterType;
    const matchSearch =
      v.plateNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      v.ticketNumber.toLowerCase().includes(searchTerm.toLowerCase());
    return matchType && matchSearch;
  });

  const checkOutDetails = selectedVehicleForCheckOut ? calculateCheckOutDetails(selectedVehicleForCheckOut) : null;
  const currentAmountPaid = parseFloat(amountPaidInput) || 0;
  const currentChange = checkOutDetails ? Math.max(0, currentAmountPaid - checkOutDetails.totalAmount) : 0;

  return (
    <div className="vehicles-container" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', height: '100%', overflowY: 'auto', paddingBottom: '2rem' }}>
      <div className="vehicles-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <h1>Vehículos Activos en Parqueadero</h1>
            <span className="badge badge-success" style={{ background: 'rgba(37, 99, 235, 0.12)', color: 'var(--primary-color)', fontSize: '0.82rem', padding: '4px 8px' }}>
              <Building size={12} style={{ marginRight: 4 }} />
              {selectedParqueadero ? selectedParqueadero.name : '🌐 Todos los Parqueaderos'}
            </span>
          </div>
          <p className="text-muted" style={{ margin: 0, fontSize: '0.9rem' }}>Consulta, control de estancia y liquidación de salida para los vehículos en el parqueadero.</p>
        </div>

        {authService.hasPermission('checkin.create') && (
          <button className="btn-primary" style={{ width: 'auto' }} onClick={handleOpenCheckIn}>
            <Plus size={16} /> Registrar Ingreso
          </button>
        )}
      </div>

      <div className="vehicles-toolbar">
        <div className="filters-group">
          <span className="filter-label">Tipo de Vehículo:</span>
          {filterOptions.map((type) => (
            <button
              key={type}
              className={`filter-pill ${filterType === type ? 'active' : ''}`}
              onClick={() => setFilterType(type)}
            >
              {type}
            </button>
          ))}
        </div>

        <div className="search-box" style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'var(--bg-card)', padding: '6px 12px', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
          <Search size={16} className="text-muted" />
          <input
            type="text"
            placeholder="Buscar por placa o tiquete..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{ border: 'none', background: 'transparent', outline: 'none', color: 'var(--text-primary)', fontSize: '0.85rem' }}
          />
        </div>
      </div>
        {/* Desktop Table View */}
      <div className="desktop-table-container">
        <div className="table-card">
          <table className="data-table">
            <thead>
              <tr>
                <th>TIQUETE</th>
                <th>PLACA</th>
                <th>TIPO DE VEHÍCULO</th>
                <th>HORA DE INGRESO</th>
                <th>TIEMPO EN SITIO</th>
                <th>TARIFA BASE</th>
                <th>ESTADO</th>
                <th className="text-right">ACCIONES</th>
              </tr>
            </thead>
            <tbody>
              {displayedVehicles.length > 0 ? (
                displayedVehicles.map((v) => {
                  const typeName = getVehicleTypeName(v.vehicleType);
                  return (
                    <tr key={v.ticketId}>
                      <td className="font-bold text-muted">{v.ticketNumber}</td>
                      <td className="font-bold text-primary" style={{ fontSize: '1rem' }}>{v.plateNumber}</td>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          {typeName.toLowerCase().includes('moto') ? (
                            <Bike size={16} />
                          ) : typeName.toLowerCase().includes('camion') || typeName.toLowerCase().includes('camión') || typeName.toLowerCase().includes('truck') ? (
                            <Truck size={16} />
                          ) : (
                            <Car size={16} />
                          )}
                          <span>{typeName}</span>
                        </div>
                      </td>
                      <td className="text-muted">
                        {formatTime(v.entryTimeUtc || (v as any).entryTime || (v as any).createdAtUtc || (v as any).entryDate)}
                      </td>
                      <td className="font-bold">
                        {calculateDuration(v.entryTimeUtc || (v as any).entryTime || (v as any).createdAtUtc || (v as any).entryDate)}
                      </td>
                      <td className="text-muted">${(v.hourlyRate || 0).toLocaleString()} /hr</td>
                      <td>
                        <span className="badge badge-success" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                          <CheckCircle size={12} /> Activo
                        </span>
                      </td>
                      <td className="text-right" style={{ whiteSpace: 'nowrap' }}>
                        <button
                          type="button"
                          className="btn-action primary"
                          style={{
                            background: '#ef4444',
                            color: '#ffffff',
                            border: 'none',
                            padding: '6px 12px',
                            borderRadius: '6px',
                            fontSize: '0.8rem',
                            fontWeight: 600,
                            cursor: 'pointer',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '6px',
                          }}
                          onClick={() => handleOpenCheckOut(v)}
                          title="Registrar salida y cobro del vehículo"
                        >
                          <LogOut size={14} /> Dar Salida
                        </button>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={8} className="text-center text-muted" style={{ padding: '24px' }}>
                    {isLoading ? (
                      <div className="loader-container">
                        <div className="spinner"></div>
                        <span>Cargando vehículos activos...</span>
                      </div>
                    ) : 'No hay vehículos activos que coincidan con la búsqueda.'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Mobile Card View */}
      <div className="mobile-card-list">
        {displayedVehicles.length > 0 ? (
          displayedVehicles.map((v) => {
            const typeName = getVehicleTypeName(v.vehicleType);
            return (
              <div key={v.ticketId} className="expandable-card">
                <div className="expandable-card-header" style={{ paddingBottom: '12px', borderBottom: '1px solid var(--border-color)', marginBottom: '12px' }}>
                  <div className="expandable-card-title">
                    <span style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--primary-color)' }}>{v.plateNumber}</span>
                    <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginLeft: '8px' }}>{v.ticketNumber}</span>
                  </div>
                  <span className="badge badge-success" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '0.75rem' }}>
                    <CheckCircle size={12} /> Activo
                  </span>
                </div>
                <div className="expandable-card-content" style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem' }}>
                    <span style={{ color: 'var(--text-secondary)' }}>Tipo:</span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 600 }}>
                      {typeName.toLowerCase().includes('moto') ? <Bike size={14} /> : typeName.toLowerCase().includes('camion') || typeName.toLowerCase().includes('camión') || typeName.toLowerCase().includes('truck') ? <Truck size={14} /> : <Car size={14} />}
                      {typeName}
                    </div>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem' }}>
                    <span style={{ color: 'var(--text-secondary)' }}>Ingreso:</span>
                    <span style={{ fontWeight: 600 }}>{formatTime(v.entryTimeUtc || (v as any).entryTime || (v as any).createdAtUtc || (v as any).entryDate)}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem' }}>
                    <span style={{ color: 'var(--text-secondary)' }}>Tiempo en Sitio:</span>
                    <span style={{ fontWeight: 600 }}>{calculateDuration(v.entryTimeUtc || (v as any).entryTime || (v as any).createdAtUtc || (v as any).entryDate)}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem' }}>
                    <span style={{ color: 'var(--text-secondary)' }}>Tarifa Base:</span>
                    <span style={{ fontWeight: 600 }}>${(v.hourlyRate || 0).toLocaleString()} /hr</span>
                  </div>
                  
                  <div style={{ marginTop: '8px', paddingTop: '12px', borderTop: '1px solid var(--border-color)', display: 'flex', justifyContent: 'flex-end' }}>
                    <button
                      type="button"
                      style={{
                        background: '#ef4444',
                        color: '#ffffff',
                        border: 'none',
                        padding: '10px 16px',
                        borderRadius: '8px',
                        fontSize: '0.9rem',
                        fontWeight: 700,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '8px',
                        width: '100%'
                      }}
                      onClick={() => handleOpenCheckOut(v)}
                    >
                      <LogOut size={16} /> Dar Salida
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        ) : (
          <div className="empty-state-message" style={{ textAlign: 'center', padding: '32px 16px', background: 'var(--bg-card)', borderRadius: '12px', border: '1px solid var(--border-color)', color: 'var(--text-secondary)' }}>
            {isLoading ? 'Cargando vehículos activos...' : 'No hay vehículos activos que coincidan con la búsqueda.'}
          </div>
        )}
      </div>

      {/* Modal Registrar Ingreso */}
      {isCheckInModalOpen && (
        <ModalPortal>
          <div className="modal-overlay">
            <div className="modal-card" style={{ maxWidth: '440px' }}>
              <div className="modal-header">
                <h3>Registrar Ingreso de Vehículo</h3>
              </div>
              <form onSubmit={handleCheckIn}>
                <div className="modal-body">
                  <div className="form-group">
                    <label>Placa del Vehículo</label>
                    <input
                      type="text"
                      className="input-field"
                      placeholder="Ej. ABC-123"
                      value={plateNumber}
                      onChange={(e) => setPlateNumber(e.target.value.toUpperCase())}
                      required
                      autoFocus
                    />
                  </div>

                  <div className="form-group">
                    <label>Tipo de Vehículo</label>
                    <select
                      className="input-field"
                      value={vehicleType}
                      onChange={(e) => setVehicleType(Number(e.target.value))}
                      required
                      disabled={isLoadingVehicleTypes || vehicleTypesList.length === 0}
                    >
                      {isLoadingVehicleTypes ? (
                        <option value="" disabled>
                          Cargando tipos de vehículos desde la base de datos...
                        </option>
                      ) : vehicleTypesList.length > 0 ? (
                        vehicleTypesList.map((vt) => (
                          <option key={vt.rateId || `${vt.vehicleType}-${vt.category}`} value={vt.vehicleType}>
                            {vt.category}
                          </option>
                        ))
                      ) : (
                        <option value="" disabled>
                          No hay tipos de vehículos registrados
                        </option>
                      )}
                    </select>
                  </div>

                  <div className="form-group">
                    <label>Teléfono Cliente (Opcional)</label>
                    <input
                      type="tel"
                      className="input-field"
                      placeholder="300 123 4567"
                      value={phoneNumber}
                      onChange={(e) => setPhoneNumber(e.target.value)}
                    />
                  </div>

                  <div className="form-group">
                    <label>Notas / Estado del Vehículo</label>
                    <input
                      type="text"
                      className="input-field"
                      placeholder="Ej. Rayón en puerta derecha"
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                    />
                  </div>
                </div>
                <div className="modal-footer">
                  <button type="button" className="btn-cancel" onClick={() => setIsCheckInModalOpen(false)}>
                    Cancelar
                  </button>
                  <button type="submit" className="btn-primary" style={{ width: 'auto' }}>
                    Generar Tiquete de Ingreso
                  </button>
                </div>
              </form>
            </div>
          </div>
        </ModalPortal>
      )}

      {/* Modal Registrar Salida / Check-Out */}
      {isCheckOutModalOpen && selectedVehicleForCheckOut && checkOutDetails && (
        <ModalPortal>
          <div className="modal-overlay">
            <div className="modal-card" style={{ maxWidth: '480px' }}>
              <div className="modal-header">
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <LogOut size={20} color="#10b981" />
                  <h3 style={{ margin: 0 }}>Registrar Salida de Vehículo</h3>
                </div>
              </div>

              <form onSubmit={handleConfirmCheckOut}>
                <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  {/* Tarjeta de identificación del vehículo */}
                  <div style={{
                    background: 'var(--bg-card, #ffffff)',
                    border: '1px solid var(--border-color, #e2e8f0)',
                    borderRadius: '10px',
                    padding: '14px 16px',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                  }}>
                    <div>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', textTransform: 'uppercase', fontWeight: 700 }}>PLACA VEHÍCULO</span>
                      <div style={{ fontSize: '1.4rem', fontWeight: 900, color: 'var(--primary-color)', letterSpacing: '1px' }}>
                        {selectedVehicleForCheckOut.plateNumber}
                      </div>
                      <span style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
                        {getVehicleTypeName(selectedVehicleForCheckOut.vehicleType)}
                      </span>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', textTransform: 'uppercase', fontWeight: 700 }}>TIQUETE</span>
                      <div style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                        {selectedVehicleForCheckOut.ticketNumber}
                      </div>
                      <span className="badge badge-success" style={{ fontSize: '0.75rem', padding: '2px 6px', marginTop: '4px', display: 'inline-block' }}>
                        En Sitio
                      </span>
                    </div>
                  </div>

                  {/* Resumen de tiempos y tarifas */}
                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(2, 1fr)',
                    gap: '10px',
                    background: 'rgba(0, 0, 0, 0.02)',
                    padding: '12px',
                    borderRadius: '8px',
                    border: '1px solid var(--border-color, #e2e8f0)',
                  }}>
                    <div>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Hora Entrada</span>
                      <p style={{ margin: '2px 0 0 0', fontWeight: 700, fontSize: '0.85rem' }}>
                        {formatTime(checkOutDetails.entry)}
                      </p>
                    </div>
                    <div>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Hora Salida (Actual)</span>
                      <p style={{ margin: '2px 0 0 0', fontWeight: 700, fontSize: '0.85rem' }}>
                        {formatTime(checkOutDetails.now)}
                      </p>
                    </div>
                    <div>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Tiempo Transcurrido</span>
                      <p style={{ margin: '2px 0 0 0', fontWeight: 700, fontSize: '0.85rem', color: 'var(--text-primary)' }}>
                        {calculateDuration(checkOutDetails.entry)} ({checkOutDetails.billableHours} hr{checkOutDetails.billableHours > 1 ? 's' : ''})
                      </p>
                    </div>
                    <div>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Tarifa por Hora</span>
                      <p style={{ margin: '2px 0 0 0', fontWeight: 700, fontSize: '0.85rem' }}>
                        ${checkOutDetails.rate.toLocaleString()} /hr
                      </p>
                    </div>
                  </div>

                  {/* Cuadro Destacado de Total a Cobrar */}
                  <div style={{
                    background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                    borderRadius: '10px',
                    padding: '16px',
                    color: '#ffffff',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                  }}>
                    <div>
                      <span style={{ fontSize: '0.8rem', opacity: 0.9, fontWeight: 600 }}>TOTAL A LIQUIDAR</span>
                      <div style={{ fontSize: '1.8rem', fontWeight: 900, lineHeight: 1.1 }}>
                        $ {checkOutDetails.totalAmount.toLocaleString()}
                      </div>
                    </div>
                    <Receipt size={32} style={{ opacity: 0.7 }} />
                  </div>

                  {/* Formulario de Pago */}
                  <div className="form-group">
                    <label>Medio de Pago *</label>
                    <select
                      className="input-field"
                      value={paymentMethodId}
                      onChange={(e) => setPaymentMethodId(Number(e.target.value))}
                      required
                    >
                      {mediosPagoList.length > 0 ? (
                        mediosPagoList.map((m) => (
                          <option key={m.id} value={m.id}>
                            {m.name}
                          </option>
                        ))
                      ) : (
                        <>
                          <option value={0}>Efectivo</option>
                          <option value={1}>Tarjeta Débito / Crédito</option>
                          <option value={2}>Transferencia / QR</option>
                          <option value={3}>Nequi / Daviplata</option>
                        </>
                      )}
                    </select>
                  </div>

                  <div className="form-group">
                    <label>Monto Recibido ($)</label>
                    <input
                      type="number"
                      className="input-field"
                      value={amountPaidInput}
                      onChange={(e) => setAmountPaidInput(e.target.value)}
                      min={checkOutDetails.totalAmount}
                      step="100"
                      required
                      placeholder="Ingrese valor recibido"
                    />
                  </div>

                  {/* Cálculo de Cambio / Vueltas */}
                  {currentChange > 0 && (
                    <div style={{
                      background: 'rgba(16, 185, 129, 0.1)',
                      border: '1px solid rgba(16, 185, 129, 0.3)',
                      borderRadius: '8px',
                      padding: '10px 14px',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                    }}>
                      <span style={{ fontSize: '0.85rem', fontWeight: 700, color: '#059669' }}>
                        Cambio / Vueltas a Entregar:
                      </span>
                      <span style={{ fontSize: '1.1rem', fontWeight: 900, color: '#059669' }}>
                        $ {currentChange.toLocaleString()}
                      </span>
                    </div>
                  )}
                </div>

                <div className="modal-footer">
                  <button type="button" className="btn-cancel" onClick={() => setIsCheckOutModalOpen(false)}>
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="btn-primary"
                    disabled={isSubmittingCheckOut}
                    style={{ width: 'auto', background: '#10b981', borderColor: '#10b981', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                  >
                    <CheckCircle size={16} />
                    {isSubmittingCheckOut ? 'Procesando Salida...' : 'Cobrar y Registrar Salida'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </ModalPortal>
      )}

      {/* Diálogo de Confirmación Exitosa de Salida */}
      {checkOutSuccessInfo && (
        <ModalPortal>
          <div className="modal-overlay">
            <div className="modal-card" style={{ maxWidth: '420px', textAlign: 'center', padding: '24px' }}>
              <div style={{ width: '56px', height: '56px', background: 'rgba(16, 185, 129, 0.12)', color: '#10b981', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px auto' }}>
                <CheckCircle size={32} />
              </div>
              <h3 style={{ margin: '0 0 8px 0', fontSize: '1.3rem' }}>¡Salida Registrada con Éxito!</h3>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', margin: '0 0 16px 0' }}>
                El vehículo con placa <strong style={{ color: 'var(--primary-color)' }}>{checkOutSuccessInfo.plate}</strong> ha completado su estancia y salida.
              </p>

              <div style={{ background: 'var(--table-header-bg, #f8fafc)', borderRadius: '8px', padding: '12px 16px', marginBottom: '20px', textAlign: 'left', border: '1px solid var(--border-color)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px', fontSize: '0.85rem' }}>
                  <span style={{ color: 'var(--text-secondary)' }}>Tiquete:</span>
                  <span style={{ fontWeight: 700 }}>{checkOutSuccessInfo.ticketNumber}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px', fontSize: '0.85rem' }}>
                  <span style={{ color: 'var(--text-secondary)' }}>Total Cobrado:</span>
                  <span style={{ fontWeight: 800, color: 'var(--primary-color)' }}>$ {checkOutSuccessInfo.total.toLocaleString()}</span>
                </div>
                {checkOutSuccessInfo.change > 0 && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem' }}>
                    <span style={{ color: 'var(--text-secondary)' }}>Cambio Entregado:</span>
                    <span style={{ fontWeight: 800, color: '#10b981' }}>$ {checkOutSuccessInfo.change.toLocaleString()}</span>
                  </div>
                )}
              </div>

              <button
                type="button"
                className="btn-primary"
                onClick={() => setCheckOutSuccessInfo(null)}
                style={{ width: '100%' }}
              >
                Aceptar y Continuar
              </button>
            </div>
          </div>
        </ModalPortal>
      )}
    </div>
  );
};
