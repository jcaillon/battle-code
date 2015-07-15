<?php
/**
 * Created by PhpStorm.
 * User: Julien
 * Date: 17/04/2015
 * Time: 22:45
 */

include_once("SPDO.php");
include_once("Params.php");

class team {
    private $teamId;
    private $teamToken;
    private $profileStr;
    private $lifePoint;
    private $roundDead = 0;
    private $PA;

    // enregistrer une nouvelle team, retourne "" si echec, teamToken sinon
    function register($teamId, $teamToken) {

        $this->teamId = $teamId;
        $this->teamToken = $teamToken;

        // To database
        $req = SPDO::getInstance()->prepare('INSERT INTO team(teamId, teamToken) VALUES(:teamId, :teamToken)');
        $req->execute(array(
            'teamId' => $teamId,
            'teamToken' => $teamToken
        ));
        return ($req->rowCount() >= 1) ? true : false;;
    }

    function checkIfLegit($teamId, $teamToken) {

        $isLegit = false;

        // check teamToken
        $req = SPDO::getInstance()->prepare('SELECT teamToken FROM team WHERE teamId = :teamId');
        $req->execute(array('teamId' => $teamId));
        $dataTeam = $req->fetch();

        if($dataTeam['teamToken'] == $teamToken) {
            $isLegit = true;
            $this->teamId = $teamId;
            $this->teamToken = $teamToken;
        }

        return $isLegit;
    }

    function checkIfExists($teamId) {
        $req = SPDO::getInstance()->prepare('SELECT teamId FROM team WHERE teamId = :teamId');
        $req->execute(array('teamId' => $teamId));
        $dataTeam = $req->fetch();
        return count($dataTeam) > 1;
    }

    // ajouter une team dans une game
    function addTeamInGame($gameId, $teamId, $profile = "") {

        if (empty($profile)) {
            $profile = Params::$profilName[1];
        }

        // To database
        $req = SPDO::getInstance()->prepare('INSERT INTO teamingame(teamId, gameId, profileStr, lifePoint, roundDead) VALUES(:teamId, :gameId, :profileStr, :lifePoint, 0)');
        $rqSuccess = $req->execute(array(
            'teamId' => $teamId,
            'gameId' => $gameId,
            'profileStr' => $profile,
            'lifePoint' => Params::$profilLP[$profile]
        ));

        if ($rqSuccess) {
            $this->profileStr = $profile;
            $this->lifePoint = Params::$profilLP[$profile];
            $this->PA = Params::$profilPA[$profile];
            $this->teamId = $teamId;
            $this->roundDead = 0;

            // +1 team dans la game
            Game::addTeamInGame($gameId);
        }

        return $rqSuccess;
    }

    // get les caracteriistiques d'une team dans une game particuliere
    function get($gameId, $teamId) {
        $req = SPDO::getInstance()->prepare('SELECT profileStr, lifePoint, roundDead FROM teamingame WHERE teamId = :teamId AND gameId = :gameId');
        $rqSuccess = $req->execute(array('teamId' => $teamId, 'gameId' => $gameId));
        $dataTeam = $req->fetch();
        $rqSuccess = ($rqSuccess AND count($dataTeam) > 1);
        if ($rqSuccess) {
            $this->teamId = $teamId;
            $this->profileStr = $dataTeam['profileStr'];
            $this->lifePoint = $dataTeam['lifePoint'];
            $this->PA = Params::$profilPA[$this->profileStr];
            $this->roundDead = $dataTeam['roundDead'];
        }
        return $rqSuccess;
    }

    // change les points de vie et le roundDead de l'equipe
    function setLP($gameId, $lifePoint, $roundDead = 0) {
        $req = SPDO::getInstance()->prepare('UPDATE teamingame SET lifePoint = :lifePoint, roundDead = :roundDead WHERE teamId = :teamId AND gameId = :gameId');
        $req->execute(array(
            'lifePoint' => $lifePoint,
            'roundDead' => $roundDead,
            'teamId' => $this->teamId,
            'gameId' => $gameId
        ));
        $rqSuccess = ($req->rowCount() >= 1) ? true : false;
        if ($rqSuccess) {
            $this->lifePoint = $lifePoint;
            $this->roundDead = $roundDead;
        }
        return $rqSuccess;
    }

