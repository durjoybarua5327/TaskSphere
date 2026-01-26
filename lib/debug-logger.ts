import fs from 'fs';
import path from 'path';

export function logDebug(message: string, data?: any) {
    const timestamp = new Date().toISOString();
    const logLine = `[${timestamp}] ${message} ${data ? JSON.stringify(data) : ''}\n`;
    const logPath = path.join(process.cwd(), 'server-debug.log');

    try {
        fs.appendFileSync(logPath, logLine);
    } catch (err) {
        console.error("Failed to write to log file:", err);
    }
}
