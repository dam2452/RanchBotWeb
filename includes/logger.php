<?php
/**
 * Logger utility class
 *
 * Handles logging for the application with different log levels
 */
class Logger {
    const DEBUG = 'debug';
    const INFO = 'info';
    const WARNING = 'warning';
    const ERROR = 'error';

    private string $logDir;
    private string $minLevel;
    private bool $enabled;

    private static $levelPriority = [
        self::DEBUG => 0,
        self::INFO => 1,
        self::WARNING => 2,
        self::ERROR => 3,
    ];

    /**
     * Constructor
     */
    public function __construct() {
        $this->logDir = config('logging.log_dir', __DIR__ . '/../logs');
        $this->minLevel = config('logging.level', self::ERROR);
        $this->enabled = config('logging.enabled', true);

        // Upewnij się, że katalog logów istnieje
        if (!is_dir($this->logDir)) {
            mkdir($this->logDir, 0777, true);
        }
    }

    /**
     * Log a message with a specific level
     *
     * @param string $message Log message
     * @param string $level Log level
     * @param string $file Log file name (without path)
     * @param array $context Additional context data
     * @return bool Success status
     */
    public function log($message, $level = self::INFO, $file = 'debug.log', $context = []) {
        if (!$this->enabled || !$this->shouldLog($level)) {
            return false;
        }

        $timestamp = date('Y-m-d H:i:s');
        $formattedContext = empty($context) ? '' : ' - ' . json_encode($context);
        $entry = "[{$timestamp}] [{$level}] {$message}{$formattedContext}\n";

        return file_put_contents($this->logDir . '/' . $file, $entry, FILE_APPEND) !== false;
    }

    /**
     * Log a debug message
     *
     * @param string $message Log message
     * @param string $file Log file name
     * @param array $context Additional context data
     * @return bool Success status
     */
    public function debug($message, $file = 'debug.log', $context = []) {
        return $this->log($message, self::DEBUG, $file, $context);
    }

    /**
     * Log an info message
     *
     * @param string $message Log message
     * @param string $file Log file name
     * @param array $context Additional context data
     * @return bool Success status
     */
    public function info($message, $file = 'debug.log', $context = []) {
        return $this->log($message, self::INFO, $file, $context);
    }

    /**
     * Log a warning message
     *
     * @param string $message Log message
     * @param string $file Log file name
     * @param array $context Additional context data
     * @return bool Success status
     */
    public function warning($message, $file = 'debug.log', $context = []) {
        return $this->log($message, self::WARNING, $file, $context);
    }

    /**
     * Log an error message
     *
     * @param string $message Log message
     * @param string $file Log file name
     * @param array $context Additional context data
     * @return bool Success status
     */
    public function error($message, $file = 'debug.log', $context = []) {
        return $this->log($message, self::ERROR, $file, $context);
    }

    /**
     * Determine if a message with this level should be logged
     *
     * @param string $level Log level
     * @return bool Whether to log this message
     */
    private function shouldLog($level) {
        return self::$levelPriority[$level] >= self::$levelPriority[$this->minLevel];
    }
}

// Tworzenie globalnej instancji loggera dostępnej przez funkcję logger()
global $__logger_instance;
$__logger_instance = new Logger();

/**
 * Global function to access the logger
 *
 * @return Logger The logger instance
 */
function logger() {
    global $__logger_instance;
    return $__logger_instance;
}