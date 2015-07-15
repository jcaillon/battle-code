<?php
/**
 * Created by PhpStorm.
 * User: Julien
 * Date: 13/05/2015
 * Time: 20:15
 */

include_once("../classes/SPDO.php");

header('content-type: application/json; charset=utf-8');
http_response_code(400);

if (!isset($_GET['id']) OR !isset($_GET['server'])) die();

if (isset($_GET['id'])) $id = htmlspecialchars($_GET['id']); else $id = '';
if (isset($_GET['server'])) $server = htmlspecialchars($_GET['server']); else $server = '';
if (isset($_GET['callback'])) $callback = htmlspecialchars($_GET['callback']); else $callback = '';

$req = SPDO::getInstance()->prepare('SELECT game FROM gamesaves WHERE id = :id AND server = :server');
if (!$req->execute(array('id' => $id, 'server' => $server))) die();
$data = $req->fetch()['game'];
$rowExists = strlen($data) > 0;

# POST
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $data = json_encode(array('method' => 'POST', 'id' => $id,  'server' => $server, 'post' => $_POST['data'], 'exists' => $rowExists),
        JSON_PRETTY_PRINT);

    if ($rowExists) {
        $req = SPDO::getInstance()->prepare('UPDATE gamesaves SET game = :game WHERE id = :id AND server = :server');
        $req->execute(array('id' => $id, 'server' => $server, 'game' => $_POST['data']));
        if ($req->rowCount() < 1) die();
    } else {
        $req = SPDO::getInstance()->prepare('INSERT INTO gamesaves(id, server, game) VALUES(:id, :server, :game)');
        $req->execute(array('id' => $id, 'server' => $server, 'game' => $_POST['data']));
        if ($req->rowCount() < 1) die();
    }

# GET
} elseif ($_SERVER['REQUEST_METHOD'] === 'GET') {

    if (!$rowExists) $data = "{}";

} else die();

# JSON if no callback
if(!isset($_GET['callback'])) {
    //echo json_encode($data, JSON_PRETTY_PRINT);
    echo $data;

# JSONP if valid callback
} elseif (is_valid_callback($callback)) {
    echo $callback."(".$data.")";

} else die();

http_response_code(200);

function is_valid_callback($subject)
{
    $identifier_syntax
        = '/^[$_\p{L}][$_\p{L}\p{Mn}\p{Mc}\p{Nd}\p{Pc}\x{200C}\x{200D}]*+$/u';

    $reserved_words = array('break', 'do', 'instanceof', 'typeof', 'case',
        'else', 'new', 'var', 'catch', 'finally', 'return', 'void', 'continue',
        'for', 'switch', 'while', 'debugger', 'function', 'this', 'with',
        'default', 'if', 'throw', 'delete', 'in', 'try', 'class', 'enum',
        'extends', 'super', 'const', 'export', 'import', 'implements', 'let',
        'private', 'public', 'yield', 'interface', 'package', 'protected',
        'static', 'null', 'true', 'false');

    return preg_match($identifier_syntax, $subject)
    && ! in_array(mb_strtolower($subject, 'UTF-8'), $reserved_words);
}