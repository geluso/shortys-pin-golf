<?php

function data_file(): string
{
    return dirname(__DIR__) . '/data/entries.json';
}

function json_response($data, int $status = 200): void
{
    http_response_code($status);
    header('Content-Type: application/json; charset=utf-8');
    echo json_encode($data);
    exit;
}

function read_json_body(): array
{
    $raw = file_get_contents('php://input');
    if ($raw === false || $raw === '') {
        return [];
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
        if ($n < 1) {
            throw new InvalidArgumentException('Scores must be 1 or higher');
        }
        return $n;
    }, $scores);
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
