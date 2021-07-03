/* Magic Mirror
    * Module: MMM-MLB
    *
    * By Cowboysdude
    *
    */
const NodeHelper = require('node_helper');
const https = require("https");
const moment = require('moment');
const fs = require('fs');

module.exports = NodeHelper.create({

    start: function() {
        var self = this;
        console.log("Starting module: " + self.name);
    },

    request: function(options, callback) {
        var error = undefined;
        var response = undefined;
        var body = "";

        const req = https.request(options.url, options, res => {
            response = res;
            res.on("data", chunk => body += chunk);
            res.on("error", e => error = e);
        });

        req.on("error", e => error = e);
        req.on("close", () => callback(error, response, body));

        req.end(options.body);
    },

    getScoreboard: function(config) {
        function z(n) { return ((n < 10) ? "0" : "") + n; }
        var self = this;
        var date = new Date();
        if (date.getUTCHours() < 15) {
            date.setUTCDate(date.getUTCDate() - 1);
        }
        var url_date = "year_" + date.getUTCFullYear() + "/month_" + z(date.getUTCMonth() + 1) + "/day_" + z(date.getUTCDate());

        self.request({
            url: `https://gd2.mlb.com/components/game/mlb/${url_date}/master_scoreboard.json`,
            method: 'GET'
        }, (error, response, body) => {
            if (!error && response.statusCode == 200) {
                self.processScoreboard(config, date, body);
            }
        });
    },

    processScoreboard: function(config, date, body) {
        function z(n) { return ((n < 10) ? "0" : "") + n; }
        var self = this;
        var focus = config.focus_on;
        var result = {
            date: z(date.getUTCMonth() + 1) + "/" + z(date.getUTCDate()) + "/" + date.getUTCFullYear(),
            scores: JSON.parse(body).data.games.game,
        };

        if (!Array.isArray(result.scores)) {
            result.scores = [result.scores];
        }

        if (focus.length > 0) {
            result.scores = result.scores.filter((game) => {
                return focus.includes(game.home_team_name) || focus.includes(game.away_team_name);
            });
        }

        self.sendSocketNotification('MLB_SCOREBOARD', result);
    },

    getStandings: function(config) {
        var self = this;
        var date = new Date();
        self.request({
            url: "https://statsapi.mlb.com/api/v1/standings?leagueId=103,104&season=" + date.getUTCFullYear() + "&standingsTypes=regularSeason,springTraining,firstHalf,secondHalf&hydrate=division,conference,sport,league,team(nextSchedule(team,gameType=[R,F,D,L,W,C],inclusive=false),previousSchedule(team,gameType=[R,F,D,L,W,C],inclusive=true))",
            method: 'GET',
            headers: {
                'User-Agent': 'MagicMirror/1.0 ('+config.email+')'
            }
        }, (error, response, body) => {
            if (!error && response.statusCode == 200) {
                self.processStandings(config, body);
            }
        });
    },

    processDivision: function(standings) {
        var result = {
            name: standings.division.nameShort,
            teams: []
        };

        for (var i in standings.teamRecords) {
            var team = standings.teamRecords[i];
            var lastTen = "-";

            for (var j in team.records.splitRecords) {
                var split = team.records.splitRecords[j];

                if (split.type === "lastTen") {
                    lastTen = split.wins + "-" + split.losses;
                    break;
                }
            }

            result.teams.push({
                "name": team.team.teamName,
                "rank": +team.divisionRank,
                "W": team.leagueRecord.wins,
                "L": team.leagueRecord.losses,
                "PCT": team.leagueRecord.pct,
                "GB": team.divisionGamesBack,
                "L10": lastTen,
                "STRK": team.streak.streakCode,
            });
        }

        result.teams.sort(function(a, b) { return a.rank - b.rank; });

        return result;
    },

    processWildcard: function(league, standings) {
        var result = {
            name: league + " Wildcard",
            teams: []
        };

        standings.map((division) => {
            if (!division.name.startsWith(league)) {
                return;
            }

            for (var i in division.teams) {
                result.teams.push(Object.assign({}, division.teams[i]));
            }
        });

        result.teams.sort(function(a, b) {
            if ((a.rank === 1) != (b.rank === 1)) {
                return (b.rank === 1) - (a.rank === 1);
            }

            var awindiff = a.W - a.L;
            var bwindiff = b.W - b.L;
            if (awindiff !== bwindiff) {
                return bwindiff - awindiff;
            }

            var awinpct = a.W / (a.W + a.L);
            var bwinpct = b.W / (b.W + b.L);
            return bwinpct - awinpct;
        });

        var wcwindiff = null;
        for (var i = 0; i < result.teams.length; ++i) {
            var team = result.teams[i];

            if (team.rank === 1) {
                continue;
            }

            if (wcwindiff === null) {
                var wc2 = result.teams[i + 1];
                wcwindiff = (wc2.W - wc2.L);
            }

            team.GB = (wcwindiff - (team.W - team.L)) * 0.5;
            if (team.GB === 0) {
                team.GB = "-";
            } else if (team.GB < 0) {
                team.GB = "+" + -team.GB;
            }
        }

        return result;
    },

    processStandings: function(config, body) {
        var self = this;
        var standings = JSON.parse(body);
        var result = {};
        // Include wildcard stats starting in September
        var include_wc = ((new Date()).getMonth() >= 8);

        ["AL", "NL"].map(function(league) {
            ["East", "Central", "West"].map(function(division) {
                standings.records.map((div) => {
                    if (div.division.nameShort !== league + " " + division) {
                        return;
                    }

                    if (!(div.standingsType in result)) {
                        result[div.standingsType] = [];
                    }

                    result[div.standingsType].push(self.processDivision(div));
                });
            });

            if (include_wc && "regularSeason" in result) {
                result.regularSeason.push(self.processWildcard(league, result.regularSeason));
            }
        });

        var focus = config.focus_on;
        if (focus.length > 0) {
            result = result.filter((division) => {
                for (var i in division.teams) {
                    if (focus.includes(division.teams[i].name)) {
                        return true;
                    }
                }
                return false;
            });
        }

        self.sendSocketNotification('MLB_STANDINGS', result.regularSeason || result.springTraining);
    },

    socketNotificationReceived: function(notification, payload) {
        var self = this;
        if (notification === 'GET_MLB_SCOREBOARD') {
            self.getScoreboard(payload);
        } else if (notification === 'GET_MLB_STANDINGS') {
            self.getStandings(payload);
        }
    }
});
