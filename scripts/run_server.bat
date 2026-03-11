@echo off
echo Starting PodcastAgent Backend...
echo.
set PYTHONPATH=C:\pylibs
python -m uvicorn backend.main:app --host 127.0.0.1 --port 8000 --reload
pause
