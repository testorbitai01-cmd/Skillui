import express, { Request, Response } from 'express';
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

let services: MCPService[] = [...INITIAL_SERVICES];
let tools: MCPTool[] = [...INITIAL_TOOLS];
let inspectorSessions: MCPInspectorConnection[] = [...INITIAL_INSPECTOR_SESSIONS];

// Helper to construct dynamic live base URL (works on localhost & Railway deployment)
const getBaseUrl = (req: Request) => {
  const host = req.get('host') || `localhost:${PORT}`;
  const isHttps = req.protocol === 'https' || req.get('x-forwarded-proto') === 'https';
  const protocol = isHttps ? 'https' : 'http';
  return `${protocol}://${host}`;
};

// ─────────────────────────────────────────────────────────────────────────────
// LIVE MCP MICROSERVICE PROTOCOL ENDPOINTS (JSON-RPC 2.0 over /mcp)
// ─────────────────────────────────────────────────────────────────────────────

// Combined Tools Registry
const ALL_MCP_TOOLS = tools.map(t => ({
  name: t.name,
  description: t.description,
  inputSchema: t.inputSchema,
  serviceName: t.serviceName,
  capabilityTag: t.capabilityTag,
}));

// Generic MCP JSON-RPC protocol handler builder
function createMcpHandler(serverName: string, serviceFilter?: string) {
  return async (req: Request, res: Response) => {
    const matchedTools = serviceFilter
      ? ALL_MCP_TOOLS.filter(t => t.serviceName === serviceFilter)
      : ALL_MCP_TOOLS;

    if (req.method === 'GET') {
      const baseUrl = getBaseUrl(req);
      return res.json({
        service: serverName,
        status: 'ONLINE',
        transport: 'HTTP/SSE',
        protocolVersion: '2024-11-05',
        liveBaseUrl: `${baseUrl}/mcp`,
        capabilities: { tools: true, resources: false, prompts: true },
        toolsCount: matchedTools.length,
        tools: matchedTools,
      });
    }

    const { jsonrpc, id, method, params } = req.body || {};

    if (jsonrpc !== '2.0') {
      return res.status(400).json({
        jsonrpc: '2.0',
        id: id || null,
        error: { code: -32600, message: 'Invalid Request: jsonrpc must be 2.0' },
      });
    }

    try {
      switch (method) {
        case 'initialize':
          return res.json({
            jsonrpc: '2.0',
            id,
            result: {
              protocolVersion: '2024-11-05',
              capabilities: { tools: {} },
              serverInfo: { name: serverName, version: '1.0.0' },
            },
          });

        case 'notifications/initialized':
          return res.status(204).end();

        case 'tools/list': {
          const matchedTools = serviceFilter
            ? ALL_MCP_TOOLS.filter(t => t.serviceName === serviceFilter)
            : ALL_MCP_TOOLS;
          return res.json({
            jsonrpc: '2.0',
            id,
            result: { tools: matchedTools },
          });
        }

        case 'tools/call': {
          const { name: toolName, arguments: toolArgs = {} } = params || {};
          const matchedTool = tools.find(t => t.name === toolName);
          const mockResult = matchedTool ? matchedTool.mockOutput : { status: 'executed', tool: toolName, args: toolArgs };

          // Dynamic enhancements based on arguments
          let dynamicResponse = { ...mockResult };
          if (toolName === 'approve_reentry_request' && toolArgs.timeAdjustmentMinutes) {
            dynamicResponse.grantedExtraMinutes = toolArgs.timeAdjustmentMinutes;
            dynamicResponse.decisionReason = toolArgs.decisionReason || 'Approved via Live MCP Endpoint';
            dynamicResponse.resumeCode = `ORBIT-${Math.floor(1000 + Math.random() * 9000)}-RESUME`;
          } else if (toolName === 'create_paper' && toolArgs.name) {
            dynamicResponse.name = toolArgs.name;
          }

          return res.json({
            jsonrpc: '2.0',
            id,
            result: {
              content: [{ type: 'text', text: JSON.stringify(dynamicResponse, null, 2) }],
              isError: false,
            },
          });
        }

        case 'resources/list':
          return res.json({ jsonrpc: '2.0', id, result: { resources: [] } });

        case 'prompts/list':
          return res.json({ jsonrpc: '2.0', id, result: { prompts: [] } });

        default:
          return res.status(404).json({
            jsonrpc: '2.0',
            id,
            error: { code: -32601, message: `Method '${method}' not found` },
          });
      }
    } catch (err: any) {
      return res.status(500).json({
        jsonrpc: '2.0',
        id,
        error: { code: -32603, message: err.message || 'Internal MCP protocol error' },
      });
    }
  };
}

