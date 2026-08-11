import React from 'react';

const TABS = [
  { id: 'addiction', label: 'Addiction Path' },
  { id: 'price', label: 'Price Evolution' },
  { id: 'consumption', label: 'Consumption Path' },
  { id: 'policy', label: 'Policy Efficiency' },
  { id: 'deaddiction', label: 'De-Addiction Simulator' },
];

export default function TabNav({ activeTab, onSelect }) {
  return (
    <nav className="tab-nav">
      {TABS.map(({ id, label }) => (
        <button
          key={id}
          className={`tab-btn ${activeTab === id ? 'active' : ''}`}
          onClick={() => onSelect(id)}
        >
          {label}
        </button>
      ))}
    </nav>
  );
}
