<?php

require __DIR__ . '/lib.php';

$method = $_SERVER['REQUEST_METHOD'] ?? 'GET';

try {
    if ($method === 'GET') {
        $draft = read_user_session();
        json_response(['draft' => $draft]);
    }

    if ($method === 'POST') {
        $body = read_json_body();
        $draft = normalize_draft($body);
        $saved = save_user_session($draft);
        json_response(['ok' => true, 'sessionId' => $saved['id'], 'draft' => $saved['draft']]);
    }

    if ($method === 'DELETE') {
        delete_user_session();
        json_response(['ok' => true]);
    }

    json_response(['error' => 'Method not allowed'], 405);
} catch (InvalidArgumentException $e) {
    json_response(['error' => $e->getMessage()], 400);
}
