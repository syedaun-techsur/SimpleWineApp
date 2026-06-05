'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { RatingWidget } from './RatingWidget';

interface TastingNoteFormProps {
  wineId: number;
  wineName: string;
  ratingScale: 'five_star' | 'hundred_point';  // from GET /api/settings
  prefillDate?: string;   // YYYY-MM-DD; pre-filled when arriving from consume flow (US-4.2)
}

type WouldBuyAgain = 'yes' | 'no' | 'maybe' | null;

interface DraftState {
  tastedOn: string;
  rating: number | null;
  appearance: string;
  aroma: string;
  flavor: string;
  finish: string;
  wouldBuyAgain: WouldBuyAgain;
  occasion: string;
  guestFeedback: string;
}

const labelStyle: React.CSSProperties = {
  fontFamily: 'JetBrains Mono, monospace',
  fontSize: '11px',
  textTransform: 'uppercase',
  color: '#9CA3AF',
  letterSpacing: '0.05em',
};

const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '8px',
  border: '1px solid #E5E7EB',
  borderRadius: '2px',
  fontFamily: 'Open Sans, sans-serif',
  fontSize: '16px',
  background: '#FAFAF7',
  boxSizing: 'border-box',
};

const textareaStyle: React.CSSProperties = {
  width: '100%',
  padding: '8px',
  border: '1px solid #E5E7EB',
  borderRadius: '2px',
  fontFamily: 'Open Sans, sans-serif',
  fontSize: '14px',
  resize: 'vertical',
  boxSizing: 'border-box',
  background: '#FAFAF7',
};

