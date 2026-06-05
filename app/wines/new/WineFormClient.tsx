'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ReadinessBadge } from '../../components/ReadinessBadge';

const WINE_TYPES = ['Red', 'White', 'Rosé', 'Sparkling', 'Dessert', 'Fortified', 'Orange', 'Other'] as const;
const BOTTLE_SIZES = ['375ml', '750ml', 'Magnum 1.5L', 'Double Magnum 3L', 'Jeroboam 4.5L'];
const CURRENT_YEAR = new Date().getFullYear();

interface LocationOption { id: number; name: string }

interface WineFormData {
  name: string; producer: string; vintage: string; wine_type: string;
  quantity: string; location_id: string;
  grape: string; country: string; region: string; bottle_size: string;
  purchase_date: string; purchase_source: string; purchase_price: string;
  drinking_window_start: string; drinking_window_end: string; notes: string;
}

interface WineFormClientProps {
  locations: LocationOption[];
  mode: 'create' | 'edit';
  initialData?: Partial<WineFormData>;
  wineId?: number;
  wineName?: string;
}

export function WineFormClient({ locations, mode, initialData, wineId, wineName }: WineFormClientProps) {
  const router = useRouter();
  const [data, setData] = useState<WineFormData>({
    name: '', producer: '', vintage: '', wine_type: '', quantity: '1', location_id: '',
    grape: '', country: '', region: '', bottle_size: '750ml',
    purchase_date: '', purchase_source: '', purchase_price: '',
    drinking_window_start: '', drinking_window_end: '', notes: '',
    ...initialData,
  });
  const [errors, setErrors] = useState<Partial<WineFormData>>({});
  const [serverError, setServerError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [showOptional, setShowOptional] = useState(
    mode === 'edit' && Boolean(
      initialData?.grape || initialData?.country || initialData?.region ||
      initialData?.purchase_date || initialData?.purchase_source ||
      initialData?.purchase_price || initialData?.drinking_window_start ||
      initialData?.drinking_window_end || initialData?.notes
    )
  );

  const set = (field: keyof WineFormData) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setData(prev => ({ ...prev, [field]: e.target.value }));
    if (errors[field]) setErrors(prev => ({ ...prev, [field]: '' }));
  };

  const validate = (): boolean => {
    const errs: Partial<WineFormData> = {};
    if (!data.name.trim()) errs.name = 'Wine Name is required.';
    if (!data.producer.trim()) errs.producer = 'Producer is required.';
    const v = Number(data.vintage);
    if (!data.vintage) errs.vintage = 'Vintage Year is required.';
    else if (!Number.isInteger(v) || v < 1900 || v > CURRENT_YEAR + 1)
      errs.vintage = `Vintage must be between 1900 and ${CURRENT_YEAR + 1}.`;
    if (!data.wine_type) errs.wine_type = 'Wine type is required.';
    const q = Number(data.quantity);
    if (!data.quantity) errs.quantity = 'Quantity is required.';
    else if (!Number.isInteger(q) || q < 1 || q > 9999) errs.quantity = 'Quantity must be between 1 and 9999.';
    if (!data.location_id) errs.location_id = 'Storage location is required.';
    if (data.drinking_window_start && data.drinking_window_end) {
      const s = Number(data.drinking_window_start);
      const e = Number(data.drinking_window_end);
      if (e < s) errs.drinking_window_end = 'Drinking window end year must be ≥ start year.';
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    setSubmitting(true);
    setServerError('');
    try {
      const payload = {
        name: data.name.trim(), producer: data.producer.trim(),
        vintage: Number(data.vintage), wine_type: data.wine_type,
        quantity: Number(data.quantity), location_id: Number(data.location_id),
        grape: data.grape.trim() || null, country: data.country.trim() || null,
        region: data.region.trim() || null, bottle_size: data.bottle_size || null,
        purchase_date: data.purchase_date || null, purchase_source: data.purchase_source.trim() || null,
        purchase_price: data.purchase_price ? Number(data.purchase_price) : null,
        drinking_window_start: data.drinking_window_start ? Number(data.drinking_window_start) : null,
        drinking_window_end: data.drinking_window_end ? Number(data.drinking_window_end) : null,
        notes: data.notes.trim() || null,
      };
      const url = mode === 'edit' ? `/api/wines/${wineId}` : '/api/wines';
      const method = mode === 'edit' ? 'PUT' : 'POST';
      const res = await fetch(url, {
        method, headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const result = await res.json();
      if (!res.ok) {
        if (result.fields) setErrors(result.fields);
        setServerError(result.message || 'Could not save wine. Please try again.');
        return;
      }
      router.push(`/wines/${result.id || (mode === 'edit' ? wineId : result.id)}`);
      router.refresh();
    } catch {
      setServerError('Network error. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const locationUnknown = mode === 'edit' && initialData?.location_id === '' && Boolean(wineName);

  const fieldStyle = (err?: string) => ({
    borderColor: err ? 'var(--color-error)' : 'var(--color-border)',
    borderWidth: err ? '2px' : '1px',
  } as React.CSSProperties);

  const windowStart = data.drinking_window_start ? Number(data.drinking_window_start) : null;
  const windowEnd = data.drinking_window_end ? Number(data.drinking_window_end) : null;

  return (
    <form onSubmit={handleSubmit} noValidate>
      {serverError && (
        <div style={{ background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: 'var(--radius-sm)', padding: '12px', marginBottom: '16px', fontSize: '14px', color: 'var(--color-error)' }}>
          ⚠ {serverError}
        </div>
      )}

      <div className="section-header">Required Fields</div>

      {/* Wine Name */}
      <div style={{ marginBottom: '16px' }}>
        <label className="label-mono" htmlFor="wine-name" style={{ display: 'block', marginBottom: '6px' }}>Wine Name *</label>
        <input id="wine-name" type="text" value={data.name} onChange={set('name')} placeholder="e.g. Château Margaux" style={fieldStyle(errors.name)} maxLength={255} />
        {errors.name && <p className="field-error">⚠ {errors.name}</p>}
      </div>

      {/* Producer */}
      <div style={{ marginBottom: '16px' }}>
        <label className="label-mono" htmlFor="producer" style={{ display: 'block', marginBottom: '6px' }}>Producer *</label>
        <input id="producer" type="text" value={data.producer} onChange={set('producer')} placeholder="e.g. Château Margaux" style={fieldStyle(errors.producer)} maxLength={255} />
        {errors.producer && <p className="field-error">⚠ {errors.producer}</p>}
      </div>

      {/* Vintage */}
      <div style={{ marginBottom: '16px' }}>
        <label className="label-mono" htmlFor="vintage" style={{ display: 'block', marginBottom: '6px' }}>Vintage Year * (1900–{CURRENT_YEAR + 1})</label>
        <input id="vintage" type="number" value={data.vintage} onChange={set('vintage')} placeholder={`e.g. ${CURRENT_YEAR - 2}`} min={1900} max={CURRENT_YEAR + 1} style={fieldStyle(errors.vintage)} inputMode="numeric" />
        {errors.vintage && <p className="field-error">⚠ {errors.vintage}</p>}
      </div>

      {/* Wine Type */}
      <div style={{ marginBottom: '16px' }}>
        <label className="label-mono" htmlFor="wine-type" style={{ display: 'block', marginBottom: '6px' }}>Wine Type *</label>
        <select id="wine-type" value={data.wine_type} onChange={set('wine_type')} style={fieldStyle(errors.wine_type)}>
          <option value="">Select wine type...</option>
          {WINE_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
        </select>
        {errors.wine_type && <p className="field-error">⚠ {errors.wine_type}</p>}
      </div>

      {/* Quantity */}
      <div style={{ marginBottom: '16px' }}>
        <label className="label-mono" htmlFor="quantity" style={{ display: 'block', marginBottom: '6px' }}>Quantity * (1–9999)</label>
        <input id="quantity" type="number" value={data.quantity} onChange={set('quantity')} min={1} max={9999} style={fieldStyle(errors.quantity)} inputMode="numeric" />
        {errors.quantity && <p className="field-error">⚠ {errors.quantity}</p>}
      </div>

      {/* Storage Location */}
      <div style={{ marginBottom: '16px' }}>
        <label className="label-mono" htmlFor="location" style={{ display: 'block', marginBottom: '6px' }}>Storage Location *</label>
        {locations.length === 0 ? (
          <div style={{ padding: '12px', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-sm)', background: '#FFFBEB', fontSize: '13px' }}>
            ℹ You have no storage locations yet.{' '}
            <Link href="/locations" style={{ color: 'var(--color-gold)' }}>Add your first storage location →</Link>
          </div>
        ) : (
          <select
            id="location"
            value={data.location_id}
            onChange={set('location_id')}
            style={{
              ...fieldStyle(errors.location_id || (locationUnknown ? 'error' : '')),
              borderColor: locationUnknown ? 'var(--color-error)' : (errors.location_id ? 'var(--color-error)' : 'var(--color-border)'),
            }}
          >
            {locationUnknown && <option value="">⚠ Location Unknown — please select a new location</option>}
            {!locationUnknown && <option value="">Select a storage location...</option>}
            {locations.map(l => <option key={l.id} value={String(l.id)}>{l.name}</option>)}
          </select>
        )}
        {locationUnknown && <p className="field-error">⚠ Location Unknown — please select a new location.</p>}
        {errors.location_id && !locationUnknown && <p className="field-error">⚠ {errors.location_id}</p>}
        <p style={{ fontSize: '12px', color: 'var(--color-muted)', marginTop: '6px' }}>
          Each wine record tracks one storage location. To split a case across two locations, create separate records with the appropriate quantities for each.
        </p>
      </div>

      {/* Optional fields toggle */}
      <div style={{ marginBottom: '8px' }}>
        <button
          type="button"
          onClick={() => setShowOptional(p => !p)}
          style={{ background: 'none', border: 'none', color: '#6B7280', cursor: 'pointer', fontSize: '14px', padding: '8px 0', display: 'flex', alignItems: 'center', gap: '6px' }}
        >
          {showOptional ? '▾' : '▸'} {showOptional ? 'Hide' : 'Show'} optional fields
        </button>
      </div>

      {showOptional && (
        <div>
          <div className="section-header">Optional Details</div>

          {/* Grape */}
          <div style={{ marginBottom: '16px' }}>
            <label className="label-mono" htmlFor="grape" style={{ display: 'block', marginBottom: '6px' }}>Grape Variety</label>
            <input id="grape" type="text" value={data.grape} onChange={set('grape')} placeholder="e.g. Cabernet Sauvignon" maxLength={255} />
          </div>

          {/* Country + Region side by side on desktop */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '16px', marginBottom: '16px' }}>
            <div>
              <label className="label-mono" htmlFor="country" style={{ display: 'block', marginBottom: '6px' }}>Country</label>
              <input id="country" type="text" value={data.country} onChange={set('country')} placeholder="e.g. France" maxLength={100} />
            </div>
            <div>
              <label className="label-mono" htmlFor="region" style={{ display: 'block', marginBottom: '6px' }}>Region</label>
              <input id="region" type="text" value={data.region} onChange={set('region')} placeholder="e.g. Bordeaux" maxLength={100} />
            </div>
          </div>

          {/* Bottle Size */}
          <div style={{ marginBottom: '16px' }}>
            <label className="label-mono" htmlFor="bottle-size" style={{ display: 'block', marginBottom: '6px' }}>Bottle Size</label>
            <input id="bottle-size" type="text" list="bottle-size-options" value={data.bottle_size} onChange={set('bottle_size')} placeholder="e.g. 750ml" maxLength={50} />
            <datalist id="bottle-size-options">
              {BOTTLE_SIZES.map(s => <option key={s} value={s} />)}
            </datalist>
          </div>

          {/* Purchase fields */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '16px', marginBottom: '16px' }}>
            <div>
              <label className="label-mono" htmlFor="purchase-date" style={{ display: 'block', marginBottom: '6px' }}>Purchase Date</label>
              <input id="purchase-date" type="date" value={data.purchase_date} onChange={set('purchase_date')} max={new Date().toISOString().split('T')[0]} />
            </div>
            <div>
              <label className="label-mono" htmlFor="purchase-price" style={{ display: 'block', marginBottom: '6px' }}>Purchase Price ($)</label>
              <input id="purchase-price" type="number" value={data.purchase_price} onChange={set('purchase_price')} placeholder="0.00" min={0} step={0.01} max={99999.99} inputMode="decimal" />
            </div>
          </div>
          <div style={{ marginBottom: '16px' }}>
            <label className="label-mono" htmlFor="purchase-source" style={{ display: 'block', marginBottom: '6px' }}>Purchase Source</label>
            <input id="purchase-source" type="text" value={data.purchase_source} onChange={set('purchase_source')} placeholder="e.g. Wine.com" maxLength={255} />
          </div>

          {/* Drinking Window */}
          <div style={{ marginBottom: '16px' }}>
            <label className="label-mono" style={{ display: 'block', marginBottom: '6px' }}>Drinking Window</label>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
              <div>
                <label className="label-mono" htmlFor="dw-start" style={{ display: 'block', marginBottom: '4px', fontSize: '10px' }}>Drink From (Year)</label>
                <input id="dw-start" type="number" value={data.drinking_window_start} onChange={set('drinking_window_start')} placeholder="e.g. 2025" min={1900} max={2100} inputMode="numeric" />
              </div>
              <div>
                <label className="label-mono" htmlFor="dw-end" style={{ display: 'block', marginBottom: '4px', fontSize: '10px' }}>Drink Until (Year)</label>
                <input id="dw-end" type="number" value={data.drinking_window_end} onChange={set('drinking_window_end')} placeholder="e.g. 2045" min={1900} max={2100} inputMode="numeric" />
                {errors.drinking_window_end && <p className="field-error">⚠ {errors.drinking_window_end}</p>}
              </div>
            </div>
            {/* Live readiness badge preview */}
            {(windowStart || windowEnd) && (
              <div style={{ marginTop: '8px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '12px', color: 'var(--color-muted)' }}>Preview:</span>
                <ReadinessBadge start={windowStart} end={windowEnd} />
              </div>
            )}
          </div>

          {/* General Notes */}
          <div style={{ marginBottom: '16px' }}>
            <label className="label-mono" htmlFor="notes" style={{ display: 'block', marginBottom: '6px' }}>General Notes</label>
            <textarea id="notes" value={data.notes} onChange={set('notes')} rows={4} placeholder="Any notes about this wine..." />
            <div style={{ textAlign: 'right', fontSize: '11px', color: 'var(--color-muted)', marginTop: '4px' }}>{data.notes.length}/2000</div>
          </div>
        </div>
      )}

      <div style={{ marginTop: '24px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
        <button type="submit" disabled={submitting} className="btn btn-primary" style={{ width: '100%' }}>
          {submitting ? 'Saving...' : mode === 'create' ? 'Save Wine' : 'Save Changes'}
        </button>
        <Link href={mode === 'edit' && wineId ? `/wines/${wineId}` : '/'} style={{ textAlign: 'center', fontSize: '14px', color: '#6B7280', textDecoration: 'none', padding: '8px' }}>
          Cancel
        </Link>
      </div>
    </form>
  );
}
