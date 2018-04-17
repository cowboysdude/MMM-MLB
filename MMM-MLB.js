/* Magic Mirror
  * Module: MMM-MLB
  *
  * By cowboysdude
  *
  */

"use strict";

function sprintf(fmt) {
    var parts = fmt.split("{}");
    var message = parts[0];
    var i;

    for (i = 1; i < parts.length; ++i) {
        message += arguments[i] + parts[i];
    }

    return message;
}

function getOrdinal(i) {
    var j = i % 10;
    var k = i % 100;
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
}

function getRunnersImg(game) {
    var runners = "runners"

    for (var i = 1; i <= 3; ++i) {
      if (game.runners_on_base.hasOwnProperty("runner_on_" + i + "b")) {
          runners += "_" + i + "b";
      }
    }

    return sprintf('<img class="runners" src="modules/MMM-MLB/icons/{}.png">', runners);
}

function makeTeamCell(game, team) {
    var cell = document.createElement("td");
    var team_name = game[team + "_team_name"];
    cell.classList.add(team + "team");
    cell.innerHTML = sprintf('<img class="logo" src="modules/MMM-MLB/icons/{}.png"> {}', team_name, team_name);
    if (game.hasOwnProperty(team + "_win") && game.hasOwnProperty(team + "_loss")) {
        cell.innerHTML += sprintf(' <span class="xsdata">({}-{})</span>', game[team + "_win"], game[team + "_loss"]);
    }
    return cell;
}

function makeStatCell(game, stat, team) {
    var cell = document.createElement("td");
    cell.classList.add("rhe-data");
    if (game.status.status != "Preview") {
        cell.innerHTML = game.linescore[stat][team] || "0";
    } else {
        cell.innerHTML = "0";
    }
    return cell;
}

function makeStatRow(game, team) {
    var row = document.createElement("tr");

    row.appendChild(makeTeamCell(game, team));
    row.appendChild(makeStatCell(game, "r", team));
    row.appendChild(makeStatCell(game, "h", team));
    row.appendChild(makeStatCell(game, "e", team));

    return row;
}

function getProbablePitcher(game, team) {
    var name = "Unknown";
    if (game.hasOwnProperty(team + "_probable_pitcher")) {
        var data = game[team + "_probable_pitcher"];
        if (data.name_display_roster !== "") {
            name = sprintf("{} ({}-{}, {})", data.name_display_roster, data.wins, data.losses, data.era);
        }
    }
    return sprintf("{}: {}", game[team + "_name_abbrev"], name);
}

function getGamePitcher(game, type) {
    var name = "Unknown";
    if (game.hasOwnProperty(type + "_pitcher")) {
        var data = game[type + "_pitcher"];
        if (data.name_display_roster !== "") {
            name = sprintf("{} ({}-{}, {})", data.name_display_roster, data.wins, data.losses, data.era);
        }
    }
    return sprintf("{}: {}", type[0].toUpperCase(), name);
}

function getSavePitcher(game) {
    if (game.hasOwnProperty("save_pitcher")) {
        var data = game.save_pitcher;
        if (data.name_display_roster !== "") {
            return sprintf("S: {} ({})", data.name_display_roster, data.saves);
        }
    }
    return "";
}

function makeNoGameWidget(game) {
    var table = document.createElement("table");

    // Header
    var row = document.createElement("tr");
    var cell = document.createElement("th");
    cell.classList.add("align-left", "status");
    cell.innerHTML = game.status.status;
    row.appendChild(cell);
    table.appendChild(row);

    // Body
    row = document.createElement("tr");
    row.appendChild(makeTeamCell(game, "home"));
    table.appendChild(row);

    return table;
}

function makePregameWidget(game) {
    var table = document.createElement("table");

    // Header
    var row = document.createElement("tr");
    var cell = document.createElement("th");
    cell.classList.add("align-left", "status");
    cell.setAttribute("colspan", 2);
    cell.innerHTML = game.status.status;
    row.appendChild(cell);
    table.appendChild(row);

    // Body
    row = document.createElement("tr");
    row.appendChild(makeTeamCell(game, "away"));

    cell = document.createElement("td");
    cell.classList.add("pregame-data");
    cell.setAttribute("rowspan", 2);
    cell.innerHTML = sprintf("{} {} {}", game.time, game.hm_lg_ampm, game.time_zone);
    row.appendChild(cell);
    table.appendChild(row);

    row = document.createElement("tr");
    row.appendChild(makeTeamCell(game, "home"));
    table.appendChild(row);

    // Footer
    row = document.createElement("tr");
    cell = document.createElement("td");
    cell.classList.add("xsdata", "status3");
    cell.setAttribute("colspan", 2);
    cell.innerHTML = sprintf('<div class="stat-block">{}</div><div class="stat-block">{}</div>',
        getProbablePitcher(game, "away"), getProbablePitcher(game, "home"));
    row.appendChild(cell);
    table.appendChild(row);

    return table;
}

