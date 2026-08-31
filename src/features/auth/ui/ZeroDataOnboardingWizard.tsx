import React, { useState } from 'react';
import { Building2, Sparkles, ArrowRight } from 'lucide-react';
import { branchesService } from '../../settings/data/branchesService';
import { useBranchContext } from '../../../shared/context/ParqueaderoContext';
import type { CreateBranchDto } from '../../settings/model/BranchesContracts';
import './ZeroDataOnboardingWizard.css';

export const ZeroDataOnboardingWizard: React.FC = () => {
  const { refreshBranches, setActiveBranchId } = useBranchContext();
  const [formData, setFormData] = useState<{
    name: string;
    address: string;
    phone: string;
    city: string;
    totalCapacity: number | string;
    notes: string;
    logoBase64: string;
  }>({
    name: '',
    address: '',
    phone: '',
    city: '',
    totalCapacity: '',
    notes: '',
    logoBase64: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: name === 'totalCapacity' ? (value === '' ? '' : Number(value)) : value,
    }));
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      setErrorMessage('La imagen no puede exceder los 2MB.');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        setFormData(prev => ({ ...prev, logoBase64: reader.result as string }));
      }
    };
    reader.onerror = () => {
      setErrorMessage('Error al leer la imagen.');
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      setErrorMessage('El nombre de la sede es obligatorio.');
      return;
    }

    const capacity = Number(formData.totalCapacity);
    if (!formData.totalCapacity || isNaN(capacity) || capacity <= 0) {
      setErrorMessage('La capacidad total de plazas debe ser un número mayor a 0.');
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      const payload: CreateBranchDto = {
        name: formData.name.trim(),
        address: formData.address.trim() || undefined,
        phone: formData.phone.trim() || undefined,
        city: formData.city.trim() || undefined,
        totalCapacity: capacity,
        notes: formData.notes.trim() || undefined,
        logoBase64: formData.logoBase64 || undefined,
      };
      const created = await branchesService.create(payload);
      if (created && created.id) {
        await refreshBranches();
        setActiveBranchId(created.id);
      }
    } catch (err: any) {
      console.error('Error al registrar la primera sede:', err);
      setErrorMessage(
        err?.response?.data?.message ||
        err?.message ||
        'Ocurrió un error al registrar la primera sede. Por favor intenta de nuevo.'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="onboarding-wizard-overlay">
      <div className="onboarding-wizard-card">
        <div className="onboarding-wizard-header">
          <div className="onboarding-wizard-icon-wrapper">
            <Building2 size={32} />
          </div>
          <h2>Bienvenido a Parking Flow</h2>
          <p>
            Aún no tienes ningún parqueadero registrado. Por favor crea tu primera sede para comenzar a configurar el sistema.
          </p>
        </div>

        {errorMessage && (
          <div className="onboarding-error-banner">
            ⚠️ {errorMessage}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="onboarding-form-grid">
            <div className="onboarding-form-group full-width">
              <label>Nombre de la Sede *</label>
              <input
                type="text"
                name="name"
                className="input-field"
                value={formData.name}
                onChange={handleChange}
                placeholder="Ej: Sede Principal Centro"
                required
              />
            </div>

            <div className="onboarding-form-group">
              <label>Ciudad</label>
              <input
                type="text"
                name="city"
                className="input-field"
                value={formData.city}
                onChange={handleChange}
                placeholder="Ej: Bogotá D.C."
              />
            </div>

            <div className="onboarding-form-group">
              <label>Capacidad Total (Plazas) *</label>
              <input
                type="number"
                name="totalCapacity"
                className="input-field"
                value={formData.totalCapacity}
                onChange={handleChange}
                min={1}
                required
              />
            </div>

            <div className="onboarding-form-group full-width">
              <label>Dirección</label>
              <input
                type="text"
                name="address"
                className="input-field"
                value={formData.address}
                onChange={handleChange}
                placeholder="Ej: Carrera 10 # 20-30"
              />
            </div>

            <div className="onboarding-form-group">
              <label>Teléfono de Contacto</label>
              <input
                type="text"
                name="phone"
                className="input-field"
                value={formData.phone}
                onChange={handleChange}
                placeholder="Ej: 3001234567"
              />
            </div>

            <div className="onboarding-form-group full-width">
              <label>Notas / Descripción</label>
              <input
                type="text"
                name="notes"
                className="input-field"
                value={formData.notes}
                onChange={handleChange}
                placeholder="Ej: Sede matriz de parqueadero"
              />
            </div>

            <div className="onboarding-form-group full-width">
              <label>Imagen de la Sede</label>
              <input
                type="file"
                accept="image/*"
                className="input-field"
                onChange={handleImageChange}
                style={{ cursor: 'pointer' }}
              />
              {formData.logoBase64 && (
                <div style={{ marginTop: '0.75rem', borderRadius: '12px', overflow: 'hidden', border: '1px solid #cbd5e1', height: '120px', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f8fafc' }}>
                  <img src={formData.logoBase64} alt="Sede preview" style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }} />
                </div>
              )}
            </div>
          </div>

          <div className="onboarding-actions">
            <button
              type="submit"
              className="btn-onboarding-submit"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>Guardando y configurando sede...</>
              ) : (
                <>
                  <Sparkles size={18} />
                  Crear Sede Inicial y Continuar
                  <ArrowRight size={18} />
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
