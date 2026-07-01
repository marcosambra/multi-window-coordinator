declare module '@modelcontextprotocol/sdk/server/stdio.js' {
  export class StdioServerTransport {
    onclose?: () => void;
    onerror?: (error: Error) => void;
    onmessage?: (message: unknown) => void;
    start(): Promise<void>;
    send(message: unknown): Promise<void>;
    close(): Promise<void>;
  }
}
