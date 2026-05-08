import sqlite3, os

DB_PATH = os.path.join(os.path.dirname(__file__), 'evhapo.db')
db = sqlite3.connect(DB_PATH)

try:
    db.execute("ALTER TABLE test_sessions ADD COLUMN test_type TEXT DEFAULT 'mental'")
    db.commit()
    print("OK: columna test_type agregada.")
except Exception as e:
    print("Info:", e)

# Verificar estructura final
cols = [row[1] for row in db.execute("PRAGMA table_info(test_sessions)").fetchall()]
print("Columnas actuales:", cols)
db.close()
