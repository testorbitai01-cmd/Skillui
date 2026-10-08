import React, { useState, useEffect } from 'react';
import { Play, Code, Clock, CheckCircle2, AlertTriangle, RefreshCw, Terminal, Layers } from 'lucide-react';
import { MCPTool } from '../data/mockData';

interface ToolCheckViewProps {
  tools: MCPTool[];
  preselectedToolId?: string;
}

export const ToolCheckView: React.FC<ToolCheckViewProps> = ({ tools, preselectedToolId }) => {
  const [selectedToolId, setSelectedToolId] = useState<string>(preselectedToolId || tools[0]?.id || '');
  const [jsonPayload, setJsonPayload] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [executionResult, setExecutionResult] = useState<any>(null);

  const selectedTool = tools.find(t => t.id === selectedToolId) || tools[0];

  useEffect(() => {
    if (selectedTool) {
      setJsonPayload(JSON.stringify(selectedTool.samplePayload, null, 2));
      setExecutionResult(null);
    }
  }, [selectedToolId]);

  const handleExecute = async () => {
    if (!selectedTool) return;
    setLoading(true);
    setExecutionResult(null);

    let parsedArgs = {};
    try {
      parsedArgs = JSON.parse(jsonPayload);
    } catch (e) {
      setExecutionResult({
        error: 'Invalid JSON Payload formatting',
        status: 400,
      });
      setLoading(false);
      return;
    }

    try {
      const res = await fetch('/api/tools/execute', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          toolId: selectedTool.id,
          payload: parsedArgs,
        }),
      });
      const data = await res.json();
      setExecutionResult(data);
    } catch (err: any) {
      setExecutionResult({
        error: err.message || 'Execution failed',
        status: 500,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Header */}
      <div>
        <h2 style={{ fontSize: '1.5rem', fontWeight: 700 }}>
          <span className="gradient-text">Interactive Tool Check & Execution Sandbox</span>
        </h2>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginTop: '0.25rem' }}>
          Test tool execution live, benchmark response latency (ms), and validate RPC outputs across all registered MCP tools.
        </p>
      </div>

      {/* Main Execution Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(340px, 1fr) minmax(400px, 1.2fr)', gap: '1.5rem' }}>
        {/* Left Column: Tool Selector & Request Editor */}
        <div className="glass-panel" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <div>
            <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Select Target MCP Tool</label>
            <select
              value={selectedToolId}
              onChange={e => setSelectedToolId(e.target.value)}
              style={{
                width: '100%',
                padding: '0.75rem',
                background: 'rgba(15, 23, 42, 0.9)',
                border: '1px solid var(--border-color)',
                borderRadius: '10px',
                color: 'white',
                fontSize: '0.95rem',
                fontWeight: 600,
                marginTop: '0.35rem',
              }}
            >
              {tools.map(tool => (
                <option key={tool.id} value={tool.id}>
                  {tool.name} ({tool.serviceName})
                </option>
              ))}
            </select>
          </div>

          {selectedTool && (
            <div style={{ background: 'rgba(0,0,0,0.3)', padding: '0.85rem', borderRadius: '8px', border: '1px solid var(--border-color)', fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.25rem' }}>
                <span style={{ fontWeight: 700, color: 'var(--accent-cyan)' }}>Capability: {selectedTool.capabilityTag}</span>
                <span style={{ color: selectedTool.riskLevel === 'HIGH' ? '#f87171' : '#34d399', fontWeight: 600 }}>
                  Risk: {selectedTool.riskLevel}
                </span>
              </div>
              {selectedTool.description}
            </div>
          )}

          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem' }}>
              <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                <Code size={14} color="var(--accent-indigo)" /> JSON Payload Editor
              </label>
              <button
                type="button"
                onClick={() => selectedTool && setJsonPayload(JSON.stringify(selectedTool.samplePayload, null, 2))}
                style={{ fontSize: '0.75rem', color: 'var(--accent-cyan)', background: 'none', border: 'none', cursor: 'pointer' }}
              >
                Reset Sample
              </button>
            </div>

            <textarea
              rows={10}
              value={jsonPayload}
              onChange={e => setJsonPayload(e.target.value)}
              style={{
                width: '100%',
                padding: '1rem',
                background: '#04070d',
                border: '1px solid var(--border-color)',
                borderRadius: '10px',
                color: '#34d399',
                fontFamily: 'monospace',
                fontSize: '0.85rem',
                lineHeight: '1.4',
              }}
            />
          </div>

          <button className="btn-primary" onClick={handleExecute} disabled={loading} style={{ width: '100%', justifyContent: 'center' }}>
            {loading ? <RefreshCw className="animate-spin" size={18} /> : <Play size={18} />} Execute Tool Call 🧪
          </button>
        </div>

        {/* Right Column: Real-Time Execution Output & Benchmark */}
        <div className="glass-panel" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h4 style={{ fontSize: '0.9rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <Terminal size={16} color="var(--accent-emerald)" /> Execution Output & Latency
            </h4>

            {executionResult && (
              <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
                <span className={`badge ${executionResult.success ? 'badge-active' : 'badge-offline'}`}>
                  HTTP {executionResult.status || 200}
                </span>
                {executionResult.latencyMs && (
                  <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--accent-emerald)', display: 'flex', alignItems: 'center', gap: '0.2rem' }}>
                    <Clock size={14} /> {executionResult.latencyMs} ms
                  </span>
                )}
              </div>
            )}
          </div>

          <div style={{
            flex: 1,
            background: '#04070d',
            padding: '1.25rem',
            borderRadius: '10px',
            border: '1px solid var(--border-color)',
            fontFamily: 'monospace',
            fontSize: '0.82rem',
            color: '#38bdf8',
            minHeight: '340px',
            overflowY: 'auto',
          }}>
            {!executionResult ? (
              <div style={{ color: 'var(--text-muted)', textAlign: 'center', marginTop: '6rem' }}>
                Press "Execute Tool Call" to invoke target tool and inspect raw payload response.
              </div>
            ) : (
              <pre style={{ margin: 0 }}>
                {JSON.stringify(executionResult, null, 2)}
              </pre>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
