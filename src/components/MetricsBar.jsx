import React from 'react';

export default function MetricsBar({ computed, valid }) {
  const { ES_F, ES_D, pF, dynamicAB } = computed;
  const b = dynamicAB?.b;

  // Format helper
  const fmt = (val, decimals = 3) => {
    if (!valid.assumption1 || isNaN(val) || val === null || val === undefined) return '—';
    return val.toFixed(decimals);
  };

  // Percentage Calculations
  let reductionPct = 0;
  let profitGainPct = 0;
  
  if (valid.assumption1 && ES_F > 0) {
    reductionPct = ((ES_F - ES_D) / ES_F) * 100;
  }
  
  // To estimate the profit gain analytically:
  // J_D - J_F / J_F
  // For simplicity, we calculate the profit gain directly from the simulation results
  const simF = computed.simFixed;
  const simD = computed.simDynamic;
  
  if (valid.assumption1 && simF && simD && simF.length > 0 && simD.length > 0) {
    const rho = computed.params?.rho || 0.95;
    const profitF = simF.reduce((acc, r, idx) => acc + Math.pow(rho, idx) * r.profit, 0);
    const profitD = simD.reduce((acc, r, idx) => acc + Math.pow(rho, idx) * r.profit, 0);
    if (profitF > 0) {
      profitGainPct = ((profitD - profitF) / profitF) * 100;
    }
  }

  return (
    <div className="metrics-bar">
      {/* Card 1: ES_F */}
      <div className="metric-card fixed">
        <span className="metric-label">Addiction — Fixed</span>
        <span className="metric-value">{fmt(ES_F)}</span>
        <span className="metric-desc">Long-run steady-state ES^F</span>
      </div>

      {/* Card 2: ES_D */}
      <div className="metric-card dynamic">
        <span className="metric-label">Addiction — Dynamic</span>
        <span className="metric-value">{fmt(ES_D)}</span>
        <span className="metric-desc">Long-run steady-state ES^D</span>
      </div>

      {/* Card 3: Addiction Reduction */}
      <div className="metric-card positive">
        <span className="metric-label">Addiction Reduction</span>
        <span className="metric-value" style={{ color: 'var(--color-success)' }}>
          {valid.assumption1 ? `↓ ${Math.abs(reductionPct).toFixed(2)}%` : '—'}
        </span>
        <span className="metric-desc">Dynamic pricing reduction</span>
      </div>

      {/* Card 4: Profit Gain */}
      <div className="metric-card positive">
        <span className="metric-label">Profit Gain</span>
        <span className="metric-value" style={{ color: 'var(--color-success)' }}>
          {valid.assumption1 ? `↑ ${profitGainPct.toFixed(2)}%` : '—'}
        </span>
        <span className="metric-desc">Dynamic pricing gain (discounted)</span>
      </div>

      {/* Card 5: Fixed Price */}
      <div className="metric-card neutral">
        <span className="metric-label">Optimal Fixed Price</span>
        <span className="metric-value">{fmt(pF, 2)}</span>
        <span className="metric-desc">p^F = λ / 2</span>
      </div>

      {/* Card 6: Dynamic Pricing Intercept */}
      <div className="metric-card dynamic">
        <span className="metric-label">Initial Dyn. Price</span>
        <span className="metric-value">{fmt(b, 2)}</span>
        <span className="metric-desc">p^D(0) = b (starter price)</span>
      </div>
    </div>
  );
}
