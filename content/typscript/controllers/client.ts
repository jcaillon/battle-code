/**
 * Created by Julien on 26/04/2015.
 */

/// <reference path='../application.ts' />

module Client {

    export interface IClientScope extends ng.IScope {
        client: Client;
        game: Game;
        vm: ClientCtrl;
    }

    /**
     * The main controller for the app. The controller:
     * - retrieves and persists the model via the todoStorage service
     * - exposes the model to the template and provides event handlers
     */
    export class ClientCtrl {

        // $inject annotation.
        // It provides $injector with information about dependencies to be injected into constructor
        // it is better to have it close to the constructor, because the parameters must match in count and type.
        // See http://docs.angularjs.org/guide/di
        public static $inject = [
            '$scope',
            'ClientServices',
        ];

        // dependencies are injected via AngularJS $injector
        // controller's name is registered in Application.ts and specified from ng-controller attribute in client.html
        constructor(
            private $scope: IClientScope,
            private clientServices: ClientServices
        ) {

            $scope.client = clientServices.getClient();
            $scope.game = clientServices.getGame();

            // 'vm' stands for 'view model'. We're adding a reference to the controller to the scope
            // for its methods to be accessible from view / HTML
            $scope.vm = this;

        }

        public connectToGame() {
            this.$scope.game.statusNb = 0;
        }

        public getStatus(): string {
            return gameStatus[this.$scope.game.statusNb];
        }

    }
}