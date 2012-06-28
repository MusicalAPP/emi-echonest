<?php
$file = urldecode($_GET["file"]);
$image = file_get_contents($file);
header("Content-type: image/jpeg");
echo $image;