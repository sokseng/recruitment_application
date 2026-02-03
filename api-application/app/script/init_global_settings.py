from sqlalchemy import text
from app.database.session import SessionLocal

SQL_SCRIPT = """
INSERT INTO t_global_setting (code, name, value, type)
VALUES ('PASSWORD_SET_LIST_SPECIAL_CHARACTERS','TS_GS_SET_LIST_SPECIAL_CHARACTERS','','Text')
ON CONFLICT (code) DO NOTHING;

INSERT INTO t_global_setting (code, name, value, type)
VALUES ('MINIMUM_NUMBER_OF_CHARACTERS_IN_PASSWORD','TS_GS_MINIMUM_NUMBER_OF_CHARACTERS_IN_PASSWORD','','Number')
ON CONFLICT (code) DO NOTHING;

INSERT INTO t_global_setting (code, name, value, type)
VALUES ('MAXIMUM_NUMBER_OF_CHARACTERS_IN_PASSWORD','TS_GS_MAXIMUM_NUMBER_OF_CHARACTERS_IN_PASSWORD','','Number')
ON CONFLICT (code) DO NOTHING;

INSERT INTO t_global_setting (code, name, value, type)
VALUES ('AT_LEAST_ONE_NUMBER_REQUIRED_IN_PASSWORD','TS_GS_AT_LEAST_ONE_NUMBER_REQUIRED_IN_PASSWORD','False','Boolean')
ON CONFLICT (code) DO NOTHING;

INSERT INTO t_global_setting (code, name, value, type)
VALUES ('AT_LEAST_ONE_LOWERCASE_CHARACTER_REQUIRED_IN_PASSWORD','TS_GS_AT_LEAST_ONE_LOWERCASE_CHARACTER_REQUIRED_IN_PASSWORD','False','Boolean')
ON CONFLICT (code) DO NOTHING;

INSERT INTO t_global_setting (code, name, value, type)
VALUES ('AT_LEAST_ONE_UPPERCASE_CHARACTER_REQUIRED_IN_PASSWORD','TS_GS_AT_LEAST_ONE_UPPERCASE_CHARACTER_REQUIRED_IN_PASSWORD','False','Boolean')
ON CONFLICT (code) DO NOTHING;
"""

def run():
    db = SessionLocal()
    try:
        # wrap SQL in text() for execution
        db.execute(text(SQL_SCRIPT))
        db.commit()
        print("✅ Global settings initialized")
    except Exception as e:
        db.rollback()
        print("❌ Error initializing global settings:", e)
    finally:
        db.close()
