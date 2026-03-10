'use client'

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <html>
      <body style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', fontFamily: 'system-ui, sans-serif' }}>
        <div style={{ textAlign: 'center', padding: '2rem' }}>
          <h2 style={{ fontSize: '1.5rem', marginBottom: '1rem' }}>오류가 발생했습니다</h2>
          <p style={{ color: '#666', marginBottom: '0.5rem' }}>
            {error.digest ? `Error: ${error.digest}` : '예상치 못한 오류가 발생했습니다.'}
          </p>
          <p style={{ color: '#ef4444', fontSize: '0.75rem', fontFamily: 'monospace', marginBottom: '1.5rem', maxWidth: '400px', wordBreak: 'break-all' }}>
            {error.message}
          </p>
          <button
            onClick={() => reset()}
            style={{
              padding: '0.75rem 1.5rem',
              backgroundColor: '#000',
              color: '#fff',
              border: 'none',
              borderRadius: '0.5rem',
              cursor: 'pointer',
              fontSize: '0.875rem',
            }}
          >
            다시 시도
          </button>
        </div>
      </body>
    </html>
  )
}
