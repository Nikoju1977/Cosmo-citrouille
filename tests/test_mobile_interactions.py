from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]
def test_touch_and_mobile_controls_present():
    js=(ROOT/"www"/"game.js").read_text(encoding="utf-8")
    css=(ROOT/"www"/"styles.css").read_text(encoding="utf-8")
    assert "pointer" in js and "addEventListener" in js
    assert "touch-action" in css or "touch" in css
def test_pwa_files_present():
    assert (ROOT/"www"/"manifest.webmanifest").exists()
    assert (ROOT/"www"/"service-worker.js").exists()
    assert (ROOT/"www"/"icons"/"icon.svg").exists()
