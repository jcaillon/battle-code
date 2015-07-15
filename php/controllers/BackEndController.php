<?php
/**
 * Created by PhpStorm.
 * User: Julien
 * Date: 26/04/2015
 * Time: 14:53
 */

// action type?
if (!isset($_GET['action'])) rollbackAndDie();
$action = htmlspecialchars($_GET['action']);

include_once("../classes/Game.php");
include_once("../classes/Team.php");
include_once("../classes/Params.php");
include_once("../classes/SPDO.php");

$game = new game();
$team = new Team();

// clear inputs
if (isset($_GET['gameId'])) $gameId = htmlspecialchars($_GET['gameId']); else $gameId = '';
if (isset($_GET['gameToken'])) $gameToken = htmlspecialchars($_GET['gameToken']); else $gameToken = '';
if (isset($_GET['teamId'])) $teamId = htmlspecialchars($_GET['teamId']); else $teamId = '';
if (isset($_GET['teamToken'])) $teamToken = htmlspecialchars($_GET['teamToken']); else $teamToken = '';
if (isset($_GET['profile'])) $profile = htmlspecialchars($_GET['profile']); else $profile = '';
if (isset($_GET['round'])) $round = intval(htmlspecialchars($_GET['round'])); else $round = 0;

http_response_code(500);
SPDO::getInstance()->beginTransaction();
switch ($action) {

    // ------------------------------
    // delete (useless but just to simulate the actual server)
    // ------------------------------
    case 'delete':

        // check inputs
        if (!isset($_GET['gameId']) OR !isset($_GET['gameToken'])) rollbackAndDie();

        // get the game
        if (!$game->get($gameId)) rollbackAndDie();

        // end it
        if (!$game->endIt()) rollbackAndDie();

        break;


    // ------------------------------
    // getClosestBattle
    // ------------------------------
    case 'getClosestBattle':
        header('Content-Type: application/json');

        // check inputs
        if (!isset($_GET['teamId']) OR !isset($_GET['teamToken'])) rollbackAndDie();

        // get closest battle
        if (isset($_GET['roundTime'])) {
            $game->getClosestBattle(intval(htmlspecialchars($_GET['roundTime'])));
        } else {
            $game->getClosestBattle();
        }

        if (!empty($game->getGameId())) {

            // get the game
            if (!$game->get($game->getGameId())) rollbackAndDie();

            // team valid?
            if (!$team->checkIfLegit($teamId, $teamToken)) rollbackAndDie();

            // is the team really in this game?
            $IamIn = $team->get($game->getGameId(), $teamId);

            echo json_encode(array('gameId' => $game->getGameId(), 'gameToken' => $game->getGameToken(), 'IAmIn' => $IamIn), JSON_PRETTY_PRINT);
        }
        break;


    // ------------------------------
    // register
    // ------------------------------
    case 'register':
        header('Content-Type: application/json');

        if (!isset($_GET['teamId']) OR !isset($_GET['teamToken'])) rollbackAndDie();

        if(!preg_match('/^[a-z]\w{0,20}$/i', $teamId)) rollbackAndDie();

        if ($team->register($teamId, $teamToken)) rollbackAndDie();

        echo json_encode(array('teamId' => $teamId, 'teamToken' => $team->getTeamToken()), JSON_PRETTY_PRINT);

        break;


    // ------------------------------
    // changeTeamProfile
    // ------------------------------
    case 'changeTeamProfile':

        // check inputs
        if (!isset($_GET['teamId']) OR !isset($_GET['gameId']) OR !isset($_GET['teamToken']) OR !isset($_GET['profile'])) rollbackAndDie();

        // valid profile?
        if (!in_array($profile, Params::$profilName)) rollbackAndDie();

        // get the game
        if (!$game->get($gameId)) rollbackAndDie();

        // can only change our profile if the game haven't started yet
        if ($game->getRound() >= 1) rollbackAndDie();

        // team valid?
        if (!$team->checkIfLegit($teamId, $teamToken)) rollbackAndDie();

        // is the team really in this game? get it
        if (!$team->get($gameId, $teamId)) rollbackAndDie();

        // change the team profile
        if (!$team->changeProfile($gameId, $profile)) rollbackAndDie();

        break;


    // ------------------------------
    // create
    // ------------------------------
    case 'create':
        header('Content-Type: application/json');

        if (isset($_GET['roundTime'])) {
            $game->create(intval(htmlspecialchars($_GET['roundTime'])));
        } else {
            $game->create();
        }

        if (!empty($game->getStatus())) {
            echo json_encode(array('gameId' => $game->getGameId(), 'gameToken' => $game->getGameToken()), JSON_PRETTY_PRINT);
        }
        break;


    // ------------------------------
    // join
    // ------------------------------
    case 'join':

        // check inputs
        if (!isset($_GET['teamId']) OR !isset($_GET['gameId']) OR !isset($_GET['gameToken'])) rollbackAndDie();

        if (!isset($_GET['profile'])) $profile = Params::$profilName[1];
        else $profile = htmlspecialchars($_GET['profile']);

        // valid profile?
        if (!in_array($profile, Params::$profilName)) rollbackAndDie();

        // valid gameToken?
        if (!$game->checkIfLegit($gameId, $gameToken)) rollbackAndDie();

        // team valid?
//        if (!$team->checkIfExists($teamId)) rollbackAndDie();

        // get the game
        if (!$game->get($gameId)) rollbackAndDie();

        // add the team to the game
        if (!$team->addTeamInGame($gameId, $teamId, $profile)) rollbackAndDie();

        break;


    // ------------------------------
    // start
    // ------------------------------
    case 'start':

        // check inputs
        if (!isset($_GET['gameId']) OR !isset($_GET['gameToken'])) rollbackAndDie();

        // check token
        if (!$game->checkIfLegit($gameId, $gameToken)) rollbackAndDie();

        // try to get the game
        if (!$game->get($gameId)) rollbackAndDie();

        // can only be started if just created
        if ($game->getStatus() <> Params::$gameStatus[0]) rollbackAndDie();

        // can only be started if > 1 team
        if ($game->getNbTeam() < 2) rollbackAndDie();

        // try to start the game!
        if (!$game->start()) rollbackAndDie();

        break;


    // ------------------------------
    // teamAction
    // ------------------------------
    case 'teamAction':

        // check inputs
        if (!isset($_GET['gameId']) OR !isset($_GET['round']) OR !isset($_GET['teamId']) OR !isset($_GET['teamToken'])) rollbackAndDie();

        // get the game
        if (!$game->get($gameId)) rollbackAndDie();

        // update the game on the server side
        $game->update();

        // team valid?
        if (!$team->checkIfLegit($teamId, $teamToken)) rollbackAndDie();

        // is the team really in this game? get it
        if (!$team->get($gameId, $teamId)) rollbackAndDie();

        // from now on, before dying, we apply a penalty to this team if something goes wrong

        // can only add actions to a started game
        if ($game->getStatus() <> Params::$gameStatus[1]) punishAndDie($team, $game);

        // check the round
        if ($round <> $game->getRound()) punishAndDie($team, $game);

        // Try to register each actions
        $targetTeam = new Team();
        $totalPA = $team->nbOfPaUsed($gameId, $round);

        // register self action to gain PA
        foreach ($_GET as $t_teamId => $PA) {
            if (preg_match('/^t_[a-z]\w{0,20}$/i', $t_teamId)) {
                $PA = intval($PA);
                // it's the sending team and it's a self targeted HP to gain PA
                if (substr($t_teamId, 2) == $team->getTeamId() && $PA < 0) {
                    $totalPA = $totalPA + $PA;
                }
            }
        }

        foreach ($_GET as $t_teamId => $PA) {
            if (preg_match('/^t_[a-z]\w{0,20}$/i', $t_teamId)) {

                $PA = intval($PA);

                // is the targeted team in the game?
                if (!$targetTeam->get($gameId, substr($t_teamId, 2))) punishAndDie($team, $game);

                // is the total PA used coherent?
                if ($PA > 0) $totalPA = $totalPA + $PA;

                if ($totalPA > $team->getPA()) punishAndDie($team, $game);

                // register action
                $team->addAction($gameId, $round, $targetTeam->getTeamId(), $PA);
            }
        }

        http_response_code(200);
        break;


    // ------------------------------
    // worldState
    // ------------------------------
    case 'worldState':
        header('Content-Type: application/json');

        // check inputs
        if (!isset($_GET['gameId']) OR !isset($_GET['round']) OR !isset($_GET['teamId']) OR !isset($_GET['teamToken'])) rollbackAndDie();

        // get the game
        if (!$game->get($gameId)) rollbackAndDie();
        if (is_null($game->getStatus()) || strlen($game->getStatus()) == 0) rollbackAndDie();

        // update the game on the server side
        $game->update();

        // team valid?
//        if (!$team->checkIfLegit($teamId, $teamToken)) rollbackAndDie();

        // is the team really in this game? get it
//        if (!$team->get($gameId, $teamId)) rollbackAndDie();

        // check the round
        if ($round > $game->getRound()) rollbackAndDie();

        http_response_code(200);
        echo json_encode($game->worldState($round), JSON_PRETTY_PRINT);
        break;
    default:
        rollbackAndDie();
        break;
}
try {
    SPDO::getInstance()->commit();
} finally {
    http_response_code(200);
}

// before dying, we apply a penalty to this team if something goes wrong
function punishAndDie(Team $team, Game $game) {
    $team->addPenatly($game->getGameId(), $game->getRound());
    rollbackAndDie();
}

function rollbackAndDie() {
    SPDO::getInstance()->rollBack();
    die();
}