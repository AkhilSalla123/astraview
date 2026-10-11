@echo off
title Push AstraView to GitHub
echo ========================================================
echo         Pushing AstraView to GitHub Repository
echo ========================================================
echo.
set "PATH=c:\Users\akank\Downloads\astraview\.git_bin\cmd;%PATH%"
cd /d "c:\Users\akank\Downloads\astraview"

echo Running git push to https://github.com/AkhilSalla123/astraview ...
echo If prompted, sign in with your GitHub account in your browser or enter your token.
echo.
git push -u origin main

echo.
echo ========================================================
if %ERRORLEVEL% equ 0 (
    echo SUCCESS! Your code is now uploaded to GitHub!
    echo Visit: https://github.com/AkhilSalla123/astraview
) else (
    echo Push did not finish. See the error message above.
)
echo ========================================================
pause
