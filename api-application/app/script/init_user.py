
from app.utils.run_sql_script import run_sql_script

SQL_SCRIPT = """ 

INSERT INTO t_user (name, password, email, role_id, right_id, status)
VALUES (
    'Administrator',
    '$2b$12$kg3nNT1bXKTTUlIgN0FQC.J7sNjiPJOePraNjXxnqWoFrhNxmNSVC',
    'administrator@gmail.com',
    1,
    1,
    false
)
ON CONFLICT (email) DO NOTHING;

"""

def run():
    run_sql_script(SQL_SCRIPT, success_message="User seeded successfully.")