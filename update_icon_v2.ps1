$userProfile = $env:USERPROFILE
$projectPath = "$userProfile\.gemini\antigravity\scratch\merkas-ticaret"
$imagePath = "$projectPath\merkas_logo.png" # Asıl logoyu kullan
$desktopPath = [Environment]::GetFolderPath("Desktop")
$shortcutPath = Join-Path $desktopPath "Merkas Otomasyon.lnk"

if (Test-Path $shortcutPath) {
    if (Test-Path $imagePath) {
        $shell = New-Object -ComObject WScript.Shell
        $shortcut = $shell.CreateShortcut($shortcutPath)
        # Windows 10/11 PNG ikonları destekler, ancak uzantı png olmalı
        $shortcut.IconLocation = "$imagePath,0"
        $shortcut.Save()
        Write-Host "Ikon PNG olarak güncellendi: $imagePath"
    } else {
        Write-Host "Logo bulunamadı: $imagePath"
    }
} else {
    Write-Host "Kısayol bulunamadı: $shortcutPath"
}
