import * as z from 'zod/v4';

export type ToolContract = {
  name: string;
  description: string;
  inputShape: Record<string, z.ZodType>;
  jsonSchema: Record<string, unknown>;
};

export const getWindowSummaryShape = {
  windowId: z.string().min(1),
};

export const createCrossAppTaskShape = {
  title: z.string().min(1),
  description: z.string().optional(),
  target: z.object({
    type: z.enum(['windowId', 'appRole']),
    value: z.string().min(1),
  }),
  workflowId: z.string().optional(),
  dependencies: z.array(z.string()).optional(),
};

export const acceptTaskShape = {
  taskId: z.string().min(1),
  windowId: z.string().min(1),
  note: z.string().optional(),
};

export const completeTaskShape = {
  taskId: z.string().min(1),
  windowId: z.string().min(1),
  note: z.string().optional(),
};

export const getWorkflowStateShape = {
  workflowId: z.string().min(1),
};

export const postWindowNoteShape = {
  windowId: z.string().min(1),
  message: z.string().min(1),
  severity: z.enum(['info', 'warning', 'error']).optional(),
};

export const toolContracts: ToolContract[] = [
  {
    name: 'list_windows',
    description: 'List all windows currently known by the multi-window coordinator.',
    inputShape: {},
    jsonSchema: {
      type: 'object',
      properties: {},
      additionalProperties: false,
    },
  },
  {
    name: 'get_window_summary',
    description: 'Get the latest summary and assigned work for a specific window.',
    inputShape: getWindowSummaryShape,
    jsonSchema: {
      type: 'object',
      properties: {
        windowId: { type: 'string' },
      },
      required: ['windowId'],
      additionalProperties: false,
    },
  },
  {
    name: 'create_cross_app_task',
    description: 'Create a task for a specific app role or window and let the coordinator route it.',
    inputShape: createCrossAppTaskShape,
    jsonSchema: {
      type: 'object',
      properties: {
        title: { type: 'string' },
        description: { type: 'string' },
        target: {
          type: 'object',
          properties: {
            type: { type: 'string', enum: ['windowId', 'appRole'] },
            value: { type: 'string' },
          },
          required: ['type', 'value'],
          additionalProperties: false,
        },
        workflowId: { type: 'string' },
        dependencies: {
          type: 'array',
          items: { type: 'string' },
        },
      },
      required: ['title', 'target'],
      additionalProperties: false,
    },
  },
  {
    name: 'accept_task',
    description: 'Mark a task as accepted on behalf of a specific window.',
    inputShape: acceptTaskShape,
    jsonSchema: {
      type: 'object',
      properties: {
        taskId: { type: 'string' },
        windowId: { type: 'string' },
        note: { type: 'string' },
      },
      required: ['taskId', 'windowId'],
      additionalProperties: false,
    },
  },
  {
    name: 'complete_task',
    description: 'Complete a task and optionally include a handoff note for the next window.',
    inputShape: completeTaskShape,
    jsonSchema: {
      type: 'object',
      properties: {
        taskId: { type: 'string' },
        windowId: { type: 'string' },
        note: { type: 'string' },
      },
      required: ['taskId', 'windowId'],
      additionalProperties: false,
    },
  },
  {
    name: 'get_workflow_state',
    description: 'Get workflow status, tasks, blockers, and the current coordination state.',
    inputShape: getWorkflowStateShape,
    jsonSchema: {
      type: 'object',
      properties: {
        workflowId: { type: 'string' },
      },
      required: ['workflowId'],
      additionalProperties: false,
    },
  },
  {
    name: 'post_window_note',
    description: 'Send a coordination note to a specific window inbox.',
    inputShape: postWindowNoteShape,
    jsonSchema: {
      type: 'object',
      properties: {
        windowId: { type: 'string' },
        message: { type: 'string' },
        severity: { type: 'string', enum: ['info', 'warning', 'error'] },
      },
      required: ['windowId', 'message'],
      additionalProperties: false,
    },
  },
];
