
from app.utils.run_sql_script import run_sql_script

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
    run_sql_script(SQL_SCRIPT, success_message="User rights seeded successfully.")
