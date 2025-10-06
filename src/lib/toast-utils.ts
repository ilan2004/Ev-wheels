import { toast } from 'sonner';

// Icon components for better visual feedback
const icons = {
  loading: '⏳',
  success: '✅',
  error: '❌',
  warning: '⚠️',
  info: 'ℹ️',
};

export interface ToastAction {
  label: string;
  onClick: () => void;
}

export interface ToastOptions {
  description?: string;
  action?: ToastAction;
  duration?: number;
  dismissible?: boolean;
  id?: string | number;
}

/**
 * Comprehensive toast notification system for user feedback
 */
export class ToastManager {
  /**
   * Show loading toast with promise handling
   */
  static async withLoading<T>(
    promise: Promise<T>,
    messages: {
      loading: string;
      success: string;
      error?: string;
    },
    options?: {
      successOptions?: ToastOptions;
      errorOptions?: ToastOptions;
    }
  ): Promise<T> {
    toast.promise(promise, {
      loading: `${icons.loading} ${messages.loading}`,
      success: `${icons.success} ${messages.success}`,
      error: (error: any) => {
        const errorMessage = messages.error || 'Operation failed';
        const errorDetails = error?.message || error?.toString() || 'Unknown error';
        return `${icons.error} ${errorMessage}: ${errorDetails}`;
      },
      ...options?.successOptions,
      ...options?.errorOptions,
    });
    
    return promise;
  }

  /**
   * Show loading toast that can be updated manually
   */
  static loading(message: string, options?: ToastOptions): string | number {
    return toast.loading(`${icons.loading} ${message}`, {
      duration: Infinity,
      dismissible: true, // Allow manual dismissal
      ...options,
    });
  }

  /**
   * Update an existing toast to success
   */
  static success(toastId: string | number, message: string, options?: ToastOptions): void;
  static success(message: string, options?: ToastOptions): string | number;
  static success(
    toastIdOrMessage: string | number,
    messageOrOptions?: string | ToastOptions,
    options?: ToastOptions
  ): string | number | void {
    if (typeof toastIdOrMessage === 'string' || typeof toastIdOrMessage === 'number') {
      if (typeof messageOrOptions === 'string') {
        // Update existing toast
        return toast.success(`${icons.success} ${messageOrOptions}`, {
          id: toastIdOrMessage,
          duration: 4000, // Auto-close after 4 seconds
          dismissible: true,
          ...options,
        });
      } else {
        // New success toast
        return toast.success(`${icons.success} ${toastIdOrMessage}`, {
          duration: 4000,
          dismissible: true,
          ...messageOrOptions,
        });
      }
    }
    return toast.success(`${icons.success} ${toastIdOrMessage}`, {
      duration: 4000,
      dismissible: true,
      ...(messageOrOptions as ToastOptions),
    });
  }

  /**
   * Update an existing toast to error
   */
  static error(toastId: string | number, message: string, options?: ToastOptions): void;
  static error(message: string, options?: ToastOptions): string | number;
  static error(
    toastIdOrMessage: string | number,
    messageOrOptions?: string | ToastOptions,
    options?: ToastOptions
  ): string | number | void {
    if (typeof toastIdOrMessage === 'string' || typeof toastIdOrMessage === 'number') {
      if (typeof messageOrOptions === 'string') {
        // Update existing toast
        return toast.error(`${icons.error} ${messageOrOptions}`, {
          id: toastIdOrMessage,
          duration: 6000, // Error messages stay longer
          dismissible: true,
          ...options,
        });
      } else {
        // New error toast
        return toast.error(`${icons.error} ${toastIdOrMessage}`, {
          duration: 6000,
          dismissible: true,
          ...messageOrOptions,
        });
      }
    }
    return toast.error(`${icons.error} ${toastIdOrMessage}`, {
      duration: 6000,
      dismissible: true,
      ...(messageOrOptions as ToastOptions),
    });
  }

  /**
   * Show warning toast
   */
  static warning(message: string, options?: ToastOptions): string | number {
    return toast.warning(`${icons.warning} ${message}`, {
      duration: 5000,
      dismissible: true,
      ...options,
    });
  }

  /**
   * Show info toast
   */
  static info(message: string, options?: ToastOptions): string | number {
    return toast.info(`${icons.info} ${message}`, {
      duration: 4000,
      dismissible: true,
      ...options,
    });
  }

  /**
   * Dismiss a specific toast
   */
  static dismiss(toastId: string | number): void {
    toast.dismiss(toastId);
  }

  /**
   * Dismiss all toasts
   */
  static dismissAll(): void {
    toast.dismiss();
  }

