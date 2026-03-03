--add new column alembic:
alembic revision --autogenerate -m "add cancelled column to job_application"

--remove column:
alembic revision -m "remove cover_letter_file column from t_candidate_resume"

python -m alembic upgrade head
