<?php

require __DIR__ . '/lib.php';

$id = normalize_id((string) ($_GET['id'] ?? ''));

$method = $_SERVER['REQUEST_METHOD'] ?? 'GET';

try {
    if ($method === 'GET') {
        foreach (read_entries() as $entry) {
            if (($entry['id'] ?? '') === $id) {
                json_response(public_entry($entry));
            }
        }
        json_response(['error' => 'Not found'], 404);
    }

    if ($method === 'POST') {
        $body = read_json_body();
        $entries = read_entries();
        $idx = find_entry_index($entries, $id);
        if ($idx === -1) {
            json_response(['error' => 'Not found'], 404);
        }

        $entry = $entries[$idx];
        $name = normalize_name((string) ($body['name'] ?? ''));

        $entry['name'] = $name;
        $entry['scores'] = normalize_scores($body['scores'] ?? []);
        $entry['updatedAt'] = iso_now();

        if (!empty($entry['pin'])) {
            $editPin = normalize_pin($body['editPin'] ?? null);
            if ($editPin === null || !verify_pin($editPin, $entry['pin'])) {
                json_response(['error' => 'Wrong PIN'], 403);
            }
            if (!is_pin_hash($entry['pin'])) {
                $entry['pin'] = hash_pin($editPin);
            }
        }

        $entries[$idx] = $entry;
        write_entries($entries);
        json_response(public_entry($entry));
    }

    json_response(['error' => 'Method not allowed'], 405);
} catch (InvalidArgumentException $e) {
    json_response(['error' => $e->getMessage()], 400);
}
