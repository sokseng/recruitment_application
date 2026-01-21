from app.utils.run_sql_script import run_sql_script

SQL_SCRIPT = """

-- ===============================
-- 1️⃣ Seed default categories (NO DUPLICATION)
-- ===============================

DO $$
BEGIN
    -- Information Technology
    IF NOT EXISTS (SELECT 1 FROM t_category WHERE name = 'Information Technology') THEN
        INSERT INTO t_category (name) VALUES ('Information Technology');
    END IF;

    -- Accounting
    IF NOT EXISTS (SELECT 1 FROM t_category WHERE name = 'Accounting') THEN
        INSERT INTO t_category (name) VALUES ('Accounting');
    END IF;

    -- Finance
    IF NOT EXISTS (SELECT 1 FROM t_category WHERE name = 'Finance') THEN
        INSERT INTO t_category (name) VALUES ('Finance');
    END IF;

    -- Healthcare
    IF NOT EXISTS (SELECT 1 FROM t_category WHERE name = 'Healthcare') THEN
        INSERT INTO t_category (name) VALUES ('Healthcare');
    END IF;

    -- Education
    IF NOT EXISTS (SELECT 1 FROM t_category WHERE name = 'Education') THEN
        INSERT INTO t_category (name) VALUES ('Education');
    END IF;

    -- Marketing
    IF NOT EXISTS (SELECT 1 FROM t_category WHERE name = 'Marketing') THEN
        INSERT INTO t_category (name) VALUES ('Marketing');
    END IF;

    -- Human Resources
    IF NOT EXISTS (SELECT 1 FROM t_category WHERE name = 'Human Resources') THEN
        INSERT INTO t_category (name) VALUES ('Human Resources');
    END IF;

    -- Engineering
    IF NOT EXISTS (SELECT 1 FROM t_category WHERE name = 'Engineering') THEN
        INSERT INTO t_category (name) VALUES ('Engineering');
    END IF;

    -- Design
    IF NOT EXISTS (SELECT 1 FROM t_category WHERE name = 'Design') THEN
        INSERT INTO t_category (name) VALUES ('Design');
    END IF;

    -- Sales
    IF NOT EXISTS (SELECT 1 FROM t_category WHERE name = 'Sales') THEN
        INSERT INTO t_category (name) VALUES ('Sales');
    END IF;

    -- Customer Service
    IF NOT EXISTS (SELECT 1 FROM t_category WHERE name = 'Customer Service') THEN
        INSERT INTO t_category (name) VALUES ('Customer Service');
    END IF;

    -- Legal
    IF NOT EXISTS (SELECT 1 FROM t_category WHERE name = 'Legal') THEN
        INSERT INTO t_category (name) VALUES ('Legal');
    END IF;

    -- Operations
    IF NOT EXISTS (SELECT 1 FROM t_category WHERE name = 'Operations') THEN
        INSERT INTO t_category (name) VALUES ('Operations');
    END IF;

    -- Research & Development
    IF NOT EXISTS (SELECT 1 FROM t_category WHERE name = 'Research & Development') THEN
        INSERT INTO t_category (name) VALUES ('Research & Development');
    END IF;

    -- Administration
    IF NOT EXISTS (SELECT 1 FROM t_category WHERE name = 'Administration') THEN
        INSERT INTO t_category (name) VALUES ('Administration');
    END IF;

END
$$;

-- ===============================
-- 2️⃣ Reset sequence safely
-- ===============================

SELECT setval(
    pg_get_serial_sequence('t_category', 'pk_id'),
    COALESCE((SELECT MAX(pk_id) FROM t_category), 1),
    true
);

"""

def run():
    run_sql_script(
        SQL_SCRIPT,
        success_message="Category seed script executed successfully."
    )
