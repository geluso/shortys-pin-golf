<?php

$uri = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);
$query = $_SERVER['QUERY_STRING'] ?? '';

foreach (['/shortys-pin-golf', '/shortys-pingolf'] as $prefix) {
    if (str_starts_with($uri, $prefix)) {
        $uri = substr($uri, strlen($prefix)) ?: '/';
        break;
    }
}

if (preg_match('#^/api/entries/([0-9a-f-]+)/?$#', $uri, $m)) {
    $_GET['id'] = $m[1];
    require __DIR__ . '/api/entry.php';
    return true;
}

if ($uri === '/api/entries' || $uri === '/api/entries/') {
    require __DIR__ . '/api/entries.php';
    return true;
}

if ($uri === '/api/admin' || $uri === '/api/admin/') {
    require __DIR__ . '/api/admin.php';
    return true;
}

if ($uri === '/api/session' || $uri === '/api/session/') {
    require __DIR__ . '/api/session.php';
    return true;
}

foreach (['play', 'leaderboard', 'entry', 'admin'] as $page) {
    if ($uri === "/{$page}" || $uri === "/{$page}/" || $uri === "/{$page}.html") {
        require __DIR__ . "/{$page}.html";
        return true;
    }
}

if ($uri === '/' || $uri === '/index.html') {
    require __DIR__ . '/index.html';
    return true;
}

if ($uri === '/favicon.svg') {
    header('Content-Type: image/svg+xml');
    readfile(__DIR__ . '/favicon.svg');
    return true;
}

return false;
