@echo off
rem Regrava assets\js\dados.js com o conteudo atual dos Markdown e abre o index.html.
cd /d "%~dp0"
node scripts\gerar-dados-index.mjs
start "" "%~dp0index.html"
