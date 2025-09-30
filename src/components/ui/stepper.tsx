'use client';

import * as React from 'react';
import { CheckIcon } from '@radix-ui/react-icons';
import { cva, type VariantProps } from 'class-variance-authority';

import { cn } from '@/lib/utils';

const stepperVariants = cva('', {
  variants: {
    orientation: {
      horizontal: 'flex flex-row',
      vertical: 'flex flex-col'
    }
  },
  defaultVariants: {
    orientation: 'horizontal'
  }
});

interface StepperContextProps {
  activeStep: number;
  orientation: 'horizontal' | 'vertical';
  steps: StepItem[];
}

interface StepItem {
  id: string;
  title: string;
  description?: string;
  icon?: React.ComponentType<{ className?: string }>;
  optional?: boolean;
}

const StepperContext = React.createContext<StepperContextProps>({
  activeStep: 0,
  orientation: 'horizontal',
  steps: []
});

export interface StepperProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof stepperVariants> {
  activeStep: number;
  steps: StepItem[];
  orientation?: 'horizontal' | 'vertical';
}

const Stepper = React.forwardRef<HTMLDivElement, StepperProps>(
  (
    {
      className,
      orientation = 'horizontal',
      activeStep,
      steps,
      children,
      ...props
    },
    ref
  ) => {
    return (
      <StepperContext.Provider value={{ activeStep, orientation, steps }}>
        <div
          ref={ref}
          className={cn(stepperVariants({ orientation }), className)}
          {...props}
        >
          {children}
        </div>
      </StepperContext.Provider>
    );
  }
);
Stepper.displayName = 'Stepper';

const useStepperContext = () => {
  const context = React.useContext(StepperContext);
  if (!context) {
    throw new Error('Stepper compound components must be used within Stepper');
  }
  return context;
};

interface StepProps extends React.HTMLAttributes<HTMLDivElement> {
  index: number;
}

const Step = React.forwardRef<HTMLDivElement, StepProps>(
  ({ className, index, children, ...props }, ref) => {
    const { activeStep, orientation, steps } = useStepperContext();
    const step = steps[index];
    const isCompleted = index < activeStep;
    const isActive = index === activeStep;
    const isLast = index === steps.length - 1;

    if (!step) return null;

    return (
      <div
        ref={ref}
        className={cn(
          'flex items-center',
          orientation === 'vertical' ? 'flex-col' : '',
          className
        )}
        {...props}
      >
        <div
          className={cn(
            'flex items-center',
            orientation === 'vertical' ? 'flex-col' : ''
          )}
        >
          <div
            className={cn(
              'flex h-8 w-8 shrink-0 items-center justify-center rounded-full border-2 text-sm font-medium',
              isCompleted &&
                'border-primary bg-primary text-primary-foreground',
              isActive && 'border-primary bg-background text-primary',
              !isCompleted &&
                !isActive &&
                'border-muted-foreground text-muted-foreground'
            )}
          >
            {isCompleted ? (
              <CheckIcon className='h-4 w-4' />
            ) : step.icon ? (
              <step.icon className='h-4 w-4' />
            ) : (
              index + 1
            )}
          </div>

          {orientation === 'horizontal' && !isLast && (
            <div
              className={cn(
                'ml-2 h-0.5 w-12',
                isCompleted ? 'bg-primary' : 'bg-muted-foreground/25'
              )}
            />
          )}

          {orientation === 'vertical' && !isLast && (
            <div
              className={cn(
                'mt-2 h-12 w-0.5',
                isCompleted ? 'bg-primary' : 'bg-muted-foreground/25'
              )}
            />
          )}
        </div>

        <div
          className={cn(
            'ml-3',
            orientation === 'vertical' ? 'mt-2 ml-0 text-center' : ''
          )}
        >
          <div
            className={cn(
              'text-sm font-medium',
              isActive && 'text-primary',
              !isActive && !isCompleted && 'text-muted-foreground'
            )}
          >
            {step.title}
            {step.optional && (
              <span className='text-muted-foreground ml-1 text-xs'>
                (Optional)
              </span>
            )}
          </div>
          {step.description && (
            <div className='text-muted-foreground mt-1 text-xs'>
              {step.description}
            </div>
          )}
        </div>

        {children}
      </div>
    );
  }
);
Step.displayName = 'Step';

interface StepperStepsProps extends React.HTMLAttributes<HTMLDivElement> {}

const StepperSteps = React.forwardRef<HTMLDivElement, StepperStepsProps>(
  ({ className, ...props }, ref) => {
    const { steps, orientation } = useStepperContext();

    return (
      <div
        ref={ref}
        className={cn(
          'flex',
          orientation === 'vertical'
            ? 'flex-col space-y-4'
            : 'items-center space-x-4',
          className
        )}
        {...props}
      >
        {steps.map((_, index) => (
          <Step key={steps[index]?.id || index} index={index} />
        ))}
      </div>
    );
  }
);
StepperSteps.displayName = 'StepperSteps';

export { Stepper, Step, StepperSteps, useStepperContext };
export type { StepItem };
