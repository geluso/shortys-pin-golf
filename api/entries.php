<?php

require __DIR__ . '/lib.php';

$method = $_SERVER['REQUEST_METHOD'] ?? 'GET';

try {
    if ($method === 'GET') {
        json_response(read_entries());
    }

    if ($method === 'POST') {
        $body = read_json_body();
        $name = trim((string) ($body['name'] ?? ''));
        if ($name === '') {
            json_response(['error' => 'Name required'], 400);
        }

        $now = iso_now();
        $entry = [
            'id' => new_id(),
            'name' => $name,
            'scores' => normalize_scores($body['scores'] ?? []),
            'pin' => !empty($body['pin']) ? (string) $body['pin'] : null,
            'createdAt' => $now,
            'updatedAt' => $now,
        ];

        $entries = read_entries();
        $entries[] = $entry;
        write_entries($entries);
        json_response($entry, 201);
    }

    json_response(['error' => 'Method not allowed'], 405);
} catch (InvalidArgumentException $e) {
    json_response(['error' => $e->getMessage()], 400);
}
