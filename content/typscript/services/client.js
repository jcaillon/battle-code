/**
 * Created by Julien on 29/04/2015.
 */
'use strict';

clientMVC.service('ClientServices', ["$http", function ($http) {


    var presets = [];
    this.GetPresets = function ()
    {
        $http
            .get("template-presets.json")
            .then(function (response)
            {
                angular.extend(presets, response.data.TemplatePresets);
            });

        return presets;
    };

    this.getClient = function() {
        return client;
    }

    this.getGame = function() {
        return new Game();
    }

    var client = {
        'gameHost': 'http://localhost/battle/',
        'teamId': 'MyAwesomeTeam!',
        'teamToken': '8974848',
        profile: 'Normal',
        ai: 'Attack lowest'
    };

    var round = [{
        "gameId": "66",
        "gameStatus": "ENDED",
        "round": 2,
        "teamIdToLifePoint": {
            "feazef": 48,
            "thisismynewteam": 134
        },
        "teamIdToRoundDead": {
            "feazef": 0,
            "thisismynewteam": 0
        },
        "teamIdToActions": {
            "feazef": [
                {
                    "id": "161",
                    "gameId": "66",
                    "round": 1,
                    "sourceTeamId": "feazef",
                    "targetTeamId": "feazef",
                    "nbPoint": 10,
                    "status": "APPLIED"
                },
                {
                    "id": "162",
                    "gameId": "66",
                    "round": 1,
                    "sourceTeamId": "feazef",
                    "targetTeamId": "thisismynewteam",
                    "nbPoint": 10,
                    "status": "APPLIED"
                },
                {
                    "id": "163",
                    "gameId": "66",
                    "round": 1,
                    "sourceTeamId": "feazef",
                    "targetTeamId": "feazef",
                    "nbPoint": 1,
                    "status": "PENALISED"
                }
            ],
            "thisismynewteam": [
                {
                    "id": "152",
                    "gameId": "66",
                    "round": 1,
                    "sourceTeamId": "thisismynewteam",
                    "targetTeamId": "feazef",
                    "nbPoint": 2,
                    "status": "APPLIED"
                },
                {
                    "id": "153",
                    "gameId": "66",
                    "round": 1,
                    "sourceTeamId": "thisismynewteam",
                    "targetTeamId": "thisismynewteam",
                    "nbPoint": 1,
                    "status": "PENALISED"
                },
                {
                    "id": "154",
                    "gameId": "66",
                    "round": 1,
                    "sourceTeamId": "thisismynewteam",
                    "targetTeamId": "feazef",
                    "nbPoint": 2,
                    "status": "APPLIED"
                },
                {
                    "id": "155",
                    "gameId": "66",
                    "round": 1,
                    "sourceTeamId": "thisismynewteam",
                    "targetTeamId": "thisismynewteam",
                    "nbPoint": 1,
                    "status": "PENALISED"
                },
                {
                    "id": "156",
                    "gameId": "66",
                    "round": 1,
                    "sourceTeamId": "thisismynewteam",
                    "targetTeamId": "thisismynewteam",
                    "nbPoint": 1,
                    "status": "PENALISED"
                },
                {
                    "id": "157",
                    "gameId": "66",
                    "round": 1,
                    "sourceTeamId": "thisismynewteam",
                    "targetTeamId": "thisismynewteam",
                    "nbPoint": 1,
                    "status": "PENALISED"
                },
                {
                    "id": "158",
                    "gameId": "66",
                    "round": 1,
                    "sourceTeamId": "thisismynewteam",
                    "targetTeamId": "thisismynewteam",
                    "nbPoint": 1,
                    "status": "PENALISED"
                },
                {
                    "id": "159",
                    "gameId": "66",
                    "round": 1,
                    "sourceTeamId": "thisismynewteam",
                    "targetTeamId": "feazef",
                    "nbPoint": 2,
                    "status": "APPLIED"
                },
                {
                    "id": "160",
                    "gameId": "66",
                    "round": 1,
                    "sourceTeamId": "thisismynewteam",
                    "targetTeamId": "thisismynewteam",
                    "nbPoint": 1,
                    "status": "PENALISED"
                }
            ]
        }
    }];



}]);

clientMVC.factory('todoStorage', function () {
    var STORAGE_ID = 'todos-angularjs-perf';

    return {
        get: function () {
            return JSON.parse(localStorage.getItem(STORAGE_ID) || '[]');
        },

        put: function (todos) {
            localStorage.setItem(STORAGE_ID, JSON.stringify(todos));
        }
    };
});