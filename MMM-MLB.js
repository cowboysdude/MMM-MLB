/* Magic Mirror
  * Module: MMM-MLB
  *
  * By cowboysdude
  *
  */

"use strict";

function el(tag, options) {
    var result = document.createElement(tag);

    options = options || {};
    for (var key in options) {
      result[key] = options[key];
    }

    return result;
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

function getIcon(name, className) {
    return el("img", {
        className: className,
        src: `modules/MMM-MLB/icons/${name}.png`,
    });
}

function getRunnersImg(game) {
    var runners = "runners"

    for (var i = 1; i <= 3; ++i) {
      if (game.runners_on_base.hasOwnProperty("runner_on_" + i + "b")) {
          runners += "_" + i + "b";
      }
    }

    return getIcon(runners, "runners");
}

function getOpposingTeam(team) {
  return (team === "home") ? "away" : "home";
}

function makeTeamCell(game, team, includeName) {
    var cell = el("td", { className: team + "team" });
    var team_name = game[team + "_team_name"];
    if (team_name === "Intrasquad") {
      var opponent = game[getOpposingTeam(team) + "_team_name"];
      cell.appendChild(getIcon(opponent, "logo"));
    } else {
      cell.appendChild(getIcon(team_name, "logo"));
    }
    if (includeName) {
        cell.appendChild(document.createTextNode(" " + team_name + " "));
        if (game.hasOwnProperty(team + "_win") && game.hasOwnProperty(team + "_loss")) {
            cell.appendChild(el("span", {
                className: "xsdata",
                innerText: `(${game[team + "_win"]}-${game[team + "_loss"]})`,
            }));
        }
    }
    return cell;
}

function makeStatCell(game, stat, team) {
    var text = "0";
    if (game.status.status != "Preview") {
        text = game.linescore[stat][team] || "0";
    }

    return el("td", { className: "rhe-data", innerText: text });
}

function makeStatRow(game, team, rowClass) {
    var row = el("tr", { className: rowClass });

    row.appendChild(makeTeamCell(game, team, true));
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
            name = `${data.name_display_roster} (${data.wins}-${data.losses}, ${data.era})`;
        }
    }
    return `${game[team + "_name_abbrev"]}: ${name}`;
}

function getGamePitcher(game, type) {
    var name = "Unknown";
    if (game.hasOwnProperty(type + "_pitcher")) {
        var data = game[type + "_pitcher"];
        if (data.name_display_roster !== "") {
            name = `${data.name_display_roster} (${data.wins}-${data.losses}, ${data.era})`;
        }
    }
    return `${type[0].toUpperCase()}: ${name}`;
}

function getSavePitcher(game) {
    if (game.hasOwnProperty("save_pitcher")) {
        var data = game.save_pitcher;
        if (data.name_display_roster !== "") {
            return `S: ${data.name_display_roster} (${data.saves})`;
        }
    }
    return "";
}

function makeNoGameWidget(game) {
    var table = document.createElement("table");

    // Header
    var row = document.createElement("tr");
    row.appendChild(el("th", { className: "align-left status", innerText: game.status.status }));
    table.appendChild(row);

    // Body
    row = document.createElement("tr");
    row.appendChild(makeTeamCell(game, "home", true));
    table.appendChild(row);

    return table;
}

function getGameTime(game) {
    if (game.time.includes(":")) {
        return `${game.time} ${game.hm_lg_ampm} ${game.time_zone}`;
    } else {
        return game.time;
    }
}

function makePregameWidget(game) {
    var table = document.createElement("table");

    // Header
    var row = document.createElement("tr");
    row.appendChild(el("th", { className: "align-left status", colSpan: "2", innerText: game.status.status }));
    table.appendChild(row);

    // Body
    row = document.createElement("tr");
    row.appendChild(makeTeamCell(game, "away", true));
    row.appendChild(el("td", { className: "pregame-data", rowSpan: "2", innerText: getGameTime(game) }));
    table.appendChild(row);

    row = document.createElement("tr");
    row.appendChild(makeTeamCell(game, "home", true));
    table.appendChild(row);

    // Footer
    row = document.createElement("tr");
    var cell = el("td", { className: "xsdata status3", colSpan: "2" });
    cell.appendChild(el("div", { className: "stat-block", innerText: getProbablePitcher(game, "away") }));
    cell.appendChild(el("div", { className: "stat-block", innerText: getProbablePitcher(game, "home") }));
    row.appendChild(cell);
    table.appendChild(row);

    return table;
}

