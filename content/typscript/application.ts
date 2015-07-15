/**
 * Created by Julien on 26/04/2015.
 */

/*
 reference all .ts files here and reference this file in all ts
 */

/// <reference path='libs/jquery-2.1.3.d.ts' />
/// <reference path='libs/angular.d.ts' />

/// <reference path='controllers/client.ts' />
/// <reference path='models/client.ts' />
/// <reference path='services/client.ts' />

module Client {

    // refered in client.html at : ng-app="Client"
    angular.module('Client', [])
        .controller('ClientCtrl', ClientCtrl)
        .service('ClientServices', ClientServices);
        //.directive('todoBlur', todoBlur)
}