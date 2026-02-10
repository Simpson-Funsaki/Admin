'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { createBrowserClient } from '@supabase/ssr';

export default function VerifiedPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [status, setStatus] = useState('verifying'); // verifying, success, error
  const [message, setMessage] = useState('');

  // Create Supabase client
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );

  useEffect(() => {
    const handleAuthCallback = async () => {
      try {
        // Get URL parameters
        const type = searchParams.get('type');
        const access_token = searchParams.get('access_token');
        const refresh_token = searchParams.get('refresh_token');

        // Check if we have the required parameters
        if (!access_token || !refresh_token) {
          setStatus('error');
          setMessage('Missing authentication tokens');
          return;
        }

        // Set the session with the tokens from URL
        const { data, error } = await supabase.auth.setSession({
          access_token: access_token,
          refresh_token: refresh_token,
        });

        if (error) {
          console.error('Error setting session:', error);
          setStatus('error');
          setMessage(error.message || 'Authentication failed');
          return;
        }

        // Success! User is now authenticated
        setStatus('success');
        setMessage(type === 'signup' ? 'Email verified successfully!' : 'Authentication successful!');

        // Redirect to dashboard or home after 2 seconds
        setTimeout(() => {
          router.push('/dashboard'); // Change this to your desired redirect path
        }, 2000);

      } catch (err) {
        console.error('Unexpected error:', err);
        setStatus('error');
        setMessage('An unexpected error occurred');
      }
    };

    handleAuthCallback();
  }, [searchParams, supabase.auth, router]);

  return (
    <div className="verified-container">
      <div className="verified-card">
        {status === 'verifying' && (
          <>
            <div className="spinner"></div>
            <h1>Verifying your account...</h1>
            <p>Please wait while we confirm your email address.</p>
          </>
        )}

        {status === 'success' && (
          <>
            <div className="success-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                <polyline points="22 4 12 14.01 9 11.01"></polyline>
              </svg>
            </div>
            <h1>Success!</h1>
            <p>{message}</p>
            <p className="redirect-text">Redirecting you to your dashboard...</p>
          </>
        )}

        {status === 'error' && (
          <>
            <div className="error-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10"></circle>
                <line x1="15" y1="9" x2="9" y2="15"></line>
                <line x1="9" y1="9" x2="15" y2="15"></line>
              </svg>
            </div>
            <h1>Verification Failed</h1>
            <p>{message}</p>
            <button onClick={() => router.push('/login')} className="retry-button">
              Go to Login
            </button>
          </>
        )}
      </div>

      <style jsx>{`
        .verified-container {
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          padding: 20px;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen',
            'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue', sans-serif;
        }

        .verified-card {
          background: white;
          border-radius: 16px;
          padding: 48px 40px;
          max-width: 480px;
          width: 100%;
          text-align: center;
          box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
          animation: slideUp 0.5s ease-out;
        }

        @keyframes slideUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .spinner {
          margin: 0 auto 24px;
          width: 48px;
          height: 48px;
          border: 4px solid #f3f4f6;
          border-top-color: #667eea;
          border-radius: 50%;
          animation: spin 0.8s linear infinite;
        }

        @keyframes spin {
          to {
            transform: rotate(360deg);
          }
        }

        .success-icon,
        .error-icon {
          margin: 0 auto 24px;
          width: 64px;
          height: 64px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          animation: scaleIn 0.5s ease-out;
        }

        .success-icon {
          background: #d1fae5;
          color: #059669;
        }

        .error-icon {
          background: #fee2e2;
          color: #dc2626;
        }

        .success-icon svg,
        .error-icon svg {
          width: 36px;
          height: 36px;
        }

        @keyframes scaleIn {
          from {
            transform: scale(0);
          }
          to {
            transform: scale(1);
          }
        }

        h1 {
          margin: 0 0 12px 0;
          font-size: 28px;
          font-weight: 700;
          color: #111827;
        }

        p {
          margin: 0 0 16px 0;
          font-size: 16px;
          color: #6b7280;
          line-height: 1.6;
        }

        .redirect-text {
          font-size: 14px;
          color: #9ca3af;
          margin-top: 24px;
        }

        .retry-button {
          margin-top: 24px;
          padding: 12px 32px;
          background: #667eea;
          color: white;
          border: none;
          border-radius: 8px;
          font-size: 16px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s;
        }

        .retry-button:hover {
          background: #5568d3;
          transform: translateY(-1px);
          box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
        }

        .retry-button:active {
          transform: translateY(0);
        }

        @media (max-width: 640px) {
          .verified-card {
            padding: 32px 24px;
          }

          h1 {
            font-size: 24px;
          }

          p {
            font-size: 15px;
          }
        }
      `}</style>
    </div>
  );
}