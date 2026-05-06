Add-Type -AssemblyName System.Drawing
$imgPath = "c:\wamp64\www\torowin-client\public\favicon.png"
$outPath = "c:\wamp64\www\torowin-client\public\favicon_transparent.png"

$img = [System.Drawing.Image]::FromFile($imgPath)
$bmp = New-Object System.Drawing.Bitmap($img)
$img.Dispose()

# We make pure white and near-white transparent
for ($x = 0; $x -lt $bmp.Width; $x++) {
    for ($y = 0; $y -lt $bmp.Height; $y++) {
        $pixel = $bmp.GetPixel($x, $y)
        if ($pixel.R -gt 235 -and $pixel.G -gt 235 -and $pixel.B -gt 235) {
            $bmp.SetPixel($x, $y, [System.Drawing.Color]::Transparent)
        }
    }
}

$bmp.Save($outPath, [System.Drawing.Imaging.ImageFormat]::Png)
$bmp.Dispose()
Write-Host "Background removed successfully."
