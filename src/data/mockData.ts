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

// 4 Official TestOrbit MCP Microservices with exact tool counts
export const INITIAL_SERVICES: MCPService[] = [
  {
    id: 'srv-questions',
    name: 'testorbit-questions-mcp',
    slug: 'questions-paper-mcp',
    description: 'Question Bank Ingestion, SHA-256 Deduplication, Section Matching & Paper Assembly Engine',
    status: 'ACTIVE',
    transport: 'HTTP',
    endpoint: 'http://localhost:4001/mcp',
    port: 4001,
    protocolVersion: '2024-11-05',
    toolsCount: 10,
    capabilitiesCount: 4,
    health: { uptimePct: 99.9, latencyMs: 14, lastPing: 'Live' },
    tags: ['Authoring', 'Question Bank', 'Paper Assembly'],
  },
  {
    id: 'srv-candidates',
    name: 'testorbit-candidates-mcp',
    slug: 'candidates-profile-mcp',
    description: 'Student Registration, Education History Auditing, Domain Assignment & Device Readiness Checks',
    status: 'ACTIVE',
    transport: 'HTTP',
    endpoint: 'http://localhost:4002/mcp',
    port: 4002,
    protocolVersion: '2024-11-05',
    toolsCount: 8,
    capabilitiesCount: 3,
    health: { uptimePct: 99.8, latencyMs: 22, lastPing: 'Live' },
    tags: ['Onboarding', 'Profiles', 'Device Audit'],
  },
  {
    id: 'srv-proctoring',
    name: 'testorbit-proctoring-mcp',
    slug: 'proctoring-reentry-mcp',
    description: 'Real-Time Proctoring Incident Triage, Fraud Detection, Force Terminations & Reentry Approvals',
    status: 'ACTIVE',
    transport: 'HTTP',
    endpoint: 'http://localhost:4003/mcp',
    port: 4003,
    protocolVersion: '2024-11-05',
    toolsCount: 11,
    capabilitiesCount: 5,
    health: { uptimePct: 100, latencyMs: 9, lastPing: 'Live' },
    tags: ['Proctoring', 'Reentry', 'Live Ops'],
  },
  {
    id: 'srv-analytics',
    name: 'testorbit-analytics-mcp',
    slug: 'grading-analytics-mcp',
    description: 'Auto MCQ Grading, Subjective Coding Review Queue, Aggregated Placement Analytics & CSV Export',
    status: 'ACTIVE',
    transport: 'HTTP',
    endpoint: 'http://localhost:4004/mcp',
    port: 4004,
    protocolVersion: '2024-11-05',
    toolsCount: 9,
    capabilitiesCount: 4,
    health: { uptimePct: 99.5, latencyMs: 18, lastPing: 'Live' },
    tags: ['Evaluation', 'Coding Review', 'Reporting'],
  },
];

