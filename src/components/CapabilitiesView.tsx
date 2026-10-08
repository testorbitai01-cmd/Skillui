import React, { useState } from 'react';
import { Layers, Search, ShieldAlert, Code, Sparkles, Filter, ChevronRight, Check } from 'lucide-react';
import { MCPTool } from '../data/mockData';

interface CapabilitiesViewProps {
  tools: MCPTool[];
  onSelectToolForCheck?: (toolId: string) => void;
}

export const CapabilitiesView: React.FC<CapabilitiesViewProps> = ({ tools, onSelectToolForCheck }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTag, setSelectedTag] = useState<string>('ALL');
  const [activeTool, setActiveTool] = useState<MCPTool | null>(tools[0] || null);

  const tags = ['ALL', 'Authoring', 'Onboarding', 'Proctoring', 'Evaluation'];

  const filteredTools = tools.filter(tool => {
    const matchesSearch = tool.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          tool.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          tool.serviceName.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesTag = selectedTag === 'ALL' || tool.capabilityTag === selectedTag;
    return matchesSearch && matchesTag;
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Header & Filter */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 700 }}>
            <span className="gradient-text">MCP Capability & Tool Matrix</span>
          </h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginTop: '0.25rem' }}>
            Map business capability requirements directly to registered MCP tools and JSON input schemas.
          </p>
        </div>

        {/* Tag Filters */}
        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
          {tags.map(tag => (
            <button
              key={tag}
              onClick={() => setSelectedTag(tag)}
              style={{
                padding: '0.4rem 0.85rem',
                borderRadius: '8px',
                fontSize: '0.8rem',
                fontWeight: 600,
                border: '1px solid',
                borderColor: selectedTag === tag ? 'var(--accent-indigo)' : 'var(--border-color)',
                background: selectedTag === tag ? 'rgba(99, 102, 241, 0.25)' : 'rgba(15, 23, 42, 0.6)',
                color: selectedTag === tag ? '#ffffff' : 'var(--text-secondary)',
                cursor: 'pointer',
                transition: 'all 0.15s ease',
              }}
            >
              {tag}
            </button>
          ))}
        </div>
      </div>

      {/* Search Input */}
      <div style={{ position: 'relative' }}>
        <Search size={18} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
        <input
          type="text"
          placeholder="Search tools by capability, tool name, or description..."
          value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
          style={{
            width: '100%',
            padding: '0.75rem 1rem 0.75rem 2.8rem',
            background: 'var(--bg-card)',
            border: '1px solid var(--border-color)',
            borderRadius: '12px',
            color: 'white',
            fontSize: '0.9rem',
          }}
        />
      </div>

      {/* Main Split Matrix View */}
      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(320px, 1fr) minmax(400px, 1.2fr)', gap: '1.5rem' }}>
        {/* Tool List Column */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {filteredTools.length === 0 ? (
            <div className="glass-panel" style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>
              No tools match your filter criteria.
            </div>
          ) : (
            filteredTools.map(tool => {
              const isSelected = activeTool?.id === tool.id;
              return (
                <div
                  key={tool.id}
                  className="glass-panel"
                  onClick={() => setActiveTool(tool)}
                  style={{
                    padding: '1.1rem',
                    cursor: 'pointer',
                    borderColor: isSelected ? 'var(--accent-indigo)' : 'var(--border-color)',
                    background: isSelected ? 'rgba(99, 102, 241, 0.15)' : 'var(--bg-card)',
                    transition: 'all 0.15s ease',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--accent-cyan)', background: 'rgba(56, 189, 248, 0.1)', padding: '0.15rem 0.5rem', borderRadius: '4px' }}>
                      {tool.capabilityTag}
                    </span>
                    <span style={{
                      fontSize: '0.7rem',
                      fontWeight: 600,
                      color: tool.riskLevel === 'HIGH' ? '#f87171' : tool.riskLevel === 'MEDIUM' ? '#fbbf24' : '#34d399',
                    }}>
                      Risk: {tool.riskLevel}
                    </span>
                  </div>

                  <h4 style={{ fontSize: '1rem', fontWeight: 700, marginTop: '0.5rem', color: '#ffffff', fontFamily: 'monospace' }}>
                    {tool.name}
                  </h4>
                  <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '0.25rem', overflow: 'hidden', textOverflow: 'ellipsis', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>
                    {tool.description}
                  </p>

                  <div style={{ marginTop: '0.75rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                    <span>📦 {tool.serviceName}</span>
                    <ChevronRight size={16} color={isSelected ? 'var(--accent-cyan)' : 'var(--text-muted)'} />
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Selected Tool Schema & Inspector Details */}
        {activeTool ? (
          <div className="glass-panel" style={{ padding: '1.75rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <span className="badge badge-active">{activeTool.capabilityTag} Capability</span>
                <h3 style={{ fontSize: '1.35rem', fontWeight: 800, marginTop: '0.5rem', fontFamily: 'monospace', color: 'var(--accent-cyan)' }}>
                  {activeTool.name}
                </h3>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '0.35rem' }}>
                  Provided by <strong>{activeTool.serviceName}</strong>
                </p>
              </div>

              {onSelectToolForCheck && (
                <button className="btn-primary" onClick={() => onSelectToolForCheck(activeTool.id)}>
                  Test in Tool Check 🧪
                </button>
              )}
            </div>

            <div style={{ background: 'rgba(0,0,0,0.3)', padding: '1rem', borderRadius: '10px', border: '1px solid var(--border-color)' }}>
              <h5 style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Description</h5>
              <p style={{ fontSize: '0.9rem', color: 'var(--text-primary)', marginTop: '0.25rem', lineHeight: '1.5' }}>
                {activeTool.description}
              </p>
            </div>

            {/* Input Schema section */}
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                <Code size={16} color="var(--accent-indigo)" />
                <h4 style={{ fontSize: '0.9rem', fontWeight: 700 }}>JSON Input Schema</h4>
              </div>
              <pre style={{
                background: '#04070d',
                padding: '1rem',
                borderRadius: '10px',
                border: '1px solid var(--border-color)',
                fontSize: '0.8rem',
                color: '#38bdf8',
                overflowX: 'auto',
                maxHeight: '220px',
              }}>
                {JSON.stringify(activeTool.inputSchema, null, 2)}
              </pre>
            </div>

            {/* Sample Payload section */}
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                <Sparkles size={16} color="var(--accent-purple)" />
                <h4 style={{ fontSize: '0.9rem', fontWeight: 700 }}>Sample Test Payload</h4>
              </div>
              <pre style={{
                background: '#04070d',
                padding: '1rem',
                borderRadius: '10px',
                border: '1px solid var(--border-color)',
                fontSize: '0.8rem',
                color: '#34d399',
                overflowX: 'auto',
                maxHeight: '180px',
              }}>
                {JSON.stringify(activeTool.samplePayload, null, 2)}
              </pre>
            </div>
          </div>
        ) : (
          <div className="glass-panel" style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
            Select a tool from the matrix to view detailed capabilities and schema.
          </div>
        )}
      </div>
    </div>
  );
};
