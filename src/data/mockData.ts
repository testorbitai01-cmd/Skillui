export interface MCPTool {
  id: string;
  name: string;
  serviceId: string;
  serviceName: string;
  description: string;
  capabilityTag: 'Authoring' | 'Onboarding' | 'Proctoring' | 'Evaluation' | 'Security';
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH';
  inputSchema: Record<string, any>;
  samplePayload: Record<string, any>;
  mockOutput: Record<string, any>;
}

export interface MCPService {
  id: string;
  name: string;
  slug: string;
  description: string;
  status: 'ACTIVE' | 'DEVELOPMENT' | 'OFFLINE';
  transport: 'STDIO' | 'SSE' | 'HTTP';
  endpoint: string;
  port: number;
  protocolVersion: string;
  toolsCount: number;
  capabilitiesCount: number;
  health: {
    uptimePct: number;
    latencyMs: number;
    lastPing: string;
  };
  tags: string[];
}

export interface TriageScenario {
  id: string;
  userPrompt: string;
  category: string;
  matchedServiceIds: string[];
  suggestedTools: {
    toolId: string;
    toolName: string;
    confidence: number;
    reason: string;
    extractedArgs: Record<string, any>;
  }[];
  stepSequence: string[];
}

export interface MCPInspectorConnection {
  id: string;
  name: string;
  transport: 'SSE' | 'STDIO' | 'HTTP';
  urlOrCommand: string;
  status: 'CONNECTED' | 'DISCONNECTED' | 'ERROR';
  connectedAt?: string;
  serverInfo: {
    name: string;
    version: string;
    protocolVersion: string;
  };
  capabilities: {
    tools: boolean;
    resources: boolean;
    prompts: boolean;
    logging: boolean;
  };
}

// Clean, non-duplicate list of official TestOrbit MCP Microservices
export const INITIAL_SERVICES: MCPService[] = [
  {
    id: 'srv-questions',
    name: 'testorbit-questions-mcp',
    slug: 'questions-paper-mcp',
    description: 'Question Bank Ingestion, SHA-256 Deduplication, Section Matching & Paper Assembly Engine',
    status: 'ACTIVE',
    transport: 'SSE',
    endpoint: 'http://localhost:4001/mcp/sse',
    port: 4001,
    protocolVersion: '2024-11-05',
    toolsCount: 10,
    capabilitiesCount: 4,
    health: {
      uptimePct: 99.9,
      latencyMs: 14,
      lastPing: '2s ago',
    },
    tags: ['Authoring', 'Question Bank', 'Paper Assembly'],
  },
  {
    id: 'srv-candidates',
    name: 'testorbit-candidates-mcp',
    slug: 'candidates-profile-mcp',
    description: 'Student Registration, Education History Auditing, Domain Assignment & Device Readiness Checks',
    status: 'ACTIVE',
    transport: 'HTTP',
    endpoint: 'http://localhost:4002/mcp/api',
    port: 4002,
    protocolVersion: '2024-11-05',
    toolsCount: 8,
    capabilitiesCount: 3,
    health: {
      uptimePct: 99.8,
      latencyMs: 22,
      lastPing: '5s ago',
    },
    tags: ['Onboarding', 'Profiles', 'Device Audit'],
  },
  {
    id: 'srv-proctoring',
    name: 'testorbit-proctoring-mcp',
    slug: 'proctoring-reentry-mcp',
    description: 'Real-Time Proctoring Incident Triage, Fraud Detection, Force Terminations & Reentry Approvals',
    status: 'ACTIVE',
    transport: 'SSE',
    endpoint: 'http://localhost:4003/mcp/sse',
    port: 4003,
    protocolVersion: '2024-11-05',
    toolsCount: 11,
    capabilitiesCount: 5,
    health: {
      uptimePct: 100,
      latencyMs: 9,
      lastPing: '1s ago',
    },
    tags: ['Proctoring', 'Reentry', 'Live Ops'],
  },
  {
    id: 'srv-analytics',
    name: 'testorbit-analytics-mcp',
    slug: 'grading-analytics-mcp',
    description: 'Auto MCQ Grading, Subjective Coding Review Queue, Aggregated Placement Analytics & CSV Export',
    status: 'ACTIVE',
    transport: 'STDIO',
    endpoint: 'npx -y testorbit-analytics-mcp',
    port: 4004,
    protocolVersion: '2024-11-05',
    toolsCount: 9,
    capabilitiesCount: 4,
    health: {
      uptimePct: 99.5,
      latencyMs: 18,
      lastPing: '4s ago',
    },
    tags: ['Evaluation', 'Coding Review', 'Reporting'],
  },
];

