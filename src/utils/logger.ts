import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

// Helper to get __dirname in ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export enum LogLevel {
  ERROR = 0,
  WARN = 1,
  INFO = 2,
  DEBUG = 3
}

class Logger {
  private logDir: string;
  private currentLogFile: string;
  private maxFileSize: number = 10 * 1024 * 1024; // 10MB
  private maxFiles: number = 5;

  constructor() {
    this.logDir = path.join(__dirname, '../../logs');
    this.currentLogFile = this.getLogFileName();
    this.ensureLogDirectory();
  }

  private getLogFileName(): string {
    const now = new Date();
    const dateStr = now.toISOString().split('T')[0]; // YYYY-MM-DD
    return `pmp-service-${dateStr}.log`;
  }

  private async ensureLogDirectory(): Promise<void> {
    try {
      await fs.access(this.logDir);
    } catch {
      await fs.mkdir(this.logDir, { recursive: true });
    }
  }

  private async rotateLogFile(): Promise<void> {
    try {
      const logPath = path.join(this.logDir, this.currentLogFile);
      const stats = await fs.stat(logPath);
      
      if (stats.size > this.maxFileSize) {
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const rotatedFileName = `${this.currentLogFile.replace('.log', '')}-${timestamp}.log`;
        const rotatedPath = path.join(this.logDir, rotatedFileName);
        
        await fs.rename(logPath, rotatedPath);
        
        // Clean up old log files
        await this.cleanupOldLogs();
      }
    } catch (error) {
      // If file doesn't exist or other error, continue
      console.error('Error rotating log file:', error);
    }
  }

  private async cleanupOldLogs(): Promise<void> {
    try {
      const files = await fs.readdir(this.logDir);
      const logFiles = files
        .filter(file => file.startsWith('pmp-service-') && file.endsWith('.log'))
        .map(file => ({
          name: file,
          path: path.join(this.logDir, file),
          mtime: 0
        }));

      // Get file stats
      for (const file of logFiles) {
        try {
          const stats = await fs.stat(file.path);
          file.mtime = stats.mtime.getTime();
        } catch {
          // Skip files that can't be stat'd
        }
      }

      // Sort by modification time (oldest first)
      logFiles.sort((a, b) => a.mtime - b.mtime);

      // Remove oldest files if we have too many
      if (logFiles.length > this.maxFiles) {
        const filesToDelete = logFiles.slice(0, logFiles.length - this.maxFiles);
        for (const file of filesToDelete) {
          try {
            await fs.unlink(file.path);
          } catch {
            // Continue if we can't delete a file
          }
        }
      }
    } catch (error) {
      console.error('Error cleaning up old logs:', error);
    }
  }

  private formatMessage(level: LogLevel, message: string, meta?: any): string {
    const timestamp = new Date().toISOString();
    const levelStr = LogLevel[level];
    let formattedMessage = `[${timestamp}] [${levelStr}] ${message}`;
    
    if (meta) {
      if (typeof meta === 'object') {
        formattedMessage += ` ${JSON.stringify(meta)}`;
      } else {
        formattedMessage += ` ${meta}`;
      }
    }
    
    return formattedMessage + '\n';
  }

  private async writeToFile(message: string): Promise<void> {
    try {
      await this.rotateLogFile();
      const logPath = path.join(this.logDir, this.currentLogFile);
      await fs.appendFile(logPath, message);
    } catch (error) {
      console.error('Error writing to log file:', error);
    }
  }

  private log(level: LogLevel, message: string, meta?: any): void {
    const formattedMessage = this.formatMessage(level, message, meta);
    
    // Always log to console
    if (level === LogLevel.ERROR) {
      console.error(formattedMessage.trim());
    } else if (level === LogLevel.WARN) {
      console.warn(formattedMessage.trim());
    } else {
      console.log(formattedMessage.trim());
    }
    
    // Write to file
    this.writeToFile(formattedMessage);
  }

  error(message: string, meta?: any): void {
    this.log(LogLevel.ERROR, message, meta);
  }

  warn(message: string, meta?: any): void {
    this.log(LogLevel.WARN, message, meta);
  }

  info(message: string, meta?: any): void {
    this.log(LogLevel.INFO, message, meta);
  }

  debug(message: string, meta?: any): void {
    this.log(LogLevel.DEBUG, message, meta);
  }

  // Special method for API requests
  apiRequest(method: string, path: string, statusCode: number, duration: number, ip?: string): void {
    const message = `${method} ${path} ${statusCode} ${duration}ms`;
    const meta = { ip, method, path, statusCode, duration };
    this.info(message, meta);
  }

  // Special method for save record operations
  saveRecord(recordId: string, processGroup: string, success: boolean, error?: string): void {
    const message = `Save Record: ${recordId} (${processGroup}) - ${success ? 'SUCCESS' : 'FAILED'}`;
    const meta = { recordId, processGroup, success, error };
    if (success) {
      this.info(message, meta);
    } else {
      this.error(message, meta);
    }
  }

  // Special method for question retrieval
  questionRetrieval(params: any, count: number, success: boolean, error?: string): void {
    const message = `Question Retrieval: ${count} questions - ${success ? 'SUCCESS' : 'FAILED'}`;
    const meta = { params, count, success, error };
    if (success) {
      this.info(message, meta);
    } else {
      this.error(message, meta);
    }
  }
}

// Create singleton instance
export const logger = new Logger(); 