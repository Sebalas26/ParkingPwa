import React, { useState } from 'react';
import { ArrowLeft, Clock, CarFront, DollarSign, ShieldCheck, Search } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export const PlateQueryMockup: React.FC = () => {
  const navigate = useNavigate();
  const [isSimulating, setIsSimulating] = useState(false);
  const [showData, setShowData] = useState(true); // Inicialmente en true por requerimiento

  const handleSimulate = () => {
    setIsSimulating(true);
    setShowData(false);
    setTimeout(() => {
      setIsSimulating(false);
      setShowData(true);
    }, 1500);
  };

  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: '#f8fafc',
      display: 'flex',
      flexDirection: 'column',
      fontFamily: 'var(--font-family)',
      position: 'relative',
      maxWidth: '500px',
      margin: '0 auto',
      boxShadow: '0 0 20px rgba(0,0,0,0.05)',
    }}>
      {/* Botón flotante para simulación */}
      <button 
        onClick={handleSimulate}
        style={{
          position: 'absolute',
          top: '10px',
          right: '10px',
          zIndex: 50,
          display: 'flex',
          alignItems: 'center',
          gap: '5px',
          padding: '6px 10px',
          backgroundColor: '#0f172a',
          color: '#fff',
          borderRadius: '20px',
          fontSize: '0.75rem',
          fontWeight: '600',
          border: 'none',
          cursor: 'pointer',
          boxShadow: '0 2px 5px rgba(0,0,0,0.2)'
        }}
      >
        <Search size={14} />
        {isSimulating ? 'Consultando...' : 'Simular Placa'}
      </button>

      {/* Header */}
      <div style={{
        padding: '20px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        position: 'relative'
      }}>
        <button 
          onClick={() => navigate(-1)}
          style={{
            position: 'absolute',
            left: '20px',
            top: '25px',
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            padding: '5px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#0f172a'
          }}
        >
          <ArrowLeft size={24} />
        </button>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#07665e', marginTop: '5px' }}>
          <ShieldCheck size={28} style={{ color: '#10b981' }} />
          <h1 style={{ margin: 0, fontSize: '1.25rem', fontWeight: '800', letterSpacing: '-0.5px' }}>
            PARKING SEGURO
          </h1>
        </div>
        <p style={{ margin: '8px 0 0 0', fontSize: '0.75rem', fontWeight: '700', color: '#475569', letterSpacing: '0.5px' }}>
          DETALLES DEL ESTACIONAMIENTO
        </p>
      </div>

      {/* Contenido Principal */}
      <div style={{ padding: '0 20px 20px 20px', display: 'flex', flexDirection: 'column', gap: '15px' }}>
        
        {isSimulating ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '40px' }}>
             <div className="spinner"></div>
          </div>
        ) : showData ? (
          <>
            {/* Tarjeta 1: Tiempo */}
            <div style={{
              background: '#fff',
              borderRadius: '16px',
              padding: '20px',
              boxShadow: '0 4px 15px rgba(0,0,0,0.03)',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              position: 'relative',
              border: '1px solid #f1f5f9'
            }}>
              <div style={{ 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'space-between',
                width: '100%',
                marginBottom: '10px'
              }}>
                <span style={{ fontSize: '0.8rem', fontWeight: '700', color: '#334155' }}>TIEMPO TRANSCURRIDO</span>
                <Clock size={20} color="#0f172a" />
              </div>
              
              <div style={{ fontSize: '3rem', fontWeight: '800', color: '#0f172a', lineHeight: '1', margin: '10px 0', letterSpacing: '-1px' }}>
                02:15:48
              </div>
              
              <div style={{ display: 'flex', gap: '5px', fontSize: '0.85rem', color: '#64748b', fontWeight: '500' }}>
                <span>Horas</span>
                <span>|</span>
                <span>Minutos</span>
                <span>|</span>
                <span>Segundos</span>
              </div>
            </div>

            {/* Tarjeta 2: Placa */}
            <div style={{
              background: '#fff',
              borderRadius: '16px',
              padding: '20px',
              boxShadow: '0 4px 15px rgba(0,0,0,0.03)',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              position: 'relative',
              border: '1px solid #f1f5f9'
            }}>
              <div style={{ 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'space-between',
                width: '100%',
                marginBottom: '5px'
              }}>
                <span style={{ fontSize: '0.8rem', fontWeight: '700', color: '#334155' }}>PLACA DEL VEHÍCULO</span>
                <div style={{ 
                  border: '1px solid #94a3b8', 
                  borderRadius: '4px', 
                  padding: '2px 6px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <CarFront size={18} color="#0f172a" />
                </div>
              </div>
              
              <div style={{ fontSize: '2.8rem', fontWeight: '900', color: '#0f172a', lineHeight: '1', margin: '10px 0', letterSpacing: '-1px' }}>
                ABC-123
              </div>
              
              <div style={{ fontSize: '0.9rem', color: '#475569', fontWeight: '500' }}>
                Renault Sandero
              </div>
            </div>

            {/* Tarjeta 3: Valor */}
            <div style={{
              background: '#fff',
              borderRadius: '16px',
              padding: '20px',
              boxShadow: '0 4px 15px rgba(0,0,0,0.03)',
              display: 'flex',
              flexDirection: 'column',
              position: 'relative',
              border: '1px solid #f1f5f9'
            }}>
              <div style={{ 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'space-between',
                width: '100%',
                marginBottom: '5px'
              }}>
                <span style={{ fontSize: '0.8rem', fontWeight: '700', color: '#334155' }}>VALOR TOTAL A PAGAR</span>
                <DollarSign size={22} color="#10b981" />
              </div>
              
              <div style={{ fontSize: '2.5rem', fontWeight: '800', color: '#10b981', lineHeight: '1', margin: '15px 0', letterSpacing: '-1px' }}>
                $12.500 <span style={{ fontSize: '1.2rem', fontWeight: '700' }}>COL</span>
              </div>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '5px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem', color: '#475569' }}>
                  <span>Tarifa Base (1 Hr):</span>
                  <span style={{ fontWeight: '600', color: '#1e293b' }}>$4.500</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem', color: '#475569' }}>
                  <span>Tiempo Adicional:</span>
                  <span style={{ fontWeight: '600', color: '#1e293b' }}>$8.000</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem', color: '#475569', marginTop: '4px' }}>
                  <span>Ingreso:</span>
                  <span style={{ fontWeight: '500', color: '#1e293b' }}>26 Oct 2023, 10:15 AM</span>
                </div>
              </div>
            </div>
          </>
        ) : null}

      </div>
    </div>
  );
};
