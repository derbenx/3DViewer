<?php
header('Content-Type: application/json');

$files = glob('3d/*.gltf');
if ($files === false) {
    // glob() can return false on error
    echo json_encode([]);
    exit;
}

// Also search for .glb files, as they are a common format for glTF.
$glb_files = glob('3d/*.glb');
if ($glb_files !== false) {
    $files = array_merge($files, $glb_files);
}

echo json_encode($files);
?>
