$ErrorActionPreference = "Stop"

# BGV login
$bresp = Invoke-RestMethod -Uri "http://localhost:5001/api/auth/login" -Method POST -ContentType "application/json" -Body '{"email":"bgv@rewardsync.com","password":"Bgv@123"}'
$bh = @{Authorization = "Bearer $($bresp.token)"}
Write-Host "[1] BGV login OK"

# Get BGV queue
$queue = Invoke-RestMethod -Uri "http://localhost:5001/api/joiners/bgv-queue" -Headers $bh
Write-Host "[2] BGV queue count: $($queue.Count)"

if ($queue.Count -gt 0) {
    $jid = $queue[0]._id
    # Use hashtable body - let PowerShell serialize it properly
    $bodyObj = @{ joinerId = $jid; bgvStatus = "cleared" }
    $bodyJson = $bodyObj | ConvertTo-Json -Compress
    Write-Host "[2b] Sending body: $bodyJson"
    $bupd = Invoke-RestMethod -Uri "http://localhost:5001/api/bgv/update" -Method PUT -ContentType "application/json" -Body $bodyJson -Headers $bh
    Write-Host "[3] PUT /api/bgv/update bgvStatus=$($bupd.bgvStatus)"
} else {
    Write-Host "[3] No joiners in BGV queue - skipping"
}

Write-Host "BGV route test PASSED"
