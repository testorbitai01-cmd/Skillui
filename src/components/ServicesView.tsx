import React, { useState } from 'react';
import { Server, Activity, Plus, Terminal, Wifi, CheckCircle2, AlertCircle, Shield, ArrowUpRight } from 'lucide-react';
import { MCPService } from '../data/mockData';

interface ServicesViewProps {
  services: MCPService[];
  onAddService: (newService: Partial<MCPService>) => void;
  onSelectServiceForTools?: (serviceId: string) => void;
}

export const ServicesView: React.FC<ServicesViewProps> = ({
  services,
  onAddService,
}) => {
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    description: '',
    transport: 'SSE' as 'SSE' | 'STDIO' | 'HTTP',
    endpoint: '',
    port: 4005,
    tags: 'Authoring, Proctoring',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onAddService({
      name: formData.name,
      slug: formData.slug,
      description: formData.description,
      transport: formData.transport,
      endpoint: formData.endpoint || `http://localhost:${formData.port}/mcp`,
      port: Number(formData.port),
      tags: formData.tags.split(',').map(t => t.trim()),
    });
    setShowModal(false);
    setFormData({
      name: '',
      slug: '',
      description: '',
      transport: 'SSE',
      endpoint: '',
      port: 4005,
      tags: 'Authoring, Proctoring',
    });
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Top Banner & Action */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 700 }}>
            <span className="gradient-text">MCP Microservices Directory</span>
          </h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginTop: '0.25rem' }}>
            Manage and monitor all active Model Context Protocol (MCP) microservices powering TestOrbit.
          </p>
        </div>
        <button className="btn-primary" onClick={() => setShowModal(true)}>
          <Plus size={18} /> Add MCP Service
        </button>
      </div>

      {/* Metrics Row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem' }}>
        <div className="glass-panel" style={{ padding: '1.25rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
            <span>Total MCP Services</span>
            <Server size={18} color="var(--brand-blue)" />
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: 800, marginTop: '0.5rem', color: 'var(--text-primary)' }}>{services.length}</div>
          <div style={{ fontSize: '0.75rem', color: 'var(--accent-emerald)', marginTop: '0.25rem', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
            <CheckCircle2 size={12} /> {services.filter(s => s.status === 'ACTIVE').length} Active Microservices
          </div>
        </div>

        <div className="glass-panel" style={{ padding: '1.25rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
            <span>Total Available Tools</span>
            <Terminal size={18} color="var(--accent-purple)" />
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: 800, marginTop: '0.5rem', color: 'var(--text-primary)' }}>
            {services.reduce((acc, s) => acc + s.toolsCount, 0)}
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>
            Spread across {services.length} endpoints
          </div>
        </div>

        <div className="glass-panel" style={{ padding: '1.25rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
            <span>Avg Network Latency</span>
            <Activity size={18} color="var(--accent-emerald)" />
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: 800, marginTop: '0.5rem', color: 'var(--text-primary)' }}>
            {Math.round(services.reduce((acc, s) => acc + s.health.latencyMs, 0) / (services.length || 1))} ms
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--accent-emerald)', marginTop: '0.25rem' }}>
            Healthy HTTP & SSE Transport
          </div>
        </div>
      </div>

      {/* Services Cards Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: '1.25rem' }}>
        {services.map(service => (
          <div key={service.id} className="glass-panel glass-panel-hover" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <div style={{ width: 10, height: 10, borderRadius: '50%', background: service.status === 'ACTIVE' ? '#10b981' : '#f59e0b' }} />
                  <span className={`badge ${service.status === 'ACTIVE' ? 'badge-active' : 'badge-dev'}`}>
                    {service.status}
                  </span>
                </div>
                <span style={{ fontSize: '0.75rem', fontFamily: 'monospace', color: 'var(--text-muted)', background: 'rgba(0,0,0,0.05)', padding: '0.2rem 0.5rem', borderRadius: '4px', border: '1px solid var(--border-color)' }}>
                  {service.transport}
                </span>
              </div>

              <h3 style={{ fontSize: '1.15rem', fontWeight: 700, marginTop: '0.75rem', color: 'var(--text-primary)' }}>
                {service.name}
              </h3>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '0.4rem', lineHeight: '1.4' }}>
                {service.description}
              </p>

              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem', marginTop: '1rem' }}>
                {service.tags.map(t => (
                  <span key={t} style={{ fontSize: '0.7rem', padding: '0.2rem 0.6rem', borderRadius: '6px', background: 'rgba(37, 99, 235, 0.1)', color: 'var(--brand-blue)', border: '1px solid rgba(37, 99, 235, 0.25)', fontWeight: 600 }}>
                    {t}
                  </span>
                ))}
              </div>
            </div>

            <div style={{ marginTop: '1.5rem', paddingTop: '1rem', borderTop: '1px solid var(--border-color)' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', textAlign: 'center', gap: '0.5rem' }}>
                <div style={{ background: 'rgba(0,0,0,0.03)', padding: '0.5rem', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                  <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Tools</div>
                  <div style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--brand-blue)' }}>{service.toolsCount}</div>
                </div>
                <div style={{ background: 'rgba(0,0,0,0.03)', padding: '0.5rem', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                  <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Latency</div>
                  <div style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--accent-emerald)' }}>{service.health.latencyMs}ms</div>
                </div>
                <div style={{ background: 'rgba(0,0,0,0.03)', padding: '0.5rem', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                  <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Uptime</div>
                  <div style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-primary)' }}>{service.health.uptimePct}%</div>
                </div>
              </div>

              <div style={{ marginTop: '0.75rem', fontSize: '0.75rem', fontFamily: 'monospace', color: 'var(--text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                🔗 {service.endpoint}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Modal for adding Service */}
      {showModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(6px)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000, padding: '1rem' }}>
          <div className="glass-panel" style={{ width: '100%', maxWidth: '500px', padding: '2rem', background: 'var(--bg-card)' }}>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '1rem', color: 'var(--text-primary)' }}>Register New MCP Service</h3>
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Service Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. testorbit-notifications-mcp"
                  value={formData.name}
                  onChange={e => setFormData({ ...formData, name: e.target.value, slug: e.target.value.toLowerCase().replace(/\s+/g, '-') })}
                  style={{ width: '100%', padding: '0.6rem', border: '1px solid var(--border-color)', borderRadius: '8px', color: 'var(--text-primary)', marginTop: '0.25rem' }}
                />
              </div>

              <div>
                <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Description</label>
                <textarea
                  required
                  placeholder="Describe what capabilities this MCP service provides..."
                  value={formData.description}
                  onChange={e => setFormData({ ...formData, description: e.target.value })}
                  style={{ width: '100%', padding: '0.6rem', border: '1px solid var(--border-color)', borderRadius: '8px', color: 'var(--text-primary)', marginTop: '0.25rem', height: '70px' }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Transport</label>
                  <select
                    value={formData.transport}
                    onChange={e => setFormData({ ...formData, transport: e.target.value as any })}
                    style={{ width: '100%', padding: '0.6rem', border: '1px solid var(--border-color)', borderRadius: '8px', color: 'var(--text-primary)', marginTop: '0.25rem' }}
                  >
                    <option value="SSE">SSE (Server-Sent Events)</option>
                    <option value="HTTP">HTTP Endpoint</option>
                    <option value="STDIO">STDIO Command</option>
                  </select>
                </div>
                <div>
                  <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Port</label>
                  <input
                    type="number"
                    value={formData.port}
                    onChange={e => setFormData({ ...formData, port: Number(e.target.value) })}
                    style={{ width: '100%', padding: '0.6rem', border: '1px solid var(--border-color)', borderRadius: '8px', color: 'var(--text-primary)', marginTop: '0.25rem' }}
                  />
                </div>
              </div>

              <div>
                <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Endpoint / Command URL</label>
                <input
                  type="text"
                  placeholder="http://localhost:4005/mcp"
                  value={formData.endpoint}
                  onChange={e => setFormData({ ...formData, endpoint: e.target.value })}
                  style={{ width: '100%', padding: '0.6rem', border: '1px solid var(--border-color)', borderRadius: '8px', color: 'var(--text-primary)', marginTop: '0.25rem' }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1rem' }}>
                <button type="button" className="btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" className="btn-primary">Save & Register</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