    // change le profile de hero de la team
    function changeProfile($gameId, $profileStr) {
        $req = SPDO::getInstance()->prepare('UPDATE teamingame SET lifePoint = :lifePoint, profileStr = :profileStr WHERE teamId = :teamId AND gameId = :gameId');
        $req->execute(array(
            'lifePoint' => Params::$profilLP[$profileStr],
            'profileStr' => $profileStr,
            'teamId' => $this->teamId,
            'gameId' => $gameId
        ));
        $rqSuccess = ($req->rowCount() >= 1) ? true : false;
        if ($rqSuccess) {
            $this->profileStr = $profileStr;
            $this->lifePoint = Params::$profilLP[$profileStr];
            $this->PA = Params::$profilPA[$profileStr];
        }
        return $rqSuccess;
    }

    // ajouter une action pour cette team
    function addAction($gameId, $round, $targetTeamId, $nbPA, $statusSr = "") {

        // To database
        $req = SPDO::getInstance()->prepare('INSERT INTO action(gameId, round, sourceTeamId, targetTeamId, nbPA, statusStr) VALUES(:gameId, :round, :sourceTeamId, :targetTeamId, :nbPA, :statusStr)');
        $rqSuccess = $req->execute(array(
            'gameId' => $gameId,
            'round' => $round,
            'sourceTeamId' => $this->teamId,
            'targetTeamId' => $targetTeamId,
            'nbPA' => $nbPA,
            'statusStr' => (empty($statusSr)) ? Params::$actionStatus[0] : $statusSr
        ));

        return $rqSuccess;
    }

    // number of PA the team used this round
    function nbOfPaUsed($gameId, $round) {
        $req = SPDO::getInstance()->prepare('SELECT SUM(nbPA) AS SUM FROM action WHERE gameId = :gameId AND round = :round AND statusStr = :registered AND sourceTeamId = :teamId GROUP BY sourceTeamId');
        $req->execute(array('gameId' => $gameId, 'round' => $round, 'registered' => Params::$actionStatus[0], 'teamId' => $this->teamId));
        return intval($req->fetch()['SUM']);
    }

    // ajouter une penalite a une equipe
    function addPenatly($gameId, $round) {
        $this->addAction($gameId, $round, $this->getTeamId(), 1, Params::$actionStatus[2]);
    }

    // appliquer toutes les actions "registered" pour le tour
    public static function applyRoundActions($gameId, $round) {
        // on met a jour les HP de chaque equipe avec toutes les actions definies
        $req = SPDO::getInstance()->prepare('SELECT actionId, sourceTeamId, targetTeamId, nbPA, statusStr FROM action WHERE gameId = :gameId AND round = :round AND (statusStr = :registered OR statusStr = :penalised)');
        $req->execute(array('gameId' => $gameId, 'round' => $round, 'registered' => Params::$actionStatus[0], 'penalised' => Params::$actionStatus[2]));
        while ($action = $req->fetch()) {
            $pa = intval($action['nbPA']);
            // cas PA defense :
            if ($action['sourceTeamId'] == $action['targetTeamId'] AND $action['statusStr'] == Params::$actionStatus[0]) {
                if ($pa > 0) $pa = intval($pa / 2);
                $pa = -$pa;
            }

            $req2 = SPDO::getInstance()->prepare('UPDATE teamingame SET lifePoint = lifePoint - :lifePoint WHERE teamId = :teamId AND gameId = :gameId');
            $req2->execute(array('teamId' => $action['targetTeamId'], 'gameId' => $gameId, 'lifePoint' => $pa));
        }

        // on regarde si une team est morte
        $req = SPDO::getInstance()->prepare('UPDATE teamingame SET roundDead = :roundDead, lifePoint = 0 WHERE gameId = :gameId AND lifePoint <= 0 AND roundDead = 0');
        $req->execute(array('roundDead' => $round + 1, 'gameId' => $gameId));

        // passe les actions au status APPLIED
        $req = SPDO::getInstance()->prepare('UPDATE action SET statusStr = :applied WHERE gameId = :gameId AND round = :round AND statusStr = :registered');
        $req->execute(array('gameId' => $gameId, 'round' => $round, 'applied' => Params::$actionStatus[1], 'registered' => Params::$actionStatus[0]));
    }

