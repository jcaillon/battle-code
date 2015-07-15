<?php
/**
 * Created by PhpStorm.
 * User: Julien
 * Date: 13/05/2015
 * Time: 20:15
 */

include_once("../classes/SPDO.php");

header('content-type: application/json; charset=utf-8');

if (!isset($_GET['id']) OR !isset($_GET['server'])) die();

if (isset($_GET['id'])) $id = htmlspecialchars($_GET['id']); else $id = '';
if (isset($_GET['server'])) $server = htmlspecialchars($_GET['server']); else $server = '';
if (isset($_GET['callback'])) $callback = htmlspecialchars($_GET['callback']); else $callback = '';

//$filename = sanitize($server."-".$id).".json";
$filename = sanitize($id).".json";
$filepath = "../../content/game_saves/".$filename;
$data = "{}";

if ($_SERVER['REQUEST_METHOD'] == 'POST') {
    if (!file_put_contents($filepath, $_POST['data'], FILE_TEXT)) {
        die();
    }
} elseif ($_SERVER['REQUEST_METHOD'] == 'GET') {
    if (file_exists($filepath)) {
        $data = file_get_contents($filepath, FILE_TEXT);
    }
} else {
    die();
}

if(!isset($_GET['callback'])) {
    echo $data;
} elseif (is_valid_callback($callback)) {
    echo $callback."(".$data.")";
} else {
    die();
}

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

/**
 * Function: sanitize
 * Returns a sanitized string, typically for URLs.
 *
 * Parameters:
 *     $string - The string to sanitize.
 *     $force_lowercase - Force the string to lowercase?
 *     $anal - If set to *true*, will remove all non-alphanumeric characters.
 */
function sanitize($string, $force_lowercase = true, $anal = false) {
    $strip = array("~", "`", "!", "@", "#", "$", "%", "^", "&", "*", "(", ")", "_", "=", "+", "[", "{", "]",
        "}", "\\", "|", ";", ":", "\"", "'", "&#8216;", "&#8217;", "&#8220;", "&#8221;", "&#8211;", "&#8212;",
        "â€”", "â€“", ",", "<", ".", ">", "/", "?");
    $clean = trim(str_replace($strip, "", strip_tags($string)));
    $clean = preg_replace('/\s+/', "-", $clean);
    $clean = ($anal) ? preg_replace("/[^a-zA-Z0-9]/", "", $clean) : $clean ;
    return ($force_lowercase) ?
        (function_exists('mb_strtolower')) ?
            mb_strtolower($clean, 'UTF-8') :
            strtolower($clean) :
        $clean;
}