export const INITIAL_TOOLS: MCPTool[] = [
  {
    id: 'tool-search-questions',
    name: 'search_questions',
    serviceId: 'srv-questions',
    serviceName: 'testorbit-questions-mcp',
    description: 'Search and filter question bank by domain slug, difficulty (EASY/MEDIUM/HARD), section, or text query.',
    capabilityTag: 'Authoring',
    riskLevel: 'LOW',
    inputSchema: {
      type: 'object',
      properties: {
        domainSlug: { type: 'string', description: 'Domain slug (e.g., software-engineering)' },
        difficulty: { type: 'string', enum: ['EASY', 'MEDIUM', 'HARD'] },
        section: { type: 'string', description: 'Section key matching PaperSection' },
        limit: { type: 'number', default: 20 },
      },
      required: ['domainSlug'],
    },
    samplePayload: {
      domainSlug: 'aiml-eng',
      difficulty: 'MEDIUM',
      limit: 5,
    },
    mockOutput: {
      status: 'success',
      totalCount: 42,
      questions: [
        { id: 'q-101', text: 'Explain Gradient Descent optimization algorithm', marks: 5, difficulty: 'MEDIUM', type: 'MCQ' },
        { id: 'q-102', text: 'Implement Softmax loss function in Python', marks: 10, difficulty: 'MEDIUM', type: 'CODING' },
      ],
    },
  },
  {
    id: 'tool-create-paper',
    name: 'create_paper',
    serviceId: 'srv-questions',
    serviceName: 'testorbit-questions-mcp',
    description: 'Create a question paper specification for a specific domain with section rules.',
    capabilityTag: 'Authoring',
    riskLevel: 'MEDIUM',
    inputSchema: {
      type: 'object',
      properties: {
        name: { type: 'string' },
        domainId: { type: 'string' },
        durationMinutes: { type: 'number', default: 45 },
        negativeMarkingEnabled: { type: 'boolean', default: false },
        sections: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              key: { type: 'string' },
              title: { type: 'string' },
              questionCount: { type: 'number' },
            },
          },
        },
      },
      required: ['name', 'domainId', 'sections'],
    },
    samplePayload: {
      name: 'Campus Recruitment Final Assessment 2026',
      domainId: 'dom_aiml',
      durationMinutes: 60,
      negativeMarkingEnabled: true,
      sections: [
        { key: 'A', title: 'Aptitude & Logic', questionCount: 15 },
        { key: 'C', title: 'Coding Challenge', questionCount: 2 },
      ],
    },
    mockOutput: {
      status: 'created',
      paperId: 'paper_9921',
      name: 'Campus Recruitment Final Assessment 2026',
      isActive: false,
      sectionsCount: 2,
    },
  },
  {
    id: 'tool-search-students',
    name: 'search_students',
    serviceId: 'srv-candidates',
    serviceName: 'testorbit-candidates-mcp',
    description: 'Lookup candidate profiles by registration number, college email, or college name.',
    capabilityTag: 'Onboarding',
    riskLevel: 'LOW',
    inputSchema: {
      type: 'object',
      properties: {
        registrationNumber: { type: 'string' },
        collegeName: { type: 'string' },
        domainId: { type: 'string' },
      },
    },
    samplePayload: {
      registrationNumber: 'REG-2026-0941',
    },
    mockOutput: {
      found: 1,
      students: [
        {
          id: 'stu_882',
          fullName: 'Aarav Sharma',
          registrationNumber: 'REG-2026-0941',
          collegeName: 'IIT Madras',
          domain: 'AI / Data Science',
          deviceCheckCompleted: true,
        },
      ],
    },
  },
  {
    id: 'tool-get-proctoring-events',
    name: 'get_proctoring_events',
    serviceId: 'srv-proctoring',
    serviceName: 'testorbit-proctoring-mcp',
    description: 'Fetch detailed proctoring violation event log for a live assessment session.',
    capabilityTag: 'Proctoring',
    riskLevel: 'LOW',
    inputSchema: {
      type: 'object',
      properties: {
        sessionId: { type: 'string' },
        minSeverity: { type: 'string', enum: ['LOGGED', 'WARNING', 'TERMINATED'] },
      },
      required: ['sessionId'],
    },
    samplePayload: {
      sessionId: 'sess_live_771',
    },
    mockOutput: {
      sessionId: 'sess_live_771',
      studentName: 'Priya Verma',
      totalWarnings: 2,
      events: [
        { type: 'TAB_HIDDEN', durationMs: 4200, action: 'WARNING', timestamp: '2026-10-08T20:15:10Z' },
        { type: 'MULTIPLE_FACES_DETECTED', faceCount: 2, action: 'WARNING', timestamp: '2026-10-08T20:22:45Z' },
      ],
    },
  },
  {
    id: 'tool-approve-reentry',
    name: 'approve_reentry_request',
    serviceId: 'srv-proctoring',
    serviceName: 'testorbit-proctoring-mcp',
    description: 'Approve candidate reentry, generate single-use resume hash, and grant time extension.',
    capabilityTag: 'Proctoring',
    riskLevel: 'HIGH',
    inputSchema: {
      type: 'object',
      properties: {
        reentryId: { type: 'string' },
        timeAdjustmentMinutes: { type: 'number', default: 0 },
        decisionReason: { type: 'string' },
      },
      required: ['reentryId', 'decisionReason'],
    },
    samplePayload: {
      reentryId: 'reentry_309',
      timeAdjustmentMinutes: 10,
      decisionReason: 'Verified power outage in candidate hostel block.',
    },
    mockOutput: {
      status: 'APPROVED',
      reentryId: 'reentry_309',
      resumeCode: 'ORBIT-9482-RESUME',
      expiresInMinutes: 15,
      grantedExtraMinutes: 10,
    },
  },
  {
    id: 'tool-finalize-score',
    name: 'finalize_session_score',
    serviceId: 'srv-analytics',
    serviceName: 'testorbit-analytics-mcp',
    description: 'Calculate final MCQ score, sum coding scores, and mark evaluation complete.',
    capabilityTag: 'Evaluation',
    riskLevel: 'MEDIUM',
    inputSchema: {
      type: 'object',
      properties: {
        sessionId: { type: 'string' },
      },
      required: ['sessionId'],
    },
    samplePayload: {
      sessionId: 'sess_live_771',
    },
    mockOutput: {
      sessionId: 'sess_live_771',
      mcqScore: 45.0,
      codingScore: 35.0,
      totalScore: 80.0,
      maxScore: 100.0,
      evaluationStatus: 'COMPLETE',
    },
  },
];

