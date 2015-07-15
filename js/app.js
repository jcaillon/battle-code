/*global clientMVC, angular */

// refered in client.html at : ng-app="Client"
var clientMVC = angular.module('Client', ['ngAnimate', 'highcharts-ng']);


function getKeyByValue ( obj, value ) {
    for(var prop in obj ) {
        if( obj.hasOwnProperty( prop ) ) {
            if( obj[ prop ] === value )
                return prop;
        }
    }
}

// saves the config before leaving the page
$(window).unload(function() {
    angular.element($(".container")).scope().saveConfigs();

    //angular.injector(['ng', 'Client']).invoke(function (ClientServices) {
    //    ClientServices.setClient();
    //});
});