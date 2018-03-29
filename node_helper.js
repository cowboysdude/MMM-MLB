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
		this.standings = {
            timestamp: null,
            data: null
        };
       this.path = "modules/MMM-MLB/standings.json";
        if (fs.existsSync(this.path)) {
            var temp = JSON.parse(fs.readFileSync(this.path, 'utf8'));
            if (temp.timestamp === this.getDate()) {
                this.standings = temp;
            }
        }
    	console.log("Starting module: " + this.name);
    },

    getMLB: function(url) {
    	var nowYear = moment().format('YYYY'); 
        var nowMonth = moment().format('MM');
        var nowDay = moment().format('DD');
    	
        request({
            url: ("http://gd2.mlb.com/components/game/mlb/year_"+ nowYear +"/month_"+nowMonth+"/day_"+nowDay+"/master_scoreboard.json"),
            method: 'GET'
        }, (error, response, body) => {
            if (!error && response.statusCode == 200) {
                var result = JSON.parse(body).data.games;
                if(this.config.focus_on.length > 0){
					result.game = result.game.filter((game) => {
						if(this.config.focus_on.includes(game.home_team_name) || this.config.focus_on.includes(game.away_team_name)){
							return true;
						} else {
							return false;
						}
					});
				}
                this.sendSocketNotification('MLB_RESULTS', result);
            }
        });
    },
    
   GET_STANDINGS: function(url) {
         request({
             url: "https://erikberg.com/mlb/standings.json", 
             method: 'GET', 
             headers: {
                 'User-Agent': 'MagicMirror/1.0 ('+this.config.email+')'
             }
         }, (error, response, body) => {
             if (!error && response.statusCode == 200) {
                 var result = JSON.parse(body).standing;
                 this.sendSocketNotification('STANDINGS_RESULTS', result);
                 this.standings.timestamp = this.getDate();
                 this.standings.data = result;
                 this.fileWrite();
             }
         });
    },
    
    
    fileWrite: function() {
        fs.writeFile(this.path, JSON.stringify(this.standings), function(err) {
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
    	if(notification === 'CONFIG'){
			this.config = payload;
		} else if (notification === 'GET_MLB') {
    		this.getMLB(payload);
        } else if (notification === 'GET_STANDINGS') {
            this.GET_STANDINGS(payload);
        }
    }

});
