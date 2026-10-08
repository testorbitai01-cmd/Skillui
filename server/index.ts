import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import {
  INITIAL_SERVICES,
  INITIAL_TOOLS,
  INITIAL_TRIAGE_SCENARIOS,
  INITIAL_INSPECTOR_SESSIONS,
  MCPService,
  MCPTool,
  MCPInspectorConnection,
} from '../src/data/mockData.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

// In-memory data store
let services: MCPService[] = [...INITIAL_SERVICES];
let tools: MCPTool[] = [...INITIAL_TOOLS];
let inspectorSessions: MCPInspectorConnection[] = [...INITIAL_INSPECTOR_SESSIONS];

// 1. Services API
app.get('/api/services', (_req, res) => {
  res.json({ success: true, count: services.length, services });
});

app.post('/api/services', (req, res) => {
  const { name, slug, description, transport, endpoint, port, tags } = req.body;
  if (!name || !slug) {
    return res.status(400).json({ success: false, error: 'Name and slug are required' });
  }
  const newService: MCPService = {
    id: `srv-${Date.now()}`,
    name,
    slug,
    description: description || 'Custom MCP Microservice',
    status: 'ACTIVE',
    transport: transport || 'SSE',
    endpoint: endpoint || `http://localhost:${port || 4005}/mcp`,
    port: Number(port) || 4005,
    protocolVersion: '2024-11-05',
    toolsCount: 0,
    capabilitiesCount: 1,
    health: {
      uptimePct: 100,
      latencyMs: 15,
      lastPing: 'Just now',
    },
    tags: Array.isArray(tags) ? tags : ['Custom'],
  };
  services.push(newService);
  res.status(201).json({ success: true, service: newService });
});

// 2. Capabilities & Tools API
app.get('/api/tools', (_req, res) => {
  res.json({ success: true, count: tools.length, tools });
});

app.get('/api/capabilities', (_req, res) => {
  const capabilitiesByTag = tools.reduce((acc, tool) => {
    const tag = tool.capabilityTag;
    if (!acc[tag]) acc[tag] = [];
    acc[tag].push(tool);
    return acc;
  }, {} as Record<string, MCPTool[]>);

  res.json({
    success: true,
    totalCapabilities: Object.keys(capabilitiesByTag).length,
    capabilities: capabilitiesByTag,
  });
});

// 3. Triage Engine API
app.post('/api/triage', (req, res) => {
  const { userPrompt } = req.body;
  if (!userPrompt) {
    return res.status(400).json({ success: false, error: 'userPrompt is required for triage' });
  }

  const promptLower = userPrompt.toLowerCase();
  
  // Intelligent rule/pattern matching
  let matchedServices: MCPService[] = [];
  let matchedToolsList: any[] = [];
  let category = 'General Assistant Query';
  let stepSequence: string[] = [];

  if (promptLower.includes('reentry') || promptLower.includes('power') || promptLower.includes('disconnect') || promptLower.includes('proctor')) {
    category = 'Reentry & Proctoring Triage';
    matchedServices = services.filter(s => s.tags.includes('Proctoring') || s.tags.includes('Onboarding'));
    
    // Extract candidate ID if present
    const regMatch = userPrompt.match(/REG[-\w\d]+/i);
    const regId = regMatch ? regMatch[0] : 'REG-2026-UNKNOWN';

    // Extract extra minutes if mentioned
    const minMatch = userPrompt.match(/(\d+)\s*(mins|minutes|extra)/i);
    const extraMins = minMatch ? parseInt(minMatch[1], 10) : 10;

    matchedToolsList = [
      {
        toolId: 'tool-3',
        toolName: 'search_students',
        confidence: 0.95,
        reason: `Locate active session ID for candidate ${regId}`,
        extractedArgs: { registrationNumber: regId },
      },
      {
        toolId: 'tool-4',
        toolName: 'get_proctoring_events',
        confidence: 0.91,
        reason: 'Review pre-disconnection warning log & tab switches',
        extractedArgs: { sessionId: 'sess_live_771' },
      },
      {
        toolId: 'tool-5',
        toolName: 'approve_reentry_request',
        confidence: 0.98,
        reason: `Grant candidate reentry with +${extraMins} minutes time extension`,
        extractedArgs: {
          reentryId: 'reentry_auto_detected',
          timeAdjustmentMinutes: extraMins,
          decisionReason: 'Verified power/connectivity interruption',
        },
      },
    ];

    stepSequence = [
      `1. Triage matched target candidate: ${regId}`,
      `2. Verify proctor logs for session interruption evidence`,
      `3. Execute approve_reentry_request with timeAdjustmentMinutes=${extraMins}`,
      `4. Generate & return secure single-use resume passcode`,
    ];
  } else if (promptLower.includes('paper') || promptLower.includes('question') || promptLower.includes('create') || promptLower.includes('bank')) {
    category = 'Test Paper & Authoring Triage';
    matchedServices = services.filter(s => s.tags.includes('Authoring'));

    matchedToolsList = [
      {
        toolId: 'tool-1',
        toolName: 'search_questions',
        confidence: 0.92,
        reason: 'Search question bank pool for matching subject tags',
        extractedArgs: { domainSlug: 'aiml-eng', limit: 25 },
      },
      {
        toolId: 'tool-2',
        toolName: 'create_paper',
        confidence: 0.96,
        reason: 'Construct structured paper schema with section configuration',
        extractedArgs: {
          name: 'Custom Assessment Paper',
          domainId: 'dom_general',
          durationMinutes: 45,
          sections: [{ key: 'A', title: 'Core Assessment', questionCount: 20 }],
        },
      },
    ];

    stepSequence = [
      '1. Parse domain & section constraints from user prompt',
      '2. Query question bank depth via search_questions',
      '3. Assemble paper specification via create_paper',
      '4. Return paper creation validation token',
    ];
  } else {
    // Default fallback triage
    category = 'General TestOrbit Query';
    matchedServices = services.slice(0, 2);
    matchedToolsList = [
      {
        toolId: 'tool-1',
        toolName: 'search_questions',
        confidence: 0.75,
        reason: 'General system query match',
        extractedArgs: { query: userPrompt },
      },
    ];
    stepSequence = [
      '1. Parse query intent',
      '2. Route payload to general MCP search handler',
    ];
  }

  res.json({
    success: true,
    triageResult: {
      userPrompt,
      category,
      matchedServiceIds: matchedServices.map(s => s.id),
      matchedServices: matchedServices.map(s => ({ id: s.id, name: s.name, endpoint: s.endpoint })),
      suggestedTools: matchedToolsList,
      stepSequence,
      timestamp: new Date().toISOString(),
    },
  });
});

