import React, { useState, useEffect } from 'react';
import { Server, Layers, Target, Eye, Wrench, Activity, Sparkles, CheckCircle2 } from 'lucide-react';
import { ServicesView } from './components/ServicesView';
import { CapabilitiesView } from './components/CapabilitiesView';
import { TriageView } from './components/TriageView';
import { MCPInspectorView } from './components/MCPInspectorView';
import { ToolCheckView } from './components/ToolCheckView';
import {
  INITIAL_SERVICES,
  INITIAL_TOOLS,
  INITIAL_INSPECTOR_SESSIONS,
  MCPService,
  MCPTool,
  MCPInspectorConnection,
} from './data/mockData';

type Tab = 'services' | 'capabilities' | 'triage' | 'mcp' | 'tool-check';

export default function App() {
  const [activeTab, setActiveTab] = useState<Tab>('services');
  const [services, setServices] = useState<MCPService[]>(INITIAL_SERVICES);
  const [tools, setTools] = useState<MCPTool[]>(INITIAL_TOOLS);
  const [inspectorSessions, setInspectorSessions] = useState<MCPInspectorConnection[]>(INITIAL_INSPECTOR_SESSIONS);
  const [selectedToolForCheck, setSelectedToolForCheck] = useState<string>('');

  // Fetch real data from backend API if available
  useEffect(() => {
    fetch('/api/services')
      .then(res => res.json())
      .then(data => {
        if (data.success && data.services) setServices(data.services);
      })
      .catch(() => {});

    fetch('/api/tools')
      .then(res => res.json())
      .then(data => {
        if (data.success && data.tools) setTools(data.tools);
      })
      .catch(() => {});
  }, []);

  const handleAddService = async (newServiceData: Partial<MCPService>) => {
    try {
      const res = await fetch('/api/services', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newServiceData),
      });
      const data = await res.json();
      if (data.success && data.service) {
        setServices(prev => [...prev, data.service]);
      }
    } catch {
      const fallback: MCPService = {
        id: `srv-${Date.now()}`,
        name: newServiceData.name || 'Custom MCP Service',
        slug: newServiceData.slug || 'custom-mcp',
        description: newServiceData.description || 'MCP Microservice',
        status: 'ACTIVE',
        transport: newServiceData.transport || 'SSE',
        endpoint: newServiceData.endpoint || 'http://localhost:4005/mcp',
        port: newServiceData.port || 4005,
        protocolVersion: '2024-11-05',
        toolsCount: 5,
        capabilitiesCount: 2,
        health: { uptimePct: 100, latencyMs: 12, lastPing: 'Just now' },
        tags: newServiceData.tags || ['Custom'],
      };
      setServices(prev => [...prev, fallback]);
    }
  };

  const handleAddInspectorConnection = async (newConn: Partial<MCPInspectorConnection>) => {
    try {
      const res = await fetch('/api/mcp/connect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newConn),
      });
      const data = await res.json();
      if (data.success && data.connection) {
        setInspectorSessions(prev => [...prev, data.connection]);
      }
    } catch {
      const fallback: MCPInspectorConnection = {
        id: `insp-${Date.now()}`,
        name: newConn.name || 'Local MCP Endpoint',
        transport: newConn.transport || 'SSE',
        urlOrCommand: newConn.urlOrCommand || 'http://localhost:4005/mcp/sse',
        status: 'CONNECTED',
        connectedAt: new Date().toISOString(),
        serverInfo: {
          name: (newConn.name || 'custom-mcp').toLowerCase().replace(/\s+/g, '-'),
          version: '1.0.0',
          protocolVersion: '2024-11-05',
        },
        capabilities: { tools: true, resources: true, prompts: true, logging: true },
      };
      setInspectorSessions(prev => [...prev, fallback]);
    }
  };

  const handleSelectToolForCheck = (toolId: string) => {
    setSelectedToolForCheck(toolId);
    setActiveTab('tool-check');
  };

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: 'var(--bg-dark)' }}>
      {/* Left Sidebar Navigation */}
      <aside style={{
        width: '270px',
        background: 'rgba(11, 18, 32, 0.96)',
        borderRight: '1px solid var(--border-color)',
        padding: '1.5rem 1rem',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        position: 'fixed',
        top: 0,
        bottom: 0,
        left: 0,
        zIndex: 50,
      }}>
        <div>
          {/* Logo Brand using official TestOrbit Brand Logo */}
          <div style={{ padding: '0 0.5rem', marginBottom: '2rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <img
                src="/logo-dark.png"
                alt="TestOrbit Logo"
                onError={(e) => {
                  // Fallback to logo.png if logo-dark.png isn't available
                  (e.target as HTMLImageElement).src = '/logo.png';
                }}
                style={{ height: '36px', objectFit: 'contain' }}
              />
              <div style={{ borderLeft: '1px solid var(--border-color)', paddingLeft: '0.6rem' }}>
                <h1 style={{ fontSize: '1.05rem', fontWeight: 800, color: '#ffffff', lineHeight: '1.1' }}>
                  Skill<span className="gradient-text">UI</span>
                </h1>
                <p style={{ fontSize: '0.65rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginTop: '0.15rem' }}>
                  MCP Control Center
                </p>
              </div>
            </div>
          </div>

          {/* Sidebar Navigation Items */}
          <nav style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
            <button
              onClick={() => setActiveTab('services')}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.75rem',
                padding: '0.75rem 1rem',
                borderRadius: '10px',
                fontSize: '0.88rem',
                fontWeight: 600,
                border: 'none',
                cursor: 'pointer',
                textAlign: 'left',
                width: '100%',
                background: activeTab === 'services' ? 'rgba(37, 99, 235, 0.22)' : 'transparent',
                color: activeTab === 'services' ? '#ffffff' : 'var(--text-secondary)',
                borderLeft: activeTab === 'services' ? '3px solid var(--brand-blue)' : '3px solid transparent',
                transition: 'all 0.15s ease',
              }}
            >
              <Server size={18} color={activeTab === 'services' ? 'var(--accent-cyan)' : 'currentColor'} />
              1. Services
            </button>

            <button
              onClick={() => setActiveTab('capabilities')}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.75rem',
                padding: '0.75rem 1rem',
                borderRadius: '10px',
                fontSize: '0.88rem',
                fontWeight: 600,
                border: 'none',
                cursor: 'pointer',
                textAlign: 'left',
                width: '100%',
                background: activeTab === 'capabilities' ? 'rgba(37, 99, 235, 0.22)' : 'transparent',
                color: activeTab === 'capabilities' ? '#ffffff' : 'var(--text-secondary)',
                borderLeft: activeTab === 'capabilities' ? '3px solid var(--brand-blue)' : '3px solid transparent',
                transition: 'all 0.15s ease',
              }}
            >
              <Layers size={18} color={activeTab === 'capabilities' ? 'var(--brand-blue-light)' : 'currentColor'} />
              2. Capability
            </button>

            <button
              onClick={() => setActiveTab('triage')}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.75rem',
                padding: '0.75rem 1rem',
                borderRadius: '10px',
                fontSize: '0.88rem',
                fontWeight: 600,
                border: 'none',
                cursor: 'pointer',
                textAlign: 'left',
                width: '100%',
                background: activeTab === 'triage' ? 'rgba(37, 99, 235, 0.22)' : 'transparent',
                color: activeTab === 'triage' ? '#ffffff' : 'var(--text-secondary)',
                borderLeft: activeTab === 'triage' ? '3px solid var(--brand-blue)' : '3px solid transparent',
                transition: 'all 0.15s ease',
              }}
            >
              <Target size={18} color={activeTab === 'triage' ? 'var(--accent-purple)' : 'currentColor'} />
              3. Triage
            </button>

            <button
              onClick={() => setActiveTab('mcp')}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.75rem',
                padding: '0.75rem 1rem',
                borderRadius: '10px',
                fontSize: '0.88rem',
                fontWeight: 600,
                border: 'none',
                cursor: 'pointer',
                textAlign: 'left',
                width: '100%',
                background: activeTab === 'mcp' ? 'rgba(37, 99, 235, 0.22)' : 'transparent',
                color: activeTab === 'mcp' ? '#ffffff' : 'var(--text-secondary)',
                borderLeft: activeTab === 'mcp' ? '3px solid var(--brand-blue)' : '3px solid transparent',
                transition: 'all 0.15s ease',
              }}
            >
              <Eye size={18} color={activeTab === 'mcp' ? '#34d399' : 'currentColor'} />
              4. MCP Inspector
            </button>

            <button
              onClick={() => setActiveTab('tool-check')}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.75rem',
                padding: '0.75rem 1rem',
                borderRadius: '10px',
                fontSize: '0.88rem',
                fontWeight: 600,
                border: 'none',
                cursor: 'pointer',
                textAlign: 'left',
                width: '100%',
                background: activeTab === 'tool-check' ? 'rgba(37, 99, 235, 0.22)' : 'transparent',
                color: activeTab === 'tool-check' ? '#ffffff' : 'var(--text-secondary)',
                borderLeft: activeTab === 'tool-check' ? '3px solid var(--brand-blue)' : '3px solid transparent',
                transition: 'all 0.15s ease',
              }}
            >
              <Wrench size={18} color={activeTab === 'tool-check' ? '#fbbf24' : 'currentColor'} />
              5. Tool Check
            </button>
          </nav>
        </div>

        {/* TestOrbit Platform Card */}
        <div style={{ padding: '0.85rem', background: 'rgba(17, 26, 46, 0.8)', borderRadius: '10px', border: '1px solid var(--border-color)' }}>
          <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>TestOrbit Campus Ecosystem</div>
          <div style={{ fontSize: '0.8rem', fontWeight: 700, color: '#34d399', display: 'flex', alignItems: 'center', gap: '0.35rem', marginTop: '0.2rem' }}>
            <Activity size={12} /> TestOrbit Connected
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <main style={{ marginLeft: '270px', flex: 1, padding: '2rem', maxWidth: '1400px' }}>
        {activeTab === 'services' && (
          <ServicesView services={services} onAddService={handleAddService} />
        )}
        {activeTab === 'capabilities' && (
          <CapabilitiesView tools={tools} onSelectToolForCheck={handleSelectToolForCheck} />
        )}
        {activeTab === 'triage' && (
          <TriageView />
        )}
        {activeTab === 'mcp' && (
          <MCPInspectorView inspectorSessions={inspectorSessions} onAddConnection={handleAddInspectorConnection} />
        )}
        {activeTab === 'tool-check' && (
          <ToolCheckView tools={tools} preselectedToolId={selectedToolForCheck} />
        )}
      </main>
    </div>
  );
}
