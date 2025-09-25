import React from 'react';

interface SectionHeaderProps {
  title: string;
  description?: string;
  actions?: React.ReactNode;
  className?: string;
}

export function SectionHeader({ title, description, actions, className = '' }: SectionHeaderProps) {
  return (
    <div className={`flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 ${className}`}>
      <div className="flex-1">
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">{title}</h1>
        {description ? (
          <p className="text-sm sm:text-base text-muted-foreground mt-1">{description}</p>
        ) : null}
      </div>
      {actions ? (
        <div className="flex flex-row gap-3 w-full sm:w-auto">
          {actions}
        </div>
      ) : null}
    </div>
  );
}
