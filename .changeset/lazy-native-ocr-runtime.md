---
'@happyvertical/ocr': patch
---

Defer loading the Sharp and ONNX Runtime native addons until the ONNX provider performs OCR, preventing provider discovery from destabilizing consumers that also load Kreuzberg or other native runtimes.
