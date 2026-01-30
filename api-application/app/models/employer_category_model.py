from sqlalchemy import Table, Column, Integer, ForeignKey
from app.database.session import Base

employer_category = Table(
    "t_employer_category",
    Base.metadata,
    Column(
        "employer_id",
        Integer,
        ForeignKey("t_employer.pk_id", ondelete="CASCADE"),
        primary_key=True,
    ),
    Column(
        "category_id",
        Integer,
        ForeignKey("t_category.pk_id", ondelete="CASCADE"),
        primary_key=True,
    ),
)
