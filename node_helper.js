/* Magic Mirror
    * Module: MMM-MLB
    *
    * By Cowboysdude
    * 
    */
const NodeHelper = require('node_helper');
const request = require('request');
const moment = require('moment');

module.exports = NodeHelper.create({
	
	start: function() {
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
        //console.log(body);
                this.sendSocketNotification('MLB_RESULTS', result);
            }
        });
    },


    //Subclass socketNotificationReceived received.
    socketNotificationReceived: function(notification, payload) {
        if (notification === 'GET_MLB') {
                this.getMLB(payload);
        }
    }

});