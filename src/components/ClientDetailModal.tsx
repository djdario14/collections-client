import { useState } from 'react';
import ClientDetail from './ClientDetail';

export default function ClientDetailModal({ clientId, onClose }: { clientId: string, onClose: () => void }) {
  return (
    <ClientDetail clientId={clientId} onClose={onClose} />
  );
}
