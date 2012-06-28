# OpenEMI Echo Nest Demo

This is a sample app using a php Echo Nest API client to create a 3D Carousel. It works with the Gorillaz sandbox, but with some tweaks it should work with others. Google Chrome only!

## You'll need..

* A local dev server running PHP+MySQL
* PHP user will need write permissions on the packshots/ directory
* An Echo Nest developer account
* Echo Nest / OpenEMI Sandbox access
* An Amazon Product Advertising API account

## Set up

### Clone this repo to your development server:
	
	git clone https://github.com/theflyingbrush/emi-echonest.git

### Update the submodules

	git submodule init
	git submodule update

### Create a local MySQL database:

	mysql -u {your_user} --password={your_password}

	mysql > CREATE DATABASE emi_echonest;

	mysql > exit;

### Configure the app. Edit config/Config.php and provide:

* Your Echo Nest API KEY
* Your Echo Nest Sandbox Key. The app works with emi_gorillaz out of the box.
* Your Echo Nest OAuth Consumer Key
* Your Echo Nest OAuth Shared Secret

* Your Amazon API KEY
* Your Amazon OAuth Consumer Key
* Your Amazon OAuth Shared Secret
* Your Amazon Associate Tag (if you don't have one, any string will do)

* Your local database details: database name (emi_echonest, if you used the one above), username and password.

###Create the index

You will need to index the Echo Nest sandbox to the local database before use:

Browse to http://localhost/path/to/your/app/api.php?action=index

You may need to change your max_script_execution time in php.ini if the script times out while indexing.

### Run the app

Launch Google Chrome and browse to http://localhost/path/to/your/app/

## Customising for a different sandbox

If you want to try a different sandbox with this app, you'll have trouble getting packshots from amazon and itunes. Replace mentions of Gorillaz from lib/emi/echonest/EMISandboxApp.php with your chosen artist, or if using a mixed-artist sandbox, just remove the conditions that check the artist name.

## Supporting libs kindly provided by:

* php-echonest-client (https://github.com/bshaffer/php-echonest-api)
* Three.js (https://github.com/mrdoob/three.js/)
* Threex.js (https://github.com/jeromeetienne/threex)
* Tween.js (https://github.com/sole/tween.js/)