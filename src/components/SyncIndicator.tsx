import { useEffect, useState } from 'react';

export default function SyncIndicator() {
  const [isOnline, setIsOnline] = useState(
    typeof navigator !== 'undefined' ? navigator.onLine : true
  );

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return (
    <div style={{
      width: 10,
      height: 10,
      borderRadius: '50%',
      background: isOnline ? '#10b981' : '#ef4444',
      boxShadow: '0 2px 6px rgba(0,0,0,0.3)',
      border: '2px solid white',
      animation: isOnline ? 'none' : 'pulse 2s infinite'
    }}>
      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.5; transform: scale(1.2); }
        }
      `}</style>
    </div>
  );
}