// 4. MCP Inspector API
app.get('/api/mcp/inspect', (_req, res) => {
  res.json({ success: true, count: inspectorSessions.length, sessions: inspectorSessions });
});

app.post('/api/mcp/connect', (req, res) => {
  const { name, transport, urlOrCommand } = req.body;
  if (!name || !urlOrCommand) {
    return res.status(400).json({ success: false, error: 'Name and urlOrCommand are required' });
  }

  const newConnection: MCPInspectorConnection = {
    id: `insp-${Date.now()}`,
    name,
    transport: transport || 'SSE',
    urlOrCommand,
    status: 'CONNECTED',
    connectedAt: new Date().toISOString(),
    serverInfo: {
      name: name.toLowerCase().replace(/\s+/g, '-'),
      version: '1.0.0',
      protocolVersion: '2024-11-05',
    },
    capabilities: {
      tools: true,
      resources: true,
      prompts: true,
      logging: true,
    },
  };

  inspectorSessions.push(newConnection);
  res.status(201).json({ success: true, connection: newConnection });
});

// 5. Tool Check Sandbox API
app.post('/api/tools/execute', (req, res) => {
  const { toolId, payload } = req.body;
  const startTime = Date.now();

  const tool = tools.find(t => t.id === toolId || t.name === toolId);
  if (!tool) {
    return res.status(404).json({
      success: false,
      error: `Tool '${toolId}' not found in registry`,
    });
  }

  // Simulate remote tool invocation delay (15-60ms)
  const simulatedDelay = Math.floor(Math.random() * 45) + 15;

  setTimeout(() => {
    const latencyMs = Date.now() - startTime;
    
    // Dynamic mock responses based on payload
    let resultPayload = { ...tool.mockOutput };
    if (tool.name === 'approve_reentry_request' && payload?.timeAdjustmentMinutes) {
      resultPayload.grantedExtraMinutes = payload.timeAdjustmentMinutes;
      resultPayload.decisionReason = payload.decisionReason || 'Approved via SkillUI Tool Check';
    } else if (tool.name === 'create_paper' && payload?.name) {
      resultPayload.name = payload.name;
    }

    res.json({
      success: true,
      toolName: tool.name,
      serviceName: tool.serviceName,
      status: 200,
      latencyMs,
      timestamp: new Date().toISOString(),
      requestPayload: payload || tool.samplePayload,
      response: resultPayload,
    });
  }, simulatedDelay);
});

// Serve frontend static assets in production
if (process.env.NODE_ENV === 'production') {
  const staticPath = path.join(__dirname, '../dist');
  app.use(express.static(staticPath));
  app.get('*', (_req, res) => {
    res.sendFile(path.join(staticPath, 'index.html'));
  });
}

app.listen(PORT, () => {
  console.log(`⚡ SkillUI Microservice running on port ${PORT}`);
});
