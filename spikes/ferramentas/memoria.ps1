# Soma working set e memória privada da árvore de processos de um PID (Chrome lançado pelo medir.mjs). Uso: powershell -File memoria.ps1 <pid>
param([int]$RaizPid)
$todos = Get-CimInstance Win32_Process | Select-Object ProcessId, ParentProcessId
$ids = New-Object System.Collections.Generic.List[int]; $ids.Add($RaizPid)
for ($i = 0; $i -lt $ids.Count; $i++) { foreach ($f in ($todos | Where-Object { $_.ParentProcessId -eq $ids[$i] })) { $ids.Add([int]$f.ProcessId) } }
$p = Get-Process -Id $ids -ErrorAction SilentlyContinue
'{0} {1} {2}' -f [math]::Round(($p | Measure-Object WorkingSet64 -Sum).Sum / 1MB), [math]::Round(($p | Measure-Object PrivateMemorySize64 -Sum).Sum / 1MB), $p.Count
