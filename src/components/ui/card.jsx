// src/components/ui/card.jsx
export function Card({ children, className = '' }) {
  return <div className={`rounded-xl shadow p-4 ${className}`}>{children}</div>;
}

export function CardContent({ children }) {
  return <div>{children}</div>;
}
