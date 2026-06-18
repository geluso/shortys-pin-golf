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
        $scores = normalize_scores($body['scores'] ?? []);
        $now = iso_now();
        $candidate = ['name' => $name, 'scores' => $scores];

        $entries = read_entries();
        $matches = find_entries_by_name($entries, $name);

        if ($matches !== []) {
            $best = best_entry_match($matches);
            $entry = $best['entry'];
            $keepIdx = $best['index'];

            if (!empty($entry['pin'])) {
                $pin = normalize_pin($body['pin'] ?? null);
                if ($pin === null || !verify_pin($pin, $entry['pin'])) {
                    json_response(['error' => 'Wrong PIN'], 403);
                }
            }

            $shouldUpdate = entry_beats($candidate, $entry) || entries_same_rank($candidate, $entry);
            if ($shouldUpdate) {
                $entry['name'] = $name;
                $entry['scores'] = $scores;
                $entry['updatedAt'] = $now;

                $newPin = store_pin($body['pin'] ?? null);
                if ($newPin !== null && empty($entry['pin'])) {
                    $entry['pin'] = $newPin;
                }

                $entries[$keepIdx] = $entry;
            }

            $duplicateIndices = array_map(
                fn($match) => $match['index'],
                array_filter($matches, fn($match) => $match['index'] !== $keepIdx)
            );
            $entries = remove_entry_indices($entries, $duplicateIndices);
            write_entries($entries);
            json_response(public_entry($entry));
        } else {
            $entry = [
                'id' => new_id(),
                'name' => $name,
                'scores' => $scores,
                'pin' => store_pin($body['pin'] ?? null),
                'createdAt' => $now,
                'updatedAt' => $now,
            ];

            $entries[] = $entry;
            write_entries($entries);
            json_response(public_entry($entry), 201);
        }
    }

    json_response(['error' => 'Method not allowed'], 405);
} catch (InvalidArgumentException $e) {
    json_response(['error' => $e->getMessage()], 400);
}
