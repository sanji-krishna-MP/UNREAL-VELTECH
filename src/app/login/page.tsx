'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Login03View } from '@/components/ui/login-03';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLogin = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!email || !password) {
      setError('Please provide both corporate email and password');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Login failed. Please check credentials.');
      }

      // Route based on role
      if (data.user.role === 'officer') {
        router.push('/dashboard');
      } else {
        router.push('/inbox');
      }
      router.refresh();
    } catch (err: any) {
      setError(err.message || 'An error occurred during authentication.');
    } finally {
      setLoading(false);
    }
  };

  const fillCredentials = (demoEmail: string) => {
    setEmail(demoEmail);
    // Security: Do not autofill fixed demo passwords in the public UI
    setPassword('');
    setError(null);
  };

  return (
    <Login03View
      email={email}
      setEmail={setEmail}
      password={password}
      setPassword={setPassword}
      loading={loading}
      error={error}
      onSubmit={handleLogin}
      onQuickFill={fillCredentials}
    />
  );
}
