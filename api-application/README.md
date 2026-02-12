--add new column alembic:

alembic revision --autogenerate -m "add cancelled column to job_application"

python -m alembic upgrade head
