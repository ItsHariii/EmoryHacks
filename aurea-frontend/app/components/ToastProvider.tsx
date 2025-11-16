import React, { createContext, useContext, useState, useCallback } from 'react';
import { Toast } from './Toast';

type ToastVariant = 'success' | 'error' | 'warning' | 'info';

interface ToastContextType {
  showToast: (message: string, variant?: ToastVariant, duration?: number) => void;
  hideToast: () => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
};

interface ToastProviderProps {
  children: React.ReactNode;
}

export const ToastProvider: React.FC<ToastProviderProps> = ({ children }) => {
  const [visible, setVisible] = useState(false);
  const [message, setMessage] = useState('');
  const [variant, setVariant] = useState<ToastVariant>('info');
  const [duration, setDuration] = useState(3000);

  const showToast = useCallback(
    (msg: string, toastVariant: ToastVariant = 'info', toastDuration: number = 3000) => {
      setMessage(msg);
      setVariant(toastVariant);
      setDuration(toastDuration);
      setVisible(true);
    },
    []
  );

  const hideToast = useCallback(() => {
    setVisible(false);
  }, []);

  return (
    <ToastContext.Provider value={{ showToast, hideToast }}>
      {children}
      <Toast
        visible={visible}
        message={message}
        variant={variant}
        duration={duration}
        onDismiss={hideToast}
      />
    </ToastContext.Provider>
  );
};
