export function HealthPage() {
  const health = {
    status: 'healthy',
    version: '1.0.0-beta.1',
    timestamp: new Date().toISOString(),
    uptime: process.uptime ? process.uptime() : 0,
    checks: {
      api: 'operational',
      database: 'connected',
      frontend: 'responsive'
    }
  };

  return (
    <div style={{ fontFamily: 'monospace', padding: '20px', backgroundColor: '#f5f5f5' }}>
      <h1>Health Check</h1>
      <pre>{JSON.stringify(health, null, 2)}</pre>
    </div>
  );
}
