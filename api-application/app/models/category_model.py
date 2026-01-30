from sqlalchemy import Column, Integer, String
from app.database.session import Base
from sqlalchemy.orm import relationship
from app.models.employer_category_model import employer_category

class Category(Base):
    __tablename__ = "t_category"
    pk_id = Column(Integer, primary_key=True, autoincrement=True)
    name = Column(String(100), nullable=False, unique=True)

    jobs = relationship(
        "Job",
        secondary="job_category",          # ← must match the table name above
        back_populates="categories"
    )

    employers = relationship(
        "Employer",
        secondary=employer_category,
        back_populates="categories"
    )