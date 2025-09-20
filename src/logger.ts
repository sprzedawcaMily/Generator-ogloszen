import { promises as fs } from 'fs';
import { join } from 'path';

export enum LogLevel {
    DEBUG = 0,
    INFO = 1,
    WARN = 2,
    ERROR = 3
}

export interface LogEntry {
    timestamp: string;
    level: string;
    message: string;
    data?: any;
}

export class Logger {
    private static instance: Logger;
    private logLevel: LogLevel = LogLevel.INFO;
    private logDir: string = 'logs';
    private logFile: string = '';
    private logs: LogEntry[] = [];
    private maxLogsInMemory: number = 1000;

    constructor() {
        this.initializeLogFile();
        this.ensureLogDirectory(); // Można wykonać asynchronicznie
    }

    static getInstance(): Logger {
        if (!Logger.instance) {
            Logger.instance = new Logger();
        }
        return Logger.instance;
    }

    private async ensureLogDirectory(): Promise<void> {
        try {
            await fs.access(this.logDir);
        } catch {
            try {
                await fs.mkdir(this.logDir, { recursive: true });
                console.log(`📁 Created log directory: ${this.logDir}`);
            } catch (error) {
                console.warn(`⚠️ Could not create log directory: ${error}`);
            }
        }
    }

    private initializeLogFile(): void {
        const today = new Date().toISOString().split('T')[0];
        this.logFile = join(this.logDir, `grailed-automation-${today}.log`);
    }

    private formatMessage(level: string, message: string, data?: any): string {
        const now = new Date();
        const timeString = now.toLocaleTimeString('pl-PL', { 
            hour12: false, 
            hour: '2-digit', 
            minute: '2-digit', 
            second: '2-digit',
            timeZone: 'Europe/Warsaw'
        });
        const emoji = this.getLevelEmoji(level);
        const levelPadded = level.toUpperCase().padEnd(5);
        
        let formatted = `[${timeString}] ${emoji} ${levelPadded} │ ${message}`;
        
        if (data !== undefined) {
            const dataString = typeof data === 'object' ? JSON.stringify(data, null, 2) : String(data);
            formatted += `\n${''.padStart(15)}└─ Data: ${dataString}`;
        }
        
        return formatted;
    }

    private getLevelEmoji(level: string): string {
        switch (level.toLowerCase()) {
            case 'debug': return '🔍';
            case 'info': return '📘';
            case 'warn': return '⚠️';
            case 'error': return '🚨';
            default: return '📝';
        }
    }

    private getConsoleColor(level: string): string {
        switch (level.toLowerCase()) {
            case 'debug': return '\x1b[36m'; // Bright Cyan
            case 'info': return '\x1b[94m';  // Bright Blue
            case 'warn': return '\x1b[93m';  // Bright Yellow
            case 'error': return '\x1b[91m'; // Bright Red
            default: return '\x1b[97m';      // Bright White
        }
    }

    private getBorderColor(level: string): string {
        switch (level.toLowerCase()) {
            case 'debug': return '\x1b[46m\x1b[30m'; // Cyan background, black text
            case 'info': return '\x1b[44m\x1b[97m';  // Blue background, white text
            case 'warn': return '\x1b[43m\x1b[30m';  // Yellow background, black text
            case 'error': return '\x1b[41m\x1b[97m'; // Red background, white text
            default: return '\x1b[47m\x1b[30m';      // White background, black text
        }
    }

    private async writeToFile(formattedMessage: string): Promise<void> {
        try {
            await fs.appendFile(this.logFile, formattedMessage + '\n');
        } catch (error) {
            console.error('Failed to write to log file:', error);
        }
    }

    private addToMemory(entry: LogEntry): void {
        this.logs.push(entry);
        
        // Keep only last N logs in memory
        if (this.logs.length > this.maxLogsInMemory) {
            this.logs = this.logs.slice(-this.maxLogsInMemory);
        }
    }

    private async log(level: LogLevel, levelName: string, message: string, data?: any): Promise<void> {
        if (level < this.logLevel) {
            return;
        }

        const entry: LogEntry = {
            timestamp: new Date().toISOString(),
            level: levelName,
            message,
            data
        };

        const formattedMessage = this.formatMessage(levelName, message, data);
        
        // Enhanced console output with better formatting
        const color = this.getConsoleColor(levelName);
        const borderColor = this.getBorderColor(levelName);
        const reset = '\x1b[0m';
        const bold = '\x1b[1m';
        const dim = '\x1b[2m';
        
        // Create a beautiful box around the message
        const lines = formattedMessage.split('\n');
        const maxLength = Math.max(...lines.map(line => this.stripAnsi(line).length));
        const boxWidth = Math.min(maxLength + 4, 100);
        
        console.log();
        console.log(`${borderColor} ${''.padEnd(boxWidth - 2)} ${reset}`);
        
        lines.forEach((line, index) => {
            if (index === 0) {
                console.log(`${color}${bold}${line}${reset}`);
            } else {
                console.log(`${dim}${line}${reset}`);
            }
        });
        
        console.log(`${borderColor} ${''.padEnd(boxWidth - 2)} ${reset}`);
        
        // Add to memory
        this.addToMemory(entry);
        
        // Write to file (without color codes)
        await this.writeToFile(this.stripAnsi(formattedMessage));
    }

