  /* Magic Mirror
    * Module: MMM-MLB
    *
    * By cowboysdude
    * 
    */
   
Module.register("MMM-MLB", {

       // Module config defaults.
       defaults: {
           updateInterval: 60000, // every 2 minutes
           animationSpeed: 10,
           initialLoadDelay: 875, // 0 seconds delay
           retryDelay: 1500,
           maxWidth: "300px",
           fadeSpeed: 4,
           rotateInterval: 5 * 1000
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
           
           // Set locale.
           this.week = "";
           this.mlb = {};
           this.today = "";
           this.activeItem = 0;
           this.rotateInterval = null;
           this.scheduleUpdate();
       },

      getDom: function() {
         
          var games = this.mlb;
         
         var wrapper = document.createElement("div");
         wrapper.className = "wrapper";
         wrapper.style.maxWidth = this.config.maxWidth;
         
         var header = document.createElement("header");
         header.classList.add("header");
         header.innerHTML = "MLB Scores     " + moment().format('MM/DD/YYYY');
         wrapper.appendChild(header);
        
         var gkeys = Object.keys(this.mlb);
         if (gkeys.length > 0) {
             if (this.activeItem >= gkeys.length) {
                 this.activeItem = 0;
             }
         var games = this.mlb[gkeys[this.activeItem]];
             
         var top = document.createElement("div");
         top.classList= "small bright";
             
         var gameTable = document.createElement("table");
         var firstrow = document.createElement("tr");
         var teamcolumn = document.createElement("th");
         teamcolumn.setAttribute("colspan", 3);
         teamcolumn.classList.add("align-left", "status");
         if (games.status.status === "In Progress"){
		 teamcolumn.innerHTML = "Inning: "+ games.status.inning;	
		 } else {
		 teamcolumn.innerHTML = games.status.status;	
		 }
         firstrow.appendChild(teamcolumn);
         gameTable.appendChild(firstrow);
        
         var runscolumn = document.createElement("th");
         runscolumn.setAttribute("colspan", 1);
         runscolumn.classList.add("r");
         runscolumn.innerHTML = "R";
         firstrow.appendChild(runscolumn);
         gameTable.appendChild(firstrow);
         
         var hitscolumn = document.createElement("th");
         hitscolumn.setAttribute("colspan", 1);
         hitscolumn.classList.add("h");
         hitscolumn.innerHTML = "H";
         firstrow.appendChild(hitscolumn);
         gameTable.appendChild(firstrow);
         
         var ecolumn = document.createElement("th");
         ecolumn.setAttribute("colspan", 1);
         ecolumn.classList.add("e");
         ecolumn.innerHTML = "E";
         firstrow.appendChild(ecolumn);
         gameTable.appendChild(firstrow);
         
         var awayTemp = document.createElement("tr");
         var awayTempColumn = document.createElement("td");
         var awayImg = '<img class="logo" src="modules/MMM-MLB/icons/'+ games.away_team_name +'.png"> ' + games.away_team_name;
         awayTempColumn.setAttribute("colspan", 3);
         awayTempColumn.classList.add("awayteam"); 
		 awayTempColumn.innerHTML = awayImg;	
		 
         
         awayTemp.appendChild(awayTempColumn);
         gameTable.appendChild(awayTemp);
         
         var awayScoreColumn = document.createElement("td");
         awayScoreColumn.setAttribute("colspan", 1);
		 if (games.status.status != "Preview"){
		 awayScoreColumn.innerHTML = games.linescore.r.away ===  "" || undefined || null ? "0" : games.linescore.r.away;	
         awayTemp.appendChild(awayScoreColumn);
         gameTable.appendChild(awayTemp);
         } else {
		 awayScoreColumn.innerHTML = "0";	
         awayTemp.appendChild(awayScoreColumn);
         gameTable.appendChild(awayTemp);	
		 }
		
         var awayHitsColumn = document.createElement("td");
         awayHitsColumn.setAttribute("colspan", 1);
         if (games.status.status != "Preview"){
		 awayHitsColumn.innerHTML = games.linescore.h.away === "" || undefined || null ? "0" : games.linescore.h.away;	
         awayTemp.appendChild(awayHitsColumn);
         gameTable.appendChild(awayTemp);
         }else{
		 awayHitsColumn.innerHTML = "0";	
         awayTemp.appendChild(awayHitsColumn);
         gameTable.appendChild(awayTemp);	
		 }
         
         var awayErrorColumn = document.createElement("td");
         awayErrorColumn.setAttribute("colspan", 1);
         if (games.status.status != "Preview"){
		 awayErrorColumn.innerHTML = games.linescore.e.away === "" || undefined || null ? "0" : games.linescore.e.away;
         awayTemp.appendChild(awayErrorColumn);
         gameTable.appendChild(awayTemp);
         }else{
		 awayErrorColumn.innerHTML = "0";
         awayTemp.appendChild(awayErrorColumn);
         gameTable.appendChild(awayTemp);	
		 }
         
         var homeTemp = document.createElement("tr");
         var homeTempColumn = document.createElement("td");
         var homeImg = '<img class="logo" src="modules/MMM-MLB/icons/'+ games.home_team_name +'.png"> ' + games.home_team_name;
         homeTempColumn.setAttribute("colspan", 3);
         homeTempColumn.classList.add("hometeam");
         homeTempColumn.innerHTML = '<img class="logo" src="modules/MMM-MLB/icons/'+ games.home_team_name +'.png"> ' + games.home_team_name;
         homeTemp.appendChild(homeTempColumn);
         gameTable.appendChild(homeTemp);
         
         var homeScoreColumn = document.createElement("td");
         homeScoreColumn.setAttribute("colspan", 1);
         if (games.status.status != "Preview"){
		 homeScoreColumn.innerHTML = games.home_team_runs === "" || undefined || null ? "0" : games.linescore.r.home;
         homeTemp.appendChild(homeScoreColumn);
         gameTable.appendChild(homeTemp);
         } else {
		 homeScoreColumn.innerHTML = "0";
         homeTemp.appendChild(homeScoreColumn);
         gameTable.appendChild(homeTemp);	
		 }
         var homeHitsColumn = document.createElement("td");
         homeHitsColumn.setAttribute("colspan", 1);
         if (games.status.status != "Preview"){
		 homeHitsColumn.innerHTML = games.linescore.h.home === "" || undefined || null ? "0" : games.linescore.h.home;
         homeTemp.appendChild(homeHitsColumn);
         gameTable.appendChild(homeTemp);
         } else {
		 homeHitsColumn.innerHTML = "0";
         homeTemp.appendChild(homeHitsColumn);
         gameTable.appendChild(homeTemp);	
		 }
         
         var homeErrorColumn = document.createElement("td");
         homeErrorColumn.setAttribute("colspan", 1);
         if (games.status.status != "Preview"){
		 homeErrorColumn.innerHTML = games.linescore.e.home === "" || undefined || null ? "0" : games.linescore.e.home;
         homeTemp.appendChild(homeErrorColumn);
         gameTable.appendChild(homeTemp);
         } else {
		 homeErrorColumn.innerHTML = "0";
         homeTemp.appendChild(homeErrorColumn);
         gameTable.appendChild(homeTemp);	
		 }
         
         var statusTemp = document.createElement("tr");
         var statusTempColumn = document.createElement("td");
         statusTempColumn.className= "xsmall bright";
         statusTempColumn.setAttribute("colspan", 1);
         if (games.status.status === "Final" && games.winning_pitcher.first != ""){
		 statusTempColumn.innerHTML = "WP: "+ games.winning_pitcher.first + " " +games.winning_pitcher.last;	
		 } else if (games.status.status === "Final" && games.save_pitcher.first != ""){
		 statusTempColumn.innerHTML = "Save: "+ games.save_pitcher.first + " " +games.save_pitcher.last;
		 } else if  (games.status.status === undefined || null || "Preview" && games.status.status === "Final" ){
		 statusTempColumn.innerHTML = "No Pitcher information";	
		 } else if  (games.status.status === "Preview"){
		 statusTempColumn.innerHTML = "Pitchers: Home - " + games.home_probable_pitcher.first_name +" "+games.home_probable_pitcher.last + " Away - "+games.away_probable_pitcher.first_name +" "+games.away_probable_pitcher.last;	
		 }	else if (games.status.status === undefined || null || "Preview" ){
		 statusTempColumn.innerHTML = "No Pitcher information";
		 } else if (games.winning_pitcher.first === "" || null || undefined  && games.save_pitcher.first === "" || null || undefined ){
		 statusTempColumn.innerHTML = "No Pitcher information";	
		 } else {
		 statusTempColumn.innerHTML = "In Progress - Inning:   " + games.inning;	
		 }
         statusTemp.appendChild(statusTempColumn);
         gameTable.appendChild(statusTemp);
 
         var venuetemp = document.createElement("tr");
         var venuetempColumn = document.createElement("td");
         venuetempColumn.className= "xsmall bright";
         venuetempColumn.setAttribute("colspan", 4);
         if (games.status.status === "In progress"){
         venuetempColumn.innerHTML = "In progress" + games.status.status + "Inning: "+ games.status.inning;
		 } else if (games.status.status === "Final"){
		 venuetempColumn.innerHTML = "Game time:  " + games.time  +" - "+   games.aw_lg_ampm  +"  "+   games.time_zone;
		 } else {
		 venuetempColumn.innerHTML = games.venue +"  "+ "--Game time:  " + games.time  +" - "+   games.aw_lg_ampm  +"  "+   games.time_zone;	
		 }
		 venuetemp.appendChild(venuetempColumn);
         gameTable.appendChild(venuetemp);
         
         top.appendChild(gameTable);
         wrapper.appendChild(top);
       }
        
         return wrapper;
        
     },
     
     processMLB: function(data) {
         this.today = data.Today;
         this.mlb = data.game;
         this.loaded = true;
     },
     
     scheduleCarousel: function() {
         console.log("Showing games today");
         this.rotateInterval = setInterval(() => {
             this.activeItem++;
             this.updateDom(this.config.animationSpeed);
         }, this.config.rotateInterval);
     },
     
     scheduleUpdate: function() {
         setInterval(() => {
             this.getMLB();
         }, this.config.updateInterval);
         this.getMLB(this.config.initialLoadDelay);
     },
     
      getMLB: function() {
         this.sendSocketNotification('GET_MLB');
     },

        socketNotificationReceived: function(notification, payload) {
         if (notification === 'MLB_RESULTS') {
             this.processMLB(payload);
             if (this.rotateInterval == null) {
                 this.scheduleCarousel();
             }
             this.updateDom(this.config.animationSpeed);
         }
     },
});
