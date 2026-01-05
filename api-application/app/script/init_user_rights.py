
from app.utils.run_sql_script import run_sql_script

SQL_SCRIPT = """ 

INSERT INTO t_user_right (name, description, rights)
VALUES (
  'Admin',
  'Administrator',
  '{
  "UserManagement": {
    "RoleRights": {
      "CanAccessModule": true
    },
    "UserRights": {
      "CanAdd": true,
      "CanEdit": true,
      "CanDelete": true,
      "CanExport": true,
      "CanAccessModule": true
    },
    "UserRightRights": {
      "CanAdd": true,
      "CanEdit": true,
      "CanDelete": true,
      "CanExport": true,
      "CanAccessModule": true
    }
  }
}'::json
)
ON CONFLICT (name) DO NOTHING;

"""

def run():
    run_sql_script(SQL_SCRIPT, success_message="User rights seeded successfully.")