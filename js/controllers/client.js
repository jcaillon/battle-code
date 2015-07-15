/**
 * Created by Julien on 29/04/2015.
 */
'use strict';

/**
 * The main controller for the app. The controller:
 * - retrieves and persists the model via the todoStorage service
 * - exposes the model to the template and provides event handlers
 */
clientMVC.controller('ClientCtrl', ['$scope', '$timeout', 'ClientServices', 'AiServices', 'GameServices', function ($scope, $timeout, ClientServices, AiServices, GameServices) {

    $scope.client = ClientServices.getClient();
    $scope.game = GameServices.getGame();

    $scope.chartConfig = myChartConfig;
    $scope.playing = false;

    $scope.serverList = globalConf.serverList;
    $scope.teamIdList = globalConf.teamIdList;
    $scope.tokenList = globalConf.tokenList;
    $scope.aiList = AiServices.listAi;

    // Configure NProgress
    NProgress.configure({ trickleRate: 0.02, trickleSpeed: 1000 });

    // start the client AI
    $scope.play = function() {
        // global progress ... just for the style
        if ($scope.client.pollFrequence < globalConf.freqLimitToDispProgress) {
            NProgress.start();
        }
        $scope.playing = true;
        toastr.success("Starting to listen for new rounds...");
        feedWorldStateToLoop();
    };

    // stop the client AI
    $scope.stop = function() {
        toastr.info("Stopped listenning for new rounds...");
        stopPlayingLoop();
    };

    var stopPlayingLoop = function() {
        // global progress ... just for the style
        if ($scope.client.pollFrequence < globalConf.freqLimitToDispProgress) {
            NProgress.done();
        }
        $scope.playing = false;
        $.each(globalVars.timeoutPromises, function(i, promise) {
            try {
                $timeout.cancel(promise);
            } catch (e) {}
        });
        globalVars.timeoutPromises = [];
    };

    // feed the playingLoop function with the worldState fetched on the server
    var feedWorldStateToLoop = function () {
        globalVars.lastWorldStateDate.push(new Date()); // remember the date of the last 2 requests
        globalVars.lastWorldStateDate.splice(0, 1);
        ClientServices.AjaxQuery($scope, "worldState", {}, function(data_jqXHR, textStatus, jqXHR) {
            if (textStatus != 'success') jqXHR = data_jqXHR;
            if (jqXHR.status == 200 && !$.isEmptyObject(jqXHR.responseJSON)) {
                playingLoop(jqXHR.responseJSON);
            } else {
                toastr.error("Couldn't get the world state!");
                stopPlayingLoop();
            }
        });
    };

    // main LOOP for the client AI
    var playingLoop = function(worldState) {

        // we have the world info, update our local info
        var iNeedToAct = GameServices.updateLocalData($scope, worldState);

        // am i even in the game?
        if (!$scope.game.iAmIn) { toastr.error("Im not in this game"); stopPlayingLoop(); $scope.$apply(); return; }

        // if something went wrong and we are checking the game when round >= 1 we don't have the profile of our team,
        // guess it with the number of AP used in a previous round
        if ($scope.game.team[$scope.client.teamId].profileNb == 0 && globalVars.tryRound < $scope.game.round) { globalVars.tryRound++; $scope.game.round = globalVars.tryRound; feedWorldStateToLoop(); return; }

        switch ($scope.game.statusNb) {
            case globalConf.gameStatus.PLANNED.nb:
                // if the game hasn't started, check to see if we need to change our profile
                AiServices.getAi($scope.client.ai).profile($scope);
                break;
            case globalConf.gameStatus.ENDED.nb:
                // end of the game, stop playing
                endGameFunc();
                return;
            case globalConf.gameStatus.STARTED.nb:
                // if we need to act (= we can still do actions) and we are still alive in the game
                if (iNeedToAct && $scope.game.teamsAlive.length > 1 && $scope.game.team[$scope.client.teamId].lifePoint > 0)
                    AiServices.getAi($scope.client.ai).actions($scope);
                break;
            default:
                toastr.error("I can't play this game");
                return;
        }

        // wait "timeOut" ms then fetch the worldstate again
        if ($scope.playing) globalVars.timeoutPromises.push($timeout(feedWorldStateToLoop, $scope.client.pollFrequence));
    };

    // called when the game has ended
    var endGameFunc = function() {
        stopPlayingLoop();
        $scope.chartConfig.series.splice($scope.game.nbTeam, $scope.game.nbTeam);
        $scope.$apply();
        // try to save the game on the server (.json)
        GameServices.saveGame($scope);
        // display the winner
        $('#idEndGame').modal('show');
        $.each($scope.game.rankArray, function(i, team) {
            if (team.ranking == 1) $('#id' + team.teamId).animo({ animation: ['bounce', 'tada', 'tada'], duration: 1.5 });
        });
    };

    // format the status of the game for UI display
    $scope.getStatus = function() {
        return globalConf.getStatusFromNb($scope.game.statusNb);
    };

    // save the client object + gameId/Token
    $scope.saveConfigs = function() {
        ClientServices.setClient($scope.client);
        GameServices.setGame($scope.game);
        toastr.info("Client configuration saved");
    };


    // ------------------------------------------
    // TRAINING/DEBUG FUNCTIONS
    // ------------------------------------------

    // stop the current + clear the game object
    $scope.deleteGame = function() {
        ClientServices.AjaxQuery($scope, "delete", {}, function(data_jqXHR, textStatus, jqXHR) {
            if (textStatus != 'success') jqXHR = data_jqXHR;
            if (jqXHR.status == 200) {
                toastr.success("The game has been deleted");
                resetGame();
                $scope.$apply();
            } else toastr.error("Couldn't delete the game");
        });

    };

    // stop the current + clear the game object
    var resetGame = function() {
        stopPlayingLoop();
        GameServices.setGame($scope.game);
        $scope.game = GameServices.getGame();
    };

    // get/create the next playable game on the server, join it and start playing
    $scope.playClosestGame = function() {
        // http rquest to get the next playable game
        ClientServices.AjaxQuery($scope, "getClosestBattle", {}, function(data_jqXHR, textStatus, jqXHR) {
            if (textStatus != 'success') jqXHR = data_jqXHR;
            if (jqXHR.status == 200 && !$.isEmptyObject(jqXHR.responseJSON)) {
                resetGame();
                $scope.game.gameId = jqXHR.responseJSON.gameId;
                $scope.game.gameToken = jqXHR.responseJSON.gameToken;
                $scope.$apply();
                if (!jqXHR.responseJSON.IAmIn) {
                    // join
                    ClientServices.AjaxQuery($scope, "join", {}, function(data_jqXHR, textStatus, jqXHR) {
                        if (textStatus != 'success') jqXHR = data_jqXHR;
                        if (jqXHR.status == 200) {
                            // play when it's done
                            $scope.play();
                        }
                    });
                } else {
                    // play right now
                    $scope.play();
                }
            } else toastr.error("Couldn't get the next playable game!");
        });
    };

    // check the game state on the server
    $scope.checkServer = function() {
        $scope.game.statusNb = globalConf.gameStatus.DC.nb;
        // http rquest to the server to get the world state
        ClientServices.AjaxQuery($scope, "worldState", {data: {round: 0}}, function(data_jqXHR, textStatus, jqXHR) {
            if (textStatus != 'success') jqXHR = data_jqXHR;
            if (jqXHR.status == 200 && !$.isEmptyObject(jqXHR.responseJSON)) {
                GameServices.updateLocalData($scope, jqXHR.responseJSON);
                $scope.$apply();
                // is the game ENDED? then try to load the data from the server to be able to rewatch the game events
                if (angular.uppercase(jqXHR.responseJSON.gameStatus) === globalConf.gameStatus.ENDED.sName) {
                    // try to load the game (if the .json exists on the server)
                    GameServices.loadGame($scope);
                }
            } else toastr.error("Couldn't get the world state!");
        });
    };

    // join the game.gameId with the client.teamId
    $scope.joinGame = function() {
        ClientServices.AjaxQuery($scope, "join", {}, function(data_jqXHR, textStatus, jqXHR) {
            if (textStatus != 'success') jqXHR = data_jqXHR;
            if (jqXHR.status == 200) {
                toastr.success("You have joined the battle, good luck!");
                resetGame();
                $scope.checkServer();
            } else toastr.error("Couldn't join the battle!");
        });
    };

    // start the current game (PLANNED to STARTED)
    $scope.startGame = function() {
        ClientServices.AjaxQuery($scope, "start", {}, function(data_jqXHR, textStatus, jqXHR) {
            if (textStatus != 'success') jqXHR = data_jqXHR;
            if (jqXHR.status == 200) toastr.success("Ready?? FIGHT!");
            else toastr.error("Couldn't start the fight!");
        });
    };

    // create a new game on the server
    $scope.createGame = function() {
        ClientServices.AjaxQuery($scope, "create", {}, function(data_jqXHR, textStatus, jqXHR) {
            if (textStatus != 'success') jqXHR = data_jqXHR;
            if (jqXHR.status == 200 && !$.isEmptyObject(jqXHR.responseJSON)) {
                resetGame();
                $scope.game.gameId = jqXHR.responseJSON.gameId;
                $scope.game.gameToken = jqXHR.responseJSON.gameToken;
                toastr.success("Well done, the battle id:" + $scope.game.gameId + " was created!");
                $scope.$apply();
            } else toastr.error("Couldn't create the battle!");
        });
    };

    // create the team
    $scope.createTeam = function() {
        ClientServices.AjaxQuery($scope, "register", {}, function(data_jqXHR, textStatus, jqXHR) {
            if (textStatus != 'success') jqXHR = data_jqXHR;
            if (jqXHR.status == 200 && !$.isEmptyObject(jqXHR.responseJSON)) {
                $scope.client.teamId = jqXHR.responseJSON.teamId;
                $scope.client.teamToken = jqXHR.responseJSON.teamToken;
                toastr.success("Well done, the team has been registered!");
                $scope.$apply();
            } else toastr.error("Couldn't register the team!");
        });
    };

    // play manually
    $scope.manualStepIn = function() {
        feedWorldStateToLoop();
    };




    // ------------------------------------------
    // MULTI PLAYERS ON THIS CLIENT
    // ------------------------------------------

    //var getProfileList = function() {
    //    var list = [];
    //    for (var i = 0; i < 4; i++) {
    //        list.push({
    //            teamId: globalConf.teamIdList[0] + "T" + (i + 1),
    //            teamToken: globalConf.tokenList[0] + "T" + (i + 1),
    //            ai: 2
    //        });
    //    }
    //    return list;
    //};
    //var profileList = getProfileList();
    //profileList[0].ai = 0;
    //var profileList = [
    //    {
    //        teamId: "SIAS_TEAMT4",
    //        teamToken: "SIAS_TEAMT4",
    //        ai: 3
    //    },{
    //        teamId: "SIAS_TEAMT2",
    //        teamToken: "SIAS_TEAMT2",
    //        ai: 2
    //    },{
    //        teamId: "SIAS_TEAMT3",
    //        teamToken: "SIAS_TEAMT3",
    //        ai: 1
    //    },{
    //        teamId: "SIAS_TEAMT1",
    //        teamToken: "SIAS_TEAMT1",
    //        ai: 0
    //    }];
    var profileList = [
        {
            teamId: "SIAS_TEAMT2",
            teamToken: "SIAS_TEAMT2",
            ai: 3
        },{
            teamId: "SIAS_TEAMT1",
            teamToken: "SIAS_TEAMT1",
            ai: 0
        }];


    $scope.playMultiProfile = function () {
        ClientServices.AjaxQuery($scope, "create", {}, function(data_jqXHR, textStatus, jqXHR) {
            if (textStatus != 'success') jqXHR = data_jqXHR;
            if (jqXHR.status == 200 && !$.isEmptyObject(jqXHR.responseJSON)) {
                resetGame();
                $scope.game.gameId = jqXHR.responseJSON.gameId;
                $scope.game.gameToken = jqXHR.responseJSON.gameToken;
                globalVars.currentTeamNb = 0;
                joinMulti();
            } else toastr.error("Couldn't create the battle!");
        });
    };

    var joinMulti = function() {
        $scope.client.teamId = profileList[globalVars.currentTeamNb].teamId;
        $scope.client.teamToken = profileList[globalVars.currentTeamNb].teamToken;
        ClientServices.AjaxQuery($scope, "join", {}, joinMultiLoop);
    };

    var joinMultiLoop = function() {
        globalVars.currentTeamNb++;
        if (globalVars.currentTeamNb >= profileList.length) {
            feedWorldStateToLoopMulti();
        } else {
            joinMulti();
        }
    };

    // feed the playingLoop function with the worldState fetched on the server
    var feedWorldStateToLoopMulti = function () {
        ClientServices.AjaxQuery($scope, "worldState", {}, function(data_jqXHR, textStatus, jqXHR) {
            if (textStatus != 'success') jqXHR = data_jqXHR;
            if (jqXHR.status == 200 && !$.isEmptyObject(jqXHR.responseJSON)) {
                playingLoopMulti(jqXHR.responseJSON);
            } else toastr.error("Couldn't get the world state!");
        });
    };

    // main LOOP for the client AI
    var playingLoopMulti = function(worldState) {

        // we have the world info, update our local info
        var iNeedToAct = GameServices.updateLocalData($scope, worldState);
        $scope.$apply();

        globalVars.currentTeamNb = 0;

        switch ($scope.game.statusNb) {
            case globalConf.gameStatus.PLANNED.nb:
                changeProfileMulti();
                break;
            case globalConf.gameStatus.ENDED.nb:
                endGameFunc();
                break;
            case globalConf.gameStatus.STARTED.nb:
                if (iNeedToAct && $scope.game.teamsAlive.length > 1)
                    takeActionsMulti();
                else {
                    globalVars.timeoutPromises.push($timeout(feedWorldStateToLoopMulti, $scope.client.pollFrequence));
                    //feedWorldStateToLoopMulti();
                }
                break;
        }
    };

    var changeProfileMulti = function() {
        $scope.client.teamId = profileList[globalVars.currentTeamNb].teamId;
        $scope.client.teamToken = profileList[globalVars.currentTeamNb].teamToken;
        var profileName = AiServices.getAiAnalysisOnly(profileList[globalVars.currentTeamNb].ai).profile($scope);
        if (profileName != $scope.game.team[$scope.client.teamId].profile) {
            ClientServices.AjaxQuery($scope, "changeTeamProfile", {data: {profile: profileName}}, changeProfileMultiLoop);
        } else {
            changeProfileMultiLoop();
        }
    };

    var changeProfileMultiLoop = function() {
        globalVars.currentTeamNb++;
        if (globalVars.currentTeamNb >= profileList.length) {
            globalVars.timeoutPromises.push($timeout(feedWorldStateToLoopMulti, $scope.client.pollFrequence));
            //feedWorldStateToLoopMulti();
        } else {
            changeProfileMulti();
        }
    };

    var takeActionsMulti = function() {
        $scope.client.teamId = profileList[globalVars.currentTeamNb].teamId;
        $scope.client.teamToken = profileList[globalVars.currentTeamNb].teamToken;
        if ($scope.game.team[$scope.client.teamId].lifePoint > 0) {
            var actions = AiServices.getAiAnalysisOnly(profileList[globalVars.currentTeamNb].ai).actions($scope);
            if (actions.notEmpty())
                ClientServices.AjaxQuery($scope, "teamAction", {data: actions.get()}, takeActionsMultiLoop);
        } else {
            takeActionsMultiLoop();
        }
    };

    var takeActionsMultiLoop = function() {
        globalVars.currentTeamNb++;
        if (globalVars.currentTeamNb >= profileList.length) {
            globalVars.timeoutPromises.push($timeout(feedWorldStateToLoopMulti, $scope.client.pollFrequence));
            //feedWorldStateToLoopMulti();
        } else {
            takeActionsMulti();
        }
    };




    $scope.test = function() {
        var scope = {
            "client": {
                teamId: "SIAS_TEAMT3"
            },
            "game": {
                "nbTeam": 4,
                "round": 14,
                "team": {
                    "SIAS_TEAMT4": {
                        "teamId": "SIAS_TEAMT4",
                        "lifePoint": 16,
                        "profileNb": 2,
                        "profilLP": 100,
                        "profilPA": 20,
                        "roundDead": 7,
                        "actionsIn": {
                            "SIAS_TEAMT4": 0,
                            "SIAS_TEAMT1": 68,
                            "SIAS_TEAMT2": 30,
                            "SIAS_TEAMT3": 14
                        },
                        "actionsOut": {
                            "SIAS_TEAMT4": 0,
                            "SIAS_TEAMT1": 16,
                            "SIAS_TEAMT2": 14,
                            "SIAS_TEAMT3": 20
                        },
                        "ranking": 4,
                        "regRound": {
                            "round": 0,
                            "lifePoint": 16,
                            "actionsIn": {
                                "SIAS_TEAMT1": 0,
                                "CA": 0,
                                "SIAS_TEAMT2": 0
                            },
                            "actionsOut": {
                                "SIAS_TEAMT1": 0,
                                "CA": 0,
                                "SIAS_TEAMT2": 0
                            },
                            "nbPenalties": 0,
                            "nbActionsOut": 0,
                            "nbActionsIn": 0,
                            "nbActionsSelf": 0,
                            "nbWastedPA": 0,
                            iGotIsActs: true
                        },
                        "rounds": [
                            {
                                "lifePoint": 50,
                                "nbActionsOut": 2,
                                "nbActionsIn": 0,
                                "actionsIn": {
                                    "SIAS_TEAMT4": 3,
                                    "SIAS_TEAMT1": 0,
                                    "SIAS_TEAMT2": 2,
                                    "SIAS_TEAMT3": 3
                                },
                                "actionsOut": {
                                    "SIAS_TEAMT4": 2,
                                    "SIAS_TEAMT1": 0,
                                    "SIAS_TEAMT2": 1,
                                    "SIAS_TEAMT3": 3
                                }
                            },
                            {
                                "lifePoint": 50,
                                "nbActionsOut": 2,
                                "nbActionsIn": 0,
                                "actionsIn": {
                                    "SIAS_TEAMT4": 3,
                                    "SIAS_TEAMT1": 10,
                                    "SIAS_TEAMT2": 2,
                                    "SIAS_TEAMT3": 5
                                },
                                "actionsOut": {
                                    "SIAS_TEAMT4": 0,
                                    "SIAS_TEAMT1": 0,
                                    "SIAS_TEAMT2": 2,
                                    "SIAS_TEAMT3": 3
                                }
                            }
                        ]
                    },
                    "SIAS_TEAMT1": {
                        "teamId": "SIAS_TEAMT1",
                        "lifePoint": 50,
                        "profileNb": 3,
                        "profilLP": 150,
                        "profilPA": 20,
                        "roundDead": 9,
                        totalActionsIn: 0,
                        "actionsIn": {
                            "SIAS_TEAMT4": 1,
                            "SIAS_TEAMT1": 0,
                            "SIAS_TEAMT2": 5,
                            "SIAS_TEAMT3": 2
                        },
                        "actionsOut": {
                            "SIAS_TEAMT4": 0,
                            "SIAS_TEAMT1": 16,
                            "SIAS_TEAMT2": 14,
                            "SIAS_TEAMT3": 20
                        },
                        "ranking": 3,
                        "regRound": {
                            "round": 0,
                            "lifePoint": 50,
                            "actionsIn": {
                                "SIAS_TEAMT1": 0,
                                "CA": 0,
                                "SIAS_TEAMT2": 0
                            },
                            "actionsOut": {
                                "SIAS_TEAMT1": 0,
                                "CA": 0,
                                "SIAS_TEAMT2": 0
                            },
                            "nbPenalties": 0,
                            "nbActionsOut": 0,
                            "nbActionsIn": 10,
                            "nbActionsSelf": 0,
                            "nbWastedPA": 0,
                            iGotIsActs: true
                        },
                        "rounds": [
                            {
                                "lifePoint": 50,
                                "nbActionsOut": 2,
                                "nbActionsIn": 10,
                                "actionsIn": {
                                    "SIAS_TEAMT4": 3,
                                    "SIAS_TEAMT1": 0,
                                    "SIAS_TEAMT2": 2,
                                    "SIAS_TEAMT3": 3
                                },
                                "actionsOut": {
                                    "SIAS_TEAMT4": 2,
                                    "SIAS_TEAMT1": 0,
                                    "SIAS_TEAMT2": 1,
                                    "SIAS_TEAMT3": 3
                                }
                            },
                            {
                                "lifePoint": 35,
                                "nbActionsOut": 2,
                                "nbActionsIn": 0,
                                "actionsIn": {
                                    "SIAS_TEAMT4": 3,
                                    "SIAS_TEAMT1": 10,
                                    "SIAS_TEAMT2": 2,
                                    "SIAS_TEAMT3": 5
                                },
                                "actionsOut": {
                                    "SIAS_TEAMT4": 0,
                                    "SIAS_TEAMT1": 0,
                                    "SIAS_TEAMT2": 2,
                                    "SIAS_TEAMT3": 3
                                }
                            }
                        ]
                    },
                    "SIAS_TEAMT2": {
                        "teamId": "SIAS_TEAMT2",
                        "lifePoint": 20,
                        "profileNb": 2,
                        "profilLP": 150,
                        "profilPA": 20,
                        "roundDead": 0,
                        "actionsIn": {
                            "SIAS_TEAMT4": 0,
                            "SIAS_TEAMT1": 68,
                            "SIAS_TEAMT2": 30,
                            "SIAS_TEAMT3": 14
                        },
                        "actionsOut": {
                            "SIAS_TEAMT4": 0,
                            "SIAS_TEAMT1": 16,
                            "SIAS_TEAMT2": 14,
                            "SIAS_TEAMT3": 20
                        },
                        "ranking": 1,
                        "regRound": {
                            "round": 0,
                            "lifePoint": 16,
                            "actionsIn": {
                                "SIAS_TEAMT1": 0,
                                "CA": 0,
                                "SIAS_TEAMT2": 0
                            },
                            "actionsOut": {
                                "SIAS_TEAMT1": 0,
                                "CA": 0,
                                "SIAS_TEAMT2": 0
                            },
                            "nbPenalties": 0,
                            "nbActionsOut": 0,
                            "nbActionsIn": 0,
                            "nbActionsSelf": 0,
                            "nbWastedPA": 0,
                            "iGotIsActs": true
                        },
                        "rounds": [
                            {
                                "lifePoint": 50,
                                "nbActionsOut": 2,
                                "nbActionsIn": 0,
                                "actionsIn": {
                                    "SIAS_TEAMT4": 3,
                                    "SIAS_TEAMT1": 0,
                                    "SIAS_TEAMT2": 2,
                                    "SIAS_TEAMT3": 3
                                },
                                "actionsOut": {
                                    "SIAS_TEAMT4": 2,
                                    "SIAS_TEAMT1": 0,
                                    "SIAS_TEAMT2": 1,
                                    "SIAS_TEAMT3": 3
                                }
                            },
                            {
                                "lifePoint": 50,
                                "nbActionsOut": 2,
                                "nbActionsIn": 0,
                                "actionsIn": {
                                    "SIAS_TEAMT4": 3,
                                    "SIAS_TEAMT1": 10,
                                    "SIAS_TEAMT2": 2,
                                    "SIAS_TEAMT3": 5
                                },
                                "actionsOut": {
                                    "SIAS_TEAMT4": 0,
                                    "SIAS_TEAMT1": 0,
                                    "SIAS_TEAMT2": 2,
                                    "SIAS_TEAMT3": 3
                                }
                            }
                        ]
                    },
                    "SIAS_TEAMT3": {
                        "teamId": "SIAS_TEAMT3",
                        "lifePoint": 150,
                        "profileNb": 1,
                        "profilLP": 150,
                        "profilPA": 5,
                        "roundDead": 0,
                        "totalActionsIn": 5,
                        "biggestThreat": [
                            "SIAS_TEAMT2",
                            "SIAS_TEAMT1"
                        ],
                        "favouriteVictim": [
                            "SIAS_TEAMT2"
                        ],
                        "actionsIn": {
                            "SIAS_TEAMT4": 0,
                            "SIAS_TEAMT1": 2,
                            "SIAS_TEAMT2": 0,
                            "SIAS_TEAMT3": 14
                        },
                        "actionsOut": {
                            "SIAS_TEAMT4": 0,
                            "SIAS_TEAMT1": 16,
                            "SIAS_TEAMT2": 14,
                            "SIAS_TEAMT3": 20
                        },
                        "ranking": 2,
                        "regRound": {
                            "round": 20,
                            "lifePoint": 20,
                            "actionsIn": {
                                "SIAS_TEAMT4": 0,
                                "SIAS_TEAMT1": 0,
                                "SIAS_TEAMT2": 0,
                                "SIAS_TEAMT3": 20
                            },
                            "actionsOut": {
                                "SIAS_TEAMT4": 0,
                                "SIAS_TEAMT1": 16,
                                "SIAS_TEAMT2": 14,
                                "SIAS_TEAMT3": 20
                            },
                            "nbPenalties": 0,
                            "nbActionsOut": 0,
                            "nbActionsIn": 10,
                            "nbActionsSelf": 0,
                            "nbWastedPA": 5,
                            iGotIsActs: true
                        },
                        "rounds": [
                            {
                                "lifePoint": 50,
                                "nbActionsOut": 2,
                                "nbActionsIn": 0,
                                "actionsIn": {
                                    "SIAS_TEAMT4": 0,
                                    "SIAS_TEAMT1": 2,
                                    "SIAS_TEAMT2": 2,
                                    "SIAS_TEAMT3": 3
                                },
                                "actionsOut": {
                                    "SIAS_TEAMT4": 0,
                                    "SIAS_TEAMT1": 0,
                                    "SIAS_TEAMT2": 2,
                                    "SIAS_TEAMT3": 3
                                }
                            },
                            {
                                "lifePoint": 80,
                                "nbActionsOut": 2,
                                "nbActionsIn": 0,
                                "actionsIn": {
                                    "SIAS_TEAMT4": 0,
                                    "SIAS_TEAMT1": 20,
                                    "SIAS_TEAMT2": 0,
                                    "SIAS_TEAMT3": 0
                                },
                                "actionsOut": {
                                    "SIAS_TEAMT4": 0,
                                    "SIAS_TEAMT1": 5,
                                    "SIAS_TEAMT2": 2,
                                    "SIAS_TEAMT3": 3
                                }
                            }
                        ]
                    }
                },
                "rankArray": [
                    {
                        "teamId": "SIAS_TEAMT2",
                        "ranking": 1
                    },
                    {
                        "teamId": "SIAS_TEAMT3",
                        "ranking": 2
                    },
                    {
                        "teamId": "SIAS_TEAMT1",
                        "ranking": 3
                    },
                    {
                        "teamId": "SIAS_TEAMT4",
                        "ranking": 4
                    }
                ],
                "teamsAlive": [
                    "SIAS_TEAMT3", "SIAS_TEAMT2", "SIAS_TEAMT1", "SIAS_TEAMT4"
                ],
                "criticalHp": 20
            }};

        // test AI 3
        var actions = AiServices.getAiAnalysisOnly(0).actions(scope);
        console.log(actions.get());
    };

}]);