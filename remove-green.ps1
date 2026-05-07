Add-Type -AssemblyName System.Drawing
$imgPath = "C:\Users\PedroLuisToro\.gemini\antigravity\brain\27391fde-1448-4723-8054-08542e24d7ab\purple_gold_envelope_green_bg_1778119391569.png"
$outPath = "c:\wamp64\www\torowin-client\public\favicon.png"

$img = [System.Drawing.Image]::FromFile($imgPath)
$bmp = New-Object System.Drawing.Bitmap($img)
$img.Dispose()

# Remove the green background (chroma key)
for ($x = 0; $x -lt $bmp.Width; $x++) {
    for ($y = 0; $y -lt $bmp.Height; $y++) {
        $pixel = $bmp.GetPixel($x, $y)
        # If Green is significantly higher than Red and Blue, it's the background
        if ($pixel.G -gt ($pixel.R + 30) -and $pixel.G -gt ($pixel.B + 30)) {
            $bmp.SetPixel($x, $y, [System.Drawing.Color]::Transparent)
        }
    }
}

$bmp.Save($outPath, [System.Drawing.Imaging.ImageFormat]::Png)
$bmp.Dispose()
Write-Host "Green background removed successfully."
