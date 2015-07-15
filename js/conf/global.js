/**
 * Created by Julien on 13/05/2015.
 */

var globalVars = {
    lastRequestDate: new Date(), // to set a timeout between 2 requests
    timeoutPromises: [], // to correctly cancel ongoing promises
    currentTeamNb: 0, // for multi players simulation
    roundStartingDate: new Date(),
    lastWorldStateDate: [new Date() - 99999, new Date() - 99999],
    tryRound: 0
};

var globalConf = {
    officialFirstRoundTime: 10 * 1000, // in ms
    officialRoundTime: 5 * 1000, // in ms
    defaultRoundTime: 0, // default time in seconds for each rounds when creating new games
    freqLimitToDispProgress: 200, // below this limit (in ms) we don't display a progress bar for each request but just a global one
    criticalHp: 20, // critical hp shown in graph
    predictionRound: 5, // for the prediction lines on the graph
    requestMaxWaitTime: 1000, // max time for an ajax request to execute itself, destroyed after this time
    serverList: [
        "http://172.27.50.169/battle/",
        "http://localhost/battle/",
        "http://noyac.fr/battle/"],
    teamIdList: [
        "CA",
        "CAT0",
        "CAT1"
    ],
    tokenList: [
        "QMTOVWZJLS1IJFHLUMQC",
        "QMTOVWZJLS1IJFHLUMQC",
        "QMTOVWZJLS1IJFHLUMQC"
    ],
    colorsArray: ['#CF7D1D', '#459108', '#0292C3', '#9A479E', '#D7230F',
        '#7cb5ec', '#434348', '#90ed7d', '#f7a35c', '#8085e9', '#f15c80', '#e4d354', '#2b908f', '#f45b5b', '#91e8e1'],

    profile: [
        {name: "Unknown!", pv: 0, pa: 5},
        {name: "Tank", pv: 150, pa: 5},
        {name: "Normal", pv: 100, pa: 10},
        {name: "Assassin", pv: 50, pa: 20}
    ],
    defaultProfile: 2,
    getProfileFromPv: function(pv) { return globalConf.getPosFromProp(pv, "profile", "pv") },
    getProfileFromPa: function(pa) { return globalConf.getPosFromProp(pa, "profile", "pa") },

    gameStatus: {
        DC: {nb: -1, sName: "DC", cName: "Disconnected"},
        ENDED: {nb: 0, sName: "ENDED", cName: "Ended"},
        PLANNED: {nb: 1, sName: "PLANNED", cName: "Planned"},
        STARTED: {nb: 2, sName: "STARTED", cName: "Started"}
    },
    getStatusFromServer: function(sName) { return globalConf.gameStatus[globalConf.getPosFromProp(sName, "gameStatus", "sName")].nb },
    getStatusFromNb: function(nb) { return globalConf.gameStatus[globalConf.getPosFromProp(nb, "gameStatus", "nb")].cName },

    actionStatus: {
        REGISTERED: "REGISTERED",
        APPLIED: "APPLIED",
        PENALISED: "PENALISED",
        IGNORED: "IGNORED"
    },

    getPosFromProp: function(val, confObj, prop) {
        var pos = -1;
        $.each(globalConf[confObj], function(i, obj) {
            if (obj[prop] == val) pos = i;
        });
        return pos;
    }
};

var myChartConfig = {
    "options": {
        colors: globalConf.colorsArray,
        chart: {
            animation: {
                duration: 1500
            },
            height: 250,
            margin: [10, 5, 20, 5],
            spacing: [0, 2, 20, 2],
            type: "spline",
            zoomType: undefined,
            backgroundColor: null
        },
        credits: {
            enabled: false
        },
        legend: {
            itemStyle: {"color": "#FFFFFF", "fontWeight": "normal"},
            itemHoverStyle: {"color": "#CCCCCC"},
            itemHiddenStyle: {"color": "#DDDDDD"},
            align: 'center',
            verticalAlign: 'top'
        },
        title: {
            text: undefined,
            align: "left",
            style: {"color": "#FFFFFF", "font-size": "19px"}
        },
        xAxis: {
            gridLineWidth: 0,
            labels: {
                enabled: false
            },
            lineWidth: 0,
            minorGridLineWidth: 0,
            minorTickLength: 0,
            tickLength: 0,
            tickWidth: 0,
            title: {
                text: undefined
            }
        },
        yAxis: {
            gridLineWidth: 0,
            labels: {
                enabled: false
            },
            lineWidth: 0,
            minorGridLineWidth: 0,
            minorTickLength: 0,
            tickLength: 0,
            tickWidth: 0,
            title: {
                text: undefined
            },
            min: 0,
            plotLines: [{
                color: '#FF0000',
                width: 1,
                dashStyle: "Dot",
                value: globalConf.criticalHp,
                label: {
                    text: "Critical (" + globalConf.criticalHp + " HP)",
                    style: {"color": "#FF0000", "fontWeight": "normal"}
                }
            },
                {
                    color: '#FFFFFF',
                    width: 1,
                    dashStyle: "Dot",
                    value: 0,
                    label: {
                        text: "Game over",
                        style: {"color": "#FFFFFF", "fontWeight": "normal"}
                    }
                }]
        },
        plotOptions: {
            spline: {
                lineWidth: 2,
                pointInterval: 1,
                pointStart: 0,
                marker: {
                    radius: 4,
                    symbol: "circle"
                },
                stickyTracking: false
            }
        }
    },
    "series": []
};