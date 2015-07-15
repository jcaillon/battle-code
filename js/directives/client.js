/**
 * Created by Julien on 06/05/2015.
 */

clientMVC.directive('myTeamColor', ["$parse", function($parse) {
    return {
        restrict: 'A',
        link: function(scope, elem, attrs) {
            var teamColor = globalConf.colorsArray[$parse(attrs.myTeamColor)(scope)];
            if ((' ' + elem.attr('class') + ' ').indexOf(' ' + 'panel' + ' ') > -1) {
                elem.css("border-color", teamColor);
            } else if ((' ' + elem.attr('class') + ' ').indexOf(' ' + 'panel-heading' + ' ') > -1) {
                elem.css("background-color", teamColor);
                elem.css("border-color", teamColor);
                //elem.css("color", "#fcf8e3");
            } else if ((' ' + elem.attr('class') + ' ').indexOf(' ' + 'round-number' + ' ') > -1) {
                elem.css("color", teamColor);
            } else {
                elem.css("background-color", teamColor);
            }
        }
    };
}]);