# Create PNG icons from SVG for Chrome Extension
# Requires ImageMagick or similar SVG converter

$desktopPath = "$env:USERPROFILE\Desktop"
$iconPath = "browser-extension\icons"

# Check if icons directory exists
if (-not (Test-Path $iconPath)) {
    New-Item -ItemType Directory -Path $iconPath -Force
}

# Create simple PNG placeholder icons (blue gradient with microphone)
# Since we don't have ImageMagick, we'll create using PowerShell GDI+

Add-Type -AssemblyName System.Drawing
Add-Type -AssemblyName System.Web

function Create-Icon {
    param($size, $outputPath)
    
    $bmp = New-Object System.Drawing.Bitmap($size, $size)
    $g = [System.Drawing.Graphics]::FromImage($bmp)
    $g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
    $g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
    
    # Background gradient (simulated with solid + radial)
    $bgBrush = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(59, 130, 246)) # Blue-500
    $g.FillRectangle($bgBrush, 0, 0, $size, $size)
    
    # Draw microphone icon (simplified)
    $centerX = $size / 2
    $centerY = $size / 2
    $scale = $size / 128
    
    # Mic body (circle)
    $micBrush = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::White)
    $micX = $centerX - 15 * $scale
    $micY = $centerY - 20 * $scale
    $micW = 30 * $scale
    $micH = 30 * $scale
    $g.FillEllipse($micBrush, $micX, $micY, $micW, $micH)
    
    # Mic base (rounded rect)
    $baseBrush = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(200, 255, 255, 255))
    $baseX = $centerX - 12 * $scale
    $baseY = $centerY - 5 * $scale
    $baseW = 24 * $scale
    $baseH = 25 * $scale
    $g.FillRectangle($baseBrush, $baseX, $baseY, $baseW, $baseH)
    
    # Stand
    $standPen = New-Object System.Drawing.Pen([System.Drawing.Color]::White, 3 * $scale)
    $g.DrawLine($standPen, $centerX, $centerY + 20 * $scale, $centerX, $size - 15 * $scale)
    $g.DrawLine($standPen, $centerX - 10 * $scale, $size - 15 * $scale, $centerX + 10 * $scale, $size - 15 * $scale)
    
    # Save
    $bmp.Save($outputPath, [System.Drawing.Imaging.ImageFormat]::Png)
    
    $g.Dispose()
    $bmp.Dispose()
    $bgBrush.Dispose()
    $micBrush.Dispose()
    $baseBrush.Dispose()
    $standPen.Dispose()
}

# Create icons at required sizes
@("icon16.png", "icon32.png", "icon48.png", "icon128.png") | ForEach-Object {
    $size = [int]($_.Replace("icon", "").Replace(".png", ""))
    $path = Join-Path $iconPath $_
    Create-Icon -size $size -outputPath $path
    Write-Host "Created $path ($size`x$size)"
}

Write-Host "`n✅ Extension icons created in $iconPath"
