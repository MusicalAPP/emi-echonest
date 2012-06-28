<?php

//ini_set('error_log',dirname(__FILE__) . "/error_log");

require("Zend/Loader/Autoloader.php");
$autoloader = Zend_Loader_Autoloader::getInstance();

class EMISandboxApp {

	private $amazon;
	private $api_key;
	private $sandbox_name;
	private $client;
	private $sandbox;
	private $track;
	private $playlist;
	private $debug = false;
	private $action;
	/* The database connection */
	private $conn;

	public function __construct($api_key, $consumer_key, $shared_secret, $sandbox_name, $debug = false){

		$this->api_key = $api_key;
		$this->sandbox_name = $sandbox_name;
		$this->debug = $debug;

		$options = array( "debug" => $this->debug);
		$httpClient = new EchoNest_HttpClient_Curl($options);
		$this->client = new EchoNest_Client($httpClient);

		$this->client->authenticate($this->api_key);
		$this->client->setOAuthCredentials($consumer_key, $shared_secret );

		$this->track = $this->client->getTrackApi();
		$this->song = $this->client->getSongApi();
		$this->sandbox = $this->client->getSandboxApi(array("sandbox" => $sandbox_name));
		
		$this->playlist = $this->client->getPlaylistApi();
		
		$this->amazon = new Zend_Service_Amazon(AMAZON_KEY, AMAZON_COUNTRY, AMAZON_SECRET, AMAZON_ASSOCIATE_TAG);

		$this->action = isset($_GET["action"]) ? $_GET["action"] : "index";
		
		$this->render($this->action);
		
	}

	public function render($action){
			header("Content-type: application/json");
			call_user_func(array($this, $action));
		
	}

	public function release_query($options = array()){

		$params = array("bucket" => array("id:emi_artists","tracks") , "artist" => "Gorillaz", "limit" => true, "results" => 50);
		$params = array_merge($params, $options);
		$playlist = $this->playlist->getStatic($params);
    	$merged = array();
    	/* Loop through the song/search results */
    	for($i = 0; $i < count($playlist); $i++){
	    	$merged[$i] = $playlist[$i];
	    	$hashed_title = md5($merged[$i]["title"]) . ".jpg";
	    	/* If this image doesn't exist in our packshot cache, then attempt to get one from amazon*/
	    	if(!file_exists( PACKSHOT_CACHE . $hashed_title )){
	    		 $new_image = $this->image_url_for_product($merged[$i]["title"]);
	    		 //error_log($new_image);
	    		 if(!empty($new_image)){
	    		 	$data = file_get_contents($new_image);
	    		 	file_put_contents(PACKSHOT_CACHE . $hashed_title, $data);
	    		 } else {
	    		 	$hashed_title = "missing.jpg";
	    		 }
	    	} 
    		$merged[$i]["image"] = "packshots/" . $hashed_title;
   		}
    	return $merged;
	}

	private function index(){

		$this->conn = mysql_connect('localhost', DATABASE_USER, DATABASE_PASSWORD);
		mysql_select_db(DATABASE_NAME);
		
		$create_table = "CREATE TABLE `emi_gorillaz`.`assets` (
		`id` INT NOT NULL AUTO_INCREMENT PRIMARY KEY ,
		`echonest_id` VARCHAR( 255 ) NOT NULL ,
		`sandbox_id` VARCHAR( 255 ) NOT NULL ,
		`type` VARCHAR( 255 ) NOT NULL ,
		`file_ext` VARCHAR( 255 ) NOT NULL ,
		`title` TEXT NOT NULL ,
		INDEX ( `echonest_id` , `sandbox_id` )
		) ENGINE = MYISAM ;";

		$create_success = mysql_query($create_table) or die(mysql_error());

		$page = 0;
		$num_assets = 0;
		
		do {
		$list = $this->sandbox->getList(array("results" => 100, "start" => $page * 100));
		
		foreach($list["assets"] as $asset){
			
			if(!empty($asset["echonest_ids"])){
				$echonest_id = $asset["echonest_ids"][0]["id"];
			} else {
				$echonest_id = "";
			}
	
			if(!empty($asset['title'])){
				$title = mysql_real_escape_string($asset['title']);
			} else {
				$title = "Untitled";
			}
			$sandbox_id = $asset['id'];
			$type = $asset['type'];
			$file_extension = $this->_file_extension_from_filename($asset['filename']);


			$query = "INSERT INTO `assets` SET `title` = '" . $title . "', `sandbox_id` = '" . $sandbox_id . "', `type` = '" . $type . "', `file_ext` = '" . $file_extension . "', `echonest_id` = '" . $echonest_id . "'";
			
			$success = mysql_query($query) or die(mysql_error());
			if($success === true){
				$num_assets += 1;
			}
		}

		$page += 1;
		} while(!empty($list["assets"]));

