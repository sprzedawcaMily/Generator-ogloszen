' start-app.vbs - double-click to start app without showing a console window
Set WshShell = CreateObject("WScript.Shell")
WshShell.Run chr(34) & "start-app.bat" & Chr(34), 0
Set WshShell = Nothing
