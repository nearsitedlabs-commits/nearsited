$env:PATH = "C:\Program Files\Docker\Docker\resources\bin;$env:PATH"
do {
    Start-Sleep -Seconds 10
    Write-Host "Waiting for Docker..."
    try {
        $result = docker ps 2>&1
        if ($result -match "CONTAINER") {
            Write-Host "DOCKER_READY"
            break
        }
    } catch {
        # Docker not ready yet
    }
} while ($true)
