#conta B-SESSAO SEMANAL FINALIZADA
* SESSAO DE 5 HORAS - RESETA 11:30
* SESSAO SEMANAL FINALIZADA-RESETA 19-10-2026 AS 17:00 DA tarde

"$env:CLAUDE_CONFIG_DIR='C:\Users\gelva\.claude-contaB'"
Set-Location 'C:\fontes'; 
claude --dangerously-skip-permissions


#conta A-SESSAO SEMANAL FINALIZADA
* SESSAO DE 5 HORAS - RESETA 11:30
* SESSAO SEMANAL FINALIZADA-RESETA 21-10-2026 AS 7 DA MANHA
"$env:CLAUDE_CONFIG_DIR='C:\Users\gelva\.claude-contaA'" 
Set-Location 'C:\fontes'; claude --dangerously-skip-permissions"

#conta C-
* SESSAO DE 5 HORAS - RESETA 11:30
* SESSAO SEMANAL -31% as 11:15 de 18-10-2026--RESETA 24-10-2026 AS 11:00 DA MANHA

"$env:CLAUDE_CONFIG_DIR='C:\Users\gelva\.claude-contaC'"
Set-Location 'C:\fontes'; 
claude --dangerously-skip-permissions

C:\WINDOWS\System32\WindowsPowerShell\v1.0\powershell.exe -NoExit -Command "$env:CLAUDE_CONFIG_DIR = 'C:\Users\gelva\.claude-contaC'; Set-Location 'C:\fontes\rules-ai\'; claude --dangerously-skip-permissions"

#conta D-
"$env:CLAUDE_CONFIG_DIR='C:\Users\gelva\.claude-contaD'"
claude --dangerously-skip-permissions


