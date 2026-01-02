// app/test-login/page.tsx
'use client';

import { useState } from 'react';
import { Union, User } from '@/types';
import { supabase } from '@/lib/supabase';
import { useEffect } from 'react';

export default function TestLogin() {
  const [unions, setUnions] = useState<Union[]>([]);
  const [selectedUnion, setSelectedUnion] = useState<number>(1);
  const [selectedRole, setSelectedRole] = useState<'citizen' | 'chairman' | 'admin'>('citizen');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);

  // Fetch unions on mount
  useEffect(() => {
    async function fetchUnions() {
      const { data } = await supabase.from('unions').select('*').order('id');
      if (data) setUnions(data);
    }
    fetchUnions();
  }, []);

  async function handleLogin() {
    setLoading(true);
    setResult(null);

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          role: selectedRole,
          union_id: selectedUnion,
        }),
      });

      const data = await response.json();
      setResult(data);
    } catch (error) {
      setResult({ error: 'Network error' });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ padding: '2rem', maxWidth: '600px', margin: '0 auto' }}>
      <h1>🧪 Test Login API</h1>

      <div style={{ marginTop: '2rem' }}>
        <label style={{ display: 'block', marginBottom: '0.5rem' }}>
          <strong>Select Role:</strong>
        </label>
        <select
          value={selectedRole}
          onChange={(e) => setSelectedRole(e.target.value as any)}
          style={{ width: '100%', padding: '0.5rem', marginBottom: '1rem' }}
        >
          <option value="citizen">Citizen</option>
          <option value="chairman">Chairman</option>
          <option value="admin">Admin</option>
        </select>

        <label style={{ display: 'block', marginBottom: '0.5rem' }}>
          <strong>Select Union:</strong>
        </label>
        <select
          value={selectedUnion}
          onChange={(e) => setSelectedUnion(Number(e.target.value))}
          style={{ width: '100%', padding: '0.5rem', marginBottom: '1rem' }}
        >
          {unions.map(union => (
            <option key={union.id} value={union.id}>
              {union.union_name} - {union.district_name}
            </option>
          ))}
        </select>

        <button
          onClick={handleLogin}
          disabled={loading}
          style={{
            width: '100%',
            padding: '0.75rem',
            background: loading ? '#ccc' : '#0070f3',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: loading ? 'not-allowed' : 'pointer',
            fontSize: '1rem',
            fontWeight: 'bold',
          }}
        >
          {loading ? 'Logging in...' : 'Test Login'}
        </button>
      </div>

      {result && (
        <div
          style={{
            marginTop: '2rem',
            padding: '1rem',
            background: result.error ? '#ffe0e0' : '#e0ffe0',
            borderRadius: '4px',
          }}
        >
          <h3>{result.error ? '❌ Error' : '✅ Success'}</h3>
          <pre style={{ overflow: 'auto' }}>
            {JSON.stringify(result, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
}