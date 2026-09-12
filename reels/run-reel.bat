@echo off
rem build-reel: render reel + scp al VPS + trigger quenoticia-reels.service
rem Task Scheduler 2x/dia. Log: out\build-reel.log
set PATH=%PATH%;C:\Program Files\nodejs;C:\Program Files\Python312;C:\Users\Fede\AppData\Local\Microsoft\WinGet\Packages\Gyan.FFmpeg_Microsoft.Winget.Source_8wekyb3d8bbwe\ffmpeg-9.0.1-full_build\bin
cd /d C:\Users\Fede\Desktop\lavozdiaria\reels
node build-reel.mjs >> out\build-reel.log 2>&1