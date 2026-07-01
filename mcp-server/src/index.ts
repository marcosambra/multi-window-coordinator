import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { createCoordinatorApi } from './coordinatorApi.js';
import { CreateTaskRequest, TaskActionRequest, WindowMessageRequest } from './types.js';
import {
  acceptTaskShape,
  completeTaskShape,
  createCrossAppTaskShape,
  getWindowSummaryShape,
  getWorkflowStateShape,
  postWindowNoteShape,
} from './toolDefinitions.js';

async function main(): Promise<void> {
  const coordinatorApi = createCoordinatorApi();
  const server = new McpServer({
    name: 'multi-window-coordinator',
    version: '0.0.1',
  });

  server.registerTool(
    'list_windows',
    {
      description: 'List all windows currently known by the multi-window coordinator.',
      inputSchema: {},
    },
    async () => {
      const windows = await coordinatorApi.listWindows();
      return jsonResult(windows);
    }
  );

  server.registerTool(
    'get_window_summary',
    {
      description: 'Get the latest summary and assigned work for a specific window.',
      inputSchema: getWindowSummaryShape,
    },
    async ({ windowId }: { windowId: string }) => {
      const summary = await coordinatorApi.getWindowSummary(windowId);
      const tasks = await coordinatorApi.listTasks(windowId);
      return jsonResult({ summary, tasks });
    }
  );

  server.registerTool(
    'create_cross_app_task',
    {
      description: 'Create a task for a specific app role or window and let the coordinator route it.',
      inputSchema: createCrossAppTaskShape,
    },
    async (input: CreateTaskRequest) => {
      const task = await coordinatorApi.createTask(input);
      return jsonResult(task);
    }
  );

  server.registerTool(
    'accept_task',
    {
      description: 'Mark a task as accepted on behalf of a specific window.',
      inputSchema: acceptTaskShape,
    },
    async ({ taskId, windowId, note }: TaskActionRequest & { taskId: string }) => {
      await coordinatorApi.acceptTask(taskId, { windowId, note });
      return textResult(`Task ${taskId} accepted for window ${windowId}.`);
    }
  );

  server.registerTool(
    'complete_task',
    {
      description: 'Complete a task and optionally include a handoff note for the next window.',
      inputSchema: completeTaskShape,
    },
    async ({ taskId, windowId, note }: TaskActionRequest & { taskId: string }) => {
      await coordinatorApi.completeTask(taskId, { windowId, note });
      return textResult(`Task ${taskId} completed for window ${windowId}.`);
    }
  );

  server.registerTool(
    'get_workflow_state',
    {
      description: 'Get workflow status, tasks, blockers, and the current coordination state.',
      inputSchema: getWorkflowStateShape,
    },
    async ({ workflowId }: { workflowId: string }) => {
      const workflow = await coordinatorApi.getWorkflowState(workflowId);
      return jsonResult(workflow);
    }
  );

  server.registerTool(
    'post_window_note',
    {
      description: 'Send a coordination note to a specific window inbox.',
      inputSchema: postWindowNoteShape,
    },
    async ({ windowId, message, severity }: WindowMessageRequest) => {
      await coordinatorApi.postWindowNote({ windowId, message, severity });
      return textResult(`Posted ${severity ?? 'info'} note to window ${windowId}.`);
    }
  );

  const transport = new StdioServerTransport();
  await server.connect(transport);
}

function jsonResult(value: unknown) {
  return {
    content: [
      {
        type: 'text' as const,
        text: JSON.stringify(value, null, 2),
      },
    ],
  };
}

function textResult(text: string) {
  return {
    content: [
      {
        type: 'text' as const,
        text,
      },
    ],
  };
}

void main();
