import React, { createContext, useContext, useState, useEffect } from 'react';
import { CheckCircle, XCircle, AlertTriangle, Info } from 'lucide-react';

const AlertContext = createContext();

export function AlertProvider({ children }) {
  const [alertState, setAlertState] = useState({
    isOpen: false,
    message: '',
    type: 'info' // 'success', 'error', 'warning', 'info'
  });

  const showAlert = (message, type = 'info') => {
    setAlertState({ isOpen: true, message, type });
  };

  const closeAlert = () => {
    setAlertState({ ...alertState, isOpen: false });
  };

  // Auto-close success messages after 3 seconds
  useEffect(() => {
    if (alertState.isOpen && alertState.type === 'success') {
      const timer = setTimeout(closeAlert, 2500);
      return () => clearTimeout(timer);
    }
  }, [alertState]);

  return (
    <AlertContext.Provider value={{ showAlert }}>
      {children}
      
      {alertState.isOpen && (
        <div style={overlayStyle} onClick={closeAlert}>
          <div 
            style={modalStyle} 
            onClick={e => e.stopPropagation()}
            className="glass-alert-modal"
          >
            <div style={iconContainerStyle(alertState.type)}>
              {alertState.type === 'success' && <CheckCircle size={32} color="#10b981" />}
              {alertState.type === 'error' && <XCircle size={32} color="#ef4444" />}
              {alertState.type === 'warning' && <AlertTriangle size={32} color="#f59e0b" />}
              {alertState.type === 'info' && <Info size={32} color="#3b82f6" />}
            </div>
            
            <h3 style={titleStyle(alertState.type)}>
              {alertState.type === 'success' && 'Başarılı'}
              {alertState.type === 'error' && 'Hata!'}
              {alertState.type === 'warning' && 'Uyarı'}
              {alertState.type === 'info' && 'Bilgilendirme'}
            </h3>
            
            <p style={messageStyle}>{alertState.message}</p>
            
            <button style={buttonStyle(alertState.type)} onClick={closeAlert}>
              Tamam
            </button>
          </div>
        </div>
      )}
    </AlertContext.Provider>
  );
}

export const useAlert = () => useContext(AlertContext);

// Styles
const overlayStyle = {
  position: 'fixed',
  top: 0, left: 0, right: 0, bottom: 0,
  backgroundColor: 'rgba(255, 255, 255, 0.15)',
  backdropFilter: 'blur(8px)',
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
  zIndex: 9999,
  animation: 'fadeIn 0.2s ease-out'
};

const modalStyle = {
  background: 'linear-gradient(145deg, rgba(255,255,255,0.95), rgba(245,247,250,0.95))',
  border: '1px solid rgba(255,255,255,0.6)',
  boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.15), 0 0 40px rgba(255,255,255,0.6) inset',
  borderRadius: '20px',
  padding: '2.5rem 2rem',
  width: '90%',
  maxWidth: '400px',
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  textAlign: 'center',
  transform: 'translateY(0)',
  animation: 'slideUp 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)'
};

const iconContainerStyle = (type) => ({
  width: '64px',
  height: '64px',
  borderRadius: '50%',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  marginBottom: '1rem',
  background: type === 'success' ? 'rgba(16, 185, 129, 0.1)' :
              type === 'error' ? 'rgba(239, 68, 68, 0.1)' :
              type === 'warning' ? 'rgba(245, 158, 11, 0.1)' :
              'rgba(59, 130, 246, 0.1)'
});

const titleStyle = (type) => ({
  margin: '0 0 0.5rem 0',
  fontSize: '1.5rem',
  fontWeight: '700',
  color: type === 'success' ? '#059669' :
         type === 'error' ? '#dc2626' :
         type === 'warning' ? '#d97706' :
         '#2563eb'
});

const messageStyle = {
  color: 'var(--color-text-main)',
  fontSize: '1rem',
  marginBottom: '1.5rem',
  lineHeight: 1.5,
  fontWeight: 500
};

const buttonStyle = (type) => {
  const bg = type === 'success' ? 'linear-gradient(135deg, #10b981, #059669)' :
             type === 'error' ? 'linear-gradient(135deg, #ef4444, #dc2626)' :
             type === 'warning' ? 'linear-gradient(135deg, #f59e0b, #d97706)' :
             'linear-gradient(135deg, #3b82f6, #2563eb)';
             
  const shadow = type === 'success' ? 'rgba(16, 185, 129, 0.3)' :
                 type === 'error' ? 'rgba(239, 68, 68, 0.3)' :
                 type === 'warning' ? 'rgba(245, 158, 11, 0.3)' :
                 'rgba(59, 130, 246, 0.3)';

  return {
    background: bg,
    color: 'white',
    border: 'none',
    padding: '0.75rem 2rem',
    borderRadius: '99px',
    fontSize: '1rem',
    fontWeight: '600',
    cursor: 'pointer',
    boxShadow: `0 4px 12px ${shadow}`,
    transition: 'transform 0.1s',
    outline: 'none'
  };
};
