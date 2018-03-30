/* Magic Mirror
  * Module: MMM-MLB
  *
  * By cowboysdude
  * 
  */
 Module.register("MMM-MLB", {

     // Module config defaults.
     defaults: {
         updateInterval: 3*60000, // every 3 minutes
         animationSpeed: 10,
         initialLoadDelay: 2500, // 2.5 seconds delay
         retryDelay: 1500,   
         maxWidth: "300px",
         fadeSpeed: 4,
         rotateInterval: 5 * 1000,
         header: true,
         logo: false,
         focus_on: [],
         showStatus: true,
         showVenue: true,
     },

     // Define required scripts.
     getScripts: function() {
         return ["moment.js"];
     },

     getStyles: function() {
         return ["MMM-MLB.css"];
     },

     // Define start sequence.
     start: function() {
         Log.info("Starting module: " + this.name);
		 this.sendSocketNotification('CONFIG', this.config);
         // Set locale.
         this.week = "";
         this.mlb = {};
         this.today = "";
         this.activeItem = 0;
         this.rotateInterval = null;
         this.updateInterval = null;
         this.scheduleUpdate();
         this.standings = false;
         //setTimeout(()=>{this.sendSocketNotification('GET_STANDINGS', "AMERICAN")}, 5000);
     },

//no longer popups up

     getDom: function() {
     	var wrapper = document.createElement("div");
		wrapper.className = "wrapper";
		wrapper.style.maxWidth = this.config.maxWidth;

		if (this.config.header === true) {
		    var header = document.createElement("header");
		    header.classList.add("header");
		    if (this.config.logo === true) {
		        header.innerHTML = "<img class='emblem' src='modules/MMM-MLB/icons/mlb.png'>    MLB Scores     " + moment().format('MM/DD/YYYY');
		    } else {
		        header.innerHTML = " MLB Scores     " + moment().format('MM/DD/YYYY');
		    }
		    wrapper.appendChild(header);
		}

		
		if (this.standings === false) {
		    
			function makeStatCell(games, stat, team) {
				var cell = document.createElement("td");
				cell.setAttribute("colspan", 1);
				cell.classList.add("rhe");
				if (games.status.status != "Preview") {
					cell.innerHTML = games.linescore[stat][team] || "0";
				} else {
					cell.innerHTML = "0";
				}
				return cell;
			}

			function makeStatRow(games, team) {
				var team_name = games[team + "_team_name"];
				var row = document.createElement("tr");

				var cell = document.createElement("td");
				cell.setAttribute("colspan", 3);
				cell.classList.add("awayteam");
				cell.innerHTML = '<img class="logo" src="modules/MMM-MLB/icons/' + team_name + '.png"> ' + team_name + " <span class=\"xsmall\">(" + games[team + "_win"] + "-" + games[team + "_loss"] + ")</span>";
				row.appendChild(cell);

				row.appendChild(makeStatCell(games, "r", team));
				row.appendChild(makeStatCell(games, "h", team));
				row.appendChild(makeStatCell(games, "e", team));

				return row;
			}

		    var games = this.mlb;
		    var gkeys = Object.keys(this.mlb);
		    if (gkeys.length > 0) {
		        if (this.activeItem >= gkeys.length) {
		            this.activeItem = 0;
		        }
		        var games = this.mlb[gkeys[this.activeItem]];

		        var top = document.createElement("div");
		        top.classList = "small bright";

		        var gameTable = document.createElement("table");
		        var firstrow = document.createElement("tr");
		        var teamcolumn = document.createElement("th");
		        teamcolumn.setAttribute("colspan", 3);
		        teamcolumn.classList.add("align-left", "status");
		        if (games.status.status === "In Progress") {
		            teamcolumn.innerHTML = (this.getOrdinal(games.status.inning)) + " Inning";
		        } else {
		            teamcolumn.innerHTML = games.status.status;
		        }
		        firstrow.appendChild(teamcolumn);

		        var runscolumn = document.createElement("th");
		        runscolumn.setAttribute("colspan", 1);
		        runscolumn.classList.add("rhe-header");
		        runscolumn.innerHTML = "R";
		        firstrow.appendChild(runscolumn);
		        gameTable.appendChild(firstrow);

		        var hitscolumn = document.createElement("th");
		        hitscolumn.setAttribute("colspan", 1);
		        hitscolumn.classList.add("rhe-header");
		        hitscolumn.innerHTML = "H";
		        firstrow.appendChild(hitscolumn);

		        var ecolumn = document.createElement("th");
		        ecolumn.setAttribute("colspan", 1);
		        ecolumn.classList.add("rhe-header");
		        ecolumn.innerHTML = "E";
		        firstrow.appendChild(ecolumn);
		        gameTable.appendChild(firstrow);

						gameTable.appendChild(makeStatRow(games, "away"));
						gameTable.appendChild(makeStatRow(games, "home"));

						if (this.config.showStatus) {
							var statusTemp = document.createElement("tr");
							var statusTempColumn = document.createElement("td");
							statusTempColumn.classList.add("xsmall", "dimmed", "status2");
							statusTempColumn.setAttribute("colspan", 1);
							if (games.hasOwnProperty('home_probable_pitcher') && (games.status.status === 'Preview' || games.status.status === 'Warm up')) {
									statusTempColumn.innerHTML = "Home Pitcher: " + games.home_probable_pitcher.first + " " + games.home_probable_pitcher.last + "    ERA: " + games.home_probable_pitcher.era;
							} else if (games.status.status === "Final" && games.winning_pitcher.first != "" || null) {
									statusTempColumn.innerHTML = "Winning Pitcher: " + games.winning_pitcher.first + " " + games.winning_pitcher.last;
							} else if (games.status.status === "Final" && games.winning_pitcher.first === "") {
									statusTempColumn.innerHTML = "Winning Pitcher: None listed";
							} else {
									statusTempColumn.innerHTML = "In Progress";
							}
							statusTemp.appendChild(statusTempColumn);
							gameTable.appendChild(statusTemp);
						}

						if (this.config.showVenue) {
							var venuetemp = document.createElement("tr");
							var venuetempColumn = document.createElement("td");
							venuetempColumn.classList.add("xsmall", "dimmed", "status3");
							venuetempColumn.setAttribute("colspan", 4);
							if (games.hasOwnProperty('away_probable_pitcher') && (games.status.status === 'Preview' || games.status.status === 'Warm up')) {
									venuetempColumn.innerHTML = "Away Pitcher: " + games.away_probable_pitcher.first + " " + games.away_probable_pitcher.last + "    ERA: " + games.away_probable_pitcher.era;
							} else if (games.status.status === "Final" && games.save_pitcher.first != "" || null) {
									venuetempColumn.innerHTML = "Save:  " + games.save_pitcher.first + " " + games.save_pitcher.last;
							} else {
									venuetempColumn.innerHTML = " ";
							}
							venuetemp.appendChild(venuetempColumn);
							gameTable.appendChild(venuetemp);

							var venueGame = document.createElement("tr");
							var venueGameColumn = document.createElement("td");
							venueGameColumn.classList.add("xsmall", "dimmed", "status4");
							venueGameColumn.setAttribute("colspan", 4);
							if (games.status.status !== "Final" || "Warm Up") {
									venueGameColumn.innerHTML = games.venue + " Game Time:  " + games.time + "" + games.hm_lg_ampm + " " + games.time_zone;
							}
							venueGame.appendChild(venueGameColumn);
							gameTable.appendChild(venueGame);
						}

		        top.appendChild(gameTable);
		        wrapper.appendChild(top);
		    }
		} else {
			//ok we have the wrapper already no need to overwrite it
			var standingsTable = document.createElement("table");
			
			var headerRow = document.createElement("tr");
			headerRow.classList.add("small", "bright");
			
			var teamLabel = document.createElement("th");
			teamLabel.innerHTML = "Team";
			headerRow.appendChild(teamLabel);
			
			var winLabel = document.createElement("th");
			winLabel.innerHTML = "W";
			headerRow.appendChild(winLabel);
			
			var lossLabel = document.createElement("th");
			lossLabel.innerHTML = "L";
			headerRow.appendChild(lossLabel);
			
			standingsTable.appendChild(headerRow);
			
			for(var i = 0; i < this.standings.length; i++){ 
			var standings = this.standings[i];
			
			var dataRow = document.createElement("tr");
            var teamsShowColumn = document.createElement("td");
		    teamsShowColumn.innerHTML = standings.team_id + " " + standings.rank;
		    dataRow.appendChild(teamsShowColumn);
		        

		     var winsShowColumn = document.createElement("td");
		     winsShowColumn.innerHTML = standings.won; //right now..
		     dataRow.appendChild(winsShowColumn); 
		     

		     var lossShowColumn = document.createElement("td");
		     lossShowColumn.innerHTML = standings.lost; //right now..
		     dataRow.appendChild(lossShowColumn); 
		     
		     standingsTable.appendChild(dataRow); 
			
			}
			wrapper.appendChild(standingsTable);
		}

		return wrapper;
     },

     getOrdinal: function(i) {
         var j = i % 10,
             k = i % 100;
         if (j == 1 && k != 11) {
             return i + "st";
         }
         if (j == 2 && k != 12) {
             return i + "nd";
         }
         if (j == 3 && k != 13) {
             return i + "rd";
         }
         return i + "th";
     },


     processMLB: function(data) {
         this.today = data.Today;
         this.mlb = data.game;
         this.loaded = true;
     },


     scheduleCarousel: function() {
         console.log("Showing MLB games for today");
         this.rotateInterval = setInterval(() => {
             this.activeItem++;
             this.updateDom(this.config.animationSpeed);
         }, this.config.rotateInterval);
     },

     scheduleUpdate: function() {
         this.updateInterval = setInterval(() => {
             this.getMLB();
         }, this.config.updateInterval);
         this.getMLB(this.config.initialLoadDelay);
     },
     

     getMLB: function() {
         this.sendSocketNotification('GET_MLB');
     },

     socketNotificationReceived: function(notification, payload) {
     	console.log(notification);
         if (notification === 'MLB_RESULTS') {
             this.processMLB(payload);
             if (this.rotateInterval == null) {
                 this.scheduleCarousel();
             }
             if (this.updateInterval == null) {
                 this.scheduleUpdate();
             }
             this.updateDom(this.config.animationSpeed);
         } else if(notification === 'STANDINGS_RESULTS') {
         	console.log(notification);
         	console.log(payload);
             this.standings = payload;
             clearInterval(this.rotateInterval);
             clearInterval(this.updateInterval);
             this.updateDom(this.config.animationSpeed);
         }
     },

     notificationReceived: function (notification, payload, sender) {
         if(notification === "ALL_MODULES_STARTED"){
             this.sendNotification("REGISTER_VOICE_MODULE", {
                 mode: "BASEBALL",
                 sentences: [
                     "SHOW AMERICAN LEAGUE STANDINGS",
                     "SHOW NATIONAL LEAGUE STANDINGS",
                     "HIDE STANDINGS"
                 ]
             });
         } else if(notification === "VOICE_BASEBALL" && sender.name === "MMM-voice"){
             this.checkCommands(payload);
         } else if(notification === "VOICE_MODE_CHANGED" && sender.name === "MMM-voice" && payload.old === "BASEBALL"){
             this.standings = false;
             this.scheduleCarousel();
             this.scheduleUpdate();
             this.updateDom(this.config.animationSpeed);
         }
     },

     checkCommands: function(data){
         if(/(STANDINGS)/g.test(data)){
             if(/(SHOW)/g.test(data) && /(AMERICAN)/g.test(data)){
                 this.sendSocketNotification('GET_STANDINGS', "AMERICAN");
             } else if(/(SHOW)/g.test(data) && /(NATIONAL)/g.test(data)) {
                 this.sendSocketNotification('GET_STANDINGS', "NATIONAL");
             } else if(/(HIDE)/g.test(data)) {
                 this.standings = false;
                 this.scheduleCarousel();
                 this.scheduleUpdate();
                 this.updateDom(this.config.animationSpeed);
             }
         }
     }
 });
