'use client';

import { useEffect, useState } from 'react';
import { Plus, Pencil, Trash2, Handshake } from 'lucide-react';
import {
  agreementsService,
  Agreement,
  AgreementInput,
} from '@/services/agreements.service';

const emptyForm: AgreementInput = {
  name: '',
  nit: '',
  discountType: 'PERCENT',
  discountValue: 0,
  validFrom: '',
  validUntil: '',
  notes: '',
  isActive: true,
};

export default function AgreementsPage() {
  const [agreements, setAgreements] = useState<Agreement[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<AgreementInput>(emptyForm);
  const [saving, setSaving] = useState(false);

  const load = async () => {
    try {
      setLoading(true);
      setError(null);
      setAgreements(await agreementsService.list());
    } catch (err: any) {
      setError(err.response?.data?.message || 'Error al cargar convenios');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const openCreate = () => {
    setEditingId(null);
    setForm(emptyForm);
    setShowModal(true);
  };

  const openEdit = (a: Agreement) => {
    setEditingId(a.id);
    setForm({
      name: a.name,
      nit: a.nit ?? '',
      discountType: a.discountType,
      discountValue: a.discountValue,
      parkingLotId: a.parkingLotId ?? undefined,
      validFrom: a.validFrom ?? '',
      validUntil: a.validUntil ?? '',
      notes: a.notes ?? '',
      isActive: a.isActive,
    });
    setShowModal(true);
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      const payload: AgreementInput = {
        ...form,
        nit: form.nit || undefined,
        validFrom: form.validFrom || undefined,
        validUntil: form.validUntil || undefined,
        notes: form.notes || undefined,
        discountValue: Number(form.discountValue) || 0,
      };
      if (editingId) {
        await agreementsService.update(editingId, payload);
      } else {
        await agreementsService.create(payload);
      }
      setShowModal(false);
      await load();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Error al guardar convenio');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (a: Agreement) => {
    if (!confirm(`¿Eliminar el convenio "${a.name}"?`)) return;
    try {
      await agreementsService.remove(a.id);
      await load();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Error al eliminar convenio');
    }
  };

  const formatDiscount = (a: Agreement) =>
    a.discountType === 'PERCENT'
      ? `${a.discountValue}%`
      : `$${a.discountValue.toLocaleString('es-CO')} COP`;

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Handshake className="w-7 h-7 text-primary" />
          <div>
            <h1 className="text-2xl font-bold text-foreground">Convenios</h1>
            <p className="text-sm text-muted-foreground">
              Descuentos por acuerdos con empresas o entidades
            </p>
          </div>
        </div>
        <button
          onClick={openCreate}
          className="inline-flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded-md text-sm font-medium hover:opacity-90"
        >
          <Plus className="w-4 h-4" /> Nuevo convenio
        </button>
      </div>

      {error && (
        <div className="mb-4 rounded-md bg-red-500/10 text-red-600 dark:text-red-400 px-4 py-3 text-sm">
          {error}
        </div>
      )}

      <div className="bg-card border border-border rounded-lg overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="text-left text-muted-foreground border-b border-border">
            <tr>
              <th className="px-4 py-3 font-medium">Nombre</th>
              <th className="px-4 py-3 font-medium">NIT</th>
              <th className="px-4 py-3 font-medium">Descuento</th>
              <th className="px-4 py-3 font-medium">Vigencia</th>
              <th className="px-4 py-3 font-medium">Estado</th>
              <th className="px-4 py-3 font-medium text-right">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-muted-foreground">
                  Cargando...
                </td>
              </tr>
            ) : agreements.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-muted-foreground">
                  No hay convenios registrados.
                </td>
              </tr>
            ) : (
              agreements.map((a) => (
                <tr key={a.id} className="border-b border-border/50 hover:bg-muted/30">
                  <td className="px-4 py-3 font-medium text-foreground">{a.name}</td>
                  <td className="px-4 py-3 text-muted-foreground">{a.nit || '—'}</td>
                  <td className="px-4 py-3 text-foreground">{formatDiscount(a)}</td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {a.validFrom || a.validUntil
                      ? `${a.validFrom || '…'} → ${a.validUntil || '…'}`
                      : 'Sin límite'}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                        a.isActive
                          ? 'bg-green-500/15 text-green-600 dark:text-green-400'
                          : 'bg-gray-500/15 text-gray-500'
                      }`}
                    >
                      {a.isActive ? 'Activo' : 'Inactivo'}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => openEdit(a)}
                        className="p-1.5 rounded hover:bg-muted text-muted-foreground hover:text-foreground"
                        title="Editar"
                      >
                        <Pencil className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(a)}
                        className="p-1.5 rounded hover:bg-red-500/10 text-muted-foreground hover:text-red-500"
                        title="Eliminar"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-card border border-border rounded-lg w-full max-w-lg p-6">
            <h2 className="text-lg font-semibold text-foreground mb-4">
              {editingId ? 'Editar convenio' : 'Nuevo convenio'}
            </h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm text-muted-foreground mb-1">Nombre *</label>
                <input
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="w-full bg-background border border-border rounded-md px-3 py-2 text-sm text-foreground"
                  placeholder="Convenio Empresa XYZ"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-muted-foreground mb-1">NIT</label>
                  <input
                    value={form.nit || ''}
                    onChange={(e) => setForm({ ...form, nit: e.target.value })}
                    className="w-full bg-background border border-border rounded-md px-3 py-2 text-sm text-foreground"
                    placeholder="900123456-7"
                  />
                </div>
                <div>
                  <label className="block text-sm text-muted-foreground mb-1">Estado</label>
                  <select
                    value={form.isActive ? 'true' : 'false'}
                    onChange={(e) => setForm({ ...form, isActive: e.target.value === 'true' })}
                    className="w-full bg-background border border-border rounded-md px-3 py-2 text-sm text-foreground"
                  >
                    <option value="true">Activo</option>
                    <option value="false">Inactivo</option>
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-muted-foreground mb-1">Tipo de descuento</label>
                  <select
                    value={form.discountType}
                    onChange={(e) =>
                      setForm({ ...form, discountType: e.target.value as 'PERCENT' | 'FIXED' })
                    }
                    className="w-full bg-background border border-border rounded-md px-3 py-2 text-sm text-foreground"
                  >
                    <option value="PERCENT">Porcentaje (%)</option>
                    <option value="FIXED">Monto fijo (COP)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm text-muted-foreground mb-1">
                    Valor {form.discountType === 'PERCENT' ? '(0-100)' : '(COP)'}
                  </label>
                  <input
                    type="number"
                    min={0}
                    value={form.discountValue}
                    onChange={(e) =>
                      setForm({ ...form, discountValue: Number(e.target.value) })
                    }
                    className="w-full bg-background border border-border rounded-md px-3 py-2 text-sm text-foreground"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-muted-foreground mb-1">Vigente desde</label>
                  <input
                    type="date"
                    value={form.validFrom || ''}
                    onChange={(e) => setForm({ ...form, validFrom: e.target.value })}
                    className="w-full bg-background border border-border rounded-md px-3 py-2 text-sm text-foreground"
                  />
                </div>
                <div>
                  <label className="block text-sm text-muted-foreground mb-1">Vigente hasta</label>
                  <input
                    type="date"
                    value={form.validUntil || ''}
                    onChange={(e) => setForm({ ...form, validUntil: e.target.value })}
                    className="w-full bg-background border border-border rounded-md px-3 py-2 text-sm text-foreground"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm text-muted-foreground mb-1">Notas</label>
                <textarea
                  value={form.notes || ''}
                  onChange={(e) => setForm({ ...form, notes: e.target.value })}
                  className="w-full bg-background border border-border rounded-md px-3 py-2 text-sm text-foreground"
                  rows={2}
                />
              </div>
            </div>
            <div className="flex justify-end gap-2 mt-6">
              <button
                onClick={() => setShowModal(false)}
                className="px-4 py-2 rounded-md text-sm border border-border text-foreground hover:bg-muted"
              >
                Cancelar
              </button>
              <button
                onClick={handleSave}
                disabled={saving || !form.name}
                className="px-4 py-2 rounded-md text-sm bg-primary text-primary-foreground font-medium hover:opacity-90 disabled:opacity-50"
              >
                {saving ? 'Guardando...' : 'Guardar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
