from sqlalchemy import (
    Column,
    Integer,
    String,
    Text,
    DateTime,
    ForeignKey,
    Enum as SQLEnum,
    func,
)
from sqlalchemy.orm import relationship
from app.database.session import Base
import enum


class CandidateStatus(str, enum.Enum):
    ACTIVE = "Active"
    INACTIVE = "Inactive"


class Candidate(Base):
    __tablename__ = "t_candidate"

    pk_id = Column(Integer, primary_key=True, autoincrement=True)
    user_id = Column(
        Integer,
        ForeignKey("t_user.pk_id", ondelete="CASCADE"),
        nullable=False,
        unique=True  # One candidate profile per user
    )

    status = Column(
        SQLEnum(CandidateStatus),
        nullable=False,
        default=CandidateStatus.ACTIVE
    )

    description = Column(
        Text,
        nullable=True,
        doc="Candidate's professional summary, bio, or career objective"
    )

    created_date = Column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False
    )

    updated_date = Column(
        DateTime(timezone=True),
        onupdate=func.now(),
        nullable=True
    )

    # Relationships
    user = relationship("User", back_populates="candidate")
    resumes = relationship(
        "CandidateResume",
        back_populates="candidate",
        cascade="all, delete-orphan",
        passive_deletes=True
    )

    applications = relationship("JobApplication", back_populates="candidate", cascade="all, delete-orphan")

    def __repr__(self):
        return f"<Candidate #{self.pk_id} | User #{self.user_id} - {self.status}>"