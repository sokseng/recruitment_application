from app.utils.run_sql_script import run_sql_script

SQL_SCRIPT = """
-- ✅ Ensure is_active column is BOOLEAN
ALTER TABLE t_user
ALTER COLUMN is_active TYPE BOOLEAN
USING is_active::BOOLEAN;

-- ✅ Set defaults
ALTER TABLE t_user
ALTER COLUMN created_date SET DEFAULT NOW();
ALTER TABLE t_user
ALTER COLUMN is_active SET DEFAULT TRUE;

-- ✅ Fix existing nulls
UPDATE t_user
SET created_date = NOW()
WHERE created_date IS NULL;

UPDATE t_user
SET is_active = TRUE
WHERE is_active IS NULL;

-- ✅ Seed admin user safely
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM t_user WHERE email = 'administrator@gmail.com'
    ) THEN
        INSERT INTO t_user (
            user_name,
            email,
            password,
            user_type,
            gender,
            phone,
            date_of_birth,
            address
        )
        VALUES (
            'Administrator',
            'administrator@gmail.com',
            '$2b$12$kg3nNT1bXKTTUlIgN0FQC.J7sNjiPJOePraNjXxnqWoFrhNxmNSVC',
            1,
            'Male',
            '093639012',
            '1998-11-11',
            'TK'
        );
    END IF;
END
$$;

-- ✅ Reset sequence to avoid jumps
SELECT setval(
    pg_get_serial_sequence('t_user', 'pk_id'),
    (SELECT COALESCE(MAX(pk_id), 0) FROM t_user)
);
"""

def run():
    run_sql_script(SQL_SCRIPT, success_message="User seeded successfully.")
