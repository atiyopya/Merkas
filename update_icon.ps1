Add-Type -AssemblyName System.Drawing
$userProfile = $env:USERPROFILE
$projectPath = "$userProfile\.gemini\antigravity\scratch\merkas-ticaret"
$imagePath = "$projectPath\merkas_logo.png"
$iconPath = "$projectPath\merkas.ico"
$desktopPath = [Environment]::GetFolderPath("Desktop")
$shortcutPath = Join-Path $desktopPath "Merkas Otomasyon.lnk"

Write-Host "ImagePath: $imagePath"
Write-Host "ShortcutPath: $shortcutPath"

# Load image and scale
if (Test-Path $imagePath) {
    $img = [System.Drawing.Image]::FromFile($imagePath)
    $bmp = New-Object System.Drawing.Bitmap(256, 256)
    $g = [System.Drawing.Graphics]::FromImage($bmp)
    $g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
    
    # Scale keeping aspect ratio or just fill
    $g.DrawImage($img, 0, 0, 256, 256)

    # Save as PNG (Windows can use it as icon source)
    $bmp.Save($iconPath, [System.Drawing.Imaging.ImageFormat]::Png)
    
    $g.Dispose()
    $bmp.Dispose()
    $img.Dispose()

    # Update shortcut
    if (Test-Path $shortcutPath) {
        $shell = New-Object -ComObject WScript.Shell
        $shortcut = $shell.CreateShortcut($shortcutPath)
        $shortcut.IconLocation = $iconPath
        $shortcut.Save()
        Write-Host "Shortcut updated successfully."
    } else {
        Write-Host "Shortcut not found at $shortcutPath"
    }
} else {
    Write-Host "Image not found at $imagePath"
}