function getPostponedReason(game) {
    var reason_map = {
        "DC": "Cold",
        "DS": "Snow",
        "DI": "Inclement Weather",
        "PI": "Inclement Weather",
        "DR": "Rain",
        "DV": "Venue",
    };

    return (game.status.ind in reason_map) ? reason_map[game.status.ind] : "Postponed";
}

function makePostponedWidget(game) {
    var table = document.createElement("table");

    // Header
    var row = document.createElement("tr");
    row.appendChild(el("th", { className: "align-left status", colSpan: "2", innerText: game.status.status }));
    table.appendChild(row);

    // Body
    row = document.createElement("tr");
    row.appendChild(makeTeamCell(game, "away", true));
    row.appendChild(el("td", { className: "postponed-data", rowSpan: "2", innerText: getPostponedReason(game) }));
    table.appendChild(row);

    row = document.createElement("tr");
    row.appendChild(makeTeamCell(game, "home", true));
    table.appendChild(row);

    return table;
}

function getInningState(game) {
    return game.status.inning_state.substring(0, 3);
}

function getInning(game) {
    return game.status.inning - ((getInningState(game) === "End") ? 1 : 0);
}

function getInningText(game) {
    return `${getInningState(game)} ${getOrdinal(getInning(game))}`;
}

function getInProgressStatus(game) {
    if (game.status.status === "In Progress") {
        return getInningText(game);
    } else if (game.status.status === "Delayed") {
        return `${getInningText(game)} (Delayed)`;
    } else if (game.status.status === "Manager Challenge") {
        return `${getInningText(game)} (Challenge)`;
    } else if (game.status.status === "Review") {
        return `${getInningText(game)} (Review)`;
    } else {
        return game.status.status;
    }
}

function getTeamScore(game, inning, team) {
    if (inning in game.linescore.inning) {
        return game.linescore.inning[inning][team];
    } else if (inning === 0 && team in game.linescore.inning) {
        return game.linescore.inning[team];
    } else {
        return "";
    }
}

function makeInProgressWidget(game) {
    var table = document.createElement("table");

    // Header
    var row = document.createElement("tr");
    row.appendChild(el("th", { className: "align-left status", innerText: getInProgressStatus(game) }));

    var baseInning = Math.max(getInning(game) - 9, 0), inning;
    for (inning = baseInning; inning < baseInning + 9; ++inning) {
        row.appendChild(el("th", { className: "rhe-data", innerText: inning + 1 }));
    }
    row.appendChild(el("th", { className: "rhe-data", innerText: "R" }));
    row.appendChild(el("th", { className: "rhe-data", innerText: "H" }));
    row.appendChild(el("th", { className: "rhe-data", innerText: "E" }));

    var cell = el("td", { className: "xsdata inprogress-data", rowSpan: "3" });
    cell.appendChild(el("div").appendChild(getRunnersImg(game)).parentElement);
    cell.appendChild(el("div", { innerText: `${game.status.b}-${game.status.s}, ${game.status.o} out` }));
    row.appendChild(cell);
    table.appendChild(row);

    // Body
    ["away", "home"].map(team => {
        row = document.createElement("tr");
        row.appendChild(makeTeamCell(game, team, false));
        for (inning = baseInning; inning < baseInning + 9; ++inning) {
            row.appendChild(el("th", { className: "rhe-data", innerText: getTeamScore(game, inning, team) }));
        }
        row.appendChild(makeStatCell(game, "r", team));
        row.appendChild(makeStatCell(game, "h", team));
        row.appendChild(makeStatCell(game, "e", team));
        table.appendChild(row);
    });

    // Footer
    row = document.createElement("tr");
    cell = el("td", { className: "xsdata status3", colSpan: "14" });
    if (game.status.status === "Manager Challenge") {
        cell.innerText = `${game.status.challenge_team_brief} challenge - ${game.status.reason}`;
    } else if (game.status.status === "Review") {
        cell.innerText = `Umpire review - ${game.status.reason}`;
    } else if (["Warmup", "Mid", "End"].includes(getInningState(game))) {
        cell.appendChild(el("div", { className: "stat-block", innerText: "Due Up:" }));
        ["batter", "ondeck", "inhole"].map(batter => {
            cell.appendChild(el("div", {
                className: "stat-block",
                innerText: `${game[batter].name_display_roster} (${game[batter].h}-${game[batter].ab})`,
            }));
        });
    } else {
        cell.appendChild(el("div", {
            className: "stat-block",
            innerText: `P: ${game.pitcher.name_display_roster} (${game.pitcher.wins}-${game.pitcher.losses}, ${game.pitcher.era})`,
        }));
        cell.appendChild(el("div", {
            className: "stat-block",
            innerText: `AB: ${game.batter.name_display_roster} (${game.batter.h}-${game.batter.ab}, ${game.batter.avg})`,
        }));
    }
    row.appendChild(cell);
    table.appendChild(row);

    return table;
}

