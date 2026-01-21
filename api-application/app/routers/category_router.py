from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from typing import List
from app.models.category_model import Category
from app.schemas.job_schema import CategoryBasic as CategoryOut
from app.dependencies.auth import get_db

router = APIRouter(prefix="/categories", tags=["Categories"])


@router.get("/", response_model=List[CategoryOut])
def get_all_categories(db: Session = Depends(get_db)):
    return db.query(Category).order_by(Category.name).all()