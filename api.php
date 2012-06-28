<?php

require "config/Config.php";
require("lib/emi/echonest/EMISandboxApp.php");
$app = new EMISandboxApp(API_KEY, CONSUMER_KEY, SHARED_SECRET, SANDBOX_NAME, false);