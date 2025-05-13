<?php

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

    public function __construct() {
        $this->logDir = config('logging.log_dir', __DIR__ . '/../logs');
        $this->minLevel = config('logging.level', self::ERROR);
        $this->enabled = config('logging.enabled', true);

        if (!is_dir($this->logDir)) {
            mkdir($this->logDir, 0777, true);
        }
    }

    public function log($message, $level = self::INFO, $file = 'debug.log', $context = []) {
        if (!$this->enabled || !$this->shouldLog($level)) {
            return false;
        }

        $timestamp = date('Y-m-d H:i:s');
        $formattedContext = empty($context) ? '' : ' - ' . json_encode($context);
        $entry = "[{$timestamp}] [{$level}] {$message}{$formattedContext}\n";

        return file_put_contents($this->logDir . '/' . $file, $entry, FILE_APPEND) !== false;
    }

    public function debug($message, $file = 'debug.log', $context = []) {
        return $this->log($message, self::DEBUG, $file, $context);
    }

    public function info($message, $file = 'debug.log', $context = []) {
        return $this->log($message, self::INFO, $file, $context);
    }

    public function warning($message, $file = 'debug.log', $context = []) {
        return $this->log($message, self::WARNING, $file, $context);
    }

    public function error($message, $file = 'debug.log', $context = []) {
        return $this->log($message, self::ERROR, $file, $context);
    }

    private function shouldLog($level) {
        return self::$levelPriority[$level] >= self::$levelPriority[$this->minLevel];
    }
}

global $__logger_instance;
$__logger_instance = new Logger();

function logger() {
    global $__logger_instance;
    return $__logger_instance;
}
