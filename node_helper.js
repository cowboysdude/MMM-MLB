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
        self.standings = {
            timestamp: null,
            data: null
        };
        self.path = "modules/MMM-MLB/standings.json";
        if (fs.existsSync(self.path)) {
            var temp = JSON.parse(fs.readFileSync(self.path, 'utf8'));
            if (temp.timestamp === self.getDate()) {
                self.standings = temp;
            }
        }
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

    processStandings: function(config, standings) {
        var self = this;
        var result = [];

        ["AL", "NL"].map(function(league) {
            ["E", "C", "W"].map(function(division) {
                result.push(self.processDivision(league, division, standings));
            });
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


    fileWrite: function() {
        var self = this;
        fs.writeFile(self.path, JSON.stringify(self.standings), function(err) {
            if (err) {
                return console.log(err);
            }
            console.log("The standings file was saved!");
        });
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