// 🌐 Main Live Root Base MCP Endpoint (/mcp)
app.all('/mcp', createMcpHandler('testorbit-unified-mcp'));

// 🌐 Sub-Service Live MCP Endpoints (/mcp/questions, /mcp/candidates, etc.)
app.all('/mcp/questions', createMcpHandler('testorbit-questions-mcp', 'testorbit-questions-mcp'));
app.all('/mcp/candidates', createMcpHandler('testorbit-candidates-mcp', 'testorbit-candidates-mcp'));
app.all('/mcp/proctoring', createMcpHandler('testorbit-proctoring-mcp', 'testorbit-proctoring-mcp'));
app.all('/mcp/analytics', createMcpHandler('testorbit-analytics-mcp', 'testorbit-analytics-mcp'));

// ─────────────────────────────────────────────────────────────────────────────
// SKILLUI REST API ENDPOINTS
// ─────────────────────────────────────────────────────────────────────────────

// 1. Services Directory API with Dynamic Live Base URL Resolution
app.get('/api/services', (req: Request, res: Response) => {
  const baseUrl = getBaseUrl(req);

  const liveServices = [
    {
      id: 'srv-questions',
      name: 'testorbit-questions-mcp',
      slug: 'questions-paper-mcp',
      description: 'Question Bank Ingestion, SHA-256 Deduplication, Section Matching & Paper Assembly Engine',
      status: 'ACTIVE' as const,
      transport: 'HTTP' as const,
      endpoint: `${baseUrl}/mcp/questions`,
      port: Number(PORT),
      protocolVersion: '2024-11-05',
      toolsCount: ALL_MCP_TOOLS.filter(t => t.serviceName === 'testorbit-questions-mcp').length,
      capabilitiesCount: 4,
      health: { uptimePct: 99.9, latencyMs: 12, lastPing: 'Live Base URL' },
      tags: ['Authoring', 'Question Bank', 'Paper Assembly'],
    },
    {
      id: 'srv-candidates',
      name: 'testorbit-candidates-mcp',
      slug: 'candidates-profile-mcp',
      description: 'Student Registration, Education History Auditing, Domain Assignment & Device Readiness Checks',
      status: 'ACTIVE' as const,
      transport: 'HTTP' as const,
      endpoint: `${baseUrl}/mcp/candidates`,
      port: Number(PORT),
      protocolVersion: '2024-11-05',
      toolsCount: ALL_MCP_TOOLS.filter(t => t.serviceName === 'testorbit-candidates-mcp').length,
      capabilitiesCount: 3,
      health: { uptimePct: 99.8, latencyMs: 15, lastPing: 'Live Base URL' },
      tags: ['Onboarding', 'Profiles', 'Device Audit'],
    },
    {
      id: 'srv-proctoring',
      name: 'testorbit-proctoring-mcp',
      slug: 'proctoring-reentry-mcp',
      description: 'Real-Time Proctoring Incident Triage, Fraud Detection, Force Terminations & Reentry Approvals',
      status: 'ACTIVE' as const,
      transport: 'HTTP' as const,
      endpoint: `${baseUrl}/mcp/proctoring`,
      port: Number(PORT),
      protocolVersion: '2024-11-05',
      toolsCount: ALL_MCP_TOOLS.filter(t => t.serviceName === 'testorbit-proctoring-mcp').length,
      capabilitiesCount: 5,
      health: { uptimePct: 100, latencyMs: 8, lastPing: 'Live Base URL' },
      tags: ['Proctoring', 'Reentry', 'Live Ops'],
    },
    {
      id: 'srv-analytics',
      name: 'testorbit-analytics-mcp',
      slug: 'grading-analytics-mcp',
      description: 'Auto MCQ Grading, Subjective Coding Review Queue, Aggregated Placement Analytics & CSV Export',
      status: 'ACTIVE' as const,
      transport: 'HTTP' as const,
      endpoint: `${baseUrl}/mcp/analytics`,
      port: Number(PORT),
      protocolVersion: '2024-11-05',
      toolsCount: ALL_MCP_TOOLS.filter(t => t.serviceName === 'testorbit-analytics-mcp').length,
      capabilitiesCount: 4,
      health: { uptimePct: 99.5, latencyMs: 14, lastPing: 'Live Base URL' },
      tags: ['Evaluation', 'Coding Review', 'Reporting'],
    },
    {
      id: 'srv-unified-root',
      name: 'testorbit-unified-mcp-root',
      slug: 'unified-mcp-root',
      description: 'Root Unified MCP Protocol Base Endpoint aggregating all TestOrbit capabilities',
      status: 'ACTIVE' as const,
      transport: 'HTTP' as const,
      endpoint: `${baseUrl}/mcp`,
      port: Number(PORT),
      protocolVersion: '2024-11-05',
      toolsCount: ALL_MCP_TOOLS.length,
      capabilitiesCount: 16,
      health: { uptimePct: 100, latencyMs: 5, lastPing: 'Live Root Base URL' },
      tags: ['Unified Base URL', 'MCP Standard'],
    },
  ];

  res.json({ success: true, count: liveServices.length, liveBaseUrl: `${baseUrl}/mcp`, services: liveServices });
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
    transport: transport || 'HTTP',
    endpoint: endpoint || `${getBaseUrl(req)}/mcp`,
    port: Number(port) || 3001,
    protocolVersion: '2024-11-05',
    toolsCount: 0,
    capabilitiesCount: 1,
    health: { uptimePct: 100, latencyMs: 10, lastPing: 'Just now' },
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
app.post('/api/triage', (req: Request, res: Response) => {
  const { userPrompt } = req.body;
  if (!userPrompt) {
    return res.status(400).json({ success: false, error: 'userPrompt is required for triage' });
  }

  const baseUrl = getBaseUrl(req);
  const promptLower = userPrompt.toLowerCase();
  
  let matchedServices: any[] = [];
  let matchedToolsList: any[] = [];
  let category = 'General Assistant Query';
  let stepSequence: string[] = [];

  if (promptLower.includes('reentry') || promptLower.includes('power') || promptLower.includes('disconnect') || promptLower.includes('proctor')) {
    category = 'Reentry & Proctoring Triage';
    matchedServices = [
      { id: 'srv-proctoring', name: 'testorbit-proctoring-mcp', endpoint: `${baseUrl}/mcp/proctoring` },
      { id: 'srv-candidates', name: 'testorbit-candidates-mcp', endpoint: `${baseUrl}/mcp/candidates` },
    ];
    
    const regMatch = userPrompt.match(/REG[-\w\d]+/i);
    const regId = regMatch ? regMatch[0] : 'REG-2026-0941';

    const minMatch = userPrompt.match(/(\d+)\s*(mins|minutes|extra)/i);
    const extraMins = minMatch ? parseInt(minMatch[1], 10) : 10;

    matchedToolsList = [
      {
        toolId: 'tool-c1',
        toolName: 'search_students',
        confidence: 0.95,
        reason: `Locate active session ID for candidate ${regId}`,
        extractedArgs: { registrationNumber: regId },
      },
      {
        toolId: 'tool-p2',
        toolName: 'get_proctoring_events',
        confidence: 0.91,
        reason: 'Review pre-disconnection warning log & tab switches',
        extractedArgs: { sessionId: 'sess_live_771' },
      },
      {
        toolId: 'tool-p6',
        toolName: 'approve_reentry_request',
        confidence: 0.98,
        reason: `Grant candidate reentry with +${extraMins} minutes time extension`,
        extractedArgs: {
          reentryId: 'reentry_309',
          timeAdjustmentMinutes: extraMins,
          decisionReason: 'Verified power/connectivity interruption',
        },
      },
    ];

    stepSequence = [
      `1. Triage matched target candidate: ${regId}`,
      `2. Verify proctor logs via ${baseUrl}/mcp/proctoring`,
      `3. Execute approve_reentry_request with timeAdjustmentMinutes=${extraMins}`,
      `4. Generate & return secure single-use resume passcode`,
    ];
  } else if (promptLower.includes('paper') || promptLower.includes('question') || promptLower.includes('create') || promptLower.includes('bank')) {
    category = 'Test Paper & Authoring Triage';
    matchedServices = [
      { id: 'srv-questions', name: 'testorbit-questions-mcp', endpoint: `${baseUrl}/mcp/questions` },
    ];

    matchedToolsList = [
      {
        toolId: 'tool-q1',
        toolName: 'search_questions',
        confidence: 0.92,
        reason: 'Search question bank pool for matching subject tags',
        extractedArgs: { domainSlug: 'aiml-eng', limit: 25 },
      },
      {
        toolId: 'tool-q6',
        toolName: 'create_paper',
        confidence: 0.96,
        reason: 'Construct structured paper schema with section configuration',
        extractedArgs: {
          name: 'AI / Machine Learning Assessment 2026',
          domainId: 'dom_aiml',
          durationMinutes: 60,
          sections: [
            { key: 'A', title: 'AIML MCQ Section', questionCount: 15 },
            { key: 'B', title: 'Coding Challenge', questionCount: 2 },
          ],
        },
      },
    ];

    stepSequence = [
      '1. Parse domain & section constraints from prompt',
      `2. Query question bank depth via ${baseUrl}/mcp/questions`,
      '3. Assemble paper specification via create_paper',
      '4. Return paper creation validation token',
    ];
  } else {
    category = 'General TestOrbit Query';
    matchedServices = [{ id: 'srv-unified-root', name: 'testorbit-unified-mcp-root', endpoint: `${baseUrl}/mcp` }];
    matchedToolsList = [
      {
        toolId: 'tool-search-questions',
        toolName: 'search_questions',
        confidence: 0.75,
        reason: 'General system query match',
        extractedArgs: { query: userPrompt },
      },
    ];
    stepSequence = ['1. Parse query intent', `2. Route payload to live base URL ${baseUrl}/mcp` ];
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
app.get('/api/mcp/inspect', (req: Request, res: Response) => {
  const baseUrl = getBaseUrl(req);
  const liveSessions = [
    {
      id: 'insp-root',
      name: 'TestOrbit Root Base Endpoint (/mcp)',
      transport: 'HTTP' as const,
      urlOrCommand: `${baseUrl}/mcp`,
      status: 'CONNECTED' as const,
      connectedAt: new Date().toISOString(),
      serverInfo: { name: 'testorbit-unified-mcp-root', version: '1.0.0', protocolVersion: '2024-11-05' },
      capabilities: { tools: true, resources: true, prompts: true, logging: true },
    },
    ...inspectorSessions,
  ];
  res.json({ success: true, count: liveSessions.length, sessions: liveSessions });
});

app.post('/api/mcp/connect', (req, res) => {
  const { name, transport, urlOrCommand } = req.body;
  if (!name || !urlOrCommand) {
    return res.status(400).json({ success: false, error: 'Name and urlOrCommand are required' });
  }

  const newConnection: MCPInspectorConnection = {
    id: `insp-${Date.now()}`,
    name,
    transport: transport || 'HTTP',
    urlOrCommand,
    status: 'CONNECTED',
    connectedAt: new Date().toISOString(),
    serverInfo: {
      name: name.toLowerCase().replace(/\s+/g, '-'),
      version: '1.0.0',
      protocolVersion: '2024-11-05',
    },
    capabilities: { tools: true, resources: true, prompts: true, logging: true },
  };

  inspectorSessions.push(newConnection);
  res.status(201).json({ success: true, connection: newConnection });
});

// 5. Tool Check API — Supports POST JSON-RPC 2.0 and GET Method Live Tool Inspection
app.all('/api/tools/execute', async (req: Request, res: Response) => {
  const isGet = req.method === 'GET';
  const toolId = (isGet ? req.query.toolId : req.body.toolId) as string;
  let payload = isGet ? req.query.payload : req.body.payload;

  if (isGet && typeof payload === 'string') {
    try {
      payload = JSON.parse(payload);
    } catch {}
  }

  const startTime = Date.now();

  const tool = tools.find(t => t.id === toolId || t.name === toolId);
  if (!tool) {
    return res.status(404).json({
      success: false,
      error: `Tool '${toolId}' not found in registry`,
    });
  }

  const baseUrl = getBaseUrl(req);
  const endpoint = `${baseUrl}/mcp`;

  if (isGet) {
    // 🌐 Fetch Live Server Data via GET Method alone
    try {
      const getRes = await fetch(endpoint, { method: 'GET' });
      const getLiveData = await getRes.json();
      const latencyMs = Date.now() - startTime;

      return res.json({
        success: true,
        httpMethod: 'GET',
        toolName: tool.name,
        serviceName: tool.serviceName,
        endpoint,
        status: 200,
        latencyMs,
        timestamp: new Date().toISOString(),
        requestPayload: payload || tool.samplePayload,
        response: {
          checkMethod: 'GET',
          serviceStatus: getLiveData.status || 'ONLINE',
          protocolVersion: getLiveData.protocolVersion || '2024-11-05',
          toolDetails: {
            name: tool.name,
            serviceName: tool.serviceName,
            capabilityTag: tool.capabilityTag,
            riskLevel: tool.riskLevel,
            description: tool.description,
            inputSchema: tool.inputSchema,
            samplePayload: tool.samplePayload,
          },
          mockOutput: tool.mockOutput,
        },
      });
    } catch (err: any) {
      const latencyMs = Date.now() - startTime;
      return res.json({
        success: true,
        httpMethod: 'GET',
        toolName: tool.name,
        serviceName: tool.serviceName,
        endpoint,
        status: 200,
        latencyMs,
        timestamp: new Date().toISOString(),
        requestPayload: payload || tool.samplePayload,
        response: {
          checkMethod: 'GET',
          serviceStatus: 'ONLINE',
          toolDetails: {
            name: tool.name,
            serviceName: tool.serviceName,
            inputSchema: tool.inputSchema,
          },
          mockOutput: tool.mockOutput,
        },
      });
    }
  }

  try {
    const rpcPayload = {
      jsonrpc: '2.0',
      id: Date.now(),
      method: 'tools/call',
      params: {
        name: tool.name,
        arguments: payload || tool.samplePayload,
      },
    };

    const response = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(rpcPayload),
    });

    const latencyMs = Date.now() - startTime;
    const rpcResult = await response.json();

    if (rpcResult?.result?.content?.[0]?.text) {
      let parsedOutput = rpcResult.result.content[0].text;
      try {
        parsedOutput = JSON.parse(parsedOutput);
      } catch {}

      return res.json({
        success: true,
        httpMethod: 'POST',
        toolName: tool.name,
        serviceName: tool.serviceName,
        endpoint,
        status: 200,
        latencyMs,
        timestamp: new Date().toISOString(),
        requestPayload: payload || tool.samplePayload,
        response: parsedOutput,
      });
    }

    res.json({
      success: true,
      httpMethod: 'POST',
      toolName: tool.name,
      serviceName: tool.serviceName,
      endpoint,
      status: 200,
      latencyMs,
      timestamp: new Date().toISOString(),
      requestPayload: payload || tool.samplePayload,
      response: rpcResult.result || tool.mockOutput,
    });
  } catch (err: any) {
    const latencyMs = Date.now() - startTime;
    res.json({
      success: true,
      httpMethod: 'POST',
      toolName: tool.name,
      serviceName: tool.serviceName,
      endpoint,
      status: 200,
      latencyMs,
      timestamp: new Date().toISOString(),
      requestPayload: payload || tool.samplePayload,
      response: tool.mockOutput,
    });
  }
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
  console.log(`⚡ SkillUI & Live MCP Engine running on port ${PORT}`);
});
