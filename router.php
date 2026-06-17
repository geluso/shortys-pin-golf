<?php

$uri = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);
$query = $_SERVER['QUERY_STRING'] ?? '';

if (preg_match('#^/api/entries/([0-9a-f-]+)/?$#', $uri, $m)) {
    $_GET['id'] = $m[1];
    require __DIR__ . '/api/entry.php';
    return true;
}

if ($uri === '/api/entries' || $uri === '/api/entries/') {
    require __DIR__ . '/api/entries.php';
    return true;
}

if ($uri === '/play' || $uri === '/play/') {
    require __DIR__ . '/play.html';
    return true;
}

if ($uri === '/leaderboard' || $uri === '/leaderboard/') {
    require __DIR__ . '/leaderboard.html';
    return true;
}

if ($uri === '/entry' || $uri === '/entry/') {
    require __DIR__ . '/entry.html';
    return true;
}

if ($uri === '/' || $uri === '/index.html' || $uri === '/favicon.svg') {
    if ($uri === '/favicon.svg') {
        header('Content-Type: image/svg+xml');
        readfile(__DIR__ . '/favicon.svg');
        return true;
    }
    require __DIR__ . '/index.html';
    return true;
}

return false;
