// components/ui/card.jsx
import React, { forwardRef } from 'react';
import clsx from 'clsx';

export const Card = forwardRef(({ className, ...props }, ref) => {
  return (
    <div
      ref={ref}
      className={clsx('rounded border text-black shadow-sm', className)}
      {...props}
    />
  );
});

export const CardContent = ({ className, ...props }) => {
  return (
    <div className={clsx('p-4', className)} {...props} />
  );
};
