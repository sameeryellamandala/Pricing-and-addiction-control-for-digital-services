import React, { useState, useMemo, useEffect, useRef } from 'react';
import ParameterPanel from './components/ParameterPanel';
import MetricsBar from './components/MetricsBar';
import TabNav from './components/TabNav';
import PolicyCards from './components/PolicyCards';
import AddictionChart from './components/charts/AddictionChart';
import PriceChart from './components/charts/PriceChart';
import ConsumptionChart from './components/charts/ConsumptionChart';
import PolicyChart from './components/charts/PolicyChart';

import { validateParams } from './math/assertions';
import { computeFixedPrice, solveDynamicAB, computeES_F, computeES_D } from './math/model';
import { simulate } from './math/simulate';
import { buildAllEfficiencyCurves } from './math/policyEngine';

const INITIAL_PARAMS = {
  lam: 3.5,
  eta: 2.68,
  mu: 0.30,
  zeta: 3.08,
  rho: 0.95,
  sigma: 0.0,
  T: 25,
};

export default function App() {
  // --- Original Model States ---
  const [params, setParams] = useState(INITIAL_PARAMS);
  const [activeTab, setActiveTab] = useState('addiction');

  // --- De-Addiction Simulator States ---
  const [s0, setS0] = useState(50);
  const [deAddictionMu, setDeAddictionMu] = useState(0.4);
  const [deAddictionZeta, setDeAddictionZeta] = useState(1.5);
  const [deAddictionEta, setDeAddictionEta] = useState(2.0);
  const [deAddictionLambda, setDeAddictionLambda] = useState(15.0);
  const [C, setC] = useState(2.0);
  const [A, setA] = useState(8.0);
  const [delta, setDelta] = useState(0.2);

  // References for De-Addiction Chart
  const deAddictionCanvasRef = useRef(null);
  const deAddictionChartRef = useRef(null);

  // --- Original Model Calculations (useMemo) ---
  const validation = useMemo(() => {
    return validateParams(params);
  }, [params]);

  const computed = useMemo(() => {
    if (!validation.isValid) {
      return {
        pF: 0,
        dynamicAB: { a: 0, b: 0 },
        ES_F: 0,
        ES_D: 0,
        simFixed: [],
        simDynamic: [],
        policyCurves: null,
        params,
      };
    }

    const pF = computeFixedPrice(params);
    const dynamicAB = solveDynamicAB(params);
    const ES_F = computeES_F(params);
    const ES_D = computeES_D(params);

    const simFixed = simulate(true, params);
    const simDynamic = simulate(false, params);

    const policyCurves = buildAllEfficiencyCurves(params);

    return {
      pF,
      dynamicAB,
      ES_F,
      ES_D,
      simFixed,
      simDynamic,
      policyCurves,
      params,
    };
  }, [params, validation.isValid]);

  // --- De-Addiction Simulator Calculations ---
  const deAddictionAlpha = deAddictionMu * (1 + deAddictionZeta / deAddictionEta);
  const isDeAddictionStable = deAddictionAlpha < 1;

  const calculateT = (AthVal, s_star, s_0, alphaVal) => {
    if (alphaVal >= 1 || alphaVal <= 0) return null;
    const num = AthVal - s_star;
    const den = s_0 - s_star;
    if (Math.abs(den) < 1e-9) return null;
    const valInsideLog = num / den;
    if (valInsideLog <= 0) return null;
    const t = Math.log(valInsideLog) / Math.log(alphaVal);
    return isFinite(t) ? t : null;
  };

  // --- De-Addiction Chart Render Effect ---
  useEffect(() => {
    if (activeTab !== 'deaddiction' || !deAddictionCanvasRef.current || !window.Chart) return;

    // Generate x-axis data points (Price p from 0.5 to lambda in steps of 0.1)
    const pValues = [];
    const step = 0.1;
    for (let p = 0.5; p <= deAddictionLambda; p += step) {
      pValues.push(Number(p.toFixed(2)));
    }
    if (pValues[pValues.length - 1] < deAddictionLambda) {
      pValues.push(Number(deAddictionLambda.toFixed(2)));
    }

    const dataAdaptive = [];
    const dataConstantGap = [];
    const dataRelativeGap = [];
    const dataConstant = [];
    const dataConstantFraction = [];

    pValues.forEach((p) => {
      const beta = (deAddictionMu * (deAddictionLambda - p)) / deAddictionEta;
      const s_star = beta / (1 - deAddictionAlpha);

      // 1. Adaptive Threshold
      const theta = (deAddictionEta + (deAddictionMu + deAddictionZeta) * (p / deAddictionLambda)) / deAddictionEta;
      const AthAdaptive = theta * s_star;
      dataAdaptive.push(calculateT(AthAdaptive, s_star, s0, deAddictionAlpha));

      // 2. Constant Gap Threshold
      const AthConstantGap = s_star + C;
      dataConstantGap.push(calculateT(AthConstantGap, s_star, s0, deAddictionAlpha));

      // 3. Relative Gap Threshold: t = ln(delta) / ln(alpha)
      let tRelative = null;
      if (deAddictionAlpha < 1 && deAddictionAlpha > 0 && delta > 0) {
        const val = Math.log(delta) / Math.log(deAddictionAlpha);
        if (isFinite(val)) tRelative = val;
      }
      dataRelativeGap.push(tRelative);

      // 4. Constant Threshold: Ath = A
      const AthConstant = A;
      dataConstant.push(calculateT(AthConstant, s_star, s0, deAddictionAlpha));

      // 5. Constant Fraction Threshold: Ath = delta * s0
      const AthConstantFraction = delta * s0;
      dataConstantFraction.push(calculateT(AthConstantFraction, s_star, s0, deAddictionAlpha));
    });

    if (deAddictionChartRef.current) {
      deAddictionChartRef.current.destroy();
    }

    const ctx = deAddictionCanvasRef.current.getContext('2d');
    deAddictionChartRef.current = new window.Chart(ctx, {
      type: 'line',
      data: {
        labels: pValues,
        datasets: [
          {
            label: 'Adaptive Threshold',
            data: dataAdaptive,
            borderColor: '#38bdf8',
            backgroundColor: 'rgba(56, 189, 248, 0.1)',
            borderWidth: 3,
            pointRadius: 0,
            pointHoverRadius: 6,
            tension: 0.15,
          },
          {
            label: 'Constant Gap Threshold',
            data: dataConstantGap,
            borderColor: '#f59e0b',
            backgroundColor: 'rgba(245, 158, 11, 0.1)',
            borderWidth: 3,
            pointRadius: 0,
            pointHoverRadius: 6,
            tension: 0.15,
          },
          {
            label: 'Relative Gap Threshold',
            data: dataRelativeGap,
            borderColor: '#10b981',
            backgroundColor: 'rgba(16, 185, 129, 0.1)',
            borderWidth: 3,
            pointRadius: 0,
            pointHoverRadius: 6,
            tension: 0.15,
          },
          {
            label: 'Constant Threshold',
            data: dataConstant,
            borderColor: '#ec4899',
            backgroundColor: 'rgba(236, 72, 153, 0.1)',
            borderWidth: 3,
            pointRadius: 0,
            pointHoverRadius: 6,
            tension: 0.15,
          },
          {
            label: 'Constant Fraction Threshold',
            data: dataConstantFraction,
            borderColor: '#a855f7',
            backgroundColor: 'rgba(168, 85, 247, 0.1)',
            borderWidth: 3,
            pointRadius: 0,
            pointHoverRadius: 6,
            tension: 0.15,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: 'top',
            labels: {
              color: '#f3f4f6',
              font: {
                family: "'IBM Plex Mono', 'Courier New', monospace",
                size: 11,
              },
            },
          },
          tooltip: {
            mode: 'index',
            intersect: false,
            backgroundColor: '#111827',
            titleColor: '#38bdf8',
            bodyColor: '#f3f4f6',
            borderColor: 'rgba(255, 255, 255, 0.1)',
            borderWidth: 1,
            bodyFont: {
              family: "'IBM Plex Mono', 'Courier New', monospace",
            },
            titleFont: {
              family: "'IBM Plex Mono', 'Courier New', monospace",
              weight: 'bold',
            },
          },
        },
        scales: {
          x: {
            title: {
              display: true,
              text: 'Price (p)',
              color: '#9ca3af',
              font: {
                family: "'IBM Plex Serif', Georgia, serif",
                size: 12,
                weight: 'bold',
              },
            },
            ticks: {
              color: '#9ca3af',
              font: {
                family: "'IBM Plex Mono', 'Courier New', monospace",
                size: 10,
              },
            },
            grid: {
              color: 'rgba(255, 255, 255, 0.05)',
            },
          },
          y: {
            title: {
              display: true,
              text: 'Recovery Time (t)',
              color: '#9ca3af',
              font: {
                family: "'IBM Plex Serif', Georgia, serif",
                size: 12,
                weight: 'bold',
              },
            },
            ticks: {
              color: '#9ca3af',
              font: {
                family: "'IBM Plex Mono', 'Courier New', monospace",
                size: 10,
              },
            },
            grid: {
              color: 'rgba(255, 255, 255, 0.05)',
            },
          },
        },
      },
    });

    return () => {
      if (deAddictionChartRef.current) {
        deAddictionChartRef.current.destroy();
      }
    };
  }, [activeTab, s0, deAddictionMu, deAddictionZeta, deAddictionEta, deAddictionLambda, C, A, delta, deAddictionAlpha]);

  return (
    <div className="app-container">
      {/* Sidebar - Parameter Panel / De-Addiction Controls */}
      {activeTab === 'deaddiction' ? (
        <aside className="sidebar">
          <h2>De-Addiction Model</h2>
          <p className="sidebar-subtitle">
            Adjust the sliders below to explore recovery dynamics across the five thresholds.
          </p>

          {/* Sliders */}
          <div className="slider-group">
            <div className="slider-header">
              <span className="slider-label">Initial Addiction (s₀)</span>
              <span className="slider-value">{s0}</span>
            </div>
            <input
              type="range" min="10" max="100" step="1"
              value={s0} onChange={(e) => setS0(Number(e.target.value))}
              className="slider-input"
            />
          </div>

          <div className="slider-group">
            <div className="slider-header">
              <span className="slider-label">Persistence (μ)</span>
              <span className="slider-value">{deAddictionMu.toFixed(2)}</span>
            </div>
            <input
              type="range" min="0.1" max="0.99" step="0.01"
              value={deAddictionMu} onChange={(e) => setDeAddictionMu(Number(e.target.value))}
              className={`slider-input ${!isDeAddictionStable ? 'slider-error' : ''}`}
            />
          </div>

          <div className="slider-group">
            <div className="slider-header">
              <span className="slider-label">Habit Strength (ζ)</span>
              <span className="slider-value">{deAddictionZeta.toFixed(1)}</span>
            </div>
            <input
              type="range" min="0.1" max="5.0" step="0.1"
              value={deAddictionZeta} onChange={(e) => setDeAddictionZeta(Number(e.target.value))}
              className={`slider-input ${!isDeAddictionStable ? 'slider-error' : ''}`}
            />
          </div>

          <div className="slider-group">
            <div className="slider-header">
              <span className="slider-label">Price Sensitivity (η)</span>
              <span className="slider-value">{deAddictionEta.toFixed(1)}</span>
            </div>
            <input
              type="range" min="0.1" max="5.0" step="0.1"
              value={deAddictionEta} onChange={(e) => setDeAddictionEta(Number(e.target.value))}
              className={`slider-input ${!isDeAddictionStable ? 'slider-error' : ''}`}
            />
          </div>

          <div className="slider-group">
            <div className="slider-header">
              <span className="slider-label">Intrinsic Utility (λ)</span>
              <span className="slider-value">{deAddictionLambda.toFixed(1)}</span>
            </div>
            <input
              type="range" min="5.0" max="30.0" step="0.5"
              value={deAddictionLambda} onChange={(e) => setDeAddictionLambda(Number(e.target.value))}
              className="slider-input"
            />
          </div>

          <div className="slider-group">
            <div className="slider-header">
              <span className="slider-label">Constant Gap (C)</span>
              <span className="slider-value">{C.toFixed(1)}</span>
            </div>
            <input
              type="range" min="0.1" max="10.0" step="0.1"
              value={C} onChange={(e) => setC(Number(e.target.value))}
              className="slider-input"
            />
          </div>

          <div className="slider-group">
            <div className="slider-header">
              <span className="slider-label">Constant Target (A)</span>
              <span className="slider-value">{A.toFixed(1)}</span>
            </div>
            <input
              type="range" min="1.0" max="20.0" step="0.5"
              value={A} onChange={(e) => setA(Number(e.target.value))}
              className="slider-input"
            />
          </div>

          <div className="slider-group">
            <div className="slider-header">
              <span className="slider-label">Target Fraction (δ)</span>
              <span className="slider-value">{delta.toFixed(2)}</span>
            </div>
            <input
              type="range" min="0.01" max="0.5" step="0.01"
              value={delta} onChange={(e) => setDelta(Number(e.target.value))}
              className="slider-input"
            />
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
      ) : (
        <ParameterPanel params={params} onChange={setParams} />
      )}

      {/* Main Content Dashboard */}
      <main className="main-content">
        <header className="main-header">
          <h1 className="main-title">Pricing & Addiction Control Panel</h1>
          <TabNav activeTab={activeTab} onSelect={setActiveTab} />
        </header>

        {activeTab === 'deaddiction' ? (
          <>
            {/* Global Stability Error Banner */}
            {!isDeAddictionStable && (
              <div className="error-banner" style={{ margin: 0 }}>
                <strong>System Unstable:</strong> The stability coefficient α is {deAddictionAlpha.toFixed(2)} (≥ 1.0). When persistence
                exceeds recovery capability, addiction stock does not converge to a finite equilibrium. Sliders highlights in red have been flagged. Please reduce Persistence (μ) or Habit (ζ), or increase Price Sensitivity (η).
              </div>
            )}

            {/* Live Metrics Row */}
            <div className="metrics-bar">
              <div className={`metric-card ${isDeAddictionStable ? 'positive' : 'worst'}`} style={{ minHeight: 'auto', padding: '12px' }}>
                <span className="metric-label">Stability Coefficient (α)</span>
                <div className="metric-value" style={{ fontSize: '1.4rem' }}>
                  {deAddictionAlpha.toFixed(3)}
                </div>
                <span className="metric-desc">
                  System is {isDeAddictionStable ? 'Stable (α < 1)' : 'Unstable (α ≥ 1)'}
                </span>
              </div>

              <div className="metric-card neutral" style={{ minHeight: 'auto', padding: '12px' }}>
                <span className="metric-label">Initial Addiction (s₀)</span>
                <div className="metric-value" style={{ fontSize: '1.4rem' }}>
                  {s0}
                </div>
                <span className="metric-desc">Starting consumption baseline</span>
              </div>

              <div className="metric-card dynamic" style={{ minHeight: 'auto', padding: '12px' }}>
                <span className="metric-label">Steady-State s* Range</span>
                <div className="metric-value" style={{ fontSize: '1.2rem', gap: '4px' }}>
                  {isDeAddictionStable
                    ? `${( (deAddictionMu * (deAddictionLambda - 0.5)) / (deAddictionEta * (1 - deAddictionAlpha)) ).toFixed(1)} → 0`
                    : 'N/A'}
                </div>
                <span className="metric-desc">From p=0.5 to p=λ</span>
              </div>
            </div>

            {/* Chart Panel */}
            <div className="chart-card">
              <div className="chart-header-row">
                <h3 className="chart-title">Recovery Time (t) vs. Price (p)</h3>
              </div>
              <div className="chart-container" style={{ height: '380px' }}>
                <canvas ref={deAddictionCanvasRef} />
              </div>
              <div className="chart-insight">
                * Lines are automatically hidden or interrupted if calculations trigger safe logarithms (e.g. Ath &le; s* or when alpha &ge; 1).
              </div>
            </div>

            {/* Mathematical Reference Card */}
            <div className="chart-card" style={{ gap: '10px' }}>
              <h3 className="chart-title" style={{ fontSize: '1rem', fontFamily: 'var(--font-serif)' }}>
                Mathematical Formulations Reference
              </h3>
              <div style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', lineHeight: '1.5' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '150px 1fr', gap: '8px', marginBottom: '8px' }}>
                  <strong>Adaptive:</strong>
                  <span>A_th = θ(p) * s* where θ(p) = (η + (μ + ζ)*(p / λ)) / η</span>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '150px 1fr', gap: '8px', marginBottom: '8px' }}>
                  <strong>Constant Gap:</strong>
                  <span>A_th = s* + C</span>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '150px 1fr', gap: '8px', marginBottom: '8px' }}>
                  <strong>Relative Gap:</strong>
                  <span>t = ln(δ) / ln(α)</span>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '150px 1fr', gap: '8px', marginBottom: '8px' }}>
                  <strong>Constant:</strong>
                  <span>A_th = A</span>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '150px 1fr', gap: '8px' }}>
                  <strong>Constant Fraction:</strong>
                  <span>A_th = δ * s₀</span>
                </div>
              </div>
            </div>
          </>
        ) : (
          <>
            {/* Metrics Grid */}
            <MetricsBar computed={computed} valid={validation} />

            {/* Tab Views */}
            {validation.isValid ? (
              <>
                {activeTab === 'addiction' && (
                  <AddictionChart
                    simFixed={computed.simFixed}
                    simDynamic={computed.simDynamic}
                    ES_F={computed.ES_F}
                    ES_D={computed.ES_D}
                    valid={validation}
                  />
                )}

                {activeTab === 'price' && (
                  <PriceChart
                    simFixed={computed.simFixed}
                    simDynamic={computed.simDynamic}
                    valid={validation}
                  />
                )}

                {activeTab === 'consumption' && (
                  <ConsumptionChart
                    simFixed={computed.simFixed}
                    simDynamic={computed.simDynamic}
                  />
                )}

                {activeTab === 'policy' && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-md)' }}>
                    <PolicyCards computed={computed} valid={validation} />
                    <PolicyChart policyCurves={computed.policyCurves} sigma={params.sigma} />
                  </div>
                )}
              </>
            ) : (
              <div style={{
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
                alignItems: 'center',
                minHeight: '300px',
                border: '1px dashed var(--color-border)',
                borderRadius: 'var(--border-radius-lg)',
                backgroundColor: 'var(--color-bg-panel)',
                color: 'var(--color-text-muted)',
                padding: 'var(--spacing-lg)',
                textAlign: 'center'
              }}>
                <svg width="48" height="48" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ marginBottom: 'var(--spacing-md)', color: 'var(--color-danger)' }}>
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
                <h3 style={{ fontFamily: 'var(--font-serif)', fontSize: '1.2rem', marginBottom: 'var(--spacing-sm)', color: 'var(--color-text-main)' }}>Simulation Locked</h3>
                <p style={{ maxWidth: '450px', fontSize: '0.85rem' }}>
                  Please adjust the parameter sliders in the sidebar panel to satisfy the model assumptions before the simulation can run.
                </p>
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
}
