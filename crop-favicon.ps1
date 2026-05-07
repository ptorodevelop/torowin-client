Add-Type -AssemblyName System.Drawing
$path = "c:\wamp64\www\torowin-client\public\favicon.png"
$bmp = New-Object System.Drawing.Bitmap($path)

$minX = $bmp.Width
$maxX = 0
$minY = $bmp.Height
$maxY = 0

# Find the bounding box of non-transparent pixels
for ($x = 0; $x -lt $bmp.Width; $x++) {
    for ($y = 0; $y -lt $bmp.Height; $y++) {
        $p = $bmp.GetPixel($x, $y)
        if ($p.A -gt 5) { # Ignore almost transparent pixels
            if ($x -lt $minX) { $minX = $x }
            if ($x -gt $maxX) { $maxX = $x }
            if ($y -lt $minY) { $minY = $y }
            if ($y -gt $maxY) { $maxY = $y }
        }
    }
}

$width = $maxX - $minX + 1
$height = $maxY - $minY + 1

if ($width -le 0 -or $height -le 0) {
    Write-Host "Error: No visible pixels found."
    exit
}

# Add a tiny bit of padding (0% to make it as big as possible)
$padding = 0
$size = [Math]::Max($width, $height)

# Create a new square bitmap
$final = New-Object System.Drawing.Bitmap($size, $size)
$g = [System.Drawing.Graphics]::FromImage($final)
$g.Clear([System.Drawing.Color]::Transparent)

# Center the cropped image in the new square
$destX = ($size - $width) / 2
$destY = ($size - $height) / 2
$destRect = New-Object System.Drawing.Rectangle($destX, $destY, $width, $height)
$srcRect = New-Object System.Drawing.Rectangle($minX, $minY, $width, $height)

$g.DrawImage($bmp, $destRect, $srcRect, [System.Drawing.GraphicsUnit]::Pixel)

# Brightening Pass: Make the dark colors pop more for dark mode tabs
for ($x = 0; $x -lt $final.Width; $x++) {
    for ($y = 0; $y -lt $final.Height; $y++) {
        $p = $final.GetPixel($x, $y)
        if ($p.A -gt 10) {
            # Increase brightness significantly (especially for dark purple)
            $factor = 1.6
            $r = [Math]::Min(255, [int]($p.R * $factor + 20))
            $g = [Math]::Min(255, [int]($p.G * $factor + 20))
            $b = [Math]::Min(255, [int]($p.B * $factor + 20))
            $final.SetPixel($x, $y, [System.Drawing.Color]::FromArgb($p.A, $r, $g, $b))
        }
    }
}

$g.Dispose()
$bmp.Dispose()

$final.Save("c:\wamp64\www\torowin-client\public\favicon_final.png", [System.Drawing.Imaging.ImageFormat]::Png)
$final.Dispose()
Write-Host "Favicon cropped, centered, and brightened successfully."
