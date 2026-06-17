<?php

require __DIR__ . '/lib.php';

$id = trim((string) ($_GET['id'] ?? ''));
if ($id === '') {
    json_response(['error' => 'ID required'], 400);
}

$method = $_SERVER['REQUEST_METHOD'] ?? 'GET';

try {
    if ($method === 'GET') {
        foreach (read_entries() as $entry) {
            if (($entry['id'] ?? '') === $id) {
                json_response($entry);
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
        if (!empty($entry['pin']) && ($body['editPin'] ?? '') !== $entry['pin']) {
            json_response(['error' => 'Wrong PIN'], 403);
        }

        $name = trim((string) ($body['name'] ?? ''));
        if ($name === '') {
            json_response(['error' => 'Name required'], 400);
        }

        $entry['name'] = $name;
        $entry['scores'] = normalize_scores($body['scores'] ?? []);
        $entry['updatedAt'] = iso_now();

        if (!empty($body['clearPin'])) {
            $entry['pin'] = null;
        } elseif (!empty($body['pin'])) {
            $entry['pin'] = (string) $body['pin'];
        }

        $entries[$idx] = $entry;
        write_entries($entries);
        json_response($entry);
    }

    json_response(['error' => 'Method not allowed'], 405);
} catch (InvalidArgumentException $e) {
    json_response(['error' => $e->getMessage()], 400);
}
