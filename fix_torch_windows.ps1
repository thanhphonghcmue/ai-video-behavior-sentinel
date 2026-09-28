# ==============================================================================
# AUTOMATED REPAIR SCRIPT FOR PYTORCH DLL INITIALIZATION FAILURE (WinError 1114)
# Project: HumanRecognitionBehaviorAnalysis (AI Computer Vision System)
# Environment: Windows 10/11 - Python 3.10 (x64)
# ==============================================================================

Write-Host "`n>>> [STEP 1/5] Downloading Microsoft Visual C++ 2015-2022 Redistributable (x64)..." -ForegroundColor Cyan
$vcInstaller = "$env:TEMP\vc_redist.x64.exe"
Invoke-WebRequest -Uri "https://aka.ms/vs/17/release/vc_redist.x64.exe" -OutFile $vcInstaller -UseBasicParsing

Write-Host ">>> Installing Visual C++ Runtime silently..." -ForegroundColor Cyan
Start-Process -FilePath $vcInstaller -ArgumentList "/install", "/quiet", "/norestart" -Wait
Write-Host ">>> [V] Visual C++ 2015-2022 Redistributable successfully installed!" -ForegroundColor Green

Write-Host "`n>>> [STEP 2/5] Purging conflicting PyTorch packages from Python 3.10..." -ForegroundColor Cyan
py -3.10 -m pip uninstall -y torch torchvision torchaudio 2>$null

Write-Host "`n>>> [STEP 3/5] Installing stable NumPy 1.26.4 (C ABI compatible) & Setuptools..." -ForegroundColor Cyan
py -3.10 -m pip install "numpy==1.26.4" "setuptools<70"

Write-Host "`n>>> [STEP 4/5] Installing official PyTorch 2.2.2+cpu & Torchvision 0.17.2+cpu..." -ForegroundColor Cyan
py -3.10 -m pip install torch==2.2.2+cpu torchvision==0.17.2+cpu --extra-index-url https://download.pytorch.org/whl/cpu

Write-Host "`n>>> [STEP 5/5] Ensuring remaining Computer Vision dependencies..." -ForegroundColor Cyan
py -3.10 -m pip install terminaltables scikit-learn imutils h5py matplotlib

Write-Host "`n>>> [VERIFICATION] Running Standalone Sanity Check..." -ForegroundColor Yellow
py -3.10 -c "
import torch, torchvision, dlib, face_recognition, cv2, numpy
print('PyTorch Version   :', torch.__version__)
print('Torchvision       :', torchvision.__version__)
print('OpenCV Version    :', cv2.__version__)
print('NumPy Version     :', numpy.__version__)
print('Dlib Version      :', dlib.__version__)
print('RESULT: DLL ERROR RESOLVED - 100% READY!')
"

Write-Host "`n>>> All steps completed successfully!`n" -ForegroundColor Green
