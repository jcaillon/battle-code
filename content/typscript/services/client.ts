/**
 * Created by Julien on 26/04/2015.
 */

/// <reference path='../application.ts' />

module Client {

    export class ClientServices {

        private client: Client = {
            'gameHost': 'http://localhost/battle/',
            'teamId': 'MyAwesomeTeam!',
            'teamToken': '8974848',
            profile: 'Normal',
            ai: 'Attack lowest'
        };

        private round: any = [{
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

        getClient(): Client {
            return this.client;
        }

        getGame(): any {
            return new Game();
        }

    }


    //export interface ITodoStorage {
    //    get (): TodoItem[];
    //    put(todos: TodoItem[]);
    //}
    //
    ///**
    // * Services that persists and retrieves TODOs from localStorage.
    // */
    //export class TodoStorage implements ITodoStorage {
    //
    //    STORAGE_ID = 'todos-angularjs-typescript';
    //
    //    get (): TodoItem[] {
    //        return JSON.parse(localStorage.getItem(this.STORAGE_ID) || '[]');
    //    }
    //
    //    put(todos: TodoItem[]) {
    //        localStorage.setItem(this.STORAGE_ID, JSON.stringify(todos));
    //    }
    //}
}