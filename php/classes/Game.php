<?php
/**
 * Created by PhpStorm.
 * User: Julien
 * Date: 17/04/2015
 * Time: 22:41
 */

include_once("SPDO.php");
include_once("Params.php");

class game {
    private $gameId;
    private $gameToken;
    private $creationTime;
    private $status = "";
    private $round;
    private $lastRoundTime; // temps à la fin du dernier round
    private $roundTime; // in seconds
    private $nbTeam;

    // create a new battle
    function create($roundTime = 0) {
        $this->gameToken = date('d.m.y');

        $req = SPDO::getInstance()->prepare('INSERT INTO game(gameToken, round, statusStr, creationTime, roundtime) VALUES(:gameToken, 0, :statusStr, NOW(), :roundTime)');
        if ($req->execute(array('gameToken' => $this->gameToken, 'statusStr' => Params::$gameStatus[0], 'roundTime' => $roundTime))) {
            $this->gameId = SPDO::getInstance()->lastInsertId();
            $this->get($this->gameId);
        }
        return $this;
    }

    // get une battle
    function get($gameId) {
        $req = SPDO::getInstance()->prepare('SELECT gameToken, creationTime, statusStr, round, lastRoundTime, roundTime, nbTeam FROM game WHERE gameId = :gameId');
        $rqSuccess = $req->execute(array('gameId' => $gameId));
        if ($rqSuccess) {
            $dataGame = $req->fetch();
            $this->gameId = $gameId;
            $this->gameToken = $dataGame['gameToken'];
            $this->creationTime = $dataGame['creationTime'];
            $this->status = $dataGame['statusStr'];
            $this->round = intval($dataGame['round']);
            $this->lastRoundTime = $dataGame['lastRoundTime'];
            $this->roundTime = intval($dataGame['roundTime']);
            $this->nbTeam = intval($dataGame['nbTeam']);
        }
        return $rqSuccess;
    }

    // set to db
    function set() {
        $req = SPDO::getInstance()->prepare('UPDATE game SET round = :round, lastRoundTime = :lastRoundTime, statusStr = :statusStr WHERE gameID = :gameId');
        $req->execute(array(
            'round' => $this->round,
            'lastRoundTime' => $this->lastRoundTime,
            'statusStr' => $this->status,
            'gameId' => $this->gameId
        ));
        return ($req->rowCount() >= 1) ? true : false;
    }

    // start a battle
    function start() {
        $this->round = 1;
        $this->lastRoundTime = date('Y-m-d H:i:s');
        $this->status = Params::$gameStatus[1];
        return $this->set();
    }

    function checkIfLegit($gameId, $gameToken) {

        $isLegit = false;

        // check teamToken
        $req = SPDO::getInstance()->prepare('SELECT gameToken FROM game WHERE gameId = :gameId');
        $req->execute(array('gameId' => $gameId));
        $dataGame = $req->fetch();

        if($dataGame['gameToken'] == $gameToken) $isLegit = true;
        return $isLegit;
    }

    // get the first battle planned in the databse
    function getClosestBattle($roundTime = 0) {
        $req = SPDO::getInstance()->prepare('SELECT gameId, gameToken FROM game WHERE statusStr = :statusStr AND round = 0');
        $req->execute(array('statusStr' => Params::$gameStatus[0]));

        if ($dataGame = $req->fetch()) {
            $this->gameId = $dataGame['gameId'];
            $this->gameToken = $dataGame['gameToken'];
        } else {
            $this->create($roundTime);
        }

        return $this;
    }

