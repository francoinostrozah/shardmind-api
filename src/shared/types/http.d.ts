import 'http';

declare module 'http' {
  interface IncomingMessage {
    correlationId?: string;
  }
}
