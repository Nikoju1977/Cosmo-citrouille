from pathlib import Path
import re
BASE = Path(__file__).resolve().parents[1]
game = (BASE / "www" / "game.js").read_text(encoding="utf-8")
html = (BASE / "www" / "index.html").read_text(encoding="utf-8")
def test_140_worlds_and_14_bosses():
    assert re.search(r"length\s*:\s*140", game)
    assert len(re.findall(r"bossName\s*:", game)) == 14
    assert "step===9" in game
    assert "finishBoss" in game
def test_difficulty_progression():
    assert "setDifficulty" in game
    assert "cosmo-unlocked" in game
    assert "aventure" in game and "expert" in game
def test_mobile_mount():
    assert 'id="space"' in html
    assert 'game.js' in html and 'styles.css' in html