  /**
   * Action-specific convenience methods
   */
  static jobCard = {
    creating: () => ToastManager.loading('Creating job card...'),
    created: (toastId: string | number) => 
      ToastManager.success(toastId, 'Job card created successfully'),
    updating: () => ToastManager.loading('Updating job card...'),
    updated: (toastId: string | number) => 
      ToastManager.success(toastId, 'Job card updated successfully'),
    deleting: () => ToastManager.loading('Deleting job card...'),
    deleted: (toastId: string | number) => 
      ToastManager.success(toastId, 'Job card deleted successfully'),
  };

  static triage = {
    starting: () => ToastManager.loading('Starting triage process...'),
    processing: (toastId: string | number) => 
      toast.loading(`${icons.loading} Processing triage...`, { 
        id: toastId,
        dismissible: true
      }),
    completed: (toastId: string | number) => 
      ToastManager.success(toastId, 'Triage completed successfully'),
    failed: (toastId: string | number, error?: string) => 
      ToastManager.error(toastId, `Triage failed${error ? ': ' + error : ''}`),
  };

  static customer = {
    creating: () => ToastManager.loading('Creating customer...'),
    created: (toastId: string | number) => 
      ToastManager.success(toastId, 'Customer created successfully'),
    updating: () => ToastManager.loading('Updating customer details...'),
    updated: (toastId: string | number) => 
      ToastManager.success(toastId, 'Customer updated successfully'),
    deleting: () => ToastManager.loading('Deleting customer...'),
    deleted: (toastId: string | number) => 
      ToastManager.success(toastId, 'Customer deleted successfully'),
  };

  static ticket = {
    creating: () => ToastManager.loading('Creating service ticket...'),
    created: (toastId: string | number) => 
      ToastManager.success(toastId, 'Service ticket created successfully'),
    updating: () => ToastManager.loading('Updating ticket status...'),
    updated: (toastId: string | number) => 
      ToastManager.success(toastId, 'Ticket status updated successfully'),
    assigning: () => ToastManager.loading('Assigning ticket...'),
    assigned: (toastId: string | number) => 
      ToastManager.success(toastId, 'Ticket assigned successfully'),
  };

  static battery = {
    testing: () => ToastManager.loading('Running battery diagnostics...'),
    testCompleted: (toastId: string | number) => 
      ToastManager.success(toastId, 'Battery test completed'),
    updating: () => ToastManager.loading('Updating battery status...'),
    updated: (toastId: string | number) => 
      ToastManager.success(toastId, 'Battery status updated'),
  };

  static file = {
    uploading: () => ToastManager.loading('Uploading files...'),
    uploaded: (toastId: string | number) => 
      ToastManager.success(toastId, 'Files uploaded successfully'),
    deleting: () => ToastManager.loading('Deleting file...'),
    deleted: (toastId: string | number) => 
      ToastManager.success(toastId, 'File deleted successfully'),
  };

  static auth = {
    signingIn: () => ToastManager.loading('Signing in...'),
    signedIn: (toastId: string | number) => 
      ToastManager.success(toastId, 'Successfully signed in'),
    signingOut: () => ToastManager.loading('Signing out...'),
    signedOut: (toastId: string | number) => 
      ToastManager.success(toastId, 'Successfully signed out'),
  };

  static data = {
    loading: () => ToastManager.loading('Loading data...'),
    loaded: (toastId: string | number) => 
      ToastManager.success(toastId, 'Data loaded successfully'),
    saving: () => ToastManager.loading('Saving changes...'),
    saved: (toastId: string | number) => 
      ToastManager.success(toastId, 'Changes saved successfully'),
    refreshing: () => ToastManager.loading('Refreshing data...'),
    refreshed: (toastId: string | number) => 
      ToastManager.success(toastId, 'Data refreshed successfully'),
  };

  static export = {
    starting: () => ToastManager.loading('Preparing export...'),
    completed: (toastId: string | number) => 
      ToastManager.success(toastId, 'Export completed successfully'),
    downloading: () => ToastManager.loading('Downloading file...'),
    downloaded: (toastId: string | number) => 
      ToastManager.success(toastId, 'File downloaded successfully'),
  };

  static users = {
    creating: () => ToastManager.loading('Creating user...'),
    created: (toastId: string | number) => 
      ToastManager.success(toastId, 'User created successfully'),
    updating: () => ToastManager.loading('Updating user...'),
    updated: (toastId: string | number) => 
      ToastManager.success(toastId, 'User updated successfully'),
    deleting: () => ToastManager.loading('Deleting user...'),
    deleted: (toastId: string | number) => 
      ToastManager.success(toastId, 'User deleted successfully'),
    success: (message: string, options?: ToastOptions) => 
      ToastManager.success(message, options),
    error: (message: string, details?: string, options?: ToastOptions) => 
      ToastManager.error(details ? `${message}: ${details}` : message, options),
  };
}

// Convenience export for shorter syntax
export const toast$ = ToastManager;
