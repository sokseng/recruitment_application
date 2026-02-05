from sqlalchemy import text
from app.database.session import SessionLocal

SQL_SCRIPT = """
INSERT INTO t_global_setting (code, name, value, type, category)
VALUES ('PASSWORD_SET_LIST_SPECIAL_CHARACTERS','TS_GS_SET_LIST_SPECIAL_CHARACTERS','','Text', 'Security')
ON CONFLICT (code) DO NOTHING;

INSERT INTO t_global_setting (code, name, value, type, category)
VALUES ('MINIMUM_NUMBER_OF_CHARACTERS_IN_PASSWORD','TS_GS_MINIMUM_NUMBER_OF_CHARACTERS_IN_PASSWORD','','Number', 'Security')
ON CONFLICT (code) DO NOTHING;

INSERT INTO t_global_setting (code, name, value, type, category)
VALUES ('MAXIMUM_NUMBER_OF_CHARACTERS_IN_PASSWORD','TS_GS_MAXIMUM_NUMBER_OF_CHARACTERS_IN_PASSWORD','','Number', 'Security')
ON CONFLICT (code) DO NOTHING;

INSERT INTO t_global_setting (code, name, value, type, category)
VALUES ('AT_LEAST_ONE_NUMBER_REQUIRED_IN_PASSWORD','TS_GS_AT_LEAST_ONE_NUMBER_REQUIRED_IN_PASSWORD','False','Boolean', 'Security')
ON CONFLICT (code) DO NOTHING;

INSERT INTO t_global_setting (code, name, value, type, category)
VALUES ('AT_LEAST_ONE_LOWERCASE_CHARACTER_REQUIRED_IN_PASSWORD','TS_GS_AT_LEAST_ONE_LOWERCASE_CHARACTER_REQUIRED_IN_PASSWORD','False','Boolean', 'Security')
ON CONFLICT (code) DO NOTHING;

INSERT INTO t_global_setting (code, name, value, type, category)
VALUES ('AT_LEAST_ONE_UPPERCASE_CHARACTER_REQUIRED_IN_PASSWORD','TS_GS_AT_LEAST_ONE_UPPERCASE_CHARACTER_REQUIRED_IN_PASSWORD','False','Boolean', 'Security')
ON CONFLICT (code) DO NOTHING;

INSERT INTO t_global_setting (code, name, value, type, category)
VALUES ('PASSWORD_MAX_LOGIN_TRY','TS_GS_PASSWORD_MAX_LOGIN_TRY','','Number', 'Security')
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
