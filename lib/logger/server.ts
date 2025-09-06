import fs from 'fs';
import path from 'path';

// Server-only logging functionality
let logStream: fs.WriteStream | null = null;

function initializeLogStream() {
  if (logStream) return logStream;
  
  try {
    // Create logs directory if it doesn't exist
    const logsDir = path.join(process.cwd(), 'logs');
    if (!fs.existsSync(logsDir)) {
      fs.mkdirSync(logsDir, { recursive: true });
    }
    
    // Create log file with timestamp
    const timestamp = new Date().toISOString().split('T')[0];
    const logFile = path.join(logsDir, `app-${timestamp}.log`);
    
    // Initialize write stream
    logStream = fs.createWriteStream(logFile, { flags: 'a' });
    
    // Handle process termination
    process.on('exit', () => {
      if (logStream) {
        logStream.end();
      }
    });

    process.on('SIGINT', () => {
      if (logStream) {
        logStream.end();
      }
      process.exit(0);
    });
    
    return logStream;
  } catch (error) {
    console.error('Failed to initialize log stream:', error);
    return null;
  }
}

export async function writeLog(message: string) {
  const stream = initializeLogStream();
  if (stream && stream.writable) {
    stream.write(message + '\n');
  }
}