function getPostgameStatus(game) {
    var text = game.status.status;

    if (game.status.inning !== "9") {
        text += "/" + game.status.inning;
    }

    if (game.game_nbr > 1) {
        text += ` - Game ${game.game_nbr}`;
    }

    return text;
}

function makePostgameWidget(game) {
    var table = document.createElement("table");

    // Header
    var row = document.createElement("tr");
    row.appendChild(el("th", { className: "align-left status", innerText: getPostgameStatus(game) }));
    row.appendChild(el("th", { className: "rhe-header", innerText: "R" }));
    row.appendChild(el("th", { className: "rhe-header", innerText: "H" }));
    row.appendChild(el("th", { className: "rhe-header", innerText: "E" }));
    table.appendChild(row);

    // Body
    var awayWin = (+game.linescore.r.away > +game.linescore.r.home);
    var homeWin = (+game.linescore.r.home > +game.linescore.r.away);
    table.appendChild(makeStatRow(game, "away", awayWin ? "winning-team" : homeWin ? "losing-team" : "tied-team"));
    table.appendChild(makeStatRow(game, "home", homeWin ? "winning-team" : awayWin ? "losing-team" : "tied-team"));

    // Footer
    row = document.createElement("tr");
    var cell = el("td", { className: "xsdata status2", colSpan: "4" });
    cell.appendChild(el("div", { className: "stat-block", innerText: getGamePitcher(game, "winning") }));
    cell.appendChild(el("div", { className: "stat-block", innerText: getGamePitcher(game, "losing") }));
    if (getSavePitcher(game) !== "") {
        cell.appendChild(el("div", { className: "stat-block", innerText: getSavePitcher(game) }));
    }
    row.appendChild(cell);
    table.appendChild(row);

    return table;
}

function makeStandingsTeamCell(team) {
    var cell = document.createElement("td");
    cell.appendChild(getIcon(team.name, "logo"));
    cell.appendChild(document.createTextNode(" " + team.name));
    return cell;
}

function makeStandingsStatCell(team, stat) {
    return el("td", { className: "rhe-data", innerText: team[stat] });
}

function makeStandingsRow(team) {
    var row = document.createElement("tr");

    row.appendChild(makeStandingsTeamCell(team));
    ["W", "L", "GB", "L10", "STRK"].map(function(column) {
        row.appendChild(makeStandingsStatCell(team, column));
    });

    return row;
}

function makeStandingsWidget(division) {
    var table = document.createElement("table");

    // Header
    var row = document.createElement("tr");
    row.appendChild(el("th", {
        className: "align-left status",
        innerText: division.name
    }));

    ["W", "L", "GB", "L10", "STRK"].map(function(column) {
        row.appendChild(el("th", { className: "rhe-header", innerText: column }));
    });

    table.appendChild(row);

    // Body
    for (var i in division.teams) {
        table.appendChild(makeStandingsRow(division.teams[i]));
    }

    return table;
}

