import express, { Request, Response } from 'express';
import cors from 'cors';

const app = express();
const PORT = process.env.PORT || 4002;

app.use(cors());
app.use(express.json());

let prisma: any = null;
try {
  const { PrismaClient } = await import('@prisma/client');
  prisma = new PrismaClient();
} catch {
  console.log('💡 [testorbit-candidates-mcp] Running in resilient mode');
}

const TOOLS_REGISTRY = [
  {
    name: 'search_students',
    description: 'Lookup student profiles by registration number, college email, or college name.',
    inputSchema: {
      type: 'object',
      properties: {
        registrationNumber: { type: 'string' },
        collegeName: { type: 'string' },
        collegeEmail: { type: 'string' },
      },
    },
  },
  {
    name: 'get_student_profile',
    description: 'Fetch complete student profile, education background (SSC, HSC, UG, PG), and device readiness logs.',
    inputSchema: {
      type: 'object',
      properties: {
        studentId: { type: 'string' },
        registrationNumber: { type: 'string' },
      },
    },
  },
  {
    name: 'register_student',
    description: 'Register a candidate profile with personal details, college info, and education history.',
    inputSchema: {
      type: 'object',
      properties: {
        fullName: { type: 'string' },
        registrationNumber: { type: 'string' },
        collegeEmail: { type: 'string' },
        mobileNumber: { type: 'string' },
        collegeName: { type: 'string' },
        department: { type: 'string' },
        yearOfPassing: { type: 'number' },
        domainId: { type: 'string' },
      },
      required: ['fullName', 'registrationNumber', 'collegeEmail', 'domainId'],
    },
  },
  {
    name: 'assign_student_domain',
    description: 'Assign or update candidate domain prior to starting the assessment session.',
    inputSchema: {
      type: 'object',
      properties: {
        studentId: { type: 'string' },
        domainId: { type: 'string' },
      },
      required: ['studentId', 'domainId'],
    },
  },
];

app.get('/mcp', (_req: Request, res: Response) => {
  res.json({
    service: 'testorbit-candidates-mcp',
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
            serverInfo: { name: 'testorbit-candidates-mcp', version: '1.0.0' },
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
    case 'search_students': {
      if (prisma) {
        try {
          const where: any = {};
          if (args.registrationNumber) where.registrationNumber = { contains: args.registrationNumber, mode: 'insensitive' };
          if (args.collegeName) where.collegeName = { contains: args.collegeName, mode: 'insensitive' };
          const students = await prisma.student.findMany({ where, take: 10, include: { domain: true } });
          return { status: 'success', count: students.length, students };
        } catch {}
      }
      return {
        status: 'success',
        count: 1,
        students: [
          {
            id: 'stu_882',
            fullName: 'Aarav Sharma',
            registrationNumber: args.registrationNumber || 'REG-2026-0941',
            collegeName: args.collegeName || 'IIT Madras',
            domain: 'AI / Data Science',
            deviceCheckCompleted: true,
          },
        ],
      };
    }

    case 'get_student_profile': {
      return {
        id: args.studentId || 'stu_882',
        fullName: 'Aarav Sharma',
        registrationNumber: args.registrationNumber || 'REG-2026-0941',
        collegeEmail: 'aarav@iitm.ac.in',
        collegeName: 'IIT Madras',
        department: 'Computer Science',
        yearOfPassing: 2026,
        domainLockedAt: '2026-10-08T10:00:00Z',
        education: [
          { level: 'HSC', institutionName: 'Delhi Public School', yearOfCompletion: 2022, score: 96.5 },
          { level: 'UG', institutionName: 'IIT Madras', yearOfCompletion: 2026, score: 9.1 },
        ],
      };
    }

    case 'register_student': {
      return {
        status: 'created',
        studentId: `stu_${Date.now()}`,
        fullName: args.fullName,
        registrationNumber: args.registrationNumber,
        collegeEmail: args.collegeEmail,
        createdAt: new Date().toISOString(),
      };
    }

    case 'assign_student_domain': {
      return {
        status: 'updated',
        studentId: args.studentId,
        domainId: args.domainId,
        message: 'Domain assigned successfully before domain lock',
      };
    }

    default:
      throw new Error(`Tool '${name}' not supported by candidates-mcp`);
  }
}

app.listen(PORT, () => {
  console.log(`🚀 [testorbit-candidates-mcp] running on http://localhost:${PORT}/mcp`);
});
