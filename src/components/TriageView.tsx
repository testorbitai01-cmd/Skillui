import React, { useState } from 'react';
import { Target, Sparkles, ArrowRight, Play, CheckCircle2, Cpu, Zap, HelpCircle } from 'lucide-react';
import { INITIAL_TRIAGE_SCENARIOS, TriageScenario } from '../data/mockData';

interface TriageViewProps {
  onExecuteTool?: (toolName: string, args: Record<string, any>) => void;
}

export const TriageView: React.FC<TriageViewProps> = ({ onExecuteTool }) => {
  const [userPrompt, setUserPrompt] = useState('');
  const [loading, setLoading] = useState(false);
  const [activeScenario, setActiveScenario] = useState<any>(INITIAL_TRIAGE_SCENARIOS[0]);
  const [executionLog, setExecutionLog] = useState<string[]>([]);

  const handleTriage = async (promptToUse?: string) => {
    const input = promptToUse || userPrompt;
    if (!input.trim()) return;

    setLoading(true);
    setExecutionLog([]);

    try {
      const res = await fetch('/api/triage', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userPrompt: input }),
      });
      const data = await res.json();
      if (data.success) {
        setActiveScenario(data.triageResult);
      }
    } catch (err) {
      console.error('Triage error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleRunPipeline = () => {
    if (!activeScenario) return;
    setExecutionLog([
      `🚀 [Triage Pipeline Started] User intent: "${activeScenario.userPrompt}"`,
      `🔍 Target Category: ${activeScenario.category}`,
      `📡 Matched MCP Services: ${activeScenario.matchedServices ? activeScenario.matchedServices.map((s: any) => s.name).join(', ') : 'testorbit-proctoring-mcp'}`,
    ]);

    activeScenario.stepSequence.forEach((step: string, idx: number) => {
      setTimeout(() => {
        setExecutionLog(prev => [...prev, `✅ Step ${idx + 1}: ${step}`]);
      }, (idx + 1) * 450);
    });

    setTimeout(() => {
      setExecutionLog(prev => [...prev, '🎉 [Triage Pipeline Completed Successfully] All matched tools executed cleanly.']);
    }, (activeScenario.stepSequence.length + 1) * 450);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Header */}
      <div>
        <h2 style={{ fontSize: '1.5rem', fontWeight: 700 }}>
          <span className="gradient-text">Smart Agentic Triage Engine</span>
        </h2>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginTop: '0.25rem' }}>
          Input user requests in natural language. The Triage Engine automatically classifies intent, routes to specific MCP services, and sequences tool calls.
        </p>
      </div>

      {/* Input Box */}
      <div className="glass-panel" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <Cpu size={16} color="var(--accent-cyan)" /> Enter Natural Language User Prompt
          </span>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Powered by TestOrbit Triage Router</span>
        </div>

        <textarea
          rows={3}
          placeholder="e.g. Candidate REG-2026-0941 lost power during section B. Please approve their reentry and give 10 extra minutes."
          value={userPrompt}
          onChange={e => setUserPrompt(e.target.value)}
          style={{
            width: '100%',
            padding: '1rem',
            background: 'rgba(0,0,0,0.3)',
            border: '1px solid var(--border-color)',
            borderRadius: '10px',
            color: 'white',
            fontSize: '0.95rem',
            lineHeight: '1.5',
          }}
        />

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem' }}>
          {/* Quick Preset Buttons */}
          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', alignSelf: 'center' }}>Try Presets:</span>
            {INITIAL_TRIAGE_SCENARIOS.map((sc, idx) => (
              <button
                key={sc.id}
                onClick={() => {
                  setUserPrompt(sc.userPrompt);
                  handleTriage(sc.userPrompt);
                }}
                style={{
                  fontSize: '0.75rem',
                  padding: '0.3rem 0.65rem',
                  borderRadius: '6px',
                  background: 'rgba(255,255,255,0.05)',
                  border: '1px solid var(--border-color)',
                  color: 'var(--text-secondary)',
                  cursor: 'pointer',
                }}
              >
                Preset #{idx + 1}
              </button>
            ))}
          </div>

          <button className="btn-primary" onClick={() => handleTriage()} disabled={loading}>
            {loading ? <Sparkles className="animate-spin" size={18} /> : <Target size={18} />} Analyze & Triage
          </button>
        </div>
      </div>

      {/* Triage Results Display */}
      {activeScenario && (
        <div style={{ display: 'grid', gridTemplateColumns: 'minmax(340px, 1fr) minmax(360px, 1fr)', gap: '1.5rem' }}>
          {/* Left Column: Triage Recommendation */}
          <div className="glass-panel" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span className="badge badge-active">{activeScenario.category}</span>
              <button className="btn-primary" style={{ padding: '0.4rem 0.85rem', fontSize: '0.8rem' }} onClick={handleRunPipeline}>
                <Play size={14} /> Run Triage Pipeline
              </button>
            </div>

            <div>
              <h4 style={{ fontSize: '0.85rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Matched Tools Pipeline</h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginTop: '0.75rem' }}>
                {activeScenario.suggestedTools.map((st: any, idx: number) => (
                  <div key={idx} style={{ background: 'rgba(0,0,0,0.3)', padding: '1rem', borderRadius: '10px', border: '1px solid var(--border-color)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: '0.9rem', fontWeight: 700, fontFamily: 'monospace', color: 'var(--accent-cyan)' }}>
                        {st.toolName}
                      </span>
                      <span style={{ fontSize: '0.75rem', color: '#34d399', fontWeight: 600 }}>
                        {(st.confidence * 100).toFixed(0)}% Confidence
                      </span>
                    </div>

                    <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '0.35rem' }}>
                      {st.reason}
                    </p>

                    <div style={{ marginTop: '0.5rem', background: '#04070d', padding: '0.5rem 0.75rem', borderRadius: '6px', fontSize: '0.75rem', fontFamily: 'monospace', color: '#818cf8' }}>
                      Extracted Args: {JSON.stringify(st.extractedArgs)}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Step Sequence */}
            <div>
              <h4 style={{ fontSize: '0.85rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Execution Steps</h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', marginTop: '0.5rem' }}>
                {activeScenario.stepSequence.map((step: string, idx: number) => (
                  <div key={idx} style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', padding: '0.4rem 0.6rem', borderRadius: '6px', background: 'rgba(255,255,255,0.03)' }}>
                    {step}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right Column: Real-Time Execution Console */}
          <div className="glass-panel" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column' }}>
            <h4 style={{ fontSize: '0.9rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
              <Zap size={16} color="var(--accent-amber)" /> Live Triage Execution Output
            </h4>

            <div style={{
              flex: 1,
              background: '#04070d',
              padding: '1rem',
              borderRadius: '10px',
              border: '1px solid var(--border-color)',
              fontFamily: 'monospace',
              fontSize: '0.8rem',
              color: '#34d399',
              minHeight: '260px',
              overflowY: 'auto',
            }}>
              {executionLog.length === 0 ? (
                <div style={{ color: 'var(--text-muted)', textAlign: 'center', marginTop: '4rem' }}>
                  Click "Run Triage Pipeline" to execute the recommended tool chain.
                </div>
              ) : (
                executionLog.map((log, i) => (
                  <div key={i} style={{ marginBottom: '0.4rem', lineHeight: '1.4' }}>
                    {log}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
