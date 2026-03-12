$ErrorActionPreference = "Stop"

# Admin login
$resp = Invoke-RestMethod -Uri "http://localhost:5001/api/auth/login" -Method POST -ContentType "application/json" -Body '{"email":"admin@rewardsync.com","password":"Admin@123"}'
$tok = $resp.token
$h = @{Authorization = "Bearer $tok"}
Write-Host "[1] Admin login OK"

# Get employees
$emps = Invoke-RestMethod -Uri "http://localhost:5001/api/admin/employees" -Headers $h
Write-Host "[2] GET /admin/employees count=$($emps.Count)"

$id = $emps[0]._id
$origName = $emps[0].name
Write-Host "[3] First emp: $origName isActive=$($emps[0].isActive)"

# PATCH update employee
$upd = Invoke-RestMethod -Uri "http://localhost:5001/api/admin/employees/$id" -Method PATCH -ContentType "application/json" -Body '{"name":"Test Update"}' -Headers $h
Write-Host "[4] PATCH /admin/employees/:id updated name=$($upd.name)"

# PATCH toggle active
$tog = Invoke-RestMethod -Uri "http://localhost:5001/api/admin/employees/$id/toggle-active" -Method PATCH -ContentType "application/json" -Body '{}' -Headers $h
Write-Host "[5] PATCH toggle-active: isActive=$($tog.isActive)"

# Restore name
$restoreBody = "{`"name`":`"$origName`"}"
Invoke-RestMethod -Uri "http://localhost:5001/api/admin/employees/$id" -Method PATCH -ContentType "application/json" -Body $restoreBody -Headers $h | Out-Null
Invoke-RestMethod -Uri "http://localhost:5001/api/admin/employees/$id/toggle-active" -Method PATCH -ContentType "application/json" -Body '{}' -Headers $h | Out-Null
Write-Host "[6] Restored data"

# Manager login + GET /api/reports
$mresp = Invoke-RestMethod -Uri "http://localhost:5001/api/auth/login" -Method POST -ContentType "application/json" -Body '{"email":"manager@rewardsync.com","password":"Manager@123"}'
$mh = @{Authorization = "Bearer $($mresp.token)"}
$rresp = Invoke-WebRequest -Uri "http://localhost:5001/api/reports" -Headers $mh -Method GET
Write-Host "[7] GET /api/reports: $($rresp.StatusCode) contentType=$($rresp.Headers['Content-Type'])"

# BGV token + test BGV update route
$bresp = Invoke-RestMethod -Uri "http://localhost:5001/api/auth/login" -Method POST -ContentType "application/json" -Body '{"email":"bgv@rewardsync.com","password":"Bgv@123"}'
$bh = @{Authorization = "Bearer $($bresp.token)"}
$joiners = Invoke-RestMethod -Uri "http://localhost:5001/api/joiners" -Headers $bh
Write-Host "[8] Joiners count: $($joiners.Count)"

if ($joiners.Count -gt 0) {
    $jid = $joiners[0]._id
    $bgvBody = "{`"joinerId`":`"$jid`",`"bgvStatus`":`"cleared`"}"
    $bupd = Invoke-RestMethod -Uri "http://localhost:5001/api/bgv/update" -Method PUT -ContentType "application/json" -Body $bgvBody -Headers $bh
    Write-Host "[9] PUT /api/bgv/update bgvStatus=$($bupd.bgvStatus)"
} else {
    Write-Host "[9] No joiners - skipping BGV update test"
}

Write-Host ""
Write-Host "ALL TESTS PASSED"
