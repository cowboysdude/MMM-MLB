/* Magic Mirror
    * Module: MMM-MLB
    *
    * By Cowboysdude
    *
    */
const NodeHelper = require('node_helper');
const request = require('request');
const moment = require('moment');
const fs = require('fs');

module.exports = NodeHelper.create({

    start: function() {
        var self = this;
        console.log("Starting module: " + self.name);
    },

    getScoreboard: function(config) {
        function z(n) { return ((n < 10) ? "0" : "") + n; }
        var self = this;
        var date = new Date();
        if (date.getUTCHours() < 15) {
            date.setUTCDate(date.getUTCDate() - 1);
        }
        var url_date = "year_" + date.getUTCFullYear() + "/month_" + z(date.getUTCMonth() + 1) + "/day_" + z(date.getUTCDate());

        request({
            url: "http://gd2.mlb.com/components/game/mlb/" + url_date + "/master_scoreboard.json",
            method: 'GET'
        }, (error, response, body) => {
            if (!error && response.statusCode == 200) {
                self.processScoreboard(config, JSON.parse(body).data.games.game || []);
            }
        });
    },

    processScoreboard: function(config, result) {
        var self = this;
        var focus = config.focus_on;
        if (focus.length > 0) {
            result = result.filter((game) => {
                return focus.includes(game.home_team_name) || focus.includes(game.away_team_name);
            });
        }
        self.sendSocketNotification('MLB_SCOREBOARD', result);
    },

    getStandings: function(config) {
        var self = this;
        request({
            url: "https://erikberg.com/mlb/standings.json",
            method: 'GET',
            headers: {
                'User-Agent': 'MagicMirror/1.0 ('+config.email+')'
            }
        }, (error, response, body) => {
            if (!error && response.statusCode == 200) {
                self.processStandings(config, JSON.parse(body).standing || []);
            }
        });
    },

    processDivision: function(league, division, standings) {
        var division_names = {
            "E": " East",
            "C": " Central",
            "W": " West"
        };
        var mapped_names = {
            "Diamondbacks": "D-backs",
        };
        var result = {
            name: league + division_names[division],
            teams: []
        };

        for (var i in standings) {
            var team = standings[i];

            if (team.conference !== league || team.division !== division) {
                continue;
            }

            result.teams.push({
                "name": mapped_names[team.last_name] || team.last_name,
                "rank": team.rank,
                "W": team.won,
                "L": team.lost,
                "PCT": team.win_percentage,
                "GB": (team.games_back > 0) ? team.games_back : "-",
                "L10": team.last_ten,
                "STRK": (team.streak_total > 0) ? (team.streak_type.toUpperCase()[0] + team.streak_total) : "-",
            });
        }

        result.teams.sort(function(a, b) { return a.rank - b.rank; });

        return result;
    },

    processWildcard: function(league, standings) {
        var mapped_names = {
            "Diamondbacks": "D-backs",
        };
        var result = {
            name: league + " Wildcard",
            teams: []
        };

        for (var i in standings) {
            var team = standings[i];

            if (team.conference != league) {
                continue;
            }

            result.teams.push({
                "name": mapped_names[team.last_name] || team.last_name,
                "rank": team.rank,
                "W": team.won,
                "L": team.lost,
                "PCT": team.win_percentage,
                "GB": (team.games_back > 0) ? team.games_back : "-",
                "L10": team.last_ten,
                "STRK": (team.streak_total > 0) ? (team.streak_type.toUpperCase()[0] + team.streak_total) : "-",
            });
        }

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

    processStandings: function(config, standings) {
        var self = this;
        var result = [];
        // Include wildcard stats starting in September
        var include_wc = ((new Date()).getMonth() >= 8);

        ["AL", "NL"].map(function(league) {
            ["E", "C", "W"].map(function(division) {
                result.push(self.processDivision(league, division, standings));
            });

            if (include_wc) {
                result.push(self.processWildcard(league, standings));
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

        self.sendSocketNotification('MLB_STANDINGS', result);
    },

    getDate: function() {
        return (new Date()).toLocaleDateString();
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
