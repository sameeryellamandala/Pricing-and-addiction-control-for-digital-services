import React, { useEffect, useRef } from 'react';

export default function PolicyChart({ policyCurves, sigma }) {
  const canvasRef = useRef(null);
  const chartRef = useRef(null);

  useEffect(() => {
    if (!canvasRef.current || !window.Chart) return;

    const ctx = canvasRef.current.getContext('2d');
    const Chart = window.Chart;

    chartRef.current = new Chart(ctx, {
      type: 'line',
      data: {
        datasets: [
          {
            label: 'DP + Consumption Limit (CL)',
            data: policyCurves.dp_cl,
            borderColor: '#38bdf8',
            borderWidth: 2.5,
            pointRadius: 0,
            fill: false,
            tension: 0.1,
          },
          {
            label: 'DP + Consumption Tax (CT)',
            data: policyCurves.dp_ct,
            borderColor: '#10b981',
            borderWidth: 2.5,
            pointRadius: 0,
            fill: false,
            tension: 0.1,
          },
          {
            label: 'DP + Price Floor (PF)',
            data: policyCurves.dp_pf,
            borderColor: '#f59e0b',
            borderWidth: 2,
            pointRadius: 0,
            fill: false,
            tension: 0.1,
          },
          {
            label: 'FP + Consumption Limit (CL)',
            data: policyCurves.fp_cl,
            borderColor: '#9ca3af',
            borderWidth: 1.5,
            borderDash: [5, 5],
            pointRadius: 0,
            fill: false,
          },
          {
            label: 'FP + Consumption Tax (CT)',
            data: policyCurves.fp_ct,
            borderColor: '#047857',
            borderWidth: 1.5,
            borderDash: [4, 2],
            pointRadius: 0,
            fill: false,
          },
          {
            label: 'FP + Price Floor (PF)',
            data: policyCurves.fp_pf,
            borderColor: '#4b5563',
            borderWidth: 1.5,
            borderDash: [2, 2],
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
            mode: 'nearest',
            intersect: false,
            backgroundColor: '#111827',
            titleColor: '#f3f4f6',
            bodyColor: '#f3f4f6',
            borderColor: 'rgba(255,255,255,0.1)',
            borderWidth: 1,
            callbacks: {
              title: (ctx) => `Addiction ES: ${ctx[0].parsed.x.toFixed(4)}`,
              label: (ctx) => ` ${ctx.dataset.label}: Profit = ${ctx.parsed.y.toFixed(3)}`,
            },
          },
        },
        scales: {
          x: {
            type: 'linear',
            title: { display: true, text: 'Long-run Average Addiction (ES)', color: '#9ca3af', font: { family: 'IBM Plex Mono', size: 10 } },
            grid: { color: 'rgba(255, 255, 255, 0.05)' },
            ticks: { color: '#9ca3af', font: { family: 'IBM Plex Mono', size: 9 } },
          },
          y: {
            title: { display: true, text: 'Expected Profit + Tax (Welfare)', color: '#9ca3af', font: { family: 'IBM Plex Mono', size: 10 } },
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
    
    chart.data.datasets[0].data = policyCurves.dp_cl;
    chart.data.datasets[1].data = policyCurves.dp_ct;
    chart.data.datasets[2].data = policyCurves.dp_pf;
    chart.data.datasets[3].data = policyCurves.fp_cl;
    chart.data.datasets[4].data = policyCurves.fp_ct;
    chart.data.datasets[5].data = policyCurves.fp_pf;
    
    chart.update('active');
  }, [policyCurves]);

  return (
    <div className="chart-card">
      <div className="chart-header-row">
        <h3 className="chart-title">Policy Efficiency Curve (Addiction vs. Profit)</h3>
        <div className="chart-legend" style={{ flexWrap: 'wrap', maxWidth: '70%', justifyContent: 'flex-end' }}>
          <div className="legend-item">
            <span className="legend-color" style={{ backgroundColor: '#38bdf8' }} />
            <span>DP+CL</span>
          </div>
          <div className="legend-item">
            <span className="legend-color" style={{ backgroundColor: '#10b981' }} />
            <span>DP+CT</span>
          </div>
          <div className="legend-item">
            <span className="legend-color" style={{ backgroundColor: '#f59e0b' }} />
            <span>DP+PF</span>
          </div>
          <div className="legend-item">
            <span className="legend-color" style={{ backgroundColor: '#9ca3af', border: '1px dashed' }} />
            <span>FP+CL</span>
          </div>
          <div className="legend-item">
            <span className="legend-color" style={{ backgroundColor: '#047857', border: '1px dashed' }} />
            <span>FP+CT</span>
          </div>
          <div className="legend-item">
            <span className="legend-color" style={{ backgroundColor: '#4b5563', border: '1px dotted' }} />
            <span>FP+PF</span>
          </div>
        </div>
      </div>

      <div className="chart-container">
        <canvas ref={canvasRef} />
      </div>

      <p className="chart-insight">
        {sigma === 0 ? (
          <span>
            <strong>Deterministic (σ = 0.0):</strong> The Consumption Limit (CL) curves lie highest, showing CL is the most efficient policy. By setting consumption limits, the regulator preserves dynamic pricing flexibility without deadweight loss.
          </span>
        ) : (
          <span>
            <strong>Stochastic (σ = {sigma.toFixed(1)}):</strong> The Consumption Tax (CT) curves lie highest. High experience variation causes deadweight loss for hard limits (CL) due to demand truncation. Taxes allow flexible responses to shocks, dominating CL and PF.
          </span>
        )}
      </p>
    </div>
  );
}
