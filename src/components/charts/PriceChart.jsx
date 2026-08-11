import React, { useEffect, useRef } from 'react';

export default function PriceChart({ simFixed, simDynamic, valid }) {
  const canvasRef = useRef(null);
  const chartRef = useRef(null);

  useEffect(() => {
    if (!canvasRef.current || !window.Chart) return;

    const ctx = canvasRef.current.getContext('2d');
    const Chart = window.Chart;

    const labels = simFixed.map((r) => `t=${r.t}`);

    chartRef.current = new Chart(ctx, {
      type: 'line',
      data: {
        labels,
        datasets: [
          {
            label: 'Dynamic Price p_D(s_t)',
            data: simDynamic.map((r) => r.p),
            borderColor: '#38bdf8',
            borderWidth: 2.5,
            pointRadius: 0,
            pointHoverRadius: 4,
            tension: 0.1,
          },
          {
            label: 'Fixed Price p_F',
            data: simFixed.map((r) => r.p),
            borderColor: '#f59e0b',
            borderWidth: 2,
            borderDash: [6, 3],
            pointRadius: 0,
            pointHoverRadius: 4,
            tension: 0.0,
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
            title: { display: true, text: 'PriceCharged', color: '#9ca3af', font: { family: 'IBM Plex Mono', size: 10 } },
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

  useEffect(() => {
    if (!chartRef.current) return;
    const chart = chartRef.current;
    
    chart.data.datasets[0].data = simDynamic.map((r) => r.p);
    chart.data.datasets[1].data = simFixed.map((r) => r.p);
    chart.data.labels = simFixed.map((r) => `t=${r.t}`);
    
    chart.update('active');
  }, [simFixed, simDynamic]);

  // Find pricing crossover time
  let crossoverT = null;
  if (valid.assumption1 && simFixed.length > 0) {
    for (let t = 0; t < simFixed.length; t++) {
      if (simDynamic[t].p > simFixed[t].p) {
        crossoverT = t;
        break;
      }
    }
  }

  return (
    <div className="chart-card">
      <div className="chart-header-row">
        <h3 className="chart-title">Price Evolution</h3>
        <div className="chart-legend">
          <div className="legend-item">
            <span className="legend-color" style={{ backgroundColor: '#38bdf8' }} />
            <span>Dynamic price</span>
          </div>
          <div className="legend-item">
            <span className="legend-color" style={{ backgroundColor: '#f59e0b', border: '1px dashed' }} />
            <span>Optimal fixed price</span>
          </div>
        </div>
      </div>

      <div className="chart-container">
        <canvas ref={canvasRef} />
      </div>

      <p className="chart-insight">
        {crossoverT !== null ? (
          <span>
            <strong>Pricing Crossover (t̄):</strong> At <em>t = {crossoverT}</em>, the dynamic price crosses above the optimal fixed price. Before this point, dynamic pricing is cheaper to accelerate habit formation. After, it monetizes at a higher rate.
          </span>
        ) : (
          <span>
            <strong>Pricing Scheme:</strong> Dynamic price begins below fixed price to quickly hook the user, then rises past the fixed baseline once the user becomes addicted.
          </span>
        )}
      </p>
    </div>
  );
}
