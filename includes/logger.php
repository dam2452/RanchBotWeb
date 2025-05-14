<?php

class Logger {
    public const string DEBUG   = 'debug';
    public const string INFO    = 'info';
    public const string WARNING = 'warning';
    public const string ERROR   = 'error';

    private string $logDir;
    private string $minLevel;
    private bool $enabled;

    private static array $levelPriority = [
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

    public function log(string $message, string $level = self::INFO, string $file = 'debug.log', array $context = []): bool {
        if (!$this->enabled || !$this->shouldLog($level)) {
            return false;
        }

        $timestamp = date('Y-m-d H:i:s');
        $formattedContext = empty($context) ? '' : ' - ' . json_encode($context);
        $entry = "[$timestamp] [$level] $message$formattedContext\n";

        return file_put_contents($this->logDir . '/' . $file, $entry, FILE_APPEND) !== false;
    }

    public function debug(string $message, string $file = 'debug.log', array $context = []): bool {
        return $this->log($message, self::DEBUG, $file, $context);
    }

    public function info(string $message, string $file = 'debug.log', array $context = []): bool {
        return $this->log($message, self::INFO, $file, $context);
    }

    public function warning(string $message, string $file = 'debug.log', array $context = []): bool {
        return $this->log($message, self::WARNING, $file, $context);
    }

    public function error(string $message, string $file = 'debug.log', array $context = []): bool {
        return $this->log($message, self::ERROR, $file, $context);
    }

    private function shouldLog(string $level): bool {
        return self::$levelPriority[$level] >= self::$levelPriority[$this->minLevel];
    }
}

global $__logger_instance;
$__logger_instance = new Logger();

function logger(): Logger {
    global $__logger_instance;
    return $__logger_instance;
}
