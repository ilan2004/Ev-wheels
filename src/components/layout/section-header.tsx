import React from 'react';

interface SectionHeaderProps {
  title: string;
  description?: string;
  actions?: React.ReactNode;
  className?: string;
}

export function SectionHeader({
  title,
  description,
  actions,
  className = ''
}: SectionHeaderProps) {
  return (
    <div
      className={`flex flex-col items-start justify-between gap-4 lg:flex-row lg:items-center ${className}`}
    >
      <div className='flex-1'>
        <h1 className='text-2xl font-bold tracking-tight sm:text-3xl'>
          {title}
        </h1>
        {description ? (
          <p className='text-muted-foreground mt-1 text-sm sm:text-base'>
            {description}
          </p>
        ) : null}
      </div>
      {actions ? (
        <div className='flex w-full flex-row gap-3 sm:w-auto'>{actions}</div>
      ) : null}
    </div>
  );
}
