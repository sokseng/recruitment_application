from app.utils.run_sql_script import run_sql_script

SQL_SCRIPT = """
-- ===============================
-- 1️⃣ Ensure column types & defaults safely
-- ===============================

ALTER TABLE t_user
    ALTER COLUMN is_active TYPE BOOLEAN
    USING is_active::BOOLEAN;

ALTER TABLE t_user
    ALTER COLUMN created_date SET DEFAULT NOW();

ALTER TABLE t_user
    ALTER COLUMN is_active SET DEFAULT TRUE;

-- ===============================
-- 2️⃣ Fix existing NULL values
-- ===============================

UPDATE t_user
SET created_date = NOW()
WHERE created_date IS NULL;

UPDATE t_user
SET is_active = TRUE
WHERE is_active IS NULL;

-- ===============================
-- 3️⃣ Seed admin user (NO DUPLICATION)
-- ===============================

DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM t_user WHERE email = 'administrator@gmail.com'
    ) THEN
        RAISE NOTICE 'Admin user already exists. Skipping insert.';
    ELSE
        INSERT INTO t_user (
            user_name,
            email,
            password,
            user_type,
            gender,
            phone,
            date_of_birth,
            address,
            is_active
        )
        VALUES (
            'Administrator',
            'administrator@gmail.com',
            '$2b$12$kg3nNT1bXKTTUlIgN0FQC.J7sNjiPJOePraNjXxnqWoFrhNxmNSVC',
            1,
            'Male',
            '093639012',
            '1998-11-11',
            'TK',
            TRUE
        );

        RAISE NOTICE 'Admin user created successfully.';
    END IF;
END
$$;

-- ===============================
-- 4️⃣ Reset sequence safely
-- ===============================

SELECT setval(
    pg_get_serial_sequence('t_user', 'pk_id'),
    COALESCE((SELECT MAX(pk_id) FROM t_user), 1),
    true
);
"""

def run():
    run_sql_script(
        SQL_SCRIPT,
        success_message="User seed script executed successfully."
    )
