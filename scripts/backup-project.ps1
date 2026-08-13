$src = "C:\Users\ADMIN\Downloads\Create new project"
$dst = "C:\Users\ADMIN\Downloads\TransportOS Version 1"

if (-not (Test-Path $dst)) {
    New-Item -ItemType Directory -Path $dst | Out-Null
}

Get-ChildItem -Path $src -Exclude "node_modules", ".git" | Copy-Item -Destination $dst -Recurse -Force
Write-Host "Backup created successfully at $dst"
