# MMM-MLB
~MagicMirror/modules

git clone https://github.com/cowboysdude/MMM-MLB

~MagicMirror/modules/MMM-MLB

npm install

______________CONFIG.JS______________________

                     {
                        disabled: false,
			module: 'MMM-MLB',
			position: 'top_center',
			config: {			      
				maxWidth: "400px",
				header: true,
				logo: true,
				focus_on: ["Indians", "Braves", "Yankees"]
			}
		   },
 ___________________________________________
      *maxWidth best to set to 350 MIN .. 400px is best!
      *To use MLB logo header MUST be set to true
      
      config options:
      maxWidth: set max width in px - ie "500px"  - default is 400
      header: do you want a header?  
      logo:  Do you want to see the MLB logo? IF so this AND header must be set to true
      focus_on: [] - teams MUST be in double quotes like above seperated by comas within the brackets [ ]
      (Thank YOU strawberry!!!!)
      
 Custom.css colors you can configure:
 
    
          .MMM-MLB .header 
          .MMM-MLB .status 
          .MMM-MLB .r 
          .MMM-MLB .h 
          .MMM-MLB .e 
          .MMM-MLB .hometeam 
          .MMM-MLB .awayteam 
	  .MMM-MLB .status2
          .MMM-MLB .status3 
 	  .MMM-MLB .status4
	  
	  
	  
![alt tag](http://www.dallascowboyschat.com/mm/progress.JPG)

![alt tag](http://www.dallascowboyschat.com/mm/progress2.JPG)

