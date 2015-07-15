/**
 * Created by Julien on 29/04/2015.
 */
'use strict';

/**
 * The main controller for the app. The controller:
 * - retrieves and persists the model via the todoStorage service
 * - exposes the model to the template and provides event handlers
 */
clientMVC.controller('ClientCtrl', ['$scope', 'ClientServices', function ($scope, clientServices) {

    $scope.client = clientServices.getClient();
    $scope.game = clientServices.getGame();

    $scope.connectToGame = function() {
        $scope.game.statusNb = 0;
    }

    $scope.getStatus = function() {
        return gameStatus[this.$scope.game.statusNb];
    }

    $scope.updateLocalData = function(round) {
        var newCurTeamStats: teamStats[];
        var i: number;
        var ind: number;
        var key: any;

        // initialisation si on est en round 0
        if (round.gameId == 0) {
            i = 1;
            for(key in round.teamIdToLifePoint){
                if (this.$scope.client.teamId == key) ind = 0; else { ind = i; ind++; }
                //newCurTeamStats[ind] = new teamStats();
                newCurTeamStats[ind].teamId = key;
                newCurTeamStats[ind].profilLP = parseInt(round.teamIdToLifePoint[key]);
                newCurTeamStats[ind].profile = LP2profile(newCurTeamStats[ind].profilLP);
                newCurTeamStats[ind].profilPA = profilPA(newCurTeamStats[ind].profile);
                newCurTeamStats[ind].teamId = "";
                newCurTeamStats[ind].roundDead = 0;
            }
        }



        return new Game();
    }
}]);