// Exact 38 Tools matching the 4 services (10 + 8 + 11 + 9 = 38)
export const INITIAL_TOOLS: MCPTool[] = [
  // ─── Service 1: testorbit-questions-mcp (10 Tools) ───
  {
    id: 'tool-q1',
    name: 'search_questions',
    serviceId: 'srv-questions',
    serviceName: 'testorbit-questions-mcp',
    description: 'Search and filter question bank by domain slug, difficulty (EASY/MEDIUM/HARD), section, or text query.',
    capabilityTag: 'Authoring',
    riskLevel: 'LOW',
    inputSchema: { type: 'object', properties: { domainSlug: { type: 'string' }, difficulty: { type: 'string' }, limit: { type: 'number' } } },
    samplePayload: { domainSlug: 'aiml-eng', difficulty: 'MEDIUM', limit: 5 },
    mockOutput: { status: 'success', count: 2, questions: [{ id: 'q-101', text: 'Explain Gradient Descent', marks: 5 }] },
  },
  {
    id: 'tool-q2',
    name: 'create_question',
    serviceId: 'srv-questions',
    serviceName: 'testorbit-questions-mcp',
    description: 'Create a new MCQ or Coding question in the question bank with options and explanations.',
    capabilityTag: 'Authoring',
    riskLevel: 'MEDIUM',
    inputSchema: { type: 'object', properties: { domainId: { type: 'string' }, section: { type: 'string' }, type: { type: 'string' }, text: { type: 'string' } } },
    samplePayload: { domainId: 'dom_aiml', section: 'A', type: 'MCQ', text: 'What is Learning Rate?' },
    mockOutput: { status: 'created', questionId: 'q_991', message: 'Question created successfully' },
  },
  {
    id: 'tool-q3',
    name: 'update_question',
    serviceId: 'srv-questions',
    serviceName: 'testorbit-questions-mcp',
    description: 'Update question stem, marks, negative marks, or options.',
    capabilityTag: 'Authoring',
    riskLevel: 'MEDIUM',
    inputSchema: { type: 'object', properties: { questionId: { type: 'string' }, text: { type: 'string' }, marks: { type: 'number' } } },
    samplePayload: { questionId: 'q-101', marks: 4 },
    mockOutput: { status: 'updated', questionId: 'q-101' },
  },
  {
    id: 'tool-q4',
    name: 'archive_question',
    serviceId: 'srv-questions',
    serviceName: 'testorbit-questions-mcp',
    description: 'Soft-delete a question from the bank while keeping historical exam references intact.',
    capabilityTag: 'Authoring',
    riskLevel: 'HIGH',
    inputSchema: { type: 'object', properties: { questionId: { type: 'string' } } },
    samplePayload: { questionId: 'q-101' },
    mockOutput: { status: 'archived', questionId: 'q-101' },
  },
  {
    id: 'tool-q5',
    name: 'import_questions_bulk',
    serviceId: 'srv-questions',
    serviceName: 'testorbit-questions-mcp',
    description: 'Bulk import questions from JSON/CSV with SHA-256 content hash deduplication.',
    capabilityTag: 'Authoring',
    riskLevel: 'MEDIUM',
    inputSchema: { type: 'object', properties: { domainId: { type: 'string' }, questionsData: { type: 'array' } } },
    samplePayload: { domainId: 'dom_aiml', questionsData: [] },
    mockOutput: { importedCount: 15, skippedDuplicates: 2 },
  },
  {
    id: 'tool-q6',
    name: 'create_paper',
    serviceId: 'srv-questions',
    serviceName: 'testorbit-questions-mcp',
    description: 'Create a question paper specification for a domain with duration and section rules.',
    capabilityTag: 'Authoring',
    riskLevel: 'MEDIUM',
    inputSchema: { type: 'object', properties: { name: { type: 'string' }, domainId: { type: 'string' }, durationMinutes: { type: 'number' } } },
    samplePayload: { name: 'Campus Assessment 2026', domainId: 'dom_aiml', durationMinutes: 60 },
    mockOutput: { status: 'created', paperId: 'paper_9921', isActive: false },
  },
  {
    id: 'tool-q7',
    name: 'configure_paper_sections',
    serviceId: 'srv-questions',
    serviceName: 'testorbit-questions-mcp',
    description: 'Define section keys, question counts, marks per question, and position order.',
    capabilityTag: 'Authoring',
    riskLevel: 'MEDIUM',
    inputSchema: { type: 'object', properties: { paperId: { type: 'string' }, sections: { type: 'array' } } },
    samplePayload: { paperId: 'paper_9921', sections: [{ key: 'A', questionCount: 10 }] },
    mockOutput: { status: 'configured', paperId: 'paper_9921', sectionCount: 1 },
  },
  {
    id: 'tool-q8',
    name: 'activate_paper',
    serviceId: 'srv-questions',
    serviceName: 'testorbit-questions-mcp',
    description: 'Set a question paper active for its target domain.',
    capabilityTag: 'Authoring',
    riskLevel: 'HIGH',
    inputSchema: { type: 'object', properties: { paperId: { type: 'string' } } },
    samplePayload: { paperId: 'paper_9921' },
    mockOutput: { status: 'activated', paperId: 'paper_9921', isActive: true },
  },
  {
    id: 'tool-q9',
    name: 'list_papers',
    serviceId: 'srv-questions',
    serviceName: 'testorbit-questions-mcp',
    description: 'List question papers filtered by domain slug and active status.',
    capabilityTag: 'Authoring',
    riskLevel: 'LOW',
    inputSchema: { type: 'object', properties: { domainId: { type: 'string' } } },
    samplePayload: { domainId: 'dom_aiml' },
    mockOutput: { count: 1, papers: [{ id: 'paper_9921', name: 'Campus Assessment 2026' }] },
  },
  {
    id: 'tool-q10',
    name: 'validate_paper_readiness',
    serviceId: 'srv-questions',
    serviceName: 'testorbit-questions-mcp',
    description: 'Verify if the question bank has sufficient pool depth for all paper sections.',
    capabilityTag: 'Authoring',
    riskLevel: 'LOW',
    inputSchema: { type: 'object', properties: { paperId: { type: 'string' } } },
    samplePayload: { paperId: 'paper_9921' },
    mockOutput: { ready: true, poolDepthCheck: 'PASSED' },
  },

  // ─── Service 2: testorbit-candidates-mcp (8 Tools) ───
  {
    id: 'tool-c1',
    name: 'search_students',
    serviceId: 'srv-candidates',
    serviceName: 'testorbit-candidates-mcp',
    description: 'Lookup student profiles by registration number, college email, or college name.',
    capabilityTag: 'Onboarding',
    riskLevel: 'LOW',
    inputSchema: { type: 'object', properties: { registrationNumber: { type: 'string' }, collegeName: { type: 'string' } } },
    samplePayload: { registrationNumber: 'REG-2026-0941' },
    mockOutput: { found: 1, students: [{ id: 'stu_882', fullName: 'Aarav Sharma' }] },
  },
  {
    id: 'tool-c2',
    name: 'get_student_profile',
    serviceId: 'srv-candidates',
    serviceName: 'testorbit-candidates-mcp',
    description: 'Fetch complete student profile, education background (SSC, HSC, UG, PG), and device readiness logs.',
    capabilityTag: 'Onboarding',
    riskLevel: 'LOW',
    inputSchema: { type: 'object', properties: { studentId: { type: 'string' } } },
    samplePayload: { studentId: 'stu_882' },
    mockOutput: { id: 'stu_882', fullName: 'Aarav Sharma', collegeName: 'IIT Madras' },
  },
  {
    id: 'tool-c3',
    name: 'register_student',
    serviceId: 'srv-candidates',
    serviceName: 'testorbit-candidates-mcp',
    description: 'Register a candidate profile with personal details, college info, and education history.',
    capabilityTag: 'Onboarding',
    riskLevel: 'MEDIUM',
    inputSchema: { type: 'object', properties: { fullName: { type: 'string' }, registrationNumber: { type: 'string' }, collegeEmail: { type: 'string' } } },
    samplePayload: { fullName: 'Aarav Sharma', registrationNumber: 'REG-2026-0941', collegeEmail: 'aarav@iitm.ac.in', domainId: 'dom_aiml' },
    mockOutput: { status: 'created', studentId: 'stu_882' },
  },
  {
    id: 'tool-c4',
    name: 'update_student_profile',
    serviceId: 'srv-candidates',
    serviceName: 'testorbit-candidates-mcp',
    description: 'Update candidate contact information or college details.',
    capabilityTag: 'Onboarding',
    riskLevel: 'MEDIUM',
    inputSchema: { type: 'object', properties: { studentId: { type: 'string' }, mobileNumber: { type: 'string' } } },
    samplePayload: { studentId: 'stu_882', mobileNumber: '+919876543210' },
    mockOutput: { status: 'updated', studentId: 'stu_882' },
  },
  {
    id: 'tool-c5',
    name: 'assign_student_domain',
    serviceId: 'srv-candidates',
    serviceName: 'testorbit-candidates-mcp',
    description: 'Assign or update candidate domain prior to starting the assessment session.',
    capabilityTag: 'Onboarding',
    riskLevel: 'MEDIUM',
    inputSchema: { type: 'object', properties: { studentId: { type: 'string' }, domainId: { type: 'string' } } },
    samplePayload: { studentId: 'stu_882', domainId: 'dom_aiml' },
    mockOutput: { status: 'updated', domainId: 'dom_aiml' },
  },
  {
    id: 'tool-c6',
    name: 'archive_student',
    serviceId: 'srv-candidates',
    serviceName: 'testorbit-candidates-mcp',
    description: 'Soft-delete candidate account while keeping assessment logs intact for audit.',
    capabilityTag: 'Onboarding',
    riskLevel: 'HIGH',
    inputSchema: { type: 'object', properties: { studentId: { type: 'string' } } },
    samplePayload: { studentId: 'stu_882' },
    mockOutput: { status: 'archived', studentId: 'stu_882' },
  },
  {
    id: 'tool-c7',
    name: 'get_device_check_logs',
    serviceId: 'srv-candidates',
    serviceName: 'testorbit-candidates-mcp',
    description: 'Audit candidate hardware readiness (webcam, mic, browser compatibility).',
    capabilityTag: 'Onboarding',
    riskLevel: 'LOW',
    inputSchema: { type: 'object', properties: { studentId: { type: 'string' } } },
    samplePayload: { studentId: 'stu_882' },
    mockOutput: { webcamOk: true, micOk: true, browser: 'Chrome 122' },
  },
  {
    id: 'tool-c8',
    name: 'list_candidate_attempts',
    serviceId: 'srv-candidates',
    serviceName: 'testorbit-candidates-mcp',
    description: 'Fetch test attempt history for a specific candidate.',
    capabilityTag: 'Onboarding',
    riskLevel: 'LOW',
    inputSchema: { type: 'object', properties: { studentId: { type: 'string' } } },
    samplePayload: { studentId: 'stu_882' },
    mockOutput: { count: 1, attempts: [{ attemptNumber: 1, status: 'SUBMITTED' }] },
  },

  // ─── Service 3: testorbit-proctoring-mcp (11 Tools) ───
  {
    id: 'tool-p1',
    name: 'list_active_sessions',
    serviceId: 'srv-proctoring',
    serviceName: 'testorbit-proctoring-mcp',
    description: 'Fetch real-time list of active assessment sessions with status.',
    capabilityTag: 'Proctoring',
    riskLevel: 'LOW',
    inputSchema: { type: 'object', properties: { status: { type: 'string' }, limit: { type: 'number' } } },
    samplePayload: { status: 'IN_PROGRESS', limit: 10 },
    mockOutput: { count: 2, sessions: [{ id: 'sess_live_771', studentName: 'Priya Verma' }] },
  },
  {
    id: 'tool-p2',
    name: 'get_proctoring_events',
    serviceId: 'srv-proctoring',
    serviceName: 'testorbit-proctoring-mcp',
    description: 'Fetch detailed proctoring violation event log for a live assessment session.',
    capabilityTag: 'Proctoring',
    riskLevel: 'LOW',
    inputSchema: { type: 'object', properties: { sessionId: { type: 'string' } } },
    samplePayload: { sessionId: 'sess_live_771' },
    mockOutput: { sessionId: 'sess_live_771', totalWarnings: 2, events: [] },
  },
  {
    id: 'tool-p3',
    name: 'review_flagged_sessions',
    serviceId: 'srv-proctoring',
    serviceName: 'testorbit-proctoring-mcp',
    description: 'List candidate test sessions flagged by automated proctoring rules.',
    capabilityTag: 'Proctoring',
    riskLevel: 'MEDIUM',
    inputSchema: { type: 'object', properties: { limit: { type: 'number' } } },
    samplePayload: { limit: 10 },
    mockOutput: { count: 1, flaggedSessions: [{ id: 'sess_live_890', reason: 'Multiple faces' }] },
  },
  {
    id: 'tool-p4',
    name: 'terminate_session',
    serviceId: 'srv-proctoring',
    serviceName: 'testorbit-proctoring-mcp',
    description: 'Force-terminate an assessment session for severe fraud or policy violation.',
    capabilityTag: 'Proctoring',
    riskLevel: 'HIGH',
    inputSchema: { type: 'object', properties: { sessionId: { type: 'string' }, terminationReason: { type: 'string' } } },
    samplePayload: { sessionId: 'sess_live_890', terminationReason: 'Confirmed unauthorized secondary person' },
    mockOutput: { status: 'TERMINATED', sessionId: 'sess_live_890' },
  },
  {
    id: 'tool-p5',
    name: 'list_pending_reentry',
    serviceId: 'srv-proctoring',
    serviceName: 'testorbit-proctoring-mcp',
    description: 'List active candidate reentry requests waiting for admin review.',
    capabilityTag: 'Proctoring',
    riskLevel: 'LOW',
    inputSchema: { type: 'object', properties: { limit: { type: 'number' } } },
    samplePayload: { limit: 5 },
    mockOutput: { count: 1, pendingReentries: [{ reentryId: 'reentry_309', studentName: 'Aarav Sharma' }] },
  },
  {
    id: 'tool-p6',
    name: 'approve_reentry_request',
    serviceId: 'srv-proctoring',
    serviceName: 'testorbit-proctoring-mcp',
    description: 'Approve candidate reentry, generate single-use resume code, and grant time extension.',
    capabilityTag: 'Proctoring',
    riskLevel: 'HIGH',
    inputSchema: { type: 'object', properties: { reentryId: { type: 'string' }, timeAdjustmentMinutes: { type: 'number' }, decisionReason: { type: 'string' } } },
    samplePayload: { reentryId: 'reentry_309', timeAdjustmentMinutes: 10, decisionReason: 'Hostel power failure' },
    mockOutput: { status: 'APPROVED', resumeCode: 'ORBIT-9482-RESUME', grantedExtraMinutes: 10 },
  },
  {
    id: 'tool-p7',
    name: 'reject_reentry_request',
    serviceId: 'srv-proctoring',
    serviceName: 'testorbit-proctoring-mcp',
    description: 'Reject a candidate reentry request with audit notes.',
    capabilityTag: 'Proctoring',
    riskLevel: 'MEDIUM',
    inputSchema: { type: 'object', properties: { reentryId: { type: 'string' }, decisionReason: { type: 'string' } } },
    samplePayload: { reentryId: 'reentry_309', decisionReason: 'Unverified disconnect' },
    mockOutput: { status: 'REJECTED', reentryId: 'reentry_309' },
  },
  {
    id: 'tool-p8',
    name: 'extend_session_time',
    serviceId: 'srv-proctoring',
    serviceName: 'testorbit-proctoring-mcp',
    description: 'Grant extra assessment time in minutes to an active session.',
    capabilityTag: 'Proctoring',
    riskLevel: 'MEDIUM',
    inputSchema: { type: 'object', properties: { sessionId: { type: 'string' }, extraMinutes: { type: 'number' } } },
    samplePayload: { sessionId: 'sess_live_771', extraMinutes: 10 },
    mockOutput: { status: 'time_extended', addedMinutes: 10 },
  },
  {
    id: 'tool-p9',
    name: 'audit_reentry_decisions',
    serviceId: 'srv-proctoring',
    serviceName: 'testorbit-proctoring-mcp',
    description: 'Review historical reentry approvals and decision notes.',
    capabilityTag: 'Proctoring',
    riskLevel: 'LOW',
    inputSchema: { type: 'object', properties: { limit: { type: 'number' } } },
    samplePayload: { limit: 10 },
    mockOutput: { count: 5, auditLogs: [] },
  },
  {
    id: 'tool-p10',
    name: 'issue_candidate_warning',
    serviceId: 'srv-proctoring',
    serviceName: 'testorbit-proctoring-mcp',
    description: 'Issue an immediate on-screen proctoring warning to a candidate.',
    capabilityTag: 'Proctoring',
    riskLevel: 'MEDIUM',
    inputSchema: { type: 'object', properties: { sessionId: { type: 'string' }, warningMessage: { type: 'string' } } },
    samplePayload: { sessionId: 'sess_live_771', warningMessage: 'Please face the camera directly.' },
    mockOutput: { status: 'warning_sent', warningNumber: 1 },
  },
  {
    id: 'tool-p11',
    name: 'get_session_heartbeat_status',
    serviceId: 'srv-proctoring',
    serviceName: 'testorbit-proctoring-mcp',
    description: 'Check candidate live heartbeat connection timestamp.',
    capabilityTag: 'Proctoring',
    riskLevel: 'LOW',
    inputSchema: { type: 'object', properties: { sessionId: { type: 'string' } } },
    samplePayload: { sessionId: 'sess_live_771' },
    mockOutput: { isAlive: true, lastHeartbeatAt: '2s ago' },
  },

  // ─── Service 4: testorbit-analytics-mcp (9 Tools) ───
  {
    id: 'tool-a1',
    name: 'get_unevaluated_submissions',
    serviceId: 'srv-analytics',
    serviceName: 'testorbit-analytics-mcp',
    description: 'Fetch submitted test sessions pending manual reviewer evaluation for coding questions.',
    capabilityTag: 'Evaluation',
    riskLevel: 'LOW',
    inputSchema: { type: 'object', properties: { limit: { type: 'number' } } },
    samplePayload: { limit: 10 },
    mockOutput: { count: 1, pendingSubmissions: [{ sessionId: 'sess_live_771', studentName: 'Priya Verma' }] },
  },
  {
    id: 'tool-a2',
    name: 'evaluate_coding_answer',
    serviceId: 'srv-analytics',
    serviceName: 'testorbit-analytics-mcp',
    description: 'Grade a candidate coding submission with awarded marks and evaluator feedback.',
    capabilityTag: 'Evaluation',
    riskLevel: 'MEDIUM',
    inputSchema: { type: 'object', properties: { sessionQuestionId: { type: 'string' }, marksAwarded: { type: 'number' } } },
    samplePayload: { sessionQuestionId: 'sq_991', marksAwarded: 18 },
    mockOutput: { status: 'evaluated', marksAwarded: 18 },
  },
  {
    id: 'tool-a3',
    name: 'finalize_session_score',
    serviceId: 'srv-analytics',
    serviceName: 'testorbit-analytics-mcp',
    description: 'Calculate auto MCQ score + coding score, compute total score, and finalize session evaluation status.',
    capabilityTag: 'Evaluation',
    riskLevel: 'MEDIUM',
    inputSchema: { type: 'object', properties: { sessionId: { type: 'string' } } },
    samplePayload: { sessionId: 'sess_live_771' },
    mockOutput: { sessionId: 'sess_live_771', totalScore: 80.0, evaluationStatus: 'COMPLETE' },
  },
  {
    id: 'tool-a4',
    name: 'get_dashboard_metrics',
    serviceId: 'srv-analytics',
    serviceName: 'testorbit-analytics-mcp',
    description: 'Retrieve overall campus recruitment dashboard metrics (total candidates, completion rate, pass rate).',
    capabilityTag: 'Evaluation',
    riskLevel: 'LOW',
    inputSchema: { type: 'object', properties: {} },
    samplePayload: {},
    mockOutput: { totalCandidates: 450, passPercentage: 86.4, totalSessions: 420 },
  },
  {
    id: 'tool-a5',
    name: 'generate_candidate_scorecard',
    serviceId: 'srv-analytics',
    serviceName: 'testorbit-analytics-mcp',
    description: 'Produce a comprehensive performance scorecard for an individual candidate.',
    capabilityTag: 'Evaluation',
    riskLevel: 'LOW',
    inputSchema: { type: 'object', properties: { studentId: { type: 'string' } } },
    samplePayload: { studentId: 'stu_882' },
    mockOutput: { studentName: 'Aarav Sharma', totalScore: 92.5, percentile: 98.4 },
  },
  {
    id: 'tool-a6',
    name: 'generate_domain_report',
    serviceId: 'srv-analytics',
    serviceName: 'testorbit-analytics-mcp',
    description: 'Generate placement analytics report aggregated by domain, college, or passing year.',
    capabilityTag: 'Evaluation',
    riskLevel: 'LOW',
    inputSchema: { type: 'object', properties: { domainSlug: { type: 'string' } } },
    samplePayload: { domainSlug: 'aiml-eng' },
    mockOutput: { domain: 'aiml-eng', averageTotalScore: 78.4, passPercentage: 88.6 },
  },
  {
    id: 'tool-a7',
    name: 'export_results_csv',
    serviceId: 'srv-analytics',
    serviceName: 'testorbit-analytics-mcp',
    description: 'Trigger export of full assessment cycle scores to CSV/Excel format.',
    capabilityTag: 'Evaluation',
    riskLevel: 'MEDIUM',
    inputSchema: { type: 'object', properties: { domainId: { type: 'string' } } },
    samplePayload: { domainId: 'dom_aiml' },
    mockOutput: { downloadUrl: '/reports/export_dom_aiml_2026.csv', totalRows: 420 },
  },
  {
    id: 'tool-a8',
    name: 'query_admin_audit_logs',
    serviceId: 'srv-analytics',
    serviceName: 'testorbit-analytics-mcp',
    description: 'Search administrative action logs for security compliance auditing.',
    capabilityTag: 'Evaluation',
    riskLevel: 'LOW',
    inputSchema: { type: 'object', properties: { action: { type: 'string' } } },
    samplePayload: { action: 'PAPER_ACTIVATED' },
    mockOutput: { count: 3, logs: [] },
  },
  {
    id: 'tool-a9',
    name: 'recalculate_attempt_percentiles',
    serviceId: 'srv-analytics',
    serviceName: 'testorbit-analytics-mcp',
    description: 'Recalculate relative candidate percentiles across all completed attempts.',
    capabilityTag: 'Evaluation',
    riskLevel: 'MEDIUM',
    inputSchema: { type: 'object', properties: { paperId: { type: 'string' } } },
    samplePayload: { paperId: 'paper_9921' },
    mockOutput: { status: 'recalculated', totalUpdated: 420 },
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
        toolId: 'tool-c1',
        toolName: 'search_students',
        confidence: 0.95,
        reason: 'Lookup student ID and active assessment session for REG-2026-0941',
        extractedArgs: { registrationNumber: 'REG-2026-0941' },
      },
      {
        toolId: 'tool-p6',
        toolName: 'approve_reentry_request',
        confidence: 0.98,
        reason: 'Approve pending reentry request with 10 minutes time adjustment',
        extractedArgs: { reentryId: 'reentry_309', timeAdjustmentMinutes: 10, decisionReason: 'Power outage recovery' },
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
        toolId: 'tool-q1',
        toolName: 'search_questions',
        confidence: 0.91,
        reason: 'Check question bank pool depth for domain aiml-eng',
        extractedArgs: { domainSlug: 'aiml-eng', limit: 20 },
      },
      {
        toolId: 'tool-q6',
        toolName: 'create_paper',
        confidence: 0.96,
        reason: 'Construct paper schema with MCQ and Coding sections',
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
    name: 'testorbit-proctoring-mcp (HTTP)',
    transport: 'HTTP',
    urlOrCommand: 'http://localhost:4003/mcp',
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
    name: 'testorbit-questions-mcp (HTTP)',
    transport: 'HTTP',
    urlOrCommand: 'http://localhost:4001/mcp',
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
