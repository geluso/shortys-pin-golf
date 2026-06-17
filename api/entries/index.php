<?php

$id = trim($_SERVER['PATH_INFO'] ?? '', '/');

if ($id !== '') {
    $_GET['id'] = $id;
    require dirname(__DIR__) . '/entry.php';
    exit;
}

require dirname(__DIR__) . '/entries.php';
