<?php
header('Content-Type: application/json');

// Use GLOB_BRACE to find all supported file types in one go.
$files = glob('3d/*.{gltf,glb,fbx,obj,stl,jpg,jpeg,png}', GLOB_BRACE);

// Ensure a consistent order
sort($files);

if ($files === false) {
    // glob() can return false on error
    echo json_encode([]);
    exit;
}

echo json_encode($files);
?>