    // get les caracteristiques d'une team dans une game particuliere
    public static function getTeamJSON($gameId, $round, $roundServer) {
        $list = [];
        $req = SPDO::getInstance()->prepare('SELECT teamId, profileStr, lifePoint, roundDead FROM teamingame WHERE gameId = :gameId');
        $req->execute(array('gameId' => $gameId));
        while ($team = $req->fetch()) {
            $list['teamIdToLifePoint'][$team['teamId']] = intval($team['lifePoint']);
            $list['teamIdToRoundDead'][$team['teamId']] = intval($team['roundDead']);
            $list['teamIdToActions'][$team['teamId']] = team::getTeamActionsJSON($gameId, $team['teamId'], $round, $roundServer);
        }
        return $list;
    }

    // return un truc qui devrait se json_encode dans le format qui convient
    public static function getTeamActionsJSON($gameId, $teamId, $round, $roundServer) {
        $arrayReturn = [];
        $req = SPDO::getInstance()->prepare('SELECT actionId, gameId, round, sourceTeamId, targetTeamId, nbPA, statusStr FROM action WHERE sourceTeamId = :teamId AND gameId = :gameId AND (round = :round OR round = :roundServer)');
        $req->execute(array('teamId' => $teamId, 'gameId' => $gameId, 'round' => $round, 'roundServer' => $roundServer));
        while ($action = $req->fetch()) {
            $donnees['id'] = $action['actionId'];
            $donnees['gameId'] = $action['gameId'];
            $donnees['round'] = intval($action['round']);
            $donnees['sourceTeamId'] = $action['sourceTeamId'];
            $donnees['targetTeamId'] = $action['targetTeamId'];
            $donnees['nbPoint'] = intval($action['nbPA']);
            $donnees['status'] = $action['statusStr'];
            $arrayReturn[] = $donnees;
        }
        return $arrayReturn;
    }

    // pour simpleWorldState
    public static function getTeamSimple($gameId) {
        $req = SPDO::getInstance()->prepare('SELECT GROUP_CONCAT(CONCAT(teamId, \':\', lifePoint)) AS txt FROM teamingame WHERE gameId = :gameId GROUP BY gameId');
        $req->execute(array('gameId' => $gameId));
        return $req->fetch()['txt'];
    }

    // nombre d'equipe encore debout
    public static function getNbTeamAlive($gameId) {
        $req = SPDO::getInstance()->prepare('SELECT COUNT(*) AS nbTeam FROM teamingame WHERE gameId = :gameId AND lifePoint > 0');
        $req->execute(array('gameId' => $gameId));
        return $req->fetch()['nbTeam'];
    }

    // combien de team on joue ce tour-ci?
    public static function nbOfTeamPlayedThisRound($gameId, $round) {
        $req = SPDO::getInstance()->prepare('SELECT COUNT(DISTINCT sourceTeamId) AS numb FROM action WHERE gameId = :gameId AND round = :round');
        $req->execute(array('gameId' => $gameId, 'round' => $round));
        return intval($req->fetch()['numb']);
    }

    /**
     * @return mixed
     */
    public function getTeamToken()
    {
        return $this->teamToken;
    }

    /**
     * @return mixed
     */
    public function getTeamId()
    {
        return $this->teamId;
    }

    /**
     * @return mixed
     */
    public function getPA()
    {
        return $this->PA;
    }



}