function getPostponedReason(game) {
    var reason_map = {
        "DC": "Cold",
        "DS": "Snow",
        "DI": "Inclement Weather",
        "DR": "Rain",
        "DV": "Venue",
    };

    return (game.status.ind in reason_map) ? reason_map[game.status.ind] : "Postponed";
}

function makePostponedWidget(game) {
    var table = document.createElement("table");

    // Header
    var row = document.createElement("tr");
    var cell = document.createElement("th");
    cell.classList.add("align-left", "status");
    cell.setAttribute("colspan", 2);
    cell.innerHTML = "Postponed";
    row.appendChild(cell);
    table.appendChild(row);

    // Body
    row = document.createElement("tr");
    row.appendChild(makeTeamCell(game, "away"));

    cell = document.createElement("td");
    cell.classList.add("postponed-data");
    cell.setAttribute("rowspan", 2);
    cell.innerHTML = getPostponedReason(game);
    row.appendChild(cell);
    table.appendChild(row);

    row = document.createElement("tr");
    row.appendChild(makeTeamCell(game, "home"));
    table.appendChild(row);

    return table;
}

function getGameInning(game) {
    return sprintf("{} {}", game.status.inning_state.substring(0, 3),
        getOrdinal(game.status.inning));
}

function makeInProgressWidget(game) {
    var table = document.createElement("table");

    // Header
    var row = document.createElement("tr");
    var cell = document.createElement("th");
    cell.classList.add("align-left", "status");
    cell.setAttribute("colspan", 2);
    if (game.status.status === "In Progress") {
        cell.innerHTML = getGameInning(game);
    } else if (game.status.status === "Delayed") {
        cell.innerHTML = sprintf("{} (Delayed)", getGameInning(game));
    } else {
        cell.innerHTML = game.status.status;
    }
    row.appendChild(cell);

    cell = document.createElement("td");
    cell.classList.add("xsdata", "inprogress-data");
    cell.setAttribute("rowspan", 3);
    cell.innerHTML = sprintf("<div>{}</div><div>{}-{}, {} out</div>", getRunnersImg(game),
        game.status.b, game.status.s, game.status.o);
    row.appendChild(cell);
    table.appendChild(row);

    // Body
    row = document.createElement("tr");
    row.appendChild(makeTeamCell(game, "away"));
    row.appendChild(makeStatCell(game, "r", "away"));
    table.appendChild(row);

    row = document.createElement("tr");
    row.appendChild(makeTeamCell(game, "home"));
    row.appendChild(makeStatCell(game, "r", "home"));
    table.appendChild(row);

    // Footer
    row = document.createElement("tr");
    cell = document.createElement("td");
    cell.classList.add("xsdata", "status3");
    cell.setAttribute("colspan", 3);
    cell.innerHTML = sprintf('<div class="stat-block">P: {} ({}-{}, {})</div><div class="stat-block">AB: {} ({}-{}, {})</div>',
        game.pitcher.name_display_roster, game.pitcher.wins, game.pitcher.losses, game.pitcher.era,
        game.batter.name_display_roster, game.batter.h, game.batter.ab, game.batter.avg);
    row.appendChild(cell);
    table.appendChild(row);

    return table;
}

function makePostgameWidget(game) {
    var table = document.createElement("table");

    // Header
    var row = document.createElement("tr");
    var cell = document.createElement("th");
    cell.classList.add("align-left", "status");
    cell.innerHTML = game.status.status;
    if (game.status.inning !== "9") {
        cell.innerHTML += "/" + game.status.inning;
    }
    row.appendChild(cell);

    cell = document.createElement("th");
    cell.classList.add("rhe-header");
    cell.innerHTML = "R";
    row.appendChild(cell);

    cell = document.createElement("th");
    cell.classList.add("rhe-header");
    cell.innerHTML = "H";
    row.appendChild(cell);

    cell = document.createElement("th");
    cell.classList.add("rhe-header");
    cell.innerHTML = "E";
    row.appendChild(cell);
    table.appendChild(row);

    // Body
    table.appendChild(makeStatRow(game, "away"));
    table.appendChild(makeStatRow(game, "home"));

    // Footer
    row = document.createElement("tr");
    cell = document.createElement("td");
    cell.classList.add("xsdata", "status2");
    cell.setAttribute("colspan", 4);
    cell.innerHTML = sprintf('<div class="stat-block">{}</div><div class="stat-block">{}</div>',
        getGamePitcher(game, "winning"), getGamePitcher(game, "losing"));
    if (getSavePitcher(game) !== "") {
        cell.innerHTML += sprintf('<div class="stat-block">{}</div>', getSavePitcher(game));
    }
    row.appendChild(cell);
    table.appendChild(row);

    return table;
}

