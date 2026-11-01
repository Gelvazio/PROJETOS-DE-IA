@echo off
rem Define AUTOSWARM_HOME (pasta de registros do AutoSwarm) para o usuario atual.
rem Vale para terminais abertos depois de rodar este script.
set "PASTA_AUTOSWARM=C:\fontes\autoswarm-dados"

if not exist "%PASTA_AUTOSWARM%" mkdir "%PASTA_AUTOSWARM%"

setx AUTOSWARM_HOME "%PASTA_AUTOSWARM%" >nul
if errorlevel 1 (
  echo Falha ao definir AUTOSWARM_HOME.
  exit /b 1
)

echo AUTOSWARM_HOME=%PASTA_AUTOSWARM%
echo Feche e abra o terminal (e o Claude Code) para a variavel valer.
