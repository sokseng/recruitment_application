from sqlalchemy import Column, Integer, String
from app.database.session import Base
from sqlalchemy.orm import relationship

class Category(Base):
    __tablename__ = "t_category"
    pk_id = Column(Integer, primary_key=True, autoincrement=True)
    name = Column(String(100), nullable=False, unique=True)

    jobs = relationship(
        "Job",
        secondary="job_category",          # ← must match the table name above
        back_populates="categories"
    )