export const INITIAL_TRIAGE_SCENARIOS: TriageScenario[] = [
  {
    id: 'tri-1',
    userPrompt: 'Candidate REG-2026-0941 lost power during section B. Please approve their reentry and give 10 extra minutes.',
    category: 'Reentry & Interruption Ops',
    matchedServiceIds: ['srv-proctoring', 'srv-candidates'],
    suggestedTools: [
      {
        toolId: 'tool-search-students',
        toolName: 'search_students',
        confidence: 0.95,
        reason: 'Lookup student ID and active assessment session for REG-2026-0941',
        extractedArgs: { registrationNumber: 'REG-2026-0941' },
      },
      {
        toolId: 'tool-approve-reentry',
        toolName: 'approve_reentry_request',
        confidence: 0.98,
        reason: 'Approve pending reentry request with 10 minutes time adjustment',
        extractedArgs: { reentryId: 'reentry_auto_match', timeAdjustmentMinutes: 10, decisionReason: 'Power outage recovery' },
      },
    ],
    stepSequence: [
      '1. Execute search_students to retrieve student session',
      '2. Fetch pending reentry record via get_proctoring_events',
      '3. Execute approve_reentry_request with timeAdjustmentMinutes=10',
      '4. Return single-use resume code to candidate',
    ],
  },
  {
    id: 'tri-2',
    userPrompt: 'Create a new assessment paper for AI / Machine Learning with 15 MCQ questions and 2 coding problems.',
    category: 'Question Paper Assembly',
    matchedServiceIds: ['srv-questions'],
    suggestedTools: [
      {
        toolId: 'tool-search-questions',
        toolName: 'search_questions',
        confidence: 0.91,
        reason: 'Check question bank pool depth for domain aiml-eng',
        extractedArgs: { domainSlug: 'aiml-eng', limit: 20 },
      },
      {
        toolId: 'tool-create-paper',
        toolName: 'create_paper',
        confidence: 0.96,
        reason: 'Construct paper schema with MCQ and Coding sections',
        extractedArgs: {
          name: 'AI / Machine Learning Benchmark 2026',
          domainId: 'dom_aiml',
          durationMinutes: 60,
          sections: [
            { key: 'A', title: 'AIML MCQ Section', questionCount: 15 },
            { key: 'B', title: 'Coding Challenge', questionCount: 2 },
          ],
        },
      },
    ],
    stepSequence: [
      '1. Verify domain questions availability via search_questions',
      '2. Generate paper draft via create_paper',
      '3. Bind questions to PaperSections',
      '4. Output readiness report',
    ],
  },
];

export const INITIAL_INSPECTOR_SESSIONS: MCPInspectorConnection[] = [
  {
    id: 'insp-proctoring',
    name: 'testorbit-proctoring-mcp (SSE)',
    transport: 'SSE',
    urlOrCommand: 'http://localhost:4003/mcp/sse',
    status: 'CONNECTED',
    connectedAt: new Date().toISOString(),
    serverInfo: {
      name: 'testorbit-proctoring-mcp',
      version: '1.2.0',
      protocolVersion: '2024-11-05',
    },
    capabilities: {
      tools: true,
      resources: true,
      prompts: true,
      logging: true,
    },
  },
  {
    id: 'insp-questions',
    name: 'testorbit-questions-mcp (Stdio)',
    transport: 'STDIO',
    urlOrCommand: 'node ./dist/questions-mcp.js',
    status: 'CONNECTED',
    connectedAt: new Date().toISOString(),
    serverInfo: {
      name: 'testorbit-questions-mcp',
      version: '1.0.4',
      protocolVersion: '2024-11-05',
    },
    capabilities: {
      tools: true,
      resources: false,
      prompts: true,
      logging: false,
    },
  },
];
