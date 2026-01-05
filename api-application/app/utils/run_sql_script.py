from sqlalchemy import text
from app.database.session import SessionLocal


def run_sql_script(sql_script: str, success_message: str = None):
    
    db = SessionLocal()
    try:
        db.execute(text(sql_script))
        db.commit()
        if success_message:
            print(f"{success_message}")
    except Exception as e:
        db.rollback()
        print(f"Error running SQL script: {e}")
    finally:
        db.close()
