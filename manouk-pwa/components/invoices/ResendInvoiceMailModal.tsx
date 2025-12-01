import { useState } from 'react';

export default function ResendInvoiceMailModal({
  isOpen,
  onClose,
  onSend,
  defaultBody = 'Bonjour,\n\nVeuillez trouver votre facture en pièce jointe.\n\nCordialement.'
}: {
  isOpen: boolean;
  onClose: () => void;
  onSend: (body: string) => void;
  defaultBody?: string;
}) {
  const [body, setBody] = useState(defaultBody);
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl max-w-lg w-full p-6 relative">
        {loading && (
          <div className="absolute inset-0 flex items-center justify-center bg-white bg-opacity-70 z-10">
            <svg className="animate-spin h-7 w-7 text-indigo-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"></path>
            </svg>
          </div>
        )}
        <h2 className="text-xl font-bold mb-4">Modifier le message du mail</h2>
        <textarea
          className="w-full border border-gray-300 rounded-lg p-2 mb-4"
          rows={6}
          value={body}
          onChange={e => setBody(e.target.value)}
          disabled={loading}
        />
        <div className="flex justify-end gap-2">
          <button
            onClick={onClose}
            className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
            disabled={loading}
          >
            Annuler
          </button>
          <button
            onClick={async () => {
              setLoading(true);
              try {
                await onSend(body);
              } finally {
                setLoading(false);
              }
            }}
            className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50"
            disabled={loading}
          >
            {loading ? 'Envoi...' : 'Envoyer'}
          </button>
        </div>
      </div>
    </div>
  )
}