    // update a battle
    function update() {
        if ($this->status == Params::$gameStatus[1] && team::getNbTeamAlive($this->gameId) <= 1) {
            $this->status = Params::$gameStatus[2];
            $this->set();
        }
        if ($this->status == Params::$gameStatus[1]) {
            if ($this->roundTime <= 0) {
                // mode où on finit le tour des que tout le monde a joué
                if (team::getNbTeamAlive($this->gameId) == Team::nbOfTeamPlayedThisRound($this->gameId, $this->round)) {
                    $this->goToNextRound();
                }
            } else {
                // mode chrono ou chaque round a un temps limite
                $nowTimeInt = doubleval(date("YmdHis"));
                $serverNewRoundTime = doubleval(date("YmdHis", strtotime($this->lastRoundTime) + $this->roundTime));

                // trop de round auraient du s'ecouler depuis la derniere update, on considere que la game est finie
                if ((($nowTimeInt - $serverNewRoundTime) / $this->roundTime) > 100) {
                    $this->status = Params::$gameStatus[2];
                    $this->set();
                }

                // doit-on declencher un nouveau tour?? (temps du tour courant ecoule + game non finie)
                while ($nowTimeInt > $serverNewRoundTime AND $this->status <> Params::$gameStatus[2]) {
                    $this->goToNextRound();
                    $serverNewRoundTime = doubleval(date("YmdHis", strtotime($this->lastRoundTime) + $this->roundTime));
                }
            }
        }
    }

    // passe un round, finit la battle si elle doit etre finie
    function goToNextRound() {
        // on doit appliquer toutes les actions effetuees ce tour
        Team::applyRoundActions($this->getGameId(), $this->getRound());

        // la battle est finie?
        if (team::getNbTeamAlive($this->gameId) <= 1) {
            $this->status = Params::$gameStatus[2];
        } else {
            // sinon nouveau round
            $this->round = $this->round + 1;
            $this->lastRoundTime = date('Y-m-d H:i:s', strtotime($this->lastRoundTime) + $this->roundTime);
        }
        $this->set();
    }

    // finit la game
    function endIt() {
        $this->status = Params::$gameStatus[2];
        $this->set();
        return true;
    }

    // return l'état du monde en version simple
    function simpleWorldState() {
        return 'round:'.strval($this->round).','.Team::getTeamSimple($this->gameId);
    }

    // return l'état complet du monde
    function worldState($round = 0) {
        if ($round == 0) $round = $this->round;
        $teamStats = team::getTeamJSON($this->gameId, $round, $this->round);
        $state['gameId'] = $this->gameId;
        $state['gameStatus'] = $this->status;
        $state['round'] = $this->round;
        if (array_key_exists('teamIdToLifePoint', $teamStats))
            $state['teamIdToLifePoint'] = $teamStats['teamIdToLifePoint'];
        if (array_key_exists('teamIdToRoundDead', $teamStats))
            $state['teamIdToRoundDead'] = $teamStats['teamIdToRoundDead'];
        if (array_key_exists('teamIdToActions', $teamStats))
            $state['teamIdToActions'] = $teamStats['teamIdToActions'];
        return $state;
    }

    // +1team dans une game
    public static function addTeamInGame($gameId) {
        $req = SPDO::getInstance()->prepare('UPDATE game SET nbTeam = nbTeam + 1 WHERE gameId = :gameId');
        $req->execute(array('gameId' => $gameId));
    }


    // log d'une battle
    function getLog() {
        return '';
    }

    /**
     * @return mixed
     */
    public function getGameId()
    {
        return $this->gameId;
    }

    /**
     * @return mixed
     */
    public function getGameToken()
    {
        return $this->gameToken;
    }

    /**
     * @return string
     */
    public function getStatus()
    {
        return $this->status;
    }

    /**
     * @return mixed
     */
    public function getRound()
    {
        return $this->round;
    }

    /**
     * @return mixed
     */
    public function getCreationTime()
    {
        return $this->creationTime;
    }

    /**
     * @return mixed
     */
    public function getLastRoundTime()
    {
        return $this->lastRoundTime;
    }

    /**
     * @return mixed
     */
    public function getRoundTime()
    {
        return $this->roundTime;
    }

    /**
     * @return mixed
     */
    public function getNbTeam()
    {
        return $this->nbTeam;
    }


}