import React, { useEffect, useRef } from 'react';

export default function AddictionChart({ simFixed, simDynamic, ES_F, ES_D, valid }) {
  const canvasRef = useRef(null);
  const chartRef = useRef(null);

  useEffect(() => {
    if (!canvasRef.current || !window.Chart) return;

    const ctx = canvasRef.current.getContext('2d');
    const Chart = window.Chart;

    const labels = simFixed.map((r) => `t=${r.t}`);
    
    // Construct constant arrays for analytical lines
    const esFLine = simFixed.map(() => ES_F);
    const esDLine = simFixed.map(() => ES_D);

    chartRef.current = new Chart(ctx, {
      type: 'line',
      data: {
        labels,
        datasets: [
          {
            label: 'Dynamic Pricing Path',
            data: simDynamic.map((r) => r.s),
            borderColor: '#38bdf8',
            backgroundColor: 'rgba(56, 189, 248, 0.1)',
            borderWidth: 2.5,
            pointRadius: 0,
            pointHoverRadius: 4,
            tension: 0.2,
          },
          {
            label: 'Fixed Pricing Path',
            data: simFixed.map((r) => r.s),
            borderColor: '#f59e0b',
            borderWidth: 2,
            borderDash: [6, 3],
            pointRadius: 0,
            pointHoverRadius: 4,
            tension: 0.2,
          },
          {
            label: 'Long-run steady-state ES^D',
            data: esDLine,
            borderColor: 'rgba(56, 189, 248, 0.5)',
            borderWidth: 1,
            borderDash: [2, 4],
            pointRadius: 0,
            fill: false,
          },
          {
            label: 'Long-run steady-state ES^F',
            data: esFLine,
            borderColor: 'rgba(245, 158, 11, 0.5)',
            borderWidth: 1,
            borderDash: [2, 4],
            pointRadius: 0,
            fill: false,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        animation: { duration: 400, easing: 'easeInOutQuart' },
        plugins: {
          legend: { display: false },
          tooltip: {
            mode: 'index',
            intersect: false,
            backgroundColor: '#111827',
            titleColor: '#f3f4f6',
            bodyColor: '#f3f4f6',
            borderColor: 'rgba(255,255,255,0.1)',
            borderWidth: 1,
            callbacks: {
              label: (ctx) => ` ${ctx.dataset.label}: ${ctx.parsed.y.toFixed(3)}`,
            },
          },
        },
        scales: {
          x: {
            title: { display: true, text: 'Period t', color: '#9ca3af', font: { family: 'IBM Plex Mono', size: 10 } },
            grid: { color: 'rgba(255, 255, 255, 0.05)' },
            ticks: { color: '#9ca3af', font: { family: 'IBM Plex Mono', size: 9 } },
          },
          y: {
            title: { display: true, text: 'Addiction Stock s_t', color: '#9ca3af', font: { family: 'IBM Plex Mono', size: 10 } },
            grid: { color: 'rgba(255, 255, 255, 0.05)' },
            ticks: { color: '#9ca3af', font: { family: 'IBM Plex Mono', size: 9 } },
          },
        },
      },
    });

    return () => {
      if (chartRef.current) {
        chartRef.current.destroy();
      }
    };
  }, []);

  // Update chart data when data changes
  useEffect(() => {
    if (!chartRef.current) return;
    const chart = chartRef.current;
    
    chart.data.datasets[0].data = simDynamic.map((r) => r.s);
    chart.data.datasets[1].data = simFixed.map((r) => r.s);
    chart.data.datasets[2].data = simFixed.map(() => ES_D);
    chart.data.datasets[3].data = simFixed.map(() => ES_F);
    chart.data.labels = simFixed.map((r) => `t=${r.t}`);
    
    chart.update('active');
  }, [simFixed, simDynamic, ES_F, ES_D]);

  // Find crossover point for display
  let crossoverT = null;
  if (valid.assumption1 && simFixed.length > 0) {
    for (let t = 0; t < simFixed.length; t++) {
      // Addiction starts lower in fixed than dynamic?
      // Actually, under dynamic pricing, price starts low so consumption builds addiction faster.
      // So early on, dynamic s_t > fixed s_t.
      // Later, dynamic s_t crossover and becomes lower than fixed s_t.
      if (t > 1 && simDynamic[t].s < simFixed[t].s && simDynamic[t-1].s >= simFixed[t-1].s) {
        crossoverT = t;
        break;
      }
    }
  }

  return (
    <div className="chart-card">
      <div className="chart-header-row">
        <h3 className="chart-title">Addiction Stock Accumulation</h3>
        <div className="chart-legend">
          <div className="legend-item">
            <span className="legend-color" style={{ backgroundColor: '#38bdf8' }} />
            <span>Dynamic pricing</span>
          </div>
          <div className="legend-item">
            <span className="legend-color" style={{ backgroundColor: '#f59e0b', border: '1px dashed' }} />
            <span>Fixed pricing</span>
          </div>
        </div>
      </div>

      <div className="chart-container">
        <canvas ref={canvasRef} />
      </div>

      <p className="chart-insight">
        {crossoverT !== null ? (
          <span>
            <strong>Theorem 1 Crossover:</strong> Around period <em>t = {crossoverT}</em>, dynamic pricing's high-addiction monetization phase overrides the build-up phase. The dynamic path drops below fixed pricing, suppressing long-run addiction.
          </span>
        ) : (
          <span>
            <strong>Theorem 1:</strong> Dynamic pricing builds addiction faster in the early stage (low starter pack price) but suppresses it in the long run (higher monetization prices).
          </span>
        )}
      </p>
    </div>
  );
}
