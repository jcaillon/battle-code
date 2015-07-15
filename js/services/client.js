/**
 * Created by Julien on 29/04/2015.
 */
'use strict';

clientMVC.service('ClientServices', ['$timeout', function ($timeout) {

    // class Client
    var Client = function () {
        this.teamId = globalConf.teamIdList[0];
        this.teamToken = globalConf.tokenList[0];
        this.ai = 0;
        this.gameHost = globalConf.serverList[0];
        this.pollFrequence = 100;
        this.minTimeBetweenRequests = 0; // in ms
        this.minTimeBeforeRoundEnds = 150; // in ms
    };

    // get client from scratch or from localstorage if it exists
    this.getClient = function() {
        var c = new Client();
        if (localStorage.getItem('client')) c = JSON.parse(localStorage.getItem('client'));
        return c;
    };

    // save client config to localstorage
    this.setClient = function(client) {
        localStorage.setItem('client', JSON.stringify(client));
    };

    // global conf for ajax requests throughout the client
    this.sharedAjaxConf = function (ajaxConf) {
        return addPropToAjaxConf(ajaxConf, true);
    };

    // global conf for ajax requests throughout the client
    var addPropToAjaxConf = function (ajaxConf, bLocalProgressBar) {
        ajaxConf.cache = false;
        ajaxConf.timeout = globalConf.requestMaxWaitTime;
        if (bLocalProgressBar) {
            ajaxConf.beforeSend = function() {
                NProgress.start();
            };
            ajaxConf.complete = function() {
                NProgress.done();
            };
        }
        return ajaxConf;
    };

    // prepare and execute an ajax query depending on the action type wanted
    // $scope is used in read-only
    this.AjaxQuery = function($scope, actionType, ajaxConf, alwaysFunction) {
        tempoAjaxQuery($scope, actionType, ajaxConf, alwaysFunction);
    };

    // trick to set a minimum timeOut between 2 ajax requests
    var tempoAjaxQuery = function($scope, actionType, ajaxConf, alwaysFunction) {
        var diff = new Date() - globalVars.lastRequestDate;

        if (diff > 0 && diff < $scope.client.minTimeBetweenRequests) {
            // we need to set a timeout before executing this ajax request
            //console.log("the action : " + actionType + " has been delayed of " + (globalConf.minTimeBetweenRequests - diff) + "ms");
            globalVars.timeoutPromises.push($timeout(tempoAjaxQuery.bind(null ,$scope, actionType, ajaxConf, alwaysFunction), $scope.client.minTimeBetweenRequests - diff));
        } else {
            realAjaxQuery($scope, actionType, ajaxConf, alwaysFunction);
        }
    };

    // prepare and execute an ajax query depending on the action type wanted
    // $scope is used in read-only
    var realAjaxQuery = function($scope, actionType, ajaxConf, alwaysFunction) {

        globalVars.lastRequestDate = new Date();

        var url = $scope.client.gameHost;

        if (!url.match(/\/$/)) {
            url += '/';
        }

        ajaxConf = addPropToAjaxConf(ajaxConf, $scope.client.pollFrequence >= globalConf.freqLimitToDispProgress || !$scope.playing);

        ajaxConf.dataType = "json";
        ajaxConf.method= 'GET';
        ajaxConf.crossDomain = true;

        if(!ajaxConf.hasOwnProperty('data')) ajaxConf.data = {};
        switch (actionType) {
            case "getClosestBattle":
                url += "getClosestBattle";
                ajaxConf.data.teamId = $scope.client.teamId;
                ajaxConf.data.teamToken = $scope.client.teamToken;
                ajaxConf.data.roundTime = globalConf.defaultRoundTime;
                break;
            case "delete":
                url += "delete";
                ajaxConf.data.gameId = $scope.game.gameId;
                ajaxConf.data.gameToken = $scope.game.gameToken;
                break;
            case "register":
                url += "register";
                ajaxConf.data.teamId = $scope.client.teamId;
                ajaxConf.data.teamToken = $scope.client.teamToken;
                break;
            case "create":
                url += "create";
                ajaxConf.data.teamId = $scope.client.teamId;
                ajaxConf.data.teamToken = $scope.client.teamToken;
                ajaxConf.data.roundTime = globalConf.defaultRoundTime;
                break;
            case "join":
                url += "join";
                ajaxConf.data.gameId = $scope.game.gameId;
                ajaxConf.data.gameToken = $scope.game.gameToken;
                ajaxConf.data.teamId = $scope.client.teamId;
                ajaxConf.data.profile = globalConf.profile[globalConf.defaultProfile].name;
                ajaxConf.dataType = "text/plain";
                break;
            case "start":
                url += "start";
                ajaxConf.data.gameId = $scope.game.gameId;
                ajaxConf.data.gameToken = $scope.game.gameToken;
                ajaxConf.dataType = "text/plain";
                break;
            case "changeTeamProfile":
                url += "changeTeamProfile";
                ajaxConf.data.gameId = $scope.game.gameId;
                ajaxConf.data.teamId = $scope.client.teamId;
                ajaxConf.data.teamToken = $scope.client.teamToken;
                if(!ajaxConf.data.hasOwnProperty('profile'))
                    ajaxConf.data.profile = globalConf.profile[globalConf.defaultProfile].name;
                ajaxConf.dataType = "text/plain";
                break;
            case "teamAction":
                url += "teamAction";
                ajaxConf.data.gameId = $scope.game.gameId;
                ajaxConf.data.round = $scope.game.round;
                ajaxConf.data.teamId = $scope.client.teamId;
                ajaxConf.data.teamToken = $scope.client.teamToken;
                ajaxConf.dataType = "text/plain";
                break;
            case "worldState":
                url += "worldState";
                ajaxConf.data.gameId = $scope.game.gameId;
                if(!ajaxConf.data.hasOwnProperty('round'))
                    ajaxConf.data.round = $scope.game.round;
                ajaxConf.data.teamId = $scope.client.teamId;
                ajaxConf.data.teamToken = $scope.client.teamToken;
                break;
        }

        ajaxConf.url = url;

        $.ajax(ajaxConf).fail(function(jqXHR, textStatus) {
            if (jqXHR.status != 200 && jqXHR.status != 500)
                toastr.error("Action requested : " + actionType + ", " + jqXHR.status + ":" + textStatus, "AJAX REQUEST ERROR");
            })
            .always(alwaysFunction);
    };

}]);