    private stripAnsi(str: string): string {
        return str.replace(/\x1b\[[0-9;]*m/g, '');
    }

    debug(message: string, data?: any): Promise<void> {
        return this.log(LogLevel.DEBUG, 'debug', message, data);
    }

    info(message: string, data?: any): Promise<void> {
        return this.log(LogLevel.INFO, 'info', message, data);
    }

    warn(message: string, data?: any): Promise<void> {
        return this.log(LogLevel.WARN, 'warn', message, data);
    }

    error(message: string, data?: any): Promise<void> {
        return this.log(LogLevel.ERROR, 'error', message, data);
    }

    // Automation specific methods
    automationStart(advertisementCount: number): Promise<void> {
        return this.info(`🚀 Starting Grailed automation for ${advertisementCount} advertisements`);
    }

    automationComplete(processed: number, successful: number, failed: number): Promise<void> {
        return this.info(`🎉 Automation completed: ${processed} processed, ${successful} successful, ${failed} failed`);
    }

    advertisementStart(id: string, title: string): Promise<void> {
        return this.info(`📝 Processing advertisement: ${title}`, { id });
    }

    advertisementComplete(id: string, success: boolean): Promise<void> {
        const status = success ? '✅ SUCCESS' : '❌ FAILED';
        return this.info(`${status} Advertisement processed`, { id });
    }

    stepStart(step: string, details?: any): Promise<void> {
        return this.debug(`🔄 Starting step: ${step}`, details);
    }

    stepComplete(step: string, success: boolean, details?: any): Promise<void> {
        const status = success ? '✅' : '❌';
        return this.debug(`${status} Step completed: ${step}`, details);
    }

    // Getters for dashboard
    getRecentLogs(count: number = 100): LogEntry[] {
        return this.logs.slice(-count);
    }

    getLogsByLevel(level: string): LogEntry[] {
        return this.logs.filter(log => log.level.toLowerCase() === level.toLowerCase());
    }

    getLogsInRange(startTime: Date, endTime: Date): LogEntry[] {
        return this.logs.filter(log => {
            const logTime = new Date(log.timestamp);
            return logTime >= startTime && logTime <= endTime;
        });
    }

    getLogStats(): { debug: number, info: number, warn: number, error: number, total: number } {
        const stats = { debug: 0, info: 0, warn: 0, error: 0, total: this.logs.length };
        
        this.logs.forEach(log => {
            switch (log.level.toLowerCase()) {
                case 'debug': stats.debug++; break;
                case 'info': stats.info++; break;
                case 'warn': stats.warn++; break;
                case 'error': stats.error++; break;
            }
        });
        
        return stats;
    }

    setLogLevel(level: LogLevel): void {
        this.logLevel = level;
        this.info(`Log level set to: ${LogLevel[level]}`);
    }

    clearLogs(): void {
        this.logs = [];
        this.info('Log memory cleared');
    }

    // Special formatted logs for important events
    banner(message: string): Promise<void> {
        const bannerLine = '═'.repeat(60);
        const centeredMessage = message.padStart((60 + message.length) / 2).padEnd(60);
        
        console.log('\n');
        console.log(`\x1b[95m\x1b[1m╔${bannerLine}╗\x1b[0m`);
        console.log(`\x1b[95m\x1b[1m║${centeredMessage}║\x1b[0m`);
        console.log(`\x1b[95m\x1b[1m╚${bannerLine}╝\x1b[0m`);
        console.log();

        return this.info(`🎯 ${message}`);
    }

    separator(): Promise<void> {
        console.log(`\x1b[90m${'─'.repeat(80)}\x1b[0m`);
        return Promise.resolve();
    }

    progress(current: number, total: number, item: string): Promise<void> {
        const percentage = Math.round((current / total) * 100);
        const progressBar = '█'.repeat(Math.floor(percentage / 5)) + '░'.repeat(20 - Math.floor(percentage / 5));
        const progressText = `[${progressBar}] ${percentage}% (${current}/${total})`;
        
        return this.info(`📊 ${progressText} - ${item}`);
    }

    success(message: string, data?: any): Promise<void> {
        return this.info(`🎉 ${message}`, data);
    }

    failure(message: string, data?: any): Promise<void> {
        return this.error(`💥 ${message}`, data);
    }

    highlight(message: string, data?: any): Promise<void> {
        console.log('\n');
        console.log(`\x1b[93m\x1b[1m⭐ ${message} ⭐\x1b[0m`);
        console.log();
        return this.info(`⭐ ${message}`, data);
    }
}

// Export singleton instance
export const logger = Logger.getInstance();