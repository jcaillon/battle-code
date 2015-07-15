/**
 * Created by Julien on 29/04/2015.
 */
'use strict';

// class Client
var Client = function () {
    this.gameHost = "";
    this.teamId = "";
    this.teamToken = "";
    this.profile = "";
    this.ai = "";
};

var Game = function () {
    this.gameId = "";
    this.gameToken = "";
    this.nbTeam = 0;
    this.statusNb = -1; // -1: dc, 0: ended, 1: planned, 2:started
    this.iAmIn = false;
    this.round = 0;
    this.team = []; // teamStats[];
};

var teamStats = function () {
    this.teamId = "";
    this.profile = "";
    this.profilLP = 0;
    this.profilPA = 0;
    this.roundDead = 0;

    this.sumUp = 0; // roundStats;
    this.rounds = []; // roundStats[];
};

var roundStats = function () {
    this.lifePoint = "";
    this.ActionsIn = "";
    this.ActionsOut = 0;

    this.totalPenalties = 0;
    this.totalActionsOut = 0;
    this.totalActionsIn = 0;
    this.totalActionsSelf = 0;
};

var LP2profile = { 150: "Tank", 100: "Normal", 50: "Assassin"};
var profilName = { Tank: 0, Normal: 1, Assassin: 2 };
var profilLP = { Tank: 150, Normal: 100, Assassin: 50 };
var profilPA = {Tank: 5, Normal: 10, Assassin: 20};
var gameStatus = {DC: -1, ENDED: 0, PLANNED: 1, STARTED: 2};
var actionStatus = {REGISTERED: 0, APPLIED: 1, PENALISED: 2, IGNORED: 3};