const ConfigurationError = () => (
  <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#020617', color: '#e2e8f0', fontFamily: 'Inter, sans-serif', padding: '2rem', textAlign: 'center' }}>
    <div style={{ maxWidth: '28rem' }}>
      <h1 style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: '0.75rem', color: '#fff' }}>SaveMe can't start</h1>
      <p style={{ fontSize: '0.875rem', lineHeight: 1.6, color: '#94a3b8' }}>
        The app is missing its Firebase configuration, so it can't connect to your data.
        If you're a user, this is on us — please try again shortly or contact{' '}
        <a href="mailto:info@saveme.space" style={{ color: '#38bdf8' }}>info@saveme.space</a>.
        If you're a developer, copy <code>.env.example</code> to <code>.env.local</code> and fill in the
        <code> VITE_FIREBASE_*</code> values, then restart the dev server.
      </p>
    </div>
  </div>
);

export default ConfigurationError;
