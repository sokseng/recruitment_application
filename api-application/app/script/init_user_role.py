from app.utils.run_sql_script import run_sql_script

SQL_SCRIPT = """
INSERT INTO t_user_role (name, description)
VALUES ('admin', 'Administrator')
ON CONFLICT (name) DO NOTHING;

INSERT INTO t_user_role (name, description)
VALUES ('user', 'User')
ON CONFLICT (name) DO NOTHING;
"""

def run():
    run_sql_script(SQL_SCRIPT, success_message="User roles seeded successfully.")