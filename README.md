# Module: MMM-MLB
The module allows you to view daily scores and standings for the MLB.

## Installation

In your terminal, go to your MagicMirror's Module folder:
````
cd ~/MagicMirror/modules
````

Clone this repository:
````
git clone https://github.com/cowboysdude/MMM-MLB.git
````

Configure the module in your `config.js` file.

## Using the module

To use this module, add it to the modules array in the `config/config.js` file:
````javascript
modules: [
  {
    module: "MMM-MLB",
    position: "top_center",
    config: { // See "Configuration options" for more information.
      maxWidth: "400px",
      header: true,
      logo: true,
      focus_on: ["Indians", "Braves", "Yankees"]
    }
  }
]
````

## Configuration options

The following properties can be configured:

|Option|Default|Description|
|---|---|---|
|`updateInterval`|`3*60000`|How often (in ms) to update data from the server.|
|`animationSpeed`|`10`|How long (in ms) animate transitions.|
|`initialLoadDelay`|`2500`|How long (in ms) to wait before initial data load.|
|`maxWidth`|`"400px"`|Maximum width (in css units) of the widget.|
|`rotateInterval`|`5 * 1000`|How often (in ms) to rotate between scores/divisions.|
|`header`|`true`|Whether or not to display a header showing the mode and date at the top of the widget.|
|`logo`|`false`|Whether or not to display the MLB logo in the header.|
|`focus_on`|`[]`|When set, games or divisions involving the listed teams will be displayed. (Thank you strawberry!)|
|`mode`|`"scoreboard"`|Set to `"standings"` to display standings.|

## Custom CSS
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
