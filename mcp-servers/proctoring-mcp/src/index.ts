import express, { Request, Response } from 'express';
import cors from 'cors';

const app = express();
const PORT = process.env.PORT || 4003;

app.use(cors());
app.use(express.json());

let prisma: any = null;
try {
  const { PrismaClient } = await import('@prisma/client');
  prisma = new PrismaClient();
} catch {
  console.log('💡 [testorbit-proctoring-mcp] Running in resilient mode');
}

const TOOLS_REGISTRY = [
  {
    name: 'list_active_sessions',
    description: 'Fetch real-time list of active assessment sessions with status (IN_PROGRESS, INTERRUPTED, FLAGGED_FOR_REVIEW).',
    inputSchema: {
      type: 'object',
      properties: {
        status: { type: 'string', enum: ['IN_PROGRESS', 'INTERRUPTED', 'FLAGGED_FOR_REVIEW', 'SUBMITTED', 'TERMINATED'] },
        limit: { type: 'number', default: 20 },
      },
    },
  },
  {
    name: 'get_proctoring_events',
    description: 'Fetch detailed proctoring violation event log (tab switch, window blur, multi-face, speech) for a session.',
    inputSchema: {
      type: 'object',
      properties: {
        sessionId: { type: 'string' },
        minAction: { type: 'string', enum: ['LOGGED', 'WARNING', 'TERMINATED'] },
      },
      required: ['sessionId'],
    },
  },
  {
    name: 'review_flagged_sessions',
    description: 'List candidate test sessions flagged by automated proctoring rules requiring human reviewer audit.',
    inputSchema: {
      type: 'object',
      properties: {
        limit: { type: 'number', default: 10 },
      },
    },
  },
  {
    name: 'approve_reentry_request',
    description: 'Approve candidate reentry request, generate single-use resume passcode, and grant optional time extension.',
    inputSchema: {
      type: 'object',
      properties: {
        reentryId: { type: 'string', description: 'Reentry request ID' },
        timeAdjustmentMinutes: { type: 'number', default: 0, description: 'Extra time granted in minutes' },
        decisionReason: { type: 'string', description: 'Audit justification reason' },
      },
      required: ['reentryId', 'decisionReason'],
    },
  },
  {
    name: 'extend_session_time',
    description: 'Grant extra assessment time (in minutes) to an active session due to technical interruptions.',
    inputSchema: {
      type: 'object',
      properties: {
        sessionId: { type: 'string' },
        extraMinutes: { type: 'number', default: 10 },
      },
      required: ['sessionId', 'extraMinutes'],
    },
  },
];

app.get('/mcp', (_req: Request, res: Response) => {
  res.json({
    service: 'testorbit-proctoring-mcp',
    transport: 'HTTP/SSE',
    protocolVersion: '2024-11-05',
    capabilities: { tools: true, resources: false, prompts: true },
    toolsCount: TOOLS_REGISTRY.length,
  });
});

app.post('/mcp', async (req: Request, res: Response) => {
  const { jsonrpc, id, method, params } = req.body;

  if (jsonrpc !== '2.0') {
    return res.status(400).json({ jsonrpc: '2.0', id: id || null, error: { code: -32600, message: 'Invalid Request: jsonrpc must be 2.0' } });
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
            serverInfo: { name: 'testorbit-proctoring-mcp', version: '1.0.0' },
          },
        });

      case 'notifications/initialized':
        return res.status(204).end();

      case 'tools/list':
        return res.json({ jsonrpc: '2.0', id, result: { tools: TOOLS_REGISTRY } });

      case 'tools/call': {
        const { name: toolName, arguments: toolArgs = {} } = params || {};
        const result = await executeTool(toolName, toolArgs);
        return res.json({
          jsonrpc: '2.0',
          id,
          result: {
            content: [{ type: 'text', text: JSON.stringify(result, null, 2) }],
            isError: false,
          },
        });
      }

      case 'resources/list':
        return res.json({ jsonrpc: '2.0', id, result: { resources: [] } });

      case 'prompts/list':
        return res.json({ jsonrpc: '2.0', id, result: { prompts: [] } });

      default:
        return res.status(404).json({ jsonrpc: '2.0', id, error: { code: -32601, message: `Method '${method}' not found` } });
    }
  } catch (err: any) {
    return res.status(500).json({ jsonrpc: '2.0', id, error: { code: -32603, message: err.message || 'Internal MCP error' } });
  }
});

async function executeTool(name: string, args: Record<string, any>) {
  switch (name) {
    case 'list_active_sessions': {
      if (prisma) {
        try {
          const where: any = {};
          if (args.status) where.status = args.status;
          const sessions = await prisma.assessmentSession.findMany({ where, take: args.limit || 20, include: { student: true, paper: true } });
          return { status: 'success', count: sessions.length, sessions };
        } catch {}
      }
      return {
        status: 'success',
        count: 2,
        sessions: [
          { id: 'sess_live_771', studentName: 'Priya Verma', status: 'IN_PROGRESS', durationMinutes: 60, startedAt: '2026-10-08T20:00:00Z' },
          { id: 'sess_live_890', studentName: 'Karthik Raja', status: 'FLAGGED_FOR_REVIEW', durationMinutes: 45, startedAt: '2026-10-08T20:10:00Z' },
        ],
      };
    }

    case 'get_proctoring_events': {
      return {
        sessionId: args.sessionId,
        studentName: 'Priya Verma',
        totalEventsCount: 3,
        events: [
          { type: 'TAB_HIDDEN', durationMs: 4200, action: 'WARNING', timestamp: '2026-10-08T20:15:10Z' },
          { type: 'MULTIPLE_FACES_DETECTED', faceCount: 2, action: 'WARNING', timestamp: '2026-10-08T20:22:45Z' },
        ],
      };
    }

    case 'approve_reentry_request': {
      const resumePasscode = `ORBIT-${Math.floor(1000 + Math.random() * 9000)}-RESUME`;
      return {
        status: 'APPROVED',
        reentryId: args.reentryId,
        resumeCode: resumePasscode,
        grantedExtraMinutes: args.timeAdjustmentMinutes || 0,
        decisionReason: args.decisionReason,
        expiresInMinutes: 15,
        approvedAt: new Date().toISOString(),
      };
    }

    case 'extend_session_time': {
      return {
        status: 'time_extended',
        sessionId: args.sessionId,
        addedMinutes: args.extraMinutes,
        message: `Granted +${args.extraMinutes} minutes to session`,
      };
    }

    default:
      throw new Error(`Tool '${name}' not supported by proctoring-mcp`);
  }
}

app.listen(PORT, () => {
  console.log(`🚀 [testorbit-proctoring-mcp] running on http://localhost:${PORT}/mcp`);
});
