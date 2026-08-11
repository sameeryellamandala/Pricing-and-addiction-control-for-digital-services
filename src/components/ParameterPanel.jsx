import React from 'react';
import { validateParams } from '../math/assertions';

const PARAM_DEFS = [
  { key: 'lam', label: 'Base marginal utility', symbol: 'λ', min: 1.0, max: 6.0, step: 0.1, desc: 'Direct utility value of consumption' },
  { key: 'eta', label: 'Price sensitivity (slope)', symbol: 'η', min: 1.0, max: 5.0, step: 0.05, desc: 'Sensitivity of demand to pricing' },
  { key: 'mu', label: 'Habit persistence', symbol: 'μ', min: 0.05, max: 0.70, step: 0.01, desc: 'Carryover strength of addiction (decay speed)' },
  { key: 'zeta', label: 'Habit formation strength', symbol: 'ζ', min: 0.5, max: 8.0, step: 0.1, desc: 'How much addiction increases demand utility' },
  { key: 'rho', label: 'Firm discount factor', symbol: 'ρ', min: 0.5, max: 0.99, step: 0.01, desc: 'Patience of the firm in long-term profits' },
  { key: 'T', label: 'Simulation periods', symbol: 'T', min: 10, max: 60, step: 1, desc: 'Horizon of dynamic paths' },
];

export default function ParameterPanel({ params, onChange }) {
  const validation = validateParams(params);

  const handleSliderChange = (key, value) => {
    onChange({
      ...params,
      [key]: Number(value),
    });
  };

  return (
    <aside className="sidebar">
      <h2>Addiction Control</h2>
      <p className="sidebar-subtitle">
        Based on Chang, Lei & Tian (2024) model. Dynamic pricing vs. policy efficiency under habit persistence.
      </p>

      {/* Global validation error */}
      {!validation.isValid && (
        <div className="error-banner">
          {validation.errorMessage}
        </div>
      )}

      {PARAM_DEFS.map(({ key, label, symbol, min, max, step, desc }) => {
        // Highlight in red if this parameter directly causes an Assumption 1 violation
        const isViolated = !validation.assumption1 && (key === 'mu' || key === 'zeta' || key === 'eta');
        
        return (
          <div key={key} className="slider-group">
            <div className="slider-header">
              <span className="slider-label" title={desc}>
                {label} (<span className="slider-symbol">{symbol}</span>)
              </span>
              <span className="slider-value">{params[key].toFixed(key === 'T' ? 0 : 2)}</span>
            </div>
            <input
              type="range"
              min={min}
              max={max}
              step={step}
              value={params[key]}
              onChange={(e) => handleSliderChange(key, e.target.value)}
              className={`slider-input ${isViolated ? 'slider-error' : ''}`}
            />
            {isViolated && (
              <span className="slider-error-text">Adjust to satisfy μ(1 + ζ/η) &lt; 1</span>
            )}
          </div>
        );
      })}

      {/* Experience variation (Sigma) via custom radio options */}
      <div className="radio-group">
        <span className="slider-label" title="Variance of random shock to consumer experience (demand noise)">
          Experience Variation (<span className="slider-symbol">σ</span>)
        </span>
        <div className="radio-options">
          {[0.0, 0.5, 1.0, 1.5].map((val) => {
            const isSelected = params.sigma === val;
            const isViolated = val >= params.lam / 2.0; // Assumption 2 violation candidate
            
            return (
              <label key={val}>
                <input
                  type="radio"
                  name="sigma"
                  value={val}
                  checked={isSelected}
                  disabled={isViolated}
                  onChange={() => handleSliderChange('sigma', val)}
                  className="radio-input"
                />
                <span 
                  className="radio-option" 
                  style={{
                    opacity: isViolated ? 0.3 : 1,
                    cursor: isViolated ? 'not-allowed' : 'pointer',
                    borderColor: isSelected ? 'var(--color-dynamic)' : isViolated ? 'var(--color-danger)' : ''
                  }}
                  title={isViolated ? "Disabled: Violates Assumption 2 (σ < λ/2)" : ""}
                >
                  {val.toFixed(1)}
                </span>
              </label>
            );
          })}
        </div>
      </div>

      {/* Sponsored Advertisement block */}
      <div
        className="ad-box"
        style={{
          marginTop: '20px',
          padding: '12px',
          borderRadius: '8px',
          background: 'linear-gradient(135deg, rgba(56, 189, 248, 0.08) 0%, rgba(168, 85, 247, 0.08) 100%)',
          border: '1px solid rgba(255, 255, 255, 0.08)',
          textAlign: 'left',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
          <span
            style={{
              fontSize: '0.6rem',
              fontWeight: 'bold',
              textTransform: 'uppercase',
              letterSpacing: '0.5px',
              color: 'var(--color-dynamic)',
              background: 'var(--color-dynamic-bg)',
              padding: '2px 6px',
              borderRadius: '4px',
            }}
          >
            Sponsored
          </span>
          <span style={{ fontSize: '0.6rem', color: 'var(--color-text-subtle)' }}>Ad</span>
        </div>
        <p style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', lineHeight: '1.3', marginBottom: '8px' }}>
          Struggling with screen time or digital consumption habits? Confidential support is available 24/7.
        </p>
        <a
          href="https://www.samhsa.gov/find-help/national-helpline"
          target="_blank"
          rel="noopener noreferrer"
          style={{
            display: 'inline-block',
            color: 'var(--color-dynamic)',
            textDecoration: 'none',
            fontSize: '0.75rem',
            fontWeight: 'bold',
          }}
        >
          Call 1-800-662-HELP &rarr;
        </a>
      </div>
    </aside>
  );
}
