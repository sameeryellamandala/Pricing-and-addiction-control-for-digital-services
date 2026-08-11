import React from 'react';

// Linear interpolation helper for curves
function getProfitAtES(points, targetES) {
  if (!points || points.length === 0) return null;
  
  // Sort points by ES (x) just in case
  const pts = [...points].sort((a, b) => a.x - b.x);
  
  // Edge cases
  if (targetES <= pts[0].x) return pts[0].y;
  if (targetES >= pts[pts.length - 1].x) return pts[pts.length - 1].y;

  // Find interval
  for (let i = 0; i < pts.length - 1; i++) {
    const p1 = pts[i];
    const p2 = pts[i + 1];
    if (p1.x <= targetES && targetES <= p2.x) {
      const t = (targetES - p1.x) / (p2.x - p1.x);
      return p1.y + t * (p2.y - p1.y);
    }
  }
  return null;
}

export default function PolicyCards({ computed, valid }) {
  const { ES_F, ES_D, params } = computed;
  const sigma = params?.sigma || 0.0;
  const rho = params?.rho || 0.95;

  // Formatting helpers
  const showPct = (val) => {
    if (!valid.assumption1 || isNaN(val)) return '—';
    return (val >= 0 ? '+' : '') + val.toFixed(2) + '%';
  };

  // Base computations
  let baselineProfitF = 0;
  let baselineProfitD = 0;
  let organicReduction = 0;
  let organicGain = 0;

  const simF = computed.simFixed;
  const simD = computed.simDynamic;

  if (valid.assumption1 && simF && simD && simF.length > 0 && simD.length > 0) {
    baselineProfitF = simF.reduce((acc, r, idx) => acc + Math.pow(rho, idx) * r.profit, 0);
    baselineProfitD = simD.reduce((acc, r, idx) => acc + Math.pow(rho, idx) * r.profit, 0);
    organicReduction = ((ES_F - ES_D) / ES_F) * 100;
    organicGain = ((baselineProfitD - baselineProfitF) / baselineProfitF) * 100;
  }

  // Evaluate policies at a 20% reduction target relative to Fixed Baseline ES_F
  // Target ES = 0.80 * ES_F
  const targetES = ES_F * 0.80;

  let profitCL = 0;
  let profitCT = 0;
  let profitPF = 0;

  if (valid.assumption1 && computed.policyCurves) {
    const profitCL_val = getProfitAtES(computed.policyCurves.dp_cl, targetES);
    const profitCT_val = getProfitAtES(computed.policyCurves.dp_ct, targetES);
    const profitPF_val = getProfitAtES(computed.policyCurves.dp_pf, targetES);

    if (baselineProfitF > 0 && profitCL_val !== null) {
      profitCL = ((profitCL_val - baselineProfitF) / baselineProfitF) * 100;
    }
    if (baselineProfitF > 0 && profitCT_val !== null) {
      profitCT = ((profitCT_val - baselineProfitF) / baselineProfitF) * 100;
    }
    if (baselineProfitF > 0 && profitPF_val !== null) {
      profitPF = ((profitPF_val - baselineProfitF) / baselineProfitF) * 100;
    }
  }

  // Badges based on noise (sigma)
  const clBadgeType = sigma === 0 ? 'win-win' : 'neutral';
  const clBadgeLabel = sigma === 0 ? 'Optimal (σ=0)' : 'Lossy under σ';

  const ctBadgeType = sigma > 0 ? 'recommended' : 'recommended';
  const ctBadgeLabel = sigma > 0 ? 'Optimal (σ>0)' : 'Second best';

  return (
    <div className="policy-cards">
      {/* Card 1: Dynamic Pricing Alone */}
      <div className="policy-card">
        <div className="policy-card-header">
          <span className="policy-name">Dynamic Alone</span>
          <span className="policy-badge win-win">Win-Win</span>
        </div>
        <div className="policy-stat">
          <span className="policy-stat-label">Addiction Cut:</span>
          <span className="policy-stat-value" style={{ color: 'var(--color-success)' }}>
            {showPct(-organicReduction)}
          </span>
        </div>
        <div className="policy-stat">
          <span className="policy-stat-label">Profit Change:</span>
          <span className="policy-stat-value" style={{ color: 'var(--color-success)' }}>
            {showPct(organicGain)}
          </span>
        </div>
      </div>

      {/* Card 2: DP + Consumption Limit */}
      <div className="policy-card">
        <div className="policy-card-header">
          <span className="policy-name">DP + Limit (CL)</span>
          <span className={`policy-badge ${clBadgeType === 'win-win' ? 'win-win' : ''}`} style={{
            backgroundColor: clBadgeType === 'neutral' ? 'var(--color-bg-card)' : '',
            color: clBadgeType === 'neutral' ? 'var(--color-text-muted)' : ''
          }}>
            {clBadgeLabel}
          </span>
        </div>
        <div className="policy-stat">
          <span className="policy-stat-label">At 20% ES Reduction:</span>
          <span className="policy-stat-value">Target ES: {targetES.toFixed(3)}</span>
        </div>
        <div className="policy-stat">
          <span className="policy-stat-label">Profit Change vs Fixed:</span>
          <span className="policy-stat-value" style={{ color: profitCL >= 0 ? 'var(--color-success)' : 'var(--color-danger)' }}>
            {showPct(profitCL)}
          </span>
        </div>
      </div>

      {/* Card 3: DP + Consumption Tax */}
      <div className="policy-card">
        <div className="policy-card-header">
          <span className="policy-name">DP + Tax (CT)</span>
          <span className="policy-badge recommended" style={{
            backgroundColor: sigma > 0 ? 'var(--color-success-bg)' : 'var(--color-dynamic-bg)',
            color: sigma > 0 ? 'var(--color-success)' : 'var(--color-dynamic)'
          }}>
            {sigma > 0 ? 'Optimal (σ>0)' : 'Recommended'}
          </span>
        </div>
        <div className="policy-stat">
          <span className="policy-stat-label">At 20% ES Reduction:</span>
          <span className="policy-stat-value">Robust to Noise</span>
        </div>
        <div className="policy-stat">
          <span className="policy-stat-label">Profit+Tax vs Fixed:</span>
          <span className="policy-stat-value" style={{ color: profitCT >= 0 ? 'var(--color-success)' : 'var(--color-danger)' }}>
            {showPct(profitCT)}
          </span>
        </div>
      </div>

      {/* Card 4: Fixed + Price Floor */}
      <div className="policy-card">
        <div className="policy-card-header">
          <span className="policy-name">Fixed + Floor (PF)</span>
          <span className="policy-badge worst">Worst Policy</span>
        </div>
        <div className="policy-stat">
          <span className="policy-stat-label">At 20% ES Reduction:</span>
          <span className="policy-stat-value">Least Efficient</span>
        </div>
        <div className="policy-stat">
          <span className="policy-stat-label">Profit Change vs Fixed:</span>
          <span className="policy-stat-value" style={{ color: profitPF >= 0 ? 'var(--color-success)' : 'var(--color-danger)' }}>
            {showPct(profitPF)}
          </span>
        </div>
      </div>
    </div>
  );
}
