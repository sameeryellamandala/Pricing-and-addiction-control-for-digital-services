import React, { useEffect, useRef } from 'react';

export default function ConsumptionChart({ simFixed, simDynamic }) {
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
            label: 'Dynamic Consumption x_t^D',
            data: simDynamic.map((r) => r.x),
            borderColor: '#38bdf8',
            backgroundColor: 'rgba(56, 189, 248, 0.05)',
            borderWidth: 2.5,
            pointRadius: 0,
            pointHoverRadius: 4,
            fill: true,
            tension: 0.2,
          },
          {
            label: 'Fixed Consumption x_t^F',
            data: simFixed.map((r) => r.x),
            borderColor: '#f59e0b',
            backgroundColor: 'rgba(245, 158, 11, 0.02)',
            borderWidth: 2,
            borderDash: [6, 3],
            pointRadius: 0,
            pointHoverRadius: 4,
            fill: true,
            tension: 0.2,
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
            title: { display: true, text: 'Consumption x_t', color: '#9ca3af', font: { family: 'IBM Plex Mono', size: 10 } },
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
    
    chart.data.datasets[0].data = simDynamic.map((r) => r.x);
    chart.data.datasets[1].data = simFixed.map((r) => r.x);
    chart.data.labels = simFixed.map((r) => `t=${r.t}`);
    
    chart.update('active');
  }, [simFixed, simDynamic]);

  return (
    <div className="chart-card">
      <div className="chart-header-row">
        <h3 className="chart-title">Consumer Consumption Curve</h3>
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
        <strong>Consumption Shocks:</strong> Shaded regions represent cumulative consumption volumes. Under dynamic pricing, consumption increases initially due to lower pricing, but drops in later periods as prices escalate.
      </p>
    </div>
  );
}