Module.register("MMM-MLB", {

    // Module config defaults.
    defaults: {
        updateInterval: 3*60000, // every 3 minutes
        animationSpeed: 10,
        initialLoadDelay: 2500, // 2.5 seconds delay
        maxWidth: "400px",
        rotateInterval: 5 * 1000,
        header: true,
        logo: false,
        focus_on: [],
        mode: "scoreboard",
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
        // Set locale.
        self.week = "";
        self.scoreboard = { date: null, scores: [] };
        self.standings = [];
        self.activeItem = 0;
        self.rotateInterval = null;
        self.updateInterval = null;
        self.scheduleUpdate();
    },

    getDom: function() {
        var self = this;
        var wrapper = document.createElement("div");
        wrapper.className = "wrapper";
        wrapper.style.maxWidth = self.config.maxWidth;

        if (self.config.header === true) {
            var text = `MLB ${(self.config.mode === "scoreboard") ? "Scores" : "Standings"} ${self.scoreboard.date || ""}`;

            var header = el("header", { className: "header" });
            if (self.config.logo === true) {
                header.appendChild(getIcon("mlb", "emblem"));
            }
            header.appendChild(document.createTextNode(text));

            wrapper.appendChild(header);
        }

        if (self.config.mode === "scoreboard") {
            if (self.scoreboard.scores.length > 0) {
                if (self.activeItem >= self.scoreboard.scores.length) {
                    self.activeItem = 0;
                }
                var game = self.scoreboard.scores[self.activeItem];

                var top = document.createElement("div");
                top.classList = "small bright";

                if (game.status.status === "Postponed" || game.status.status.startsWith("Delayed Start")) {
                    top.appendChild(makePostponedWidget(game));
                } else if (["Preview", "Pre-Game", "Delayed Start"].includes(game.status.status)) {
                    top.appendChild(makePregameWidget(game));
                } else if (["Game Over", "Final"].includes(game.status.status)) {
                    top.appendChild(makePostgameWidget(game));
                } else {
                    top.appendChild(makeInProgressWidget(game));
                }

                wrapper.appendChild(top);
            }
        } else {
            if (self.standings.length > 0) {
                if (self.activeItem >= self.standings.length) {
                    self.activeItem = 0;
                }
                var division = self.standings[self.activeItem];

                var top = document.createElement("div");
                top.classList = "small bright";

                top.appendChild(makeStandingsWidget(division));

                wrapper.appendChild(top);
            }
        }

        return wrapper;
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
            self.getData();
        }, self.config.updateInterval);
        self.getData();
    },


    getData: function() {
        var self = this;
        if (self.config.mode === "standings") {
            self.sendSocketNotification('GET_MLB_STANDINGS', self.config);
        } else {
            self.sendSocketNotification('GET_MLB_SCOREBOARD', self.config);
        }
    },

    socketNotificationReceived: function(notification, payload) {
        var self = this;
        if (notification === 'MLB_SCOREBOARD' && self.config.mode === "scoreboard") {
            self.scoreboard = payload;
            if (self.rotateInterval == null) {
                self.scheduleCarousel();
            }
            self.updateDom(self.config.animationSpeed);
        } else if (notification === 'MLB_STANDINGS' && self.config.mode === "standings") {
            self.standings = payload;
            if (self.rotateInterval == null) {
                self.scheduleCarousel();
            }
            self.updateDom(self.config.animationSpeed);
        }
    },

    notificationReceived: function (notification, payload, sender) {
        var self = this;
        if(notification === "ALL_MODULES_STARTED"){
            self.sendNotification("REGISTER_VOICE_MODULE", {
                mode: "BASEBALL",
                sentences: [
                    "SHOW STANDINGS",
                    "HIDE STANDINGS"
                ]
            });
        } else if(notification === "VOICE_BASEBALL" && sender.name === "MMM-voice"){
            self.checkCommands(payload);
        } else if(notification === "VOICE_MODE_CHANGED" && sender.name === "MMM-voice" && payload.old === "BASEBALL"){
            self.checkCommands("HIDE STANDINGS");
        }
    },

    checkCommands: function(data){
        var self = this;
        if(/(STANDINGS)/g.test(data)){
            if(/(SHOW)/g.test(data)) {
                self.config.mode = "standings";
            } else if(/(HIDE)/g.test(data)) {
                self.config.mode = "scoreboard";
            }
            self.updateDom(self.config.animationSpeed);
            self.getData();
        }
    }
 });
