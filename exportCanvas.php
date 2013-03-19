<?php

if ($_POST['base64']) {
	$base64 = $_POST['base64'];
	$img = str_replace('data:image/png;base64,', '', $base64);
	$img = str_replace(' ', '+', $img);
	$data = base64_decode($img);
	
	echo (file_put_contents('upload/'.md5(uniqid(rand(), true)).'.png', $data)) ? "Fichier téléchargé !" : "Erreur !";
}

?>