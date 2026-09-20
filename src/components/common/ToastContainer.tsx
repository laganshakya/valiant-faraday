import React from 'react';
import { useApp } from '../../context/AppContext';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faCheckCircle, 
  faExclamationCircle, 
  faInfoCircle, 
  faTriangleExclamation,
  faXmark 
} from '@fortawesome/free-solid-svg-icons';

export const ToastContainer: React.FC = () => {
  const { toasts, removeToast } = useApp();

  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-5 right-5 z-50 flex flex-col space-y-3 max-w-sm w-full pointer-events-none">
      {toasts.map(toast => {
        let bg = 'bg-white border-slate-200 text-slate-800';
        let icon = faInfoCircle;
        let iconColor = 'text-blue-500';

        if (toast.type === 'success') {
          bg = 'bg-emerald-50 border-emerald-200 text-emerald-950';
          icon = faCheckCircle;
          iconColor = 'text-emerald-600';
        } else if (toast.type === 'error') {
          bg = 'bg-rose-50 border-rose-200 text-rose-950';
          icon = faExclamationCircle;
          iconColor = 'text-rose-600';
        } else if (toast.type === 'warning') {
          bg = 'bg-amber-50 border-amber-200 text-amber-950';
          icon = faTriangleExclamation;
          iconColor = 'text-amber-600';
        }

        return (
          <div
            key={toast.id}
            className={`pointer-events-auto flex items-start gap-3 p-4 rounded-xl border shadow-lg backdrop-blur transition-all duration-300 transform translate-y-0 ${bg}`}
          >
            <FontAwesomeIcon icon={icon} className={`mt-0.5 text-lg ${iconColor}`} />
            <div className="flex-1 min-w-0">
              <h4 className="font-semibold text-sm">{toast.title}</h4>
              {toast.message && <p className="text-xs mt-0.5 opacity-90">{toast.message}</p>}
            </div>
            <button
              onClick={() => removeToast(toast.id)}
              className="text-slate-400 hover:text-slate-700 transition-colors p-1"
              aria-label="Close notification"
            >
              <FontAwesomeIcon icon={faXmark} className="text-sm" />
            </button>
          </div>
        );
      })}
    </div>
  );
};