		echo "Complete. Retrieved $num_assets assets.";

	}

	private function track_profile(){
		$id = $_GET["id"];
		$result = $this->track->profile($id, "audio_summary");
		
		echo json_encode($result);
	}

	private function song_profile(){
		$id = $_GET["id"];
		$result = $this->song->profile($id);
		
		echo json_encode($result);
		
	}

	private function access(){
		
		// this is a track id, not a sandbox asset id. Lookup the asset in the database then defer to _access;
		$id = $_GET["id"];
		$this->conn = mysql_connect('localhost', DATABASE_USER, DATABASE_PASSWORD);
		mysql_select_db(DATABASE_NAME);
		$query = "SELECT * FROM assets WHERE echonest_id = '" . mysql_real_escape_string($id) . "' LIMIT 1";
		$search_result = mysql_query($query) or die(mysql_error);
		if($search_result){
			$asset = mysql_fetch_object($search_result);

			$asset_result = $this->_access($asset->sandbox_id);
		} else {
			$asset_result = array("success" => 0);
		}				
		echo json_encode($asset_result);
	}

	private function _access($id){
		$result = $this->sandbox->access($id);
		return $result;
	}

	private function list_all(){
		$results = $this->release_query();
		
		echo json_encode($results);
	}

	private function image_url_for_product($title){
		$results = $this->amazon->itemSearch(array('SearchIndex' => 'MP3Downloads',
                                     'Title' => $title,
                                     'Creator' => "Gorillaz",
                                     'ResponseGroup' => "Medium,Images"));

		foreach ($results as $result) {

			if(isset($result->Creator) && $result->Creator == "Gorillaz"){
				if(isset($result->Publisher) && strstr($result->Publisher, "EMI") !== FALSE){	
    				return $this->make_webgl_friendly_image($result->LargeImage->Url->getUri());
    			}
  			}
		}

		$itunes = $this->do_itunes_search($title);
		//var_dump($itunes);
		foreach($itunes->results as $result){
			if( stristr($result->artistName, "Gorillaz") !== FALSE){
				$artwork_url = $result->artworkUrl100;
				//http://a1.mzstatic.com/us/r1000/007/Music/y2004/m06/d23/h15/s06.cbagdien.100x100-75.jpg
				$large_url = str_replace("100x100", "200x200", $artwork_url);
				return $large_url;
			}
		}

	}

	public function amazon_search(){
		header("Content-type: text/html");
		$title = $_GET["title"];
		$results = $this->amazon->itemSearch(array('SearchIndex' => 'MP3Downloads',
                                     'Title' => $title,
                                     'Creator' => "Gorillaz",
                                     'ResponseGroup' => "Medium,Images"));

		foreach ($results as $result) {

			if(isset($result->Creator) && $result->Creator == "Gorillaz"){

				if(isset($result->Publisher) && strstr($result->Publisher, "EMI") !== FALSE){
					echo "<p>{$result->Title}</p>";
					echo "<p>{$result->Creator}</p>";
					echo "<p>{$result->Publisher}</p>";
					echo "<img src='" . $result->LargeImage->Url->getUri() . "'>";
					echo "<p>------------------</p>";
				}
    		//return $result->LargeImage->Url->getUri();
  			}
		}

	}

	private function do_itunes_search($title){

//http://itunes.apple.com/search?media=music&entity=musicTrack&term=Faust&country=gb

		$title = urlencode($title);
		$url = "http://itunes.apple.com/search?media=music&entity=musicTrack&term=$title&country=gb";
		$data = file_get_contents($url);
		$arr = json_decode($data);
		return $arr;

	}

	public function itunes_search(){
		$title = urldecode($_GET["title"]);
		header("Content-type: text/html");
		$itunes = $this->do_itunes_search($title);
		foreach($itunes->results as $result){
			if( stristr($result->artistName, "Gorillaz") !== FALSE){
				$artwork_url = $result->artworkUrl100;
				//http://a1.mzstatic.com/us/r1000/007/Music/y2004/m06/d23/h15/s06.cbagdien.100x100-75.jpg
				$large_url = str_replace("100x100", "200x200", $artwork_url);
				var_dump($result->trackName);
				var_dump($result->collectionName);
				var_dump($large_url);
			}
		}
	}

	private function make_webgl_friendly_image($url){
		
		if(!$url){return false;}
		$file = substr($url, 0, -3);
		return $file . "_SX256_AA256_.jpg";
	}

	public function view(){
		$access = $this->sandbox->access($_GET["id"]);
		
		echo json_encode($access);
	}

	private function _file_extension_from_filename($name){
		return substr(strrchr($name, "."), 1);
	}

}
