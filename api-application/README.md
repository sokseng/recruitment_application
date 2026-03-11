--add new column alembic:
alembic revision --autogenerate -m "add cancelled column to job_application"

--remove column:
alembic revision -m "remove cover_letter_file column from t_candidate_resume"

python -m alembic upgrade head

python -m alembic stamp head

// Remove all installed packages (clean environment)

pip freeze   // List installed packages

pip freeze | ForEach-Object { pip uninstall -y $_ }    // Uninstall all pip packages

Clear-Content requirements.txt    // Clear `requirements.txt`

**Remove-Item**-**Recurse**-**Force**venv   // uninstalling everything, just  **delete and recreate the virtual environment** .

pip freeze > requirements.txt

pip install fastapi "uvicorn[standard]" livekit-api pydantic-settings aiofiles pytz python-multipart
