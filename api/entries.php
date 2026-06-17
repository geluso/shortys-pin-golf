<?php

require __DIR__ . '/lib.php';

$method = $_SERVER['REQUEST_METHOD'] ?? 'GET';

try {
    if ($method === 'GET') {
        json_response(public_entries(read_entries()));
    }

    if ($method === 'POST') {
        $body = read_json_body();
        $name = normalize_name((string) ($body['name'] ?? ''));

        $now = iso_now();
        $entry = [
            'id' => new_id(),
            'name' => $name,
            'scores' => normalize_scores($body['scores'] ?? []),
            'pin' => store_pin($body['pin'] ?? null),
            'createdAt' => $now,
            'updatedAt' => $now,
        ];

        $entries = read_entries();
        $entries[] = $entry;
        write_entries($entries);
        json_response(public_entry($entry), 201);
    }

    json_response(['error' => 'Method not allowed'], 405);
} catch (InvalidArgumentException $e) {
    json_response(['error' => $e->getMessage()], 400);
}
