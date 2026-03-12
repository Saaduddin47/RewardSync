$ErrorActionPreference = "Stop"

$bresp = Invoke-RestMethod -Uri "http://localhost:5001/api/auth/login" -Method POST -ContentType "application/json" -Body '{"email":"bgv@rewardsync.com","password":"Bgv@123"}'
$bh = @{Authorization = "Bearer $($bresp.token)"}

$queue = Invoke-RestMethod -Uri "http://localhost:5001/api/joiners/bgv-queue" -Headers $bh
Write-Host "Queue count: $($queue.Count)"
Write-Host "First item type: $($queue[0].GetType().FullName)"
Write-Host "First item _id: $($queue[0]._id)"
Write-Host "First item id: $($queue[0].id)"
$queue[0] | ConvertTo-Json -Depth 2 | Out-Host
