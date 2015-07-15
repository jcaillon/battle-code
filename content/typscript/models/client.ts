/**
 * Created by Julien on 26/04/2015.
 */
/// <reference path='../application.ts' />

module Client {

    export enum profilName {Tank = 0, Normal = 1, Assassin = 2};
    export enum profilLP {Tank = 150, Normal = 100, Assassin = 50};
    export function LP2profile(lp: number): string {
        var tmp = {150: "Tank",
            100: "Normal",
            50: "Assassin"};
        return tmp[lp];
    }
    export function profilPA(str: string): number {
        var tmp = {"Tank": 5,
            "Normal": 10,
            "Assassin": 20};
        return tmp[str];
    }

    export enum gameStatus {DC = -1, ENDED = 0, PLANNED = 1, STARTED = 2};
    export enum actionStatus {REGISTERED = 0, APPLIED = 1, PENALISED = 2, IGNORED = 3};

    export class Client {
        public gameHost: string;
        public teamId: string;
        public teamToken: string;
        public profile: string;
        public ai: string;
    }

    export class Game {
        public gameId:string;
        public gameToken:string;
        public nbTeam:number = 0;
        public statusNb:number = gameStatus.DC; // -1: dc, 0: ended, 1: planned, 2:started
        public iAmIn:boolean = false;

        public round:number;
        public team: teamStats[];
    }

    export class teamStats {
        public teamId: string;
        public profile: string;
        public profilLP: number;
        public profilPA: number;
        public roundDead: number;

        public curRound: roundStats;
        public prevRound: roundStats[];
    }

    export class roundStats {
        public lifePoint: number;
        public ActionsIn: arrayStringNumber[];
        public ActionsOut: arrayStringNumber[];

        // cumul, could be claculated
        public totalPenalties: number;
        public totalActionsOut: number;
        public totalActionsIn: number;
        public totalActionsSelf: number;
    }

    interface arrayStringNumber {
        [index: string]: number;
    }
}