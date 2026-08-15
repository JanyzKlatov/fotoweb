$ErrorActionPreference = 'Stop'

Add-Type -AssemblyName System.Drawing

$root = Resolve-Path (Join-Path $PSScriptRoot '..')
$thumbDir = Join-Path $root 'images\thumbs'
$optDir = Join-Path $root 'images\optimized'

New-Item -ItemType Directory -Force -Path $thumbDir, $optDir | Out-Null

function Get-ImageEncoder($mimeType) {
    [System.Drawing.Imaging.ImageCodecInfo]::GetImageEncoders() |
        Where-Object { $_.MimeType -eq $mimeType } |
        Select-Object -First 1
}

function Save-Jpeg($image, $path, $quality) {
    $encoder = Get-ImageEncoder 'image/jpeg'
    $params = New-Object System.Drawing.Imaging.EncoderParameters(1)
    $params.Param[0] = New-Object System.Drawing.Imaging.EncoderParameter(
        [System.Drawing.Imaging.Encoder]::Quality,
        [int64]$quality
    )

    $image.Save($path, $encoder, $params)
    $params.Dispose()
}

function Resize-Jpeg($src, $dest, $maxLongSide, $quality) {
    $img = [System.Drawing.Image]::FromFile($src)

    try {
        $longSide = [Math]::Max($img.Width, $img.Height)
        $ratio = 1.0
        if ($longSide -gt $maxLongSide) {
            $ratio = $maxLongSide / [double]$longSide
        }
        $width = [Math]::Max(1, [int][Math]::Round($img.Width * $ratio))
        $height = [Math]::Max(1, [int][Math]::Round($img.Height * $ratio))
        $bmp = New-Object System.Drawing.Bitmap($width, $height)

        try {
            $bmp.SetResolution(72, 72)
            $graphics = [System.Drawing.Graphics]::FromImage($bmp)

            try {
                $graphics.CompositingQuality = [System.Drawing.Drawing2D.CompositingQuality]::HighQuality
                $graphics.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
                $graphics.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality
                $graphics.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
                $graphics.DrawImage($img, 0, 0, $width, $height)
            }
            finally {
                $graphics.Dispose()
            }

            Save-Jpeg $bmp $dest $quality

            [pscustomobject]@{
                path = $dest.Replace("$root\", '')
                width = $width
                height = $height
                kb = [Math]::Round((Get-Item $dest).Length / 1KB)
            }
        }
        finally {
            $bmp.Dispose()
        }
    }
    finally {
        $img.Dispose()
    }
}

function Resize-Png($src, $dest, $maxLongSide) {
    $img = [System.Drawing.Image]::FromFile($src)

    try {
        $longSide = [Math]::Max($img.Width, $img.Height)
        $ratio = 1.0
        if ($longSide -gt $maxLongSide) {
            $ratio = $maxLongSide / [double]$longSide
        }
        $width = [Math]::Max(1, [int][Math]::Round($img.Width * $ratio))
        $height = [Math]::Max(1, [int][Math]::Round($img.Height * $ratio))
        $bmp = New-Object System.Drawing.Bitmap($width, $height, [System.Drawing.Imaging.PixelFormat]::Format32bppArgb)

        try {
            $bmp.SetResolution(72, 72)
            $graphics = [System.Drawing.Graphics]::FromImage($bmp)

            try {
                $graphics.Clear([System.Drawing.Color]::Transparent)
                $graphics.CompositingQuality = [System.Drawing.Drawing2D.CompositingQuality]::HighQuality
                $graphics.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
                $graphics.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality
                $graphics.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
                $graphics.DrawImage($img, 0, 0, $width, $height)
            }
            finally {
                $graphics.Dispose()
            }

            $bmp.Save($dest, [System.Drawing.Imaging.ImageFormat]::Png)

            [pscustomobject]@{
                path = $dest.Replace("$root\", '')
                width = $width
                height = $height
                kb = [Math]::Round((Get-Item $dest).Length / 1KB)
            }
        }
        finally {
            $bmp.Dispose()
        }
    }
    finally {
        $img.Dispose()
    }
}

$results = @()

$portfolioImages = @(
    'are1.jpeg',
    'ares.jpeg',
    'deny.jpeg',
    'honza auto.jpeg',
    'ht.jpeg',
    'mustang1.jpeg',
    'mustang2.jpeg',
    'mustang3.jpeg',
    'par.jpeg',
    'pes1.jpeg',
    'ptak1.jpeg',
    'terka.jpeg',
    'terka1.jpeg',
    'terka2.jpeg',
    'zoe.jpeg',
    'zoe1.jpeg',
    'zoe2.jpeg',
    'audi1.jpeg'
)

foreach ($image in $portfolioImages) {
    $results += Resize-Jpeg `
        (Join-Path $root "images\$image") `
        (Join-Path $thumbDir $image) `
        900 `
        72
}

$heroImages = @(
    @('velka1.jpeg', 'hero-velka1.jpeg'),
    @('nahore.jpeg', 'hero-nahore.jpeg'),
    @('leva dole.jpeg', 'hero-leva-dole.jpeg'),
    @('mustang2.jpeg', 'hero-mustang2.jpeg')
)

foreach ($pair in $heroImages) {
    $results += Resize-Jpeg `
        (Join-Path $root "images\$($pair[0])") `
        (Join-Path $optDir $pair[1]) `
        2000 `
        78

    $mobileName = $pair[1] -replace '\.jpeg$', '-1000.jpeg'
    $results += Resize-Jpeg `
        (Join-Path $root "images\$($pair[0])") `
        (Join-Path $optDir $mobileName) `
        1000 `
        72
}

$results += Resize-Png `
    (Join-Path $root 'images\logo\seethru logo MJ.png') `
    (Join-Path $optDir 'logo-mj-nav.png') `
    128

$results += Resize-Png `
    (Join-Path $root 'images\logo\seethru logo MJ.png') `
    (Join-Path $optDir 'logo-mj-nav-42.png') `
    42

$results += Resize-Png `
    (Join-Path $root 'images\logo\seethru logo MJ.png') `
    (Join-Path $optDir 'logo-mj-nav-84.png') `
    84

$results += Resize-Png `
    (Join-Path $root 'images\logo\logo MJ black circle.png') `
    (Join-Path $optDir 'logo-mj-favicon.png') `
    128

$results | ConvertTo-Json -Depth 3
