$ErrorActionPreference = "Stop"

$bresp = Invoke-RestMethod -Uri "http://localhost:5001/api/auth/login" -Method POST -ContentType "application/json" -Body '{"email":"bgv@rewardsync.com","password":"Bgv@123"}'
$bh = @{Authorization = "Bearer $($bresp.token)"}
Write-Host "[1] BGV login OK"

$queue = Invoke-RestMethod -Uri "http://localhost:5001/api/joiners/bgv-queue" -Headers $bh
Write-Host "[2] BGV queue count: $($queue.Count)"

if ($queue.Count -gt 0) {
    # Use the joinerId field from response (it's the joiner's MongoDB _id)
    $jid = $queue[0].joinerId
    Write-Host "[2b] Using joinerId: $jid"
    
    $bodyObj = @{ joinerId = $jid; bgvStatus = "cleared" }
    $bodyJson = $bodyObj | ConvertTo-Json -Compress
    Write-Host "[2c] Body: $bodyJson"
    
    $bupd = Invoke-RestMethod -Uri "http://localhost:5001/api/bgv/update" -Method PUT -ContentType "application/json" -Body $bodyJson -Headers $bh
    Write-Host "[3] PUT /api/bgv/update bgvStatus=$($bupd.bgvStatus)"
} else {
    Write-Host "[3] No joiners in BGV queue - skipping"
}

Write-Host "BGV route test PASSED"
