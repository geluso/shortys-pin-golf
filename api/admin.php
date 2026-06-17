<?php

require __DIR__ . '/lib.php';

$method = $_SERVER['REQUEST_METHOD'] ?? 'GET';

try {
    if ($method === 'GET') {
        json_response(['authenticated' => is_admin()]);
    }

    if ($method === 'POST') {
        $body = read_json_body();
        $action = (string) ($body['action'] ?? '');

        if ($action === 'login') {
            if (admin_login((string) ($body['password'] ?? ''))) {
                json_response(['authenticated' => true]);
            }
            json_response(['error' => 'Wrong password'], 403);
        }

        if ($action === 'logout') {
            admin_logout();
            json_response(['authenticated' => false]);
        }

        require_admin();

        if ($action === 'delete') {
            delete_entry(normalize_id((string) ($body['id'] ?? '')));
            json_response(['ok' => true]);
        }

        if ($action === 'clear') {
            $backup = clear_all_entries();
            json_response(['ok' => true, 'backup' => $backup]);
        }

        json_response(['error' => 'Unknown action'], 400);
    }

    json_response(['error' => 'Method not allowed'], 405);
} catch (InvalidArgumentException $e) {
    json_response(['error' => $e->getMessage()], 400);
}
