import React, { useState } from 'react';
import { Eye, Radio, Plus, CheckCircle2, Shield, RefreshCw, Terminal, Globe, Server, FileText } from 'lucide-react';
import { MCPInspectorConnection } from '../data/mockData';

interface MCPInspectorViewProps {
  inspectorSessions: MCPInspectorConnection[];
  onAddConnection: (newConn: Partial<MCPInspectorConnection>) => void;
}

export const MCPInspectorView: React.FC<MCPInspectorViewProps> = ({ inspectorSessions, onAddConnection }) => {
  const [showModal, setShowModal] = useState(false);
  const [activeSession, setActiveSession] = useState<MCPInspectorConnection>(inspectorSessions[0]);
  const [formData, setFormData] = useState({
    name: '',
    transport: 'SSE' as 'SSE' | 'STDIO' | 'HTTP',
    urlOrCommand: '',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onAddConnection({
      name: formData.name,
      transport: formData.transport,
      urlOrCommand: formData.urlOrCommand,
    });
    setShowModal(false);
    setFormData({ name: '', transport: 'SSE', urlOrCommand: '' });
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 700 }}>
            <span className="gradient-text">MCP Inspector Platform</span>
          </h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginTop: '0.25rem' }}>
            Interactive MCP protocol inspector for SSE, Stdio, and HTTP endpoints. Validate capabilities negotiation & protocol handshake.
          </p>
        </div>
        <button className="btn-primary" onClick={() => setShowModal(true)}>
          <Plus size={18} /> Connect MCP Server
        </button>
      </div>

      {/* Connection Tabs / List */}
      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(280px, 1fr) minmax(440px, 1.4fr)', gap: '1.5rem' }}>
        {/* Connection List Left Bar */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          <h4 style={{ fontSize: '0.85rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Connected Inspector Endpoints</h4>
          {inspectorSessions.map(session => {
            const isSelected = activeSession?.id === session.id;
            return (
              <div
                key={session.id}
                className="glass-panel"
                onClick={() => setActiveSession(session)}
                style={{
                  padding: '1.1rem',
                  cursor: 'pointer',
                  borderColor: isSelected ? 'var(--accent-indigo)' : 'var(--border-color)',
                  background: isSelected ? 'rgba(99, 102, 241, 0.15)' : 'var(--bg-card)',
                  transition: 'all 0.15s ease',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span className="badge badge-active">
                    <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#10b981' }} />
                    {session.status}
                  </span>
                  <span style={{ fontSize: '0.75rem', fontFamily: 'monospace', color: 'var(--text-muted)' }}>
                    {session.transport}
                  </span>
                </div>

                <h4 style={{ fontSize: '0.95rem', fontWeight: 700, marginTop: '0.5rem', color: '#ffffff' }}>
                  {session.name}
                </h4>

                <div style={{ fontSize: '0.75rem', fontFamily: 'monospace', color: 'var(--text-muted)', marginTop: '0.4rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  🔗 {session.urlOrCommand}
                </div>
              </div>
            );
          })}
        </div>

        {/* Protocol Details Right Panel */}
        {activeSession && (
          <div className="glass-panel" style={{ padding: '1.75rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <span style={{ fontSize: '0.75rem', color: 'var(--accent-cyan)', fontWeight: 600 }}>
                  Protocol Handshake Verified
                </span>
                <h3 style={{ fontSize: '1.35rem', fontWeight: 800, marginTop: '0.25rem', color: '#ffffff' }}>
                  {activeSession.name}
                </h3>
              </div>
              <button className="btn-secondary" style={{ padding: '0.4rem 0.75rem', fontSize: '0.8rem' }}>
                <RefreshCw size={14} /> Re-handshake
              </button>
            </div>

            {/* Server Info Card */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem', background: 'rgba(0,0,0,0.3)', padding: '1rem', borderRadius: '10px', border: '1px solid var(--border-color)' }}>
              <div>
                <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Server Name</div>
                <div style={{ fontSize: '0.9rem', fontWeight: 700, fontFamily: 'monospace', color: 'var(--accent-cyan)' }}>
                  {activeSession.serverInfo.name}
                </div>
              </div>
              <div>
                <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Server Version</div>
                <div style={{ fontSize: '0.9rem', fontWeight: 700, fontFamily: 'monospace', color: '#ffffff' }}>
                  v{activeSession.serverInfo.version}
                </div>
              </div>
              <div>
                <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Protocol Version</div>
                <div style={{ fontSize: '0.9rem', fontWeight: 700, fontFamily: 'monospace', color: '#34d399' }}>
                  {activeSession.serverInfo.protocolVersion}
                </div>
              </div>
            </div>

            {/* Capability Flags */}
            <div>
              <h4 style={{ fontSize: '0.85rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.5rem' }}>Negotiated MCP Capabilities</h4>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0.75rem' }}>
                {Object.entries(activeSession.capabilities).map(([cap, enabled]) => (
                  <div key={cap} style={{ background: enabled ? 'rgba(16, 185, 129, 0.1)' : 'rgba(255,255,255,0.03)', border: '1px solid', borderColor: enabled ? 'rgba(16, 185, 129, 0.3)' : 'var(--border-color)', padding: '0.6rem', borderRadius: '8px', textAlign: 'center' }}>
                    <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'capitalize' }}>{cap}</div>
                    <div style={{ fontSize: '0.85rem', fontWeight: 700, color: enabled ? '#34d399' : 'var(--text-muted)', marginTop: '0.2rem' }}>
                      {enabled ? 'Supported ✅' : 'Off ❌'}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Protocol Message Inspector Log */}
            <div>
              <h4 style={{ fontSize: '0.85rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.5rem' }}>JSON-RPC Handshake Logs</h4>
              <pre style={{
                background: '#04070d',
                padding: '1rem',
                borderRadius: '10px',
                border: '1px solid var(--border-color)',
                fontSize: '0.78rem',
                fontFamily: 'monospace',
                color: '#818cf8',
                maxHeight: '200px',
                overflowY: 'auto',
              }}>
                {`--> {"jsonrpc":"2.0","id":1,"method":"initialize","params":{"protocolVersion":"2024-11-05","capabilities":{}}}
<-- {"jsonrpc":"2.0","id":1,"result":{"protocolVersion":"2024-11-05","capabilities":{"tools":{}},"serverInfo":{"name":"${activeSession.serverInfo.name}","version":"${activeSession.serverInfo.version}"}}}
--> {"jsonrpc":"2.0","method":"notifications/initialized"}
--> {"jsonrpc":"2.0","id":2,"method":"tools/list"}
<-- {"jsonrpc":"2.0","id":2,"result":{"tools":[{"name":"search_questions"},{"name":"create_paper"}]}}`}
              </pre>
            </div>
          </div>
        )}
      </div>

      {/* Modal for adding MCP connection */}
      {showModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(8px)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000, padding: '1rem' }}>
          <div className="glass-panel" style={{ width: '100%', maxWidth: '480px', padding: '2rem' }}>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '1rem' }}>Connect Custom MCP Endpoint</h3>
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Server Name / Label</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. testorbit-analytics-mcp"
                  value={formData.name}
                  onChange={e => setFormData({ ...formData, name: e.target.value })}
                  style={{ width: '100%', padding: '0.6rem', background: 'rgba(0,0,0,0.3)', border: '1px solid var(--border-color)', borderRadius: '8px', color: 'white', marginTop: '0.25rem' }}
                />
              </div>

              <div>
                <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Transport Type</label>
                <select
                  value={formData.transport}
                  onChange={e => setFormData({ ...formData, transport: e.target.value as any })}
                  style={{ width: '100%', padding: '0.6rem', background: 'rgba(15, 23, 42, 0.9)', border: '1px solid var(--border-color)', borderRadius: '8px', color: 'white', marginTop: '0.25rem' }}
                >
                  <option value="SSE">SSE (Server-Sent Events)</option>
                  <option value="STDIO">STDIO (Local Node / CLI process)</option>
                  <option value="HTTP">HTTP Endpoint</option>
                </select>
              </div>

              <div>
                <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>URL or Command</label>
                <input
                  type="text"
                  required
                  placeholder="http://localhost:4003/mcp/sse or node build/index.js"
                  value={formData.urlOrCommand}
                  onChange={e => setFormData({ ...formData, urlOrCommand: e.target.value })}
                  style={{ width: '100%', padding: '0.6rem', background: 'rgba(0,0,0,0.3)', border: '1px solid var(--border-color)', borderRadius: '8px', color: 'white', marginTop: '0.25rem' }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1rem' }}>
                <button type="button" className="btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" className="btn-primary">Connect & Inspect</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
