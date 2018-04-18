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

    getMLB: function() {
        function z(n) { return ((n < 10) ? "0" : "") + n; }
        var self = this;
        var date = new Date();
        if (date.getUTCHours() < 15) {
            date.setUTCDate(date.getUTCDate() - 1);
        }
        var url_date = "year_" + date.getUTCFullYear() + "/month_" + z(date.getUTCMonth() + 1) + "/day_" + z(date.getUTCDate());

        if (!self.config) {
            return;
        }

        request({
            url: "http://gd2.mlb.com/components/game/mlb/" + url_date + "/master_scoreboard.json",
            method: 'GET'
        }, (error, response, body) => {
            if (!error && response.statusCode == 200) {
                self.processResults(JSON.parse(body).data.games.game);
            }
        });
    },

    processResults: function(result) {
        var self = this;
        var focus = self.config.focus_on;
        if (focus.length > 0) {
            result = result.filter((game) => {
                return focus.includes(game.home_team_name) || focus.includes(game.away_team_name);
            });
            focus.map((team) => {
                if (!result.some((game) => { return [game.home_team_name, game.away_team_name].includes(team); })) {
                    result.push({ "status": { "status": "No Game Scheduled" }, "home_team_name": team });
                }
            });
        }
        self.sendSocketNotification('MLB_RESULTS', result);
    },

    GET_STANDINGS: function(url) {
        var self = this;
        request({
            url: "https://erikberg.com/mlb/standings.json",
            method: 'GET',
            headers: {
                'User-Agent': 'MagicMirror/1.0 ('+self.config.email+')'
            }
        }, (error, response, body) => {
            if (!error && response.statusCode == 200) {
                var result = JSON.parse(body).standing;
                self.sendSocketNotification('STANDINGS_RESULTS', result);
                self.standings.timestamp = self.getDate();
                self.standings.data = result;
                self.fileWrite();
            }
        });
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
        if (notification === 'CONFIG') {
            self.config = payload;
        } else if (notification === 'GET_MLB') {
            self.getMLB(payload);
        } else if (notification === 'GET_STANDINGS') {
            self.GET_STANDINGS(payload);
        }
    }

});
