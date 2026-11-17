@echo off
setlocal
cd /d "%~dp0"
if errorlevel 1 (
  echo Impossible d'ouvrir le dossier du projet.
  pause
  exit /b 1
)
if not exist "server.js" (
  echo Place photo.bat dans le meme dossier que server.js.
  pause
  exit /b 1
)
where node >nul 2>nul
if errorlevel 1 (
  echo Node.js est introuvable. Verifie son installation.
  pause
  exit /b 1
)
echo Demarrage de l'application. Garde cette fenetre ouverte.
echo Edge ouvrira la page de connexion lorsque le serveur sera pret.
node "server.js" --open-login
set "PHOTO_EXIT_CODE=%errorlevel%"
echo.
echo Le serveur est arrete. Consulte le message ci-dessus en cas d'erreur.
pause
exit /b %PHOTO_EXIT_CODE%