Module.register("MMM-MLB", {

    // Module config defaults.
    defaults: {
        updateInterval: 3*60000, // every 3 minutes
        animationSpeed: 10,
        initialLoadDelay: 2500, // 2.5 seconds delay
        retryDelay: 1500,
        maxWidth: "400px",
        fadeSpeed: 4,
        rotateInterval: 5 * 1000,
        header: true,
        logo: false,
        focus_on: [],
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
        var self = this;
        Log.info("Starting module: " + self.name);
        self.sendSocketNotification('CONFIG', self.config);
        // Set locale.
        self.week = "";
        self.scoreboard = [];
        self.activeItem = 0;
        self.rotateInterval = null;
        self.updateInterval = null;
        self.scheduleUpdate();
        self.standings = false;
        //setTimeout(()=>{self.sendSocketNotification('GET_STANDINGS', "AMERICAN")}, 5000);
    },

//no longer popups up

    getDom: function() {
        var self = this;
        var wrapper = document.createElement("div");
        wrapper.className = "wrapper";
        wrapper.style.maxWidth = self.config.maxWidth;

        if (self.config.header === true) {
            var header = document.createElement("header");
            header.classList.add("header");
            if (self.config.logo === true) {
                header.innerHTML = "<img class='emblem' src='modules/MMM-MLB/icons/mlb.png'>    MLB Scores     " + moment().format('MM/DD/YYYY');
            } else {
                header.innerHTML = " MLB Scores     " + moment().format('MM/DD/YYYY');
            }
            wrapper.appendChild(header);
        }

        if (self.standings === false) {

            if (self.scoreboard.length > 0) {
                if (self.activeItem >= self.scoreboard.length) {
                    self.activeItem = 0;
                }
                var game = self.scoreboard[self.activeItem];

                var top = document.createElement("div");
                top.classList = "small bright";

                if (game.status.status === "No Game Scheduled") {
                    top.appendChild(makeNoGameWidget(game));
                } else if (game.status.status === "Postponed") {
                    top.appendChild(makePostponedWidget(game));
                } else if (["Preview", "Pre-Game"].includes(game.status.status)) {
                    top.appendChild(makePregameWidget(game));
                } else if (["Game Over", "Final"].includes(game.status.status)) {
                    top.appendChild(makePostgameWidget(game));
                } else {
                    top.appendChild(makeInProgressWidget(game));
                }

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

            for(var i = 0; i < self.standings.length; i++) {
                var standings = self.standings[i];

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


    processMLB: function(scoreboard) {
        var self = this;
        self.scoreboard = scoreboard;
        self.loaded = true;
    },


    scheduleCarousel: function() {
        var self = this;
        console.log("Showing MLB games for today");
        self.rotateInterval = setInterval(() => {
            self.activeItem++;
            self.updateDom(self.config.animationSpeed);
        }, self.config.rotateInterval);
    },


    scheduleUpdate: function() {
        var self = this;
        self.updateInterval = setInterval(() => {
            self.getMLB();
        }, self.config.updateInterval);
        self.getMLB(self.config.initialLoadDelay);
    },


    getMLB: function() {
        this.sendSocketNotification('GET_MLB');
    },

    socketNotificationReceived: function(notification, payload) {
        var self = this;
        console.log(notification);
        if (notification === 'MLB_RESULTS') {
            self.processMLB(payload);
            if (self.rotateInterval == null) {
                self.scheduleCarousel();
            }
            if (self.updateInterval == null) {
                self.scheduleUpdate();
            }
            self.updateDom(self.config.animationSpeed);
        } else if(notification === 'STANDINGS_RESULTS') {
            console.log(notification);
            console.log(payload);
            self.standings = payload;
            clearInterval(self.rotateInterval);
            clearInterval(self.updateInterval);
            self.updateDom(self.config.animationSpeed);
        }
    },

    notificationReceived: function (notification, payload, sender) {
        var self = this;
        if(notification === "ALL_MODULES_STARTED"){
            self.sendNotification("REGISTER_VOICE_MODULE", {
                mode: "BASEBALL",
                sentences: [
                    "SHOW AMERICAN LEAGUE STANDINGS",
                    "SHOW NATIONAL LEAGUE STANDINGS",
                    "HIDE STANDINGS"
                ]
            });
        } else if(notification === "VOICE_BASEBALL" && sender.name === "MMM-voice"){
            self.checkCommands(payload);
        } else if(notification === "VOICE_MODE_CHANGED" && sender.name === "MMM-voice" && payload.old === "BASEBALL"){
            self.standings = false;
            self.scheduleCarousel();
            self.scheduleUpdate();
            self.updateDom(self.config.animationSpeed);
        }
    },

    checkCommands: function(data){
        var self = this;
        if(/(STANDINGS)/g.test(data)){
            if(/(SHOW)/g.test(data) && /(AMERICAN)/g.test(data)){
                self.sendSocketNotification('GET_STANDINGS', "AMERICAN");
            } else if(/(SHOW)/g.test(data) && /(NATIONAL)/g.test(data)) {
                self.sendSocketNotification('GET_STANDINGS', "NATIONAL");
            } else if(/(HIDE)/g.test(data)) {
                self.standings = false;
                self.scheduleCarousel();
                self.scheduleUpdate();
                self.updateDom(self.config.animationSpeed);
            }
        }
    }
 });
