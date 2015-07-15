/**
 * Created by Julien on 29/04/2015.
 *
 * Contains the methods concerning the game object
 */
'use strict';

clientMVC.service('GameServices', ['$window', 'ClientServices', function ($window, ClientServices) {

    // class Game
    var Game = function () {
        this.gameId = "";
        this.gameToken = "";
        this.nbTeam = 0;
        this.statusNb = -1; // -1: dc, 0: ended, 1: planned, 2:started
        this.iAmIn = false;
        this.round = 0;
        this.team = {}; // team[teamId] = New TeamStats();
        this.rankArray = []; // array of objects with teamId (string) and ranking (int) properties
        this.teamsAlive = []; // array of strings with the name of the teams still alive
        this.criticalHp = globalConf.criticalHp;
    };

    // class Team
    var TeamStats = function () {
        this.teamId = "";
        this.id = 0;
        this.color = 0;
        this.profileNb = -1;
        this.profile = "";
        this.profilLP = 0;
        this.profilPA = 0;
        this.roundDead = 0;

        this.biggestThreat = [];
        this.favouriteVictim = [];

        this.regRound = {}; // = New RoundStats();
        this.curRound = {}; // = New RoundStats();
        this.rounds = []; // an array of RoundStats objects;

        // total sum up stats
        this.lifePoint = 0;
        this.actionsIn = {};
        this.actionsOut = {};
        this.ranking = 1;

        this.totalPenalties = 0;
        this.totalActionsOut = 0;
        this.totalActionsIn = 0;
        this.totalActionsSelf = 0;
        this.totalWastedPA = 0;
    };

    // class Round
    var RoundStats = function () {
        this.round = 0;
        this.lifePoint = 0;
        this.actionsIn = {};
        this.actionsOut = {};

        this.nbPenalties = 0;
        this.nbActionsOut = 0;
        this.nbActionsIn = 0;
        this.nbActionsSelf = 0;
        this.nbWastedPA = 0;
    };

    // registered actions in the current round
    var RegRoundStats = function () {
        this.lifePoint = 0;
        this.actionsIn = {};
        this.actionsOut = {};

        this.nbActionsOut = 0;
        this.nbActionsIn = 0;
        this.nbActionsSelf = 0;
        this.nbWastedPA = 0;

        this.iGotIsActs = false;
    };

    // get game from scratch or from localstorage if it exists
    this.getGame = function() {
        var g = new Game();
        if (localStorage.getItem('game')) {
            var gl = JSON.parse(localStorage.getItem('game'));
            g.gameId = gl.gameId;
            g.gameToken = gl.gameToken;
        }
        return g;
    };

    // save game config to localstorage
    this.setGame = function(game) {
        var gl = {};
        gl.gameId = game.gameId;
        gl.gameToken = game.gameToken;
        localStorage.setItem('game', JSON.stringify(gl));
    };

    // load the game with game.gameId from the server
    this.loadGame = function($scope) {
        var ajaxConf = ClientServices.sharedAjaxConf({});
        ajaxConf.dataType = "json";
        ajaxConf.method= 'GET';
        ajaxConf.url = "gameSaves?" + $.param({id: $scope.game.gameId, server: $window.location.hostname});
        $.ajax(ajaxConf)
            .always(function(data_jqXHR, textStatus, jqXHR) {
                if (textStatus != 'success') jqXHR = data_jqXHR;
                if (jqXHR.status == 200 && !$.isEmptyObject(jqXHR.responseJSON)) {
                    $scope.game = jqXHR.responseJSON.game;
                    $scope.chartConfig = jqXHR.responseJSON.chartConfig;
                    toastr.info("Game data retrieved successfully from the server");
                    $scope.$apply();
                }
            });
    };

    // load the game with game.gameId from the server
    this.saveGame = function($scope) {
        var data = {};
        data.game = $scope.game;
        data.chartConfig = $scope.chartConfig;
        var ajaxConf = ClientServices.sharedAjaxConf({});
        ajaxConf.dataType = "json";
        ajaxConf.method= 'POST';
        ajaxConf.url = "gameSaves?" + $.param({id: $scope.game.gameId, server: $window.location.hostname});
        ajaxConf.data = {data: angular.toJson(data, true)};
        $.ajax(ajaxConf);
    };


    // Updates the model based on the info received in JSON from server, returns a boolean indicating if our team has actions to do ( = true)
    this.updateLocalData = function($scope, worldState) {
        var i, j, targT, nbPoint, locTeam, sarray, teams, tempObj;

        // indicates if a new round has begun or if the server status has changed
        var isNewRound = (worldState.round > $scope.game.round || ($scope.game.statusNb != globalConf.gameStatus.DC.nb && $scope.game.statusNb !=  globalConf.getStatusFromServer(angular.uppercase(worldState.gameStatus))));

        // update the game status
        $scope.game.statusNb = globalConf.getStatusFromServer(angular.uppercase(worldState.gameStatus));

        // do we need to initialize the game? (fetch info on each team, init properties of the game object etc..)
        var needToInit = (worldState.round <= 1 || $scope.game.round == 0);

        // if it's a new round, remember when this round started
        if (isNewRound) globalVars.roundStartingDate = globalVars.lastWorldStateDate[0];

        // check if the world state is usable
        if (!angular.isObject(worldState.teamIdToLifePoint) || !angular.isObject(worldState.teamIdToRoundDead)) return false;


        // ------------------------ START INITILIZATION --------------------------
        if (needToInit) {
            $scope.game.iAmIn = false;
            teams = [];

            // for each team in the worldState
            $.each(worldState.teamIdToLifePoint, function(teamId, hp) {

                locTeam = new TeamStats();
                locTeam.teamId = teamId;
                locTeam.color = 0;
                // try to get the profile type of the team (can only do that if round = 0
                locTeam.profilLP = parseInt(hp);

                // if the game is already started and we can't find the profile of each team, set profile to unknown for now
                locTeam.profileNb = globalConf.getProfileFromPv(locTeam.profilLP);
                if (locTeam.profileNb < 0) locTeam.profileNb = 0;
                locTeam.profile = globalConf.profile[locTeam.profileNb].name;
                locTeam.profilPA = globalConf.profile[locTeam.profileNb].pa;

                locTeam.rounds = [];

                locTeam.roundDead = 0;
                locTeam.biggestThreat = [];
                locTeam.favouriteVictim = [];

                locTeam.lifePoint = locTeam.profilLP;
                locTeam.actionsIn = {};
                locTeam.actionsOut = {};
                locTeam.ranking = 1;

                locTeam.totalPenalties = 0;
                locTeam.totalActionsOut = 0;
                locTeam.totalActionsIn = 0;
                locTeam.totalActionsSelf = 0;
                locTeam.totalWastedPA = 0;

                if (teamId == $scope.client.teamId) {
                    $scope.game.iAmIn = true;
                    teams.splice(0, 0, locTeam);
                } else {
                    teams.push(locTeam);
                }
            });

            // for each team
            $scope.chartConfig.series = [];
            $scope.game.teamsAlive = [];
            $scope.game.team = {};
            for (i = 0; i < teams.length; i++) {
                // convert array of team in an object (teamId s are the properties)
                $scope.game.team[teams[i].teamId] = teams[i];

                // set a color for each team, myteam is always color 0 if i am in
                $scope.game.team[teams[i].teamId].color = i + ($scope.game.iAmIn? 0 : 1 );

                // assign an id.. mainly to identy the corresponding serie in the graph
                $scope.game.team[teams[i].teamId].id = i;

                // initialize actions lists
                for (j = 0; j < teams.length; j++) {
                    $scope.game.team[teams[i].teamId].actionsIn[teams[j].teamId] = 0;
                    $scope.game.team[teams[i].teamId].actionsOut[teams[j].teamId] = 0;
                }

                // initialize graph object
                $scope.chartConfig.series.push(newSerie(teams[i].teamId, $scope.game.team[teams[i].teamId].color, [$scope.game.team[teams[i].teamId].lifePoint], false));

                $scope.game.teamsAlive.push(teams[i].teamId);
            }

            // initialize graph object (predictions)
            for (i = 0; i < teams.length; i++) {
                $scope.chartConfig.series.push(newSerie(teams[i].teamId, $scope.game.team[teams[i].teamId].color, [], true));
            }

            // nb of team in the game
            $scope.game.nbTeam = i;

        }
        // ------------------------ END INITIALIZATION --------------------------


        // ------------------------ START NEW ROUND --------------------------
        if (isNewRound && worldState.round > 1) {

            // for each team, initialize the current round stats
            $.each($scope.game.team, function(teamId, team) {
                team.curRound = new RoundStats();
                $.each($scope.game.team, function(teamId2, team2) {
                    team.curRound.actionsIn[teamId2] = 0;
                    team.curRound.actionsOut[teamId2] = 0;
                });
            });

            $scope.game.teamsAlive = [];

            // for each team, compute the stats of the round and also the total "sum up" stats
            $.each($scope.game.team, function(teamId, locTeam) {

                // current game.round
                locTeam.curRound.round = $scope.game.round;
                locTeam.curRound.lifePoint = locTeam.lifePoint;

                locTeam.roundDead = parseInt(worldState.teamIdToRoundDead[teamId]);

                // update lifePoints
                locTeam.lifePoint = parseInt(worldState.teamIdToLifePoint[teamId]);
                locTeam.lifePoint = (locTeam.lifePoint < 0) ? 0 : locTeam.lifePoint;

                // if the team isn't dead or if the team just died
                if (locTeam.lifePoint > 0 || $scope.chartConfig.series[locTeam.id].data[$scope.chartConfig.series[locTeam.id].data.length -1] > 0) {

                    // update the graph
                    $scope.chartConfig.series[locTeam.id].data.push(locTeam.lifePoint);

                    // PA for this round and Total
                    var availablePA = locTeam.profilPA;

                    // for each action of this team
                    if (angular.isObject(worldState.teamIdToActions) && angular.isObject(worldState.teamIdToActions[teamId])) {
                        $.each(worldState.teamIdToActions[teamId], function(i, arrayActions) {

                            targT = arrayActions.targetTeamId;
                            nbPoint = parseInt(arrayActions.nbPoint);

                            // save applied actions
                            if(arrayActions.status == globalConf.actionStatus.APPLIED && parseInt(arrayActions.round) == $scope.game.round) {

                                // ACTION OUT MY TEAM
                                if (nbPoint > 0) {
                                    locTeam.curRound.actionsOut[targT] += nbPoint;
                                    locTeam.curRound.nbActionsOut += nbPoint;

                                    locTeam.actionsOut[targT] += nbPoint;
                                    locTeam.totalActionsOut += nbPoint;
                                }

                                // ACTION SELF (HEAL)
                                if (teamId == targT && nbPoint > 0) {
                                    locTeam.curRound.nbActionsSelf += Math.floor(nbPoint / 2);

                                    locTeam.totalActionsSelf += Math.floor(nbPoint / 2);
                                } else {
                                    if (teamId == targT) { // nbPoint <= 0
                                        nbPoint = -nbPoint;

                                        // HP FOR PA
                                        availablePA += nbPoint;
                                    }

                                    // ACTION IN ENNEMY TEAM
                                    $scope.game.team[targT].curRound.actionsIn[teamId] += nbPoint;
                                    $scope.game.team[targT].curRound.nbActionsIn += nbPoint;

                                    $scope.game.team[targT].actionsIn[teamId] += nbPoint;
                                    $scope.game.team[targT].totalActionsIn += nbPoint;
                                }

                                // also save penalised actions
                            } else if (arrayActions.status == globalConf.actionStatus.PENALISED) {
                                locTeam.curRound.nbPenalties += nbPoint;

                                locTeam.totalPenalties += nbPoint;
                            }
                        });
                    }

                    // Wasted PA
                    locTeam.curRound.nbWastedPA = availablePA - locTeam.curRound.nbActionsOut;
                    locTeam.totalWastedPA += locTeam.curRound.nbWastedPA;

                    // if we didn't know which profile this team has, we can deduce it now
                    if (locTeam.profileNb == 0) {
                        locTeam.profileNb = globalConf.getProfileFromPa(locTeam.curRound.nbActionsOut);
                        if (locTeam.profileNb < 0) locTeam.profileNb = 0;
                        locTeam.profile = globalConf.profile[locTeam.profileNb].name;
                        locTeam.profilPA = globalConf.profile[locTeam.profileNb].pa;
                        globalVars.tryRound = 0;
                    }

                }

                // if the team isn't dead
                if (locTeam.lifePoint > 0) {
                    $scope.game.teamsAlive.push(teamId);

                    // prediction
                    $scope.chartConfig.series[$scope.game.nbTeam + locTeam.id].data = fitData($scope.chartConfig.series[locTeam.id].data).data;
                } else {
                    // hide prediction
                    $scope.chartConfig.series[$scope.game.nbTeam + locTeam.id].data = [];
                    $scope.chartConfig.series[$scope.game.nbTeam + locTeam.id].visible = false;
                }


            }); // end for each team

            // for each team, push the current client round into the rounds history
            $.each($scope.game.team, function(teamId, team) {
                team.rounds.push(team.curRound);
                team.curRound = {};
            });


            // ------------------------ START THREATS/VICTIMS --------------------------
            $.each($scope.game.team, function(teamId, team) {
                var maxHpT = -1;
                var maxHpV = -1;
                team.biggestThreat = [];
                team.favouriteVictim = [];
                $.each(team.actionsIn, function(teamId2, actions) {
                    if (actions > maxHpT && teamId2 != teamId) maxHpT = actions;
                });
                $.each(team.actionsIn, function(teamId2, actions) {
                    if (actions == maxHpT && maxHpT > 0 && teamId2 != teamId) team.biggestThreat.push(teamId2);
                });
                $.each(team.actionsOut, function(teamId2, actions) {
                    if (actions > maxHpV && teamId2 != teamId) maxHpV = actions;
                });
                $.each(team.actionsOut, function(teamId2, actions) {
                    if (actions == maxHpV && maxHpV > 0 && teamId2 != teamId) team.favouriteVictim.push(teamId2);
                });
            });
            // ------------------------ END THREATS/VICTIMS --------------------------

        }
        // ------------------------ END NEW ROUND --------------------------


        // get the current (server side) round
        $scope.game.round = parseInt(worldState.round);


        // ------------------------ START RANKING --------------------------
        if (isNewRound || needToInit) {
            var rankInDouble = [];
            for (i = 1; i <= $scope.game.nbTeam; i++) {
                rankInDouble[i] = 0;
            }

            var rankArray = [];
            var ranking = $scope.game.nbTeam;

            // sort an array by ascending order containing objects with teamId and roundDead as properties
            sarray = [];
            $.each(worldState.teamIdToRoundDead, function(teamId, round) {
                tempObj = {};
                tempObj.teamId = teamId;
                tempObj.round = round;
                sarray.push(tempObj);
            });
            sarray.sort(function(a, b) {
                return a.round - b.round;
            });

            // use this array to set the lowest ranks to those players
            var lastRndNumb = -1, lastRank = 0;
            for (i = 0; i < sarray.length; i++) {
                if (sarray[i].round > 0 ) {
                    if (sarray[i].round == lastRndNumb) {
                        rankArray.push({teamId: sarray[i].teamId, ranking: lastRank});
                        rankInDouble[lastRank]++;
                    } else {
                        rankArray.push({teamId: sarray[i].teamId, ranking: ranking});
                        lastRank = ranking;
                    }
                    ranking--;
                }
                lastRndNumb = sarray[i].round;
            }

            // now we set the rest of the ranks with respect to the amount of hp each team has
            sarray = [];
            $.each($scope.game.team, function(teamId, team) {
                tempObj = {};
                tempObj.teamId = teamId;
                tempObj.hp = team.lifePoint;
                if (team.roundDead == 0)
                    sarray.push(tempObj);
            });
            sarray.sort(function(a, b) {
                return a.hp - b.hp;
            });

            // use the hp array to rank players
            for (i = 0; i < sarray.length; i++) {
                if (sarray[i].hp > 0 ) {
                    if (sarray[i].hp == lastRndNumb) {
                        rankArray.push({teamId: sarray[i].teamId, ranking: lastRank});
                        rankInDouble[lastRank]++;
                    } else {
                        rankArray.push({teamId: sarray[i].teamId, ranking: ranking});
                        lastRank = ranking;
                    }
                    ranking--;
                }
                lastRndNumb = sarray[i].hp;
            }

            // correct the gaps (i.e. if there are 4, 4, 4, 1 correct to 2, 2, 2, 1)
            for (i = 1; i <= rankArray.length; i++) {
                if (rankInDouble[i] > 0) { // the rank i is represented (rankInDouble[i] + 1) times
                    for (j = 0; j < rankArray.length; j++) {
                        if (rankArray[j].ranking == i) {
                            rankArray[j].ranking = i - rankInDouble[i];
                        }
                    }
                }
            }

            // register ranking for each team
            for (j = 0; j < rankArray.length; j++) {
                $scope.game.team[rankArray[j].teamId].ranking = rankArray[j].ranking;
            }

            $scope.game.rankArray = rankArray.sort(function(a, b) {
                return a.ranking - b.ranking;
            });
        }
        //-------------------------- END RANKING -------------------------------

        var bIHavePALeft = false;

        // ------------------------ GET REGISTERED ACTIONS --------------------------
        if ($scope.game.iAmIn) {
            // for each team, initialize the current round stats
            $.each($scope.game.team, function(teamId, team) {
                team.regRound = new RegRoundStats();
                $.each($scope.game.team, function(teamId2, team2) {
                    team.regRound.actionsIn[teamId2] = 0;
                    team.regRound.actionsOut[teamId2] = 0;
                });
                team.regRound.lifePoint = team.lifePoint;
            });

            // for each team, compute the stats of the round and also the total "sum up" stats
            $.each($scope.game.team, function(teamId, locTeam) {
                locTeam.regRound.nbWastedPA = locTeam.profilPA;

                // for each action of this team
                if (angular.isObject(worldState.teamIdToActions) && angular.isObject(worldState.teamIdToActions[teamId])) {
                    $.each(worldState.teamIdToActions[teamId], function(i, arrayActions) {

                        targT = arrayActions.targetTeamId;
                        nbPoint = parseInt(arrayActions.nbPoint);

                        // save an applied action
                        if(arrayActions.status == globalConf.actionStatus.REGISTERED && parseInt(arrayActions.round) == $scope.game.round) {
                            // ACTION OUT MY TEAM
                            if (nbPoint > 0) {
                                locTeam.regRound.actionsOut[targT] += nbPoint;
                                locTeam.regRound.nbActionsOut += nbPoint;
                                locTeam.regRound.nbWastedPA -= nbPoint;
                            }
                            // ACTION SELF (HEAL)
                            if (teamId == targT && nbPoint > 0) {
                                locTeam.regRound.nbActionsSelf += Math.floor(nbPoint / 2);
                                locTeam.regRound.lifePoint += Math.floor(nbPoint / 2);
                            } else {
                                if (teamId == targT) { // nbPoint <= 0 (SACRIFICE HP FOR PA)
                                    nbPoint = -nbPoint;
                                    locTeam.regRound.nbWastedPA += nbPoint;
                                }
                                // ACTION IN ENNEMY TEAM
                                $scope.game.team[targT].regRound.actionsIn[teamId] += nbPoint;
                                $scope.game.team[targT].regRound.nbActionsIn += nbPoint;
                                $scope.game.team[targT].regRound.lifePoint -= nbPoint;
                            }
                        }
                    });
                }
                locTeam.regRound.iGotIsActs = (locTeam.regRound.nbWastedPA == 0);
            });
            bIHavePALeft = ($scope.game.team[$scope.client.teamId].regRound.nbWastedPA != 0);
        }
        // ------------------------ END GET REGISTERED ACTIONS --------------------------

        // refresh the info displayed if needed
        if ((isNewRound && worldState.round > 1) || needToInit) $scope.$apply();

        // returns true if my team needs to play (= if my team didn't already play this round), false otherwise
        return bIHavePALeft;
    };



    // returned a formatted object that is a serie for highcharts
    var newSerie = function(teamName, teamColor, dataArray, isPrediction) {
        var seriesObject = {
            name: teamName,
            color: globalConf.colorsArray[teamColor],
            "data": dataArray,
            dataLabels: {
                color: globalConf.colorsArray[teamColor],
                enabled: true,
                format: "{y} HP",
                style: {"color": "contrast", "fontSize": "11px", "fontWeight": "bold", "textShadow": "0 0 3x contrast, 0 0 2px contrast" }
            },
            dashStyle: "Solid",
            showInLegend: true,
            pointStart: 1,
            pointInterval: 1
        };
        if (isPrediction) {
            seriesObject.dataLabels.enabled = false;
            seriesObject.dashStyle = "LongDash";
            seriesObject.showInLegend = false;
        }
        return seriesObject;
    };


    // return an objetc containing "data" which contains 2 points to draw the hypothetical trend of the team
    var fitData = function(data) {
        var N = data.length;
        var slope;
        var intercept;
        var SX = 0;
        var SY = 0;
        var SXX = 0;
        var SXY = 0;
        var SYY = 0;
        var xi;
        var yi;
        var xCrossZero;
        var addRound = globalConf.predictionRound;

        for (var i = 0; i < N; i++) {
            SX = SX + (i + 1);
            SY = SY + data[i];
            SXY = SXY + (i + 1) * data[i];
            SXX = SXX + (i + 1) * (i + 1);
            SYY = SYY + data[i] * data[i];
        }

        slope = (N * SXY - SX * SY) / (N * SXX - SX * SX);
        intercept = (SY - slope * SX) / N;

        var pointData = [];

        // last point of the data
        pointData.push({
            x: data.length,
            y: data[data.length - 1],
            dataLabels: {
                enabled: false
            },
            marker: {
                enabled: false
            }
        });

        // extrapolate to 0HP or 10 rounds
        if (slope != 0) {
            xCrossZero = parseInt((0 - intercept) / slope + 0.5);
            if (data.length < xCrossZero && xCrossZero <= data.length + addRound) {
                xi = xCrossZero;
                yi = 0;
            } else {
                xi = data.length + addRound;
                yi = parseInt((data.length + addRound) * slope + intercept + 0.5);
            }
        } else {
            xi = data.length + addRound;
            yi = data[data.length - 1];
        }

        pointData.push({
            x: xi,
            y: yi,
            name: (slope >= 0) ? "&infin;" : "Dead in " + (xCrossZero - data.length) + " rounds",
            dataLabels: {
                enabled: true,
                align: 'left',
                format: "{point.name}",
                style: {"fontSize": "10px", "fontWeight": "normal" },
                useHTML: true
            },
            marker: {
                enabled: true,
                symbol: "diamond",
                radius: 5
            }
        });

        return {
            data: pointData,
            slope: slope,
            intercept: intercept,
            y: function (x) {
                return (this.slope * x) + this.intercept;
            },
            x: function (y) {
                return (y - this.intercept) / this.slope;
            }
        }
    };

}]);