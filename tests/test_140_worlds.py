from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]
game=(ROOT/"www"/"game.js").read_text(encoding="utf-8")
html=(ROOT/"www"/"index.html").read_text(encoding="utf-8")

def test_140_worlds_14_bosses():
    assert "length:140" in game
    assert game.count("bossName:")==14
    assert "step===9" in game

def test_points_and_time_goal():
    assert "const goal=800,bossHp=" in game
    assert "goal,bossHp,seconds:120" in game
    assert "DURATION=LEVELS[level-1].seconds;" in game
    assert "state.score=0;" in game
    assert "state.candy>=GOAL" not in game
    assert "state.score<GOAL||state.left<=0" in game
    assert "if(state.boss&&!state.boss.defeated)" in game
    assert "checkGoal()" in game
    assert "0/800" in html
