export interface OrderError {
  message: string;
  stack?: string;
  attemptsMade: number;
  sentToDLQ?: boolean;
  timestamp?: string;
}
