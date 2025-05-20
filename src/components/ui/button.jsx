// src/components/ui/button.jsx
export function Button({ children, variant = 'default', className = '', ...props }) {
  const base = 'px-4 py-2 rounded font-semibold';
  const variants = {
    default: 'bg-blue-600 text-white hover:bg-blue-700',
    outline: 'border border-blue-600 text-blue-600 hover:bg-blue-100',
    destructive: 'bg-red-600 text-white hover:bg-red-700',
  };
  return (
    <button className={`${base} ${variants[variant]} ${className}`} {...props}>
      {children}
    </button>
  );
}
