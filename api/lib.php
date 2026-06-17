<?php

function data_file(): string
{
    return dirname(__DIR__) . '/data/entries.json';
}

function data_dir(): string
{
    return dirname(data_file());
}

function json_response($data, int $status = 200): void
{
    http_response_code($status);
    header('Content-Type: application/json; charset=utf-8');
    header('Cache-Control: no-store, no-cache, must-revalidate, max-age=0');
    header('Pragma: no-cache');
    header('Expires: 0');
    echo json_encode($data);
    exit;
}

function read_json_body(): array
{
    $raw = file_get_contents('php://input');
    if ($raw === false || $raw === '') {
        return [];
    }
    if (strlen($raw) > 16384) {
        throw new InvalidArgumentException('Request too large');
    }
    $data = json_decode($raw, true);
    if (!is_array($data)) {
        throw new InvalidArgumentException('Invalid JSON');
    }
    return $data;
}

function read_entries(): array
{
    $file = data_file();
    if (!file_exists($file)) {
        return [];
    }
    $data = json_decode(file_get_contents($file), true);
    return is_array($data) ? $data : [];
}

function write_entries(array $entries): void
{
    $dir = dirname(data_file());
    if (!is_dir($dir)) {
        mkdir($dir, 0755, true);
    }
    file_put_contents(data_file(), json_encode($entries, JSON_PRETTY_PRINT), LOCK_EX);
}

function normalize_scores(array $scores): array
{
    if (count($scores) !== 9) {
        throw new InvalidArgumentException('Need scores for 9 holes');
    }
    return array_map(function ($s) {
        if ($s === null || $s === '') {
            return null;
        }
        $n = (int) $s;
        if ($n < 1 || $n > 99) {
            throw new InvalidArgumentException('Scores must be between 1 and 99');
        }
        return $n;
    }, $scores);
}

function normalize_name(string $name): string
{
    if (looks_malicious_text($name)) {
        throw new InvalidArgumentException('Rejected');
    }

    $name = trim($name);
    $name = preg_replace('/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/u', '', $name) ?? '';
    $name = preg_replace('/\s+/u', ' ', $name) ?? '';
    if ($name === '') {
        throw new InvalidArgumentException('Name required');
    }
    if (function_exists('mb_substr')) {
        return mb_substr($name, 0, 64);
    }
    return substr($name, 0, 64);
}

function looks_malicious_text(string $text): bool
{
    if (preg_match('/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/', $text)) {
        return true;
    }
    if (preg_match('/<[^>]*>/i', $text)) {
        return true;
    }
    if (preg_match('/javascript:/i', $text)) {
        return true;
    }
    if (preg_match('/on\w+\s*=/i', $text)) {
        return true;
    }
    if (preg_match('/data:\s*text\/html/i', $text)) {
        return true;
    }

    $trimmed = preg_replace('/\s+/u', ' ', trim($text)) ?? '';
    $sanitized = preg_replace('/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/u', '', $trimmed) ?? '';
    return $sanitized !== $trimmed;
}

function normalize_pin($pin): ?string
{
    if ($pin === null || $pin === '') {
        return null;
    }
    $pin = trim((string) $pin);
    if ($pin === '') {
        return null;
    }
    if (strlen($pin) > 32) {
        throw new InvalidArgumentException('PIN too long');
    }
    return $pin;
}

function is_pin_hash(string $value): bool
{
    return str_starts_with($value, '$2y$')
        || str_starts_with($value, '$2a$')
        || str_starts_with($value, '$argon2');
}

function hash_pin(string $pin): string
{
    return password_hash($pin, PASSWORD_DEFAULT);
}

function verify_pin(string $pin, string $stored): bool
{
    if (is_pin_hash($stored)) {
        return password_verify($pin, $stored);
    }

    return hash_equals($stored, $pin);
}

function store_pin($pin): ?string
{
    $plain = normalize_pin($pin);
    if ($plain === null) {
        return null;
    }

    return hash_pin($plain);
}

function public_entry(array $entry): array
{
    $entry['hasPin'] = !empty($entry['pin']);
    unset($entry['pin']);

    return $entry;
}

function public_entries(array $entries): array
{
    return array_map('public_entry', $entries);
}

function normalize_id(string $id): string
{
    $id = strtolower(trim($id));
    if (!preg_match('/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/', $id)) {
        throw new InvalidArgumentException('Invalid ID');
    }
    return $id;
}

function new_id(): string
{
    $data = random_bytes(16);
    $data[6] = chr(ord($data[6]) & 0x0f | 0x40);
    $data[8] = chr(ord($data[8]) & 0x3f | 0x80);
    return vsprintf('%s%s-%s-%s-%s-%s%s%s', str_split(bin2hex($data), 4));
}

function iso_now(): string
{
    return gmdate('Y-m-d\TH:i:s\Z');
}

function find_entry_index(array $entries, string $id): int
{
    foreach ($entries as $i => $entry) {
        if (($entry['id'] ?? '') === $id) {
            return $i;
        }
    }
    return -1;
}

function start_session(): void
{
    if (session_status() === PHP_SESSION_NONE) {
        session_start();
    }
}

function is_admin(): bool
{
    start_session();
    return !empty($_SESSION['admin']);
}

function require_admin(): void
{
    if (!is_admin()) {
        json_response(['error' => 'Unauthorized'], 401);
    }
}

function admin_login(string $password): bool
{
    start_session();
    if (hash_equals('hotdog', $password)) {
        $_SESSION['admin'] = true;
        return true;
    }
    return false;
}

function admin_logout(): void
{
    start_session();
    unset($_SESSION['admin']);
}

function delete_entry(string $id): void
{
    $entries = read_entries();
    $idx = find_entry_index($entries, $id);
    if ($idx === -1) {
        json_response(['error' => 'Not found'], 404);
    }
    array_splice($entries, $idx, 1);
    write_entries($entries);
}

function backup_entries_file(): string
{
    $source = data_file();
    $timestamp = gmdate('Y-m-d-His');
    $backup = data_dir() . '/scores-' . $timestamp . '.json';

    if (file_exists($source)) {
        if (!copy($source, $backup)) {
            throw new RuntimeException('Could not backup scores');
        }
    } else {
        file_put_contents($backup, "[]\n");
    }

    return $backup;
}

function clear_all_entries(): string
{
    $backup = backup_entries_file();
    write_entries([]);
    return basename($backup);
}
