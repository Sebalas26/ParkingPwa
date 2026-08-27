import React, { useState } from 'react';
import { Building2, Sparkles, ArrowRight } from 'lucide-react';
import { branchesService } from '../../settings/data/branchesService';
import { useBranchContext } from '../../../shared/context/ParqueaderoContext';
import type { CreateBranchDto } from '../../settings/model/BranchesContracts';
import './ZeroDataOnboardingWizard.css';

export const ZeroDataOnboardingWizard: React.FC = () => {
  const { refreshBranches, setActiveBranchId } = useBranchContext();
  const [formData, setFormData] = useState<{
    code: string;
    name: string;
    address: string;
    phone: string;
    city: string;
    totalCapacity: number | string;
    notes: string;
  }>({
    code: '',
    name: '',
    address: '',
    phone: '',
    city: '',
    totalCapacity: '',
    notes: '',
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.code.trim() || !formData.name.trim()) {
      setErrorMessage('El código y el nombre de la sede son obligatorios.');
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
        code: formData.code.trim(),
        name: formData.name.trim(),
        address: formData.address.trim() || undefined,
        phone: formData.phone.trim() || undefined,
        city: formData.city.trim() || undefined,
        totalCapacity: capacity,
        notes: formData.notes.trim() || undefined,
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
            <div className="onboarding-form-group">
              <label>Código de Sede *</label>
              <input
                type="text"
                name="code"
                className="input-field"
                value={formData.code}
                onChange={handleChange}
                placeholder="Ej: SEDE-01"
                required
              />
            </div>

            <div className="onboarding-form-group">
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
