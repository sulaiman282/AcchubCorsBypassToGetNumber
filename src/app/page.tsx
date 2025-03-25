'use client';

import { useState } from 'react';

export default function Home() {
  const [country, setCountry] = useState('');
  const [carrier, setCarrier] = useState('');
  const [authKey, setAuthKey] = useState('');
  const [response, setResponse] = useState<Record<string, unknown> | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setResponse(null);

    try {
      // Create form data
      const formData = new FormData();
      formData.append('country', country);
      formData.append('carrier', carrier);
      formData.append('authKey', authKey);

      // Send request to our proxy API
      const res = await fetch('/api/proxy/getNumber', {
        method: 'POST',
        body: formData,
      });

      if (!res.ok) {
        throw new Error(`Error: ${res.status}`);
      }

      const data = await res.json();
      setResponse(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unknown error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen p-8 flex flex-col items-center bg-gray-900 text-white">
      <h1 className="text-3xl font-bold mb-8">CORS Bypass Proxy</h1>
      
      <div className="w-full max-w-md bg-gray-800 p-6 rounded-lg shadow-lg">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="country" className="block text-sm font-medium mb-1">
              Country
            </label>
            <input
              type="text"
              id="country"
              value={country}
              onChange={(e) => setCountry(e.target.value)}
              className="w-full p-2 bg-gray-700 rounded border border-gray-600 text-white"
              required
            />
          </div>
          
          <div>
            <label htmlFor="carrier" className="block text-sm font-medium mb-1">
              Carrier (optional)
            </label>
            <input
              type="text"
              id="carrier"
              value={carrier}
              onChange={(e) => setCarrier(e.target.value)}
              className="w-full p-2 bg-gray-700 rounded border border-gray-600 text-white"
            />
          </div>
          
          <div>
            <label htmlFor="authKey" className="block text-sm font-medium mb-1">
              Auth Key
            </label>
            <input
              type="text"
              id="authKey"
              value={authKey}
              onChange={(e) => setAuthKey(e.target.value)}
              className="w-full p-2 bg-gray-700 rounded border border-gray-600 text-white"
              required
            />
          </div>
          
          <button
            type="submit"
            disabled={loading}
            className="w-full py-2 px-4 bg-blue-600 hover:bg-blue-700 rounded font-medium text-white disabled:opacity-50"
          >
            {loading ? 'Loading...' : 'Submit'}
          </button>
        </form>
      </div>

      {error && (
        <div className="mt-8 w-full max-w-md p-4 bg-red-900/50 border border-red-700 rounded-lg">
          <h2 className="text-xl font-semibold mb-2">Error</h2>
          <p>{error}</p>
        </div>
      )}

      {response && (
        <div className="mt-8 w-full max-w-md">
          <h2 className="text-xl font-semibold mb-2">Response</h2>
          <pre className="bg-gray-800 p-4 rounded-lg overflow-auto max-h-96">
            {JSON.stringify(response, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
}