export function TastingNoteForm({
  wineId,
  wineName,
  ratingScale: initialScale,
  prefillDate,
}: TastingNoteFormProps) {
  const router = useRouter();
  const draftKey = `swa_note_draft_${wineId}`;
  const today = new Date().toISOString().split('T')[0];

  const [scale, setScale] = useState<'five_star' | 'hundred_point'>(initialScale);
  const [tastedOn, setTastedOn] = useState(prefillDate ?? today);
  const [rating, setRating] = useState<number | null>(null);
  const [appearance, setAppearance] = useState('');
  const [aroma, setAroma] = useState('');
  const [flavor, setFlavor] = useState('');
  const [finish, setFinish] = useState('');
  const [wouldBuyAgain, setWouldBuyAgain] = useState<WouldBuyAgain>(null);
  const [occasion, setOccasion] = useState('');
  const [guestFeedback, setGuestFeedback] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Restore draft on mount
  useEffect(() => {
    try {
      const draft = sessionStorage.getItem(draftKey);
      if (draft) {
        const d: Partial<DraftState> = JSON.parse(draft);
        if (d.tastedOn) setTastedOn(d.tastedOn);
        if (d.rating !== undefined) setRating(d.rating ?? null);
        if (d.appearance) setAppearance(d.appearance);
        if (d.aroma) setAroma(d.aroma);
        if (d.flavor) setFlavor(d.flavor);
        if (d.finish) setFinish(d.finish);
        if (d.wouldBuyAgain !== undefined) setWouldBuyAgain(d.wouldBuyAgain ?? null);
        if (d.occasion) setOccasion(d.occasion);
        if (d.guestFeedback) setGuestFeedback(d.guestFeedback);
      }
    } catch {
      /* sessionStorage unavailable */
    }
  }, [draftKey]);

  // Save draft on any field change
  const saveDraft = useCallback(() => {
    try {
      const draft: DraftState = {
        tastedOn,
        rating,
        appearance,
        aroma,
        flavor,
        finish,
        wouldBuyAgain,
        occasion,
        guestFeedback,
      };
      sessionStorage.setItem(draftKey, JSON.stringify(draft));
    } catch {
      /* sessionStorage unavailable */
    }
  }, [draftKey, tastedOn, rating, appearance, aroma, flavor, finish, wouldBuyAgain, occasion, guestFeedback]);

  useEffect(() => {
    saveDraft();
  }, [saveDraft]);

  const handleScaleSwitch = async () => {
    const newScale = scale === 'five_star' ? 'hundred_point' : 'five_star';
    try {
      await fetch('/api/settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rating_scale: newScale }),
      });
      setScale(newScale);
      setRating(null); // reset rating on scale change
    } catch {
      /* ignore scale switch errors; keep current scale */
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    // Client validation
    if (!tastedOn) {
      setErrors({ tasted_on: 'Tasting date is required.' });
      return;
    }
    const d = new Date(tastedOn);
    const todayEnd = new Date();
    todayEnd.setHours(23, 59, 59, 999);
    if (d > todayEnd) {
      setErrors({ tasted_on: 'Tasting date cannot be in the future.' });
      return;
    }

    setSubmitting(true);
    try {
      const body: Record<string, unknown> = { tasted_on: tastedOn };

      if (rating !== null) {
        // For five_star: RatingWidget returns stored value (star × 20), API expects raw input (1-5)
        // For hundred_point: stored value = input value, pass as-is
        const apiRating = scale === 'five_star' ? Math.round(rating / 20) : rating;
        body.rating = apiRating;
      }
      if (appearance) body.appearance = appearance;
      if (aroma) body.aroma = aroma;
      if (flavor) body.flavor = flavor;
      if (finish) body.finish = finish;
      if (wouldBuyAgain) body.would_buy_again = wouldBuyAgain;
      if (occasion) body.occasion = occasion;
      if (guestFeedback) body.guest_feedback = guestFeedback;

      const res = await fetch(`/api/wines/${wineId}/notes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      if (res.status === 201) {
        try {
          sessionStorage.removeItem(draftKey);
        } catch {
          /* ok */
        }
        router.push(`/wines/${wineId}`);
      } else {
        const data = await res.json();
        if (data.fields) setErrors(data.fields);
        else {
          setErrors({
            _: data.message ?? 'Could not save tasting note. Please try again.',
          });
        }
      }
    } catch {
      setErrors({ _: 'Could not save tasting note. Please try again.' });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} style={{ maxWidth: '600px', padding: '16px' }}>
      <h1
        style={{
          fontFamily: 'Montserrat, sans-serif',
          fontWeight: 900,
          fontSize: '24px',
          color: '#0A0A0A',
          marginBottom: '8px',
          marginTop: 0,
        }}
      >
        Add Tasting Note
      </h1>
      <p style={{ color: '#6B7280', fontFamily: 'Open Sans, sans-serif', marginBottom: '24px' }}>
        {wineName}
      </p>

      {/* Global error */}
      {errors._ && (
        <div
          style={{
            background: '#FEF2F2',
            border: '1px solid #EF4444',
            borderLeft: '4px solid #EF4444',
            padding: '12px',
            marginBottom: '16px',
            borderRadius: '2px',
          }}
        >
          {errors._}
        </div>
      )}

      {/* Rating — most prominent, first field */}
      <div style={{ marginBottom: '24px' }}>
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '8px',
          }}
        >
          <label style={labelStyle}>Rating</label>
          <button
            type="button"
            onClick={handleScaleSwitch}
            style={{
              fontFamily: 'JetBrains Mono, monospace',
              fontSize: '10px',
              textTransform: 'uppercase',
              color: '#6B7280',
              background: 'none',
              border: '1px solid #E5E7EB',
              borderRadius: '2px',
              padding: '4px 8px',
              cursor: 'pointer',
              letterSpacing: '0.05em',
            }}
          >
            Switch to {scale === 'five_star' ? '100-point' : '5-star'}
          </button>
        </div>
        <RatingWidget value={rating} scale={scale} onChange={setRating} />
      </div>

      {/* Tasting date */}
      <div style={{ marginBottom: '16px' }}>
        <label
          htmlFor="tasted_on"
          style={{ ...labelStyle, display: 'block', marginBottom: '4px' }}
        >
          Tasting Date *
        </label>
        <input
          id="tasted_on"
          type="date"
          value={tastedOn}
          max={today}
          required
          onChange={(e) => setTastedOn(e.target.value)}
          style={{
            ...inputStyle,
            borderColor: errors.tasted_on ? '#EF4444' : '#E5E7EB',
          }}
        />
        {errors.tasted_on && (
          <p style={{ color: '#EF4444', fontSize: '12px', marginTop: '4px' }}>
            {errors.tasted_on}
          </p>
        )}
      </div>

      {/* Sensory fields with char counters */}
      {(
        [
          ['appearance', appearance, setAppearance, 1000],
          ['aroma', aroma, setAroma, 1000],
          ['flavor', flavor, setFlavor, 1000],
          ['finish', finish, setFinish, 1000],
        ] as [string, string, React.Dispatch<React.SetStateAction<string>>, number][]
      ).map(([field, val, setter, max]) => (
        <div key={field} style={{ marginBottom: '16px' }}>
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              marginBottom: '4px',
            }}
          >
            <label htmlFor={field} style={labelStyle}>
              {field.charAt(0).toUpperCase() + field.slice(1)}
            </label>
            <span
              style={{
                fontSize: '11px',
                color: val.length > max * 0.9 ? '#EF4444' : '#9CA3AF',
                fontFamily: 'JetBrains Mono, monospace',
              }}
            >
              {val.length} / {max}
            </span>
          </div>
          <textarea
            id={field}
            value={val}
            maxLength={max}
            onChange={(e) => setter(e.target.value)}
            rows={3}
            style={textareaStyle}
          />
        </div>
      ))}

      {/* Would buy again */}
      <div style={{ marginBottom: '16px' }}>
        <label style={{ ...labelStyle, display: 'block', marginBottom: '8px' }}>
          Would Buy Again
        </label>
        <div style={{ display: 'flex', gap: '12px' }}>
          {(['yes', 'no', 'maybe'] as const).map((opt) => (
            <label
              key={opt}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                cursor: 'pointer',
                fontFamily: 'Open Sans, sans-serif',
                fontSize: '14px',
              }}
            >
              <input
                type="radio"
                name="would_buy_again"
                value={opt}
                checked={wouldBuyAgain === opt}
                onChange={() => setWouldBuyAgain(opt)}
              />
              {opt.charAt(0).toUpperCase() + opt.slice(1)}
            </label>
          ))}
        </div>
      </div>

      {/* Occasion */}
      <div style={{ marginBottom: '16px' }}>
        <label
          htmlFor="occasion"
          style={{ ...labelStyle, display: 'block', marginBottom: '4px' }}
        >
          Occasion
        </label>
        <select
          id="occasion"
          value={occasion}
          onChange={(e) => setOccasion(e.target.value)}
          style={{
            width: '100%',
            padding: '8px',
            border: '1px solid #E5E7EB',
            borderRadius: '2px',
            fontFamily: 'Open Sans, sans-serif',
            fontSize: '14px',
            background: '#FAFAF7',
          }}
        >
          <option value="">Select an occasion...</option>
          {['dinner', 'gift', 'casual', 'celebration', 'restaurant', 'tasting', 'other'].map(
            (occ) => (
              <option key={occ} value={occ}>
                {occ.charAt(0).toUpperCase() + occ.slice(1)}
              </option>
            )
          )}
        </select>
      </div>

      {/* Guest feedback */}
      <div style={{ marginBottom: '24px' }}>
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            marginBottom: '4px',
          }}
        >
          <label htmlFor="guest_feedback" style={labelStyle}>
            Guest Feedback
          </label>
          <span
            style={{
              fontSize: '11px',
              color: guestFeedback.length > 1800 ? '#EF4444' : '#9CA3AF',
              fontFamily: 'JetBrains Mono, monospace',
            }}
          >
            {guestFeedback.length} / 2000
          </span>
        </div>
        <textarea
          id="guest_feedback"
          value={guestFeedback}
          maxLength={2000}
          onChange={(e) => setGuestFeedback(e.target.value)}
          rows={4}
          style={textareaStyle}
        />
      </div>

      {/* Submit */}
      <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
        <button
          type="submit"
          disabled={submitting}
          style={{
            padding: '12px 24px',
            background: '#FBCA5C',
            color: '#0A0A0A',
            border: 'none',
            borderRadius: '2px',
            fontFamily: 'JetBrains Mono, monospace',
            fontSize: '13px',
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
            cursor: submitting ? 'not-allowed' : 'pointer',
            fontWeight: 700,
          }}
        >
          {submitting ? 'Saving...' : 'Save Note'}
        </button>
        <a
          href={`/wines/${wineId}`}
          style={{
            fontFamily: 'Open Sans, sans-serif',
            fontSize: '14px',
            color: '#6B7280',
            textDecoration: 'none',
          }}
        >
          Cancel
        </a>
      </div>
    </form>
  );
}
