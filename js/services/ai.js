/**
 * Created by Julien on 29/04/2015.
 *
 * Contains the A.I. behaviour
 */
'use strict';

clientMVC.service('AiServices', ['ClientServices', function (ClientServices) {

    // return the list of the available AI (for UI selection)
    this.listAi = [
        {id: 0, name: "Dream Crusher!"}, // 0
        {id: 1, name: "Let's play dice?"}, // 1
        {id: 2, name: "Target the lowest"}, // 2
        {id: 3, name: "Old boy"} // 3
    ];

    // Actions Object, use its methods to create the action object to send to the server
    var Actions = function () {
        this.obj = {};
        this.add = function (teamId, PA) {
            if (PA == 0) return;
            var propName = "t_" + teamId;
            if (this.obj.hasOwnProperty(propName))
                this.obj[propName] += PA;
            else
                this.obj[propName] = PA;
        };
        this.get = function () {
            return this.obj;
        };
        this.notEmpty = function () {
            return !$.isEmptyObject(this.obj);
        };
    };

    // return the correct profile/actions functions depending on the AI selected
    this.getAi = function (ai) {
        return {
            profile: function (scope) {

                // call the correct AI function
                var profileName = AI[ai].fProfile(scope);

                // if the wanted profile isn't what is selected, then change it!
                if (profileName != scope.game.team[scope.client.teamId].profile) {
                    ClientServices.AjaxQuery(scope, "changeTeamProfile", {data: {profile: profileName}}, function (data_jqXHR, textStatus, jqXHR) {
                        if (textStatus != 'success') jqXHR = data_jqXHR;
                        if (jqXHR.status == 200) {
                            toastr.info("I changed my profile to : " + profileName);
                        } else toastr.error("Couldn't change my profile!");
                    });
                }
            },
            actions: function (scope) {

                // check the info we have at our disposition
                var nbTeamInfo = 0;
                $.each(scope.game.team, function(teamId, locTeam) {
                    if (locTeam.regRound.nbWastedPA < locTeam.profilPA && teamId != scope.client.teamId) nbTeamInfo++;
                });
                var bInfoOnAll = (nbTeamInfo == (scope.game.teamsAlive.length - 1)); // true if we have info on all the teams

                // time difference between now and the start time of the current round
                var diff = new Date() - globalVars.roundStartingDate;

                // at max, we can wait this time (in ms) before we HAVE to play
                var waitInterval = (scope.game.round == 1 ? globalConf.officialFirstRoundTime : globalConf.officialRoundTime)
                    - scope.client.minTimeBeforeRoundEnds
                    - scope.client.pollFrequence
                    - scope.client.minTimeBetweenRequests
                    - 50;

                // if we waited as long as we possibly can or if we have enough information on everyone else
                if (diff >= waitInterval || bInfoOnAll) {

                    console.log("I play : diff = " + diff + " & waitInterval = " + waitInterval + " bInfoOnAll = " + bInfoOnAll + " (nbTeamInfo = " + nbTeamInfo + ")");

                    // call the correct AI function
                    var actions = AI[ai].fActions(scope);

                    // send actions
                    if (actions.notEmpty()) {
                        ClientServices.AjaxQuery(scope, "teamAction", {data: actions.get()}, function (data_jqXHR, textStatus, jqXHR) {
                            if (textStatus != 'success') jqXHR = data_jqXHR;
                            if (jqXHR.status != 200) toastr.error("Couldn't send the actions for round " + scope.game.round + "!");
                        });
                    }

                }

            }
        };
    };


    // return the correct profile/actions functions depending on the AI selected
    this.getAiAnalysisOnly = function (ai) {
        return {
            profile: function (scope) {
                return AI[ai].fProfile(scope);
            },
            actions: function (scope) {
                return AI[ai].fActions(scope);
            }
        };
    };


    // list of the ennemy teams sorted by rank (starting from rank 4 and not including dead teams)
    var getEnnemiesAlive = function (scope) {
        var teams = [];
        $.each(scope.game.rankArray, function(i, team) {
            if (team.teamId != scope.client.teamId && scope.game.team[team.teamId].lifePoint)
                teams.splice(0, 0, team.teamId);
        });
        return teams;
    };


    var play1v1 = function (scope, ennemyTeamId, actions) {

        var game = scope.game;
        var myTeamId = scope.client.teamId;
        var myTeam = game.team[myTeamId];

        // my team's stats
        var myHP = myTeam.lifePoint;
        var myPA = myTeam.profilPA;
        var myXtraPA = (myHP > 20) ? 20 : myHP - 1;

        // compute ennemy's stats
        var hisTeam = game.team[ennemyTeamId];
        var hisHP = hisTeam.lifePoint;
        var hisPA = hisTeam.profilPA;
        var hisXtraPA = (hisHP > 20) ? 20 : hisHP - 1;

        var xtraPAtoSurviveWith1HP;

        // if i got his actions for this round
        if (hisTeam.regRound.iGotIsActs) {

            // if he kills me this turn
            if (myTeam.regRound.lifePoint <= 0) {

                var neededHeal = (1 - myTeam.regRound.lifePoint) * 2;
                var leftPA = Math.max(myPA - neededHeal, 0);

                // if i can heal myself to 1 hp and kill him
                if (myPA >= neededHeal && leftPA >= hisTeam.regRound.lifePoint) {
                    actions.add(myTeamId, neededHeal);
                    actions.add(ennemyTeamId, leftPA);
                } else {

                    // if i can't finish him and get a draw but if i can heal myself to 1HP, do it
                    if (myPA + myXtraPA < hisTeam.regRound.lifePoint && myPA >= neededHeal) {
                        actions.add(myTeamId, neededHeal);
                        actions.add(ennemyTeamId, leftPA);
                    } else {
                        // end the fight with a draw (or lose)
                        actions.add(myTeamId, -myXtraPA);
                        actions.add(ennemyTeamId, myPA + myXtraPA);
                    }
                }
                return;
            }

            // can i kill him and survive?
            xtraPAtoSurviveWith1HP = (myTeam.regRound.lifePoint > 20) ? 20 : myTeam.regRound.lifePoint - 1;
            if (myPA + xtraPAtoSurviveWith1HP >= hisTeam.regRound.lifePoint) {
                actions.add(myTeamId, -xtraPAtoSurviveWith1HP);
                actions.add(ennemyTeamId, myPA + xtraPAtoSurviveWith1HP);
                return;
            }

        } else {

            // if i can give the killing blow without dying myself
            xtraPAtoSurviveWith1HP = Math.min(Math.max(myHP - hisPA - hisXtraPA - 1, 0), 20); // max PA to survive with 1 HP in the worst scenario
            if (myPA + xtraPAtoSurviveWith1HP >= hisHP) {
                actions.add(myTeamId, -xtraPAtoSurviveWith1HP);
                actions.add(ennemyTeamId, myPA + xtraPAtoSurviveWith1HP);
                return;
            }
        }

        var healPA, hisNeededXtraPA;

        // if i should play extra PA to win the game
        if (hisPA > myPA && myHP > hisPA) {
            hisNeededXtraPA = Math.max(myHP - myXtraPA - hisPA, 0);

            // if he can kill me just with his PA
            if (hisNeededXtraPA == 0) {
                // correct the xtra PA to have 1 hp left
                myXtraPA = Math.min(Math.max(myHP - hisPA - 1, 0), 20);
            }
            // otherwise, we can't do much anyway so just attack with xtra PA
            actions.add(myTeamId, -myXtraPA);
            actions.add(ennemyTeamId, myPA + myXtraPA);


        // if i should not play xtra PA to win : if (myPA >= hisPA || myHP <= hisPA)
        } else {
            // compute the xtra PA he needs to add to kill me (considering i dont sacrifice HP)
            hisNeededXtraPA = Math.max(myHP - hisPA, 0);

            // if he can kill me just with his PA
            if (hisNeededXtraPA == 0) {
                // if i can't finish him this turn
                if (myPA + myXtraPA < hisHP) {
                    healPA = Math.min((Math.abs(myHP - hisPA) + 1) * 2, myPA);
                    // if i my PA can't cover his PA OR if i have to use all my PA to heal forget it
                    if (myPA <= hisPA || healPA >= myPA) {
                        // heal 1 hp and hope for a bad AI on his part
                        healPA = 2;
                    }
                    actions.add(myTeamId, healPA);
                    actions.add(ennemyTeamId, myPA - healPA);
                } else {
                    // end the fight with a draw
                    if (myXtraPA > 0) actions.add(myTeamId, -myXtraPA);
                    actions.add(ennemyTeamId, myPA + myXtraPA);
                }

                // if he can kill me using xtra PA
            } else if (hisNeededXtraPA <= hisXtraPA) {
                healPA = (Math.abs(myHP - hisPA - hisXtraPA) + 1) * 2;
                // if my PA can cover his xtra PA and if i can close the gap between me and him
                if (myPA > hisPA && myPA > healPA) {
                    actions.add(myTeamId, healPA);
                    actions.add(ennemyTeamId, myPA - healPA);
                } else {
                    // if i can draw playing normally
                    if (myPA + hisNeededXtraPA >= hisHP) {
                        actions.add(ennemyTeamId, myPA);
                    } else {
                        // if i can draw using xtra PA
                        if (myPA + myXtraPA >= hisHP) {
                            actions.add(myTeamId, -myXtraPA);
                            actions.add(ennemyTeamId, myPA + myXtraPA);
                        } else {
                            // otherwise try a heal, hope he doesn't use xtra PA
                            actions.add(myTeamId, 2);
                            actions.add(ennemyTeamId, myPA - 2);
                        }
                    }
                }

                // otherwise, the game should not be over this turn, play normally
            } else {
                actions.add(ennemyTeamId, myPA);
            }
        }
    };

    // list of the ennemy teams sorted by rank (starting from rank 4 and not including dead teams)
    var bestEnnemy = function (normalEnnemy) {
        return normalEnnemy;
    };

    var AI = [


        // ------------------- AI 0 : Dream Crusher -------------------------------
        {
            fProfile: function (scope) {
                return "Tank";
            },

            fActions: function (scope) {
                var actions = new Actions();

                var game = scope.game;
                var myTeamId = scope.client.teamId;
                var myTeam = game.team[myTeamId];

                // my team's stats
                var myHP = myTeam.lifePoint;
                var myPA = myTeam.profilPA;
                var myXtraPA = (myHP > 20) ? 20 : myHP - 1;

                var ennemyTeamId = "";
                var lastRndInd = myTeam.rounds.length - 1;

                // Array of objects with the ennemy teams alive, sort teams by lifepoint (ascending) and then profilPA (descending)
                var ennemyArray = [];
                var iPALeft = 0;
                $.each(scope.game.team, function(teamId, team) {
                    if (teamId != myTeamId && team.regRound.lifePoint > 0) {
                        ennemyArray.push({teamId: teamId, lifePoint: team.regRound.lifePoint, profilPA: team.profilPA});
                        iPALeft += team.regRound.nbWastedPA;
                    }
                });
                ennemyArray.sort(function(a, b) {
                    if(a.lifePoint === b.lifePoint) {
                        if(a.profilPA === b.profilPA) {
                            return (b.teamId == "SIAS_TEAMT1") ? 1 : -1;
                        }
                        return b.profilPA - a.profilPA;
                    }
                    return a.lifePoint - b.lifePoint;
                });


                // if there are more than 2 ennemy teams alive
                if (ennemyArray.length >= 2) {

                    // ennemies with strictly less hp than me at the end of the prev round and in the current round (regRound)
                    var listOfTeamsWithLessHP = $.grep(game.teamsAlive, function (teamId) { return game.team[teamId].lifePoint < myTeam.lifePoint; });

                    // my biggest threats
                    var myThreats = [];
                    var maxHpT = -1;
                    $.each(myTeam.actionsIn, function(teamId, actionsIn) {
                        if ((actionsIn + myTeam.regRound.actionsIn[teamId]) > maxHpT && teamId != myTeamId && game.team[teamId].regRound.lifePoint > 0) maxHpT = actionsIn + myTeam.regRound.actionsIn[teamId];
                    });
                    if (maxHpT > 0) {
                        $.each(myTeam.actionsIn, function (teamId, actionsIn) {
                            if ((actionsIn + myTeam.regRound.actionsIn[teamId]) == maxHpT && teamId != myTeamId) myThreats.push(teamId);
                        });
                    }
                    console.log(myThreats);
                    console.log(ennemyArray[ennemyArray.length - 1].teamId);
                    console.log(ennemyArray);

                    // if i am the lowest HP of the end of the last round
                    if (listOfTeamsWithLessHP == 0) {

                        // if im about to die, go kamikaze
                        if (myTeam.regRound.lifePoint <= 0 || (myTeam.regRound.lifePoint - iPALeft) <= 0) {
                            actions.add(myTeamId, -myXtraPA);
                            actions.add(ennemyArray[0].teamId, myPA + myXtraPA); //TODO: bestEnnemy
                        } else {
                            // hit the next lowest player and pray not to be the lowest at the end of the round... we are fucked anyway
                            actions.add(ennemyArray[0].teamId, myPA);
                        }

                    } else {
                        // otherwise, im not the lowest

                        // if i don't have a threat
                        if (myThreats.length == 0) {

                            // hit my highest hp ennemy
                            actions.add(ennemyArray[ennemyArray.length - 1].teamId, myPA); //TODO: bestEnnemy

                        } else {

                            // i have a threat, the question is, do i want to kill him sacrificing hp or not
                            ennemyTeamId = myThreats[0];
                            var myDmg = myTeam.regRound.nbActionsIn - myTeam.regRound.actionsIn[ennemyTeamId] + game.team[ennemyTeamId].profilPA;
                            var hisDmg = game.team[ennemyTeamId].regRound.nbActionsIn + myPA;
                            if (lastRndInd >= 0) {
                                myDmg = (myTeam.rounds[lastRndInd].nbActionsIn + myDmg) / 2;
                                hisDmg = (game.team[ennemyTeamId].rounds[lastRndInd].nbActionsIn + hisDmg) / 2;
                            }
                            var turnsISurvive = Math.floor(myHP / myDmg);
                            var turnsHeSurvive = Math.floor(game.team[ennemyTeamId].lifePoint / hisDmg);

                            // if he survives more turns than me, enter 1v1 mode, otherwise play just our PA
                            if (turnsHeSurvive >= turnsISurvive || turnsISurvive == 0) play1v1(scope, ennemyTeamId, actions);
                            else actions.add(ennemyTeamId, myPA);
                            //console.log("myDmg = " + myDmg + " turnsISurvive = " + turnsISurvive +" hisDmg = " + hisDmg +" turnsHeSurvive = " + turnsHeSurvive);
                        }
                    }

                } else {
                    play1v1(scope, ennemyArray[0].teamId, actions);
                }


                // Check if i used all my PA for this round
                var totalPA = 0;
                $.each(actions.get(), function(teamId, pa) {
                    totalPA = totalPA + pa
                });
                if ($.isEmptyObject(actions.get())) totalPA = 0;
                // if not, use the rest on the lowest hp team
                if (totalPA < myPA) actions.add(ennemyArray[0].teamId, myPA - totalPA);

                return actions;
            }
        },


// ------------------- AI 1 : Dice -------------------------------
        {
            fProfile: function (scope) {
                //return "Assassin";
                return globalConf.profile[Math.floor(Math.random() * 3) + 1].name;
            },

            fActions: function (scope) {
                var actions = new Actions();

                var game = scope.game;
                var myTeamId = scope.client.teamId;
                var myPA = game.team[myTeamId].profilPA;

                // compute the actions needed for this game
                // attack a random ennemy !!
                var j = game.teamsAlive.length - 1;
                $.each(game.teamsAlive, function (i, teamId) {
                    if (teamId === myTeamId) return;
                    var PA = Math.floor((Math.random() * myPA));
                    if (j == 1) actions.add(teamId, myPA);
                    else actions.add(teamId, PA);
                    myPA -= PA;
                    j--;
                });

                return actions;
            }
        }
        ,


// ------------------- AI 2 : Target lowest -------------------------------
        {
            fProfile: function (scope) {
                var profileName;
                //if (scope.game.nbTeam > 2)
                //    profileName = "Tank";
                //else
                    profileName = "Normal";
                return profileName;
            },

            fActions: function (scope) {
                var actions = new Actions();

                var game = scope.game;
                var myTeamId = scope.client.teamId;
                var myPA = game.team[myTeamId].profilPA;
                var ennemiesAlive = getEnnemiesAlive(scope);

                actions.add(ennemiesAlive[0], myPA);

                return actions;
            }
        },


// ------------------- AI 3 : Old  boy -------------------------------
        {
            fProfile: function (scope) {
                return "Assassin";
            },

            fActions: function (scope) {
                var actions = new Actions();

                var game = scope.game;
                var myTeamId = scope.client.teamId;
                var myTeam = game.team[myTeamId];

                // my team's stats
                var myHP = myTeam.lifePoint;
                var myPA = myTeam.profilPA;
                var myHealPA = Math.floor(myPA / 2) * 2;
                var myXtraPA = (myHP > 20) ? 20 : myHP - 1;

                var ennemiesAlive = getEnnemiesAlive(scope);
                var ennemyTeamId = "";
                var lastRndInd = myTeam.rounds.length - 1;

                var myIncPA = 0;
                var bPlaySafe = false; // if i should play safe (not using xtra PA)

                // if there are more than 2 ennemy teams alive
                if (ennemiesAlive.length >= 2) {

                    // list the teams that have more or equal HP than me
                    var listOfTeamsWithMoreHP = [];
                    $.each(ennemiesAlive, function(i, teamId) {
                        if (game.team[teamId].lifePoint >= myTeam.lifePoint) listOfTeamsWithMoreHP.push(teamId);
                    });

                    // if ive never been attacked
                    if (myTeam.totalActionsIn <= 0) {
                        // if im the lowest HP (or one of the lowest HP) of the game
                        if (listOfTeamsWithMoreHP.length == ennemiesAlive.length) {
                            // attack someone and hope not to be the lowest hp next turn
                            actions.add(ennemiesAlive[0], myPA);
                        } else {
                            // otherwise, heal and don't draw attention
                            actions.add(myTeamId, myHealPA);
                            if (myHealPA != myPA) actions.add(ennemiesAlive[0], myPA - myHealPA);
                        }

                        // if i was attacked at some point
                    } else {

                        // list of ennemies that attacked me last round
                        var lastRndEnnemies = [];
                        $.each(myTeam.rounds[lastRndInd].actionsIn, function(teamId, pa) {
                            if (pa > 0 && teamId != myTeamId && game.team[teamId].lifePoint > 0)
                                lastRndEnnemies.push(teamId);
                        });

                        // if i was not attacked last round or if my only ennemy is dead this turn
                        if (lastRndEnnemies.length == 0 || (lastRndEnnemies.length == 1 && game.team[lastRndEnnemies[0]].lifePoint <= 0)) {

                            // if there are only 2 ennemy teams alive
                            if (ennemiesAlive.length == 2) {
                                // attack both team
                                var lowestTeamPA = Math.floor(myPA * game.team[ennemiesAlive[0]] / (game.team[ennemiesAlive[0]].lifePoint + game.team[ennemiesAlive[1]].lifePoint));
                                actions.add(ennemiesAlive[0], lowestTeamPA);
                                actions.add(ennemiesAlive[1], myPA - lowestTeamPA);
                            } else {
                                // otherwise heal
                                actions.add(myTeamId, myHealPA);
                                if (myHealPA != myPA) actions.add(ennemiesAlive[0], myPA - myHealPA);
                            }

                            // if i was attacked by 1 ennemy
                        } else if (lastRndEnnemies.length == 1) {

                            // did he aleady attacked me last round - 1?
                            var bRepeatedAtk = false;
                            if (lastRndInd > 0) if (myTeam.rounds[lastRndInd - 1].actionsIn[lastRndEnnemies[0]] > 0) bRepeatedAtk = true;

                            // nb of HP he lost last round (PA not coming from me)
                            var hisActsIn = game.team[lastRndEnnemies[0]].rounds[lastRndInd].nbActionsIn -
                                myTeam.rounds[lastRndInd].actionsOut[lastRndEnnemies[0]];

                            if (bRepeatedAtk) {
                                // attack with full force
                                ennemyTeamId = lastRndEnnemies[0]; // (this will activate the 1v1 mode against that team)

                            } else {
                                // if he is attacked by someone else or if he didn't spend all his PA on me
                                if (hisActsIn > 0) {

                                    // get the maximum this ennemy receives from someone else
                                    var maxPAIn = 0;
                                    $.each(scope.game.team, function(teamId, team) {
                                        if (scope.game.team[lastRndEnnemies[0]].rounds[lastRndInd].actionsIn[teamId] > maxPAIn && teamId != myTeamId && teamId != lastRndEnnemies[0]) maxPAIn = scope.game.team[lastRndEnnemies[0]].rounds[lastRndInd].actionsIn[teamId];
                                    });

                                    // attack just enough to not trigger the highest threat
                                    maxPAIn = Math.max(Math.min(maxPAIn - 1, myPA), 0);
                                    if ((myPA - maxPAIn) % 2 != 0) maxPAIn = Math.max(maxPAIn - 1, 0);
                                    actions.add(lastRndEnnemies[0], maxPAIn);
                                    if (myPA - maxPAIn > 0) actions.add(myTeamId, Math.floor((myPA - maxPAIn) / 2) * 2);


                                    // else i need to attack
                                } else {
                                    ennemyTeamId = lastRndEnnemies[0];
                                }
                            }

                            // if i was attacked by multiple ennemies
                        } else {
                            // im probably doomed.. try to take down someone to not be last
                            ennemyTeamId = ennemiesAlive[0];
                        }

                        // if im under attack and i need to react
                        if (ennemyTeamId !== "") {

                            // compute the lowest HP of the previous round
                            var lowestHP = 99999;
                            $.each(scope.game.team, function(teamId, team) {
                                if (team.rounds[lastRndInd].lifePoint < lowestHP) lowestHP = team.rounds[lastRndInd].lifePoint;
                            });

                            // if i was the lowest HP last round
                            if (lowestHP == myTeam.rounds[lastRndInd].lifePoint) {
                                // that's probably why i was attacked, now i need to end someone before i die (but it's very unlikely to happen..)
                                ennemyTeamId = ennemiesAlive[0];
                                myIncPA = myTeam.rounds[lastRndInd].nbActionsIn;

                                // else
                            } else {
                                // that means someone is targetting me for no obvious reasons so i just want to attack him
                                // not much to do... ennemyTeamId probably is lastRndEnnemies[0], just let the 1v1 A.I. play
                                //myIncPA = myTeam.rounds[lastRndInd].nbActionsIn;

                                // if he was attacked last round by someone else then play it safe
                                if (game.team[ennemyTeamId].rounds[lastRndInd].nbActionsIn -
                                    myTeam.rounds[lastRndInd].actionsOut[ennemyTeamId] > 0) bPlaySafe = true;

                                // can i die soon?
                                // last round .actionsIN > myHp
                            }
                        }
                    }
                } else {
                    ennemyTeamId = $.grep(game.teamsAlive, function (e) { return e !== myTeamId; })[0];
                }


                // 1v1 combat A.I.
                if (ennemyTeamId !== "") {

                    // compute ennemy's stats
                    var hisHP = game.team[ennemyTeamId].lifePoint;
                    var hisPA = (myIncPA == 0) ? game.team[ennemyTeamId].profilPA : myIncPA;
                    var hisXtraPA = (hisHP > 20) ? 20 : hisHP - 1;

                    // compute the maximum PA we can use to survive with 1 HP in the worst scenario (he uses xtra PA)
                    var xtraPAtoSurviveWith1HP = Math.min(Math.max(myHP - hisPA - hisXtraPA - 1, 0), 20);

                    // if i can give the killing blow without dying myself
                    if (myPA + xtraPAtoSurviveWith1HP >= hisHP && !bPlaySafe) {
                        // if it's not a 1v1
                        if (ennemiesAlive.length > 1) {
                            // compute the just enough xtra to kill him
                            var hisInc = game.team[ennemyTeamId].rounds[lastRndInd].nbActionsIn - myTeam.rounds[lastRndInd].actionsOut[ennemyTeamId];
                            if (lastRndInd > 0) hisInc = Math.min(hisInc, game.team[ennemyTeamId].rounds[lastRndInd - 1].nbActionsIn - myTeam.rounds[lastRndInd - 1].actionsOut[ennemyTeamId]);
                            xtraPAtoSurviveWith1HP = Math.min(Math.max(Math.max(hisHP - hisInc, myPA) - myPA, 0), 20);
                        }
                        // end the game for him
                        if (xtraPAtoSurviveWith1HP > 0) actions.add(myTeamId, -xtraPAtoSurviveWith1HP);
                        actions.add(ennemyTeamId, myPA + xtraPAtoSurviveWith1HP);

                    } else {
                        // if i should play extra PA to win the game
                        if (hisPA > myPA && myHP > hisPA && !bPlaySafe) {
                            hisNeededXtraPA = Math.max(myHP - myXtraPA - hisPA, 0);

                            // if he can kill me just with his PA
                            if (hisNeededXtraPA == 0) {
                                // correct the xtra PA to have 1 hp left
                                myXtraPA = Math.min(Math.max(myHP - hisPA - 1, 0), 20);
                            }
                            // otherwise, we can't do much anyway so just attack with xtra PA
                            actions.add(myTeamId, -myXtraPA);
                            actions.add(ennemyTeamId, myPA + myXtraPA);
                        }

                        var healPA, hisNeededXtraPA;

                        // if i should not play xtra PA to win
                        if (myPA >= hisPA || myHP <= hisPA || bPlaySafe) {
                            // compute the xtra PA he needs to add to kill me (considering i dont sacrifice HP)
                            hisNeededXtraPA = Math.max(myHP - hisPA, 0);

                            // if he can kill me just with his PA
                            if (hisNeededXtraPA == 0) {
                                // if i can't finish him this turn
                                if (myPA + myXtraPA < hisHP) {
                                    healPA = Math.min((Math.abs(myHP - hisPA) + 1) * 2, myPA);
                                    // if i my PA can't cover his PA OR if i have to use all my PA to heal forget it
                                    if (myPA <= hisPA || healPA >= myPA) {
                                        // heal 1 hp and hope for a bad AI on his part
                                        healPA = 2;
                                    }
                                    actions.add(myTeamId, healPA);
                                    actions.add(ennemyTeamId, myPA - healPA);
                                } else {
                                    // end the fight with a draw
                                    actions.add(myTeamId, -myXtraPA);
                                    actions.add(ennemyTeamId, myPA + myXtraPA);
                                }

                                // if he can kill me using xtra PA
                            } else if (hisNeededXtraPA <= hisXtraPA) {
                                healPA = (Math.abs(myHP - hisPA - hisXtraPA) + 1) * 2;
                                // if my PA can cover his xtra PA and if i can close the gap between me and him
                                if (myPA > hisPA && myPA > healPA) {
                                    actions.add(myTeamId, healPA);
                                    actions.add(ennemyTeamId, myPA - healPA);
                                } else {
                                    // if i can draw playing normally
                                    if (myPA + hisNeededXtraPA >= hisHP) {
                                        actions.add(ennemyTeamId, myPA);
                                    } else {
                                        // if i can draw using xtra PA
                                        if (myPA + myXtraPA >= hisHP) {
                                            actions.add(myTeamId, -myXtraPA);
                                            actions.add(ennemyTeamId, myPA + myXtraPA);
                                        } else {
                                            // otherwise try a heal, hope he doesn't use xtra PA
                                            actions.add(myTeamId, 2);
                                            actions.add(ennemyTeamId, myPA - 2);
                                        }
                                    }
                                }

                                // otherwise, the game should not be over this turn, play normally
                            } else {
                                actions.add(ennemyTeamId, myPA);
                            }
                        }
                    }
                }


                // Check if i used all my PA for this round
                var totalPA = 0;
                $.each(actions.get(), function(teamId, pa) {
                    totalPA = totalPA + pa
                });
                if ($.isEmptyObject(actions.get())) totalPA = 0;
                // if not, use the rest on the lowest hp team
                if (totalPA < myPA) actions.add(ennemiesAlive[0], myPA - totalPA);

                return actions;
            }
        }

    ]
    ;

}])
;