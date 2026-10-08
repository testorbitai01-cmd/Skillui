import React, { useState, useEffect } from 'react';
import { Play, Code, Clock, CheckCircle2, RefreshCw, Terminal, Wrench, Server, CheckSquare, Layers, Shield } from 'lucide-react';
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
  
  // Track unique tools tested during current session
  const [checkedToolIds, setCheckedToolIds] = useState<Set<string>>(new Set());
  const [filterServer, setFilterServer] = useState<string>('ALL');

  // Derive unique server names (excluding root endpoint if present)
  const uniqueServers = Array.from(new Set(tools.map(t => t.serviceName)));

  // Calculate filtered tools based on selected server
  const filteredTools = filterServer === 'ALL'
    ? tools
    : tools.filter(t => t.serviceName === filterServer);

  // Sync selectedToolId when preselectedToolId changes or when filterServer changes
  useEffect(() => {
    if (preselectedToolId) {
      const targetTool = tools.find(t => t.id === preselectedToolId);
      if (targetTool) {
        setSelectedToolId(preselectedToolId);
        if (filterServer !== 'ALL' && targetTool.serviceName !== filterServer) {
          setFilterServer('ALL');
        }
      }
    }
  }, [preselectedToolId]);

  // Ensure selectedToolId belongs to filteredTools when filter changes
  useEffect(() => {
    if (filteredTools.length > 0 && !filteredTools.some(t => t.id === selectedToolId)) {
      setSelectedToolId(filteredTools[0].id);
    }
  }, [filterServer, filteredTools]);

  const selectedTool = tools.find(t => t.id === selectedToolId) || filteredTools[0] || tools[0];

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

    // Track checked tool immediately upon test execution
    setCheckedToolIds(prev => new Set(prev).add(selectedTool.id));

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

  // Calculate checked tools within current filter scope
  const checkedInFilterCount = filteredTools.filter(t => checkedToolIds.has(t.id)).length;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Top Banner */}
      <div>
        <h2 style={{ fontSize: '1.5rem', fontWeight: 700 }}>
          <span className="gradient-text">Interactive MCP Tool Check & Execution Sandbox</span>
        </h2>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginTop: '0.25rem' }}>
          Execute live JSON-RPC tool calls across all 4 TestOrbit MCP microservices, benchmark latency, and inspect outputs.
        </p>
      </div>

      {/* 📊 Top Metrics Header (No. of Tools, No. of Servers, No. of Tools Checked) */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem' }}>
        <div className="glass-panel" style={{ padding: '1.25rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
            <span>No. of Registered Tools</span>
            <Wrench size={18} color="var(--brand-blue)" />
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: 800, marginTop: '0.5rem', color: 'var(--text-primary)' }}>
            {filteredTools.length} {filterServer !== 'ALL' ? `/ ${tools.length}` : ''}
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>
            {filterServer === 'ALL' ? `Across all ${uniqueServers.length} MCP services` : `Filtered by ${filterServer}`}
          </div>
        </div>

        <div className="glass-panel" style={{ padding: '1.25rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
            <span>No. of MCP Servers</span>
            <Server size={18} color="var(--accent-purple)" />
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: 800, marginTop: '0.5rem', color: 'var(--text-primary)' }}>
            {filterServer === 'ALL' ? uniqueServers.length : 1}
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--accent-emerald)', marginTop: '0.25rem', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
            <CheckCircle2 size={12} /> {filterServer === 'ALL' ? 'All 4 Microservices Online' : `${filterServer} Active`}
          </div>
        </div>

        <div className="glass-panel" style={{ padding: '1.25rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
            <span>No. of Tools Checked</span>
            <CheckSquare size={18} color="var(--accent-emerald)" />
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: 800, marginTop: '0.5rem', color: 'var(--accent-emerald)' }}>
            {checkedInFilterCount} / {filteredTools.length}
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>
            Tested during current session ({checkedToolIds.size} total tested)
          </div>
        </div>
      </div>

      {/* Filter Header & Dropdowns */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', width: '100%', maxWidth: '700px' }}>
          {/* Server Filter Dropdown */}
          <div style={{ flex: 1 }}>
            <label style={{ fontSize: '0.78rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Filter by MCP Server
            </label>
            <select
              value={filterServer}
              onChange={e => setFilterServer(e.target.value)}
              style={{
                width: '100%',
                padding: '0.6rem 0.8rem',
                borderRadius: '8px',
                fontSize: '0.85rem',
                fontWeight: 600,
                marginTop: '0.25rem',
                background: 'var(--bg-card)',
                color: 'var(--text-primary)',
                border: '1px solid var(--border-color)',
              }}
            >
              <option value="ALL">All MCP Servers ({uniqueServers.length} Microservices — {tools.length} Tools)</option>
              {uniqueServers.map(server => {
                const count = tools.filter(t => t.serviceName === server).length;
                return (
                  <option key={server} value={server}>
                    {server} ({count} Tools)
                  </option>
                );
              })}
            </select>
          </div>

          {/* Tool Dropdown Selector */}
          <div style={{ flex: 1.2 }}>
            <label style={{ fontSize: '0.78rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Select Tool to Check ({filteredTools.length} Available)
            </label>
            <select
              value={selectedToolId}
              onChange={e => setSelectedToolId(e.target.value)}
              style={{
                width: '100%',
                padding: '0.6rem 0.8rem',
                borderRadius: '8px',
                fontSize: '0.85rem',
                fontWeight: 600,
                marginTop: '0.25rem',
                background: 'var(--bg-card)',
                color: 'var(--text-primary)',
                border: '1px solid var(--border-color)',
              }}
            >
              {filteredTools.map(tool => (
                <option key={tool.id} value={tool.id}>
                  {tool.name} — {tool.serviceName}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* 🎴 Tools Grid (Card Format View) */}
      <div>
        <h4 style={{ fontSize: '0.85rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.75rem' }}>
          Select Tool Card to Test ({filteredTools.length} Tools Shown)
        </h4>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1rem' }}>
          {filteredTools.map(tool => {
            const isSelected = selectedTool?.id === tool.id;
            const isChecked = checkedToolIds.has(tool.id);
            return (
              <div
                key={tool.id}
                className="glass-panel"
                onClick={() => setSelectedToolId(tool.id)}
                style={{
                  padding: '1rem',
                  cursor: 'pointer',
                  border: isSelected ? '2px solid var(--brand-blue)' : '1px solid var(--border-color)',
                  background: isSelected ? 'rgba(37, 99, 235, 0.12)' : 'var(--bg-card)',
                  transition: 'all 0.15s ease',
                  position: 'relative',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--brand-blue)', background: 'rgba(37, 99, 235, 0.1)', padding: '0.15rem 0.45rem', borderRadius: '4px' }}>
                    {tool.capabilityTag}
                  </span>
                  {isChecked ? (
                    <span className="badge badge-active" style={{ fontSize: '0.65rem' }}>
                      <CheckCircle2 size={10} /> TESTED
                    </span>
                  ) : (
                    <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)', fontWeight: 600 }}>
                      UNTESTED
                    </span>
                  )}
                </div>

                <h4 style={{ fontSize: '0.95rem', fontWeight: 700, marginTop: '0.5rem', color: 'var(--text-primary)', fontFamily: 'monospace' }}>
                  {tool.name}
                </h4>

                <p style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginTop: '0.25rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {tool.description}
                </p>

                <div style={{ marginTop: '0.75rem', fontSize: '0.72rem', color: 'var(--text-muted)', display: 'flex', justifyContent: 'space-between' }}>
                  <span>📦 {tool.serviceName}</span>
                  <span style={{ color: tool.riskLevel === 'HIGH' ? '#f87171' : '#34d399', fontWeight: 600 }}>
                    Risk: {tool.riskLevel}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Main Execution Grid */}
      {selectedTool && (
        <div style={{ display: 'grid', gridTemplateColumns: 'minmax(340px, 1fr) minmax(400px, 1.2fr)', gap: '1.5rem', marginTop: '0.5rem' }}>
          {/* Left Column: Request Payload Editor */}
          <div className="glass-panel" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <span className="badge badge-active">{selectedTool.capabilityTag} Capability</span>
                <h3 style={{ fontSize: '1.2rem', fontWeight: 800, marginTop: '0.35rem', fontFamily: 'monospace', color: 'var(--brand-blue)' }}>
                  {selectedTool.name}
                </h3>
              </div>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontFamily: 'monospace' }}>
                {selectedTool.serviceName}
              </span>
            </div>

            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem' }}>
                <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                  <Code size={14} color="var(--brand-blue)" /> JSON Payload Editor
                </label>
                <button
                  type="button"
                  onClick={() => setJsonPayload(JSON.stringify(selectedTool.samplePayload, null, 2))}
                  style={{ fontSize: '0.75rem', color: 'var(--brand-blue)', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 600 }}
                >
                  Reset Sample
                </button>
              </div>

              <textarea
                rows={9}
                value={jsonPayload}
                onChange={e => setJsonPayload(e.target.value)}
                style={{
                  width: '100%',
                  padding: '1rem',
                  background: 'var(--code-bg)',
                  border: '1px solid var(--border-color)',
                  borderRadius: '10px',
                  color: 'var(--code-text)',
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

          {/* Right Column: Real-Time Output Console */}
          <div className="glass-panel" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h4 style={{ fontSize: '0.9rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <Terminal size={16} color="var(--accent-emerald)" /> Live Output & Latency
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
              background: 'var(--code-bg)',
              padding: '1.25rem',
              borderRadius: '10px',
              border: '1px solid var(--border-color)',
              fontFamily: 'monospace',
              fontSize: '0.82rem',
              color: 'var(--code-text)',
              minHeight: '320px',
              overflowY: 'auto',
            }}>
              {!executionResult ? (
                <div style={{ color: 'var(--text-muted)', textAlign: 'center', marginTop: '6rem' }}>
                  Press "Execute Tool Call" to invoke target tool and inspect response payload.
                </div>
              ) : (
                <pre style={{ margin: 0 }}>
                  {JSON.stringify(executionResult, null, 2)}
                </pre>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

