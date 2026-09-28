@echo off
title PyTorch DLL Fixer - HumanRecognitionBehaviorAnalysis
echo =========================================================================
echo AUTO REPAIR PYTORCH DLL CRASH (WinError 1114 / c10.dll) - Python 3.10
echo =========================================================================

echo.
echo [1/5] Downloading Microsoft Visual C++ 2015-2022 Redistributable (x64)...
curl -L -o "%TEMP%\vc_redist.x64.exe" "https://aka.ms/vs/17/release/vc_redist.x64.exe"

echo.
echo Installing Visual C++ Runtime silently...
"%TEMP%\vc_redist.x64.exe" /install /quiet /norestart

echo.
echo [2/5] Purging conflicting PyTorch packages...
py -3.10 -m pip uninstall -y torch torchvision torchaudio

echo.
echo [3/5] Installing NumPy 1.26.4 and Setuptools^<70...
py -3.10 -m pip install "numpy==1.26.4" "setuptools<70"

echo.
echo [4/5] Installing official PyTorch 2.2.2+cpu ^& Torchvision 0.17.2+cpu...
py -3.10 -m pip install torch==2.2.2+cpu torchvision==0.17.2+cpu --extra-index-url https://download.pytorch.org/whl/cpu

echo.
echo [5/5] Installing remaining dependencies...
py -3.10 -m pip install terminaltables scikit-learn imutils h5py matplotlib

echo.
echo =========================================================================
echo [VERIFICATION] Running 1-line Python sanity check...
echo =========================================================================
py -3.10 -c "import torch; print('PyTorch Version: ' + torch.__version__); print('OK: DLL Error Completely Resolved!')"

echo.
pause
