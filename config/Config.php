<?php
// Echo Nest Credentials
define("API_KEY", "{YOUR API KEY}");
define("SANDBOX_NAME", "{YOUR SANDBOX KEY}");
define("CONSUMER_KEY", "{YOUR CONSUMER KEY}");
define("SHARED_SECRET", "{YOUR SHARED SECRET}");
// Amazon Credentials
define("AMAZON_KEY", "{YOUR AMAZON KEY}");
define("AMAZON_COUNTRY", "{YOUR AMAZON COUNTRY - UK}");
define("AMAZON_SECRET", "{YOUR AMAZON SECRET}");
define("AMAZON_ASSOCIATE_TAG", "your-amazon-tag1");
// Index Database Connection
define("DATABASE_NAME", "{YOUR DATABASE NAME}");
define("DATABASE_USER", "{YOUR DATABASE USERNAME}");
define("DATABASE_PASSWORD", "{YOUR DATABASE PASSWORD}");

// Paths
define("DS", DIRECTORY_SEPARATOR);
define("PACKSHOT_CACHE", realpath(dirname(__FILE__). DS . ".." . DS . "packshots") . DS);
define("LIB_DIR", realpath( dirname(__FILE__) . DS . ".." . DS . "lib" . DS) . DS );
define("ECHONEST_API_LIB_DIR", LIB_DIR . "php-echonest-api" . DS . "lib" . DS);
define("ECHONEST_LIB", ECHONEST_API_LIB_DIR . "EchoNest" . DS);

// Requires
require_once ECHONEST_LIB . 'Autoloader.php';
EchoNest_Autoloader::register();