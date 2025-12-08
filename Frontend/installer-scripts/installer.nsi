; FusionDesk NSIS Installer Script
; Customization for Windows deployment

!include "MUI2.nsh"
!include "LogicLib.nsh"
!include "x64.nsh"
!include "FileAssociation.nsh"

; ========== Configuration ==========
Name "FusionDesk"
OutFile "FusionDesk-Installer.exe"
InstallDir "$PROGRAMFILES\FusionDesk"
InstallDirRegKey HKCU "Software\FusionDesk" "InstallPath"

; ========== MUI Settings ==========
!define MUI_ICON "assets\installer-icon.ico"
!define MUI_UNICON "assets\uninstaller-icon.ico"
!define MUI_HEADERIMAGE
!define MUI_HEADERIMAGE_BITMAP "assets\installer-header.bmp"
!define MUI_WELCOMEFINISHPAGE_BITMAP "assets\installer-sidebar.bmp"

!insertmacro MUI_PAGE_WELCOME
!insertmacro MUI_PAGE_DIRECTORY
!insertmacro MUI_PAGE_INSTFILES
!insertmacro MUI_PAGE_FINISH

!insertmacro MUI_LANGUAGE "English"

; ========== Installer Sections ==========
Section "Install"
  SetOutPath "$INSTDIR"
  
  ; Copy application files
  File /r "dist\*.*"
  File /r "dist-electron\*.*"
  File "package.json"
  
  ; Create shortcuts
  CreateDirectory "$SMPROGRAMS\FusionDesk"
  CreateShortCut "$SMPROGRAMS\FusionDesk\FusionDesk.lnk" "$INSTDIR\FusionDesk.exe"
  CreateShortCut "$SMPROGRAMS\FusionDesk\Uninstall.lnk" "$INSTDIR\Uninstall.exe"
  CreateShortCut "$DESKTOP\FusionDesk.lnk" "$INSTDIR\FusionDesk.exe"
  
  ; Register in Add/Remove Programs
  WriteRegStr HKCU "Software\Microsoft\Windows\CurrentVersion\Uninstall\FusionDesk" \
    "DisplayName" "FusionDesk"
  WriteRegStr HKCU "Software\Microsoft\Windows\CurrentVersion\Uninstall\FusionDesk" \
    "DisplayVersion" "1.0.0"
  WriteRegStr HKCU "Software\Microsoft\Windows\CurrentVersion\Uninstall\FusionDesk" \
    "Publisher" "FusionDesk Team"
  WriteRegStr HKCU "Software\Microsoft\Windows\CurrentVersion\Uninstall\FusionDesk" \
    "UninstallString" "$INSTDIR\Uninstall.exe"
  WriteRegStr HKCU "Software\Microsoft\Windows\CurrentVersion\Uninstall\FusionDesk" \
    "InstallLocation" "$INSTDIR"
  
  ; File associations
  ${RegisterExtension} "$INSTDIR\FusionDesk.exe" ".fusiondesk" "FusionDesk File"
  
  ; Create uninstaller
  WriteUninstaller "$INSTDIR\Uninstall.exe"
  WriteRegStr HKCU "Software\FusionDesk" "InstallPath" "$INSTDIR"
SectionEnd

; ========== Uninstaller ==========
Section "Uninstall"
  ; Remove application files
  RMDir /r "$INSTDIR"
  
  ; Remove shortcuts
  RMDir /r "$SMPROGRAMS\FusionDesk"
  Delete "$DESKTOP\FusionDesk.lnk"
  
  ; Remove registry entries
  DeleteRegKey HKCU "Software\FusionDesk"
  DeleteRegKey HKCU "Software\Microsoft\Windows\CurrentVersion\Uninstall\FusionDesk"
  
  ; Remove file associations
  ${UnregisterExtension} ".fusiondesk" "FusionDesk File"
SectionEnd

; ========== Callbacks ==========
Function .onInit
  ; Check Windows version (Windows 7+)
  ${If} ${RunningX64}
    SetRegView 64
  ${EndIf}
FunctionEnd

Function un.onInit
  ${If} ${RunningX64}
    SetRegView 64
  ${EndIf}
FunctionEnd
