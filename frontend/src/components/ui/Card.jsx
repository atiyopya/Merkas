import React from 'react';
import './Card.css';

export default function Card({ children, className = '', glass = false, ...props }) {
  return (
    <div className={`card ${glass ? 'glass-panel' : ''} ${className}`} {...props}>
      {children}
    </div>
  );
}

export function CardHeader({ title, subtitle, action }) {
  return (
    <div className="card-header">
      <div>
        <h3 className="card-title">{title}</h3>
        {subtitle && <p className="card-subtitle">{subtitle}</p>}
      </div>
      {action && <div>{action}</div>}
    </div>
  );
}

export function CardContent({ children }) {
  return <div className="card-content">{children}</div>;
}
