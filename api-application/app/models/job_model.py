from sqlalchemy import (
    Column,
    Integer,
    String,
    Table,
    Text,
    Date,
    DateTime,
    ForeignKey,
    Enum as SQLEnum,
    func,
)
from sqlalchemy.orm import relationship
from app.database.session import Base
import enum

job_category = Table(
    "job_category",                    # ← table name (you can customize if you want)
    Base.metadata,
    Column("job_id", Integer, ForeignKey("t_job.pk_id"), primary_key=True),
    Column("category_id", Integer, ForeignKey("t_category.pk_id"), primary_key=True),
)

class JobLevel(str, enum.Enum):
    ENTRY_LEVEL = "Entry Level"
    JUNIOR      = "Junior"
    MID_LEVEL   = "Mid Level"
    SENIOR      = "Senior"
    LEAD        = "Lead"
    MANAGER       = "Manager"


class JobType(str, enum.Enum):
    FULL_TIME = "Full-time"
    PART_TIME = "Part-time"
    INTERNSHIP = "Internship"


class JobStatus(str, enum.Enum):
    OPEN = "Open"
    CLOSED = "Closed"
    DRAFT = "Draft"


class Job(Base):
    __tablename__ = "t_job"

    pk_id = Column(Integer, primary_key=True, autoincrement=True)
    employer_id = Column(
        Integer,
        ForeignKey("t_employer.pk_id", ondelete="CASCADE"),
        nullable=False,
    )
    categories = relationship(
        "Category",
        secondary=job_category,
        back_populates="jobs",
        lazy="selectin"          # good for loading in lists
    )
    job_title = Column(String(255), nullable=False)
    job_type = Column(SQLEnum(JobType), nullable=False)
    level = Column(SQLEnum(JobLevel), nullable=False, default=JobLevel.MID_LEVEL)
    position_number = Column(Integer, nullable=True) 
    salary_range = Column(String(100), nullable=True)  
    location = Column(String(255), nullable=True)
    job_description = Column(Text, nullable=False)
    experience_required = Column(Text, nullable=False)
    posting_date = Column(Date, server_default=func.current_date(), nullable=False)
    closing_date = Column(Date, nullable=True)
    status = Column(SQLEnum(JobStatus), default=JobStatus.DRAFT, nullable=False)

    created_at = Column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False,
    )

    # Relationships
    employer = relationship("Employer", back_populates="jobs")
    applications = relationship("JobApplication", back_populates="job", cascade="all, delete-orphan")

    # Optional: help with enum serialization in responses
    def __repr__(self):
        cats = ", ".join(c.name for c in self.categories) if self.categories else "no categories"
        return f"<Job {self.job_title} - {self.status} - categories: {cats}>"