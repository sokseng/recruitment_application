from sqlalchemy import (
    Column,
    Integer,
    Text,
    DateTime,
    func,
    String,
    ForeignKey,
    Boolean,
)
from sqlalchemy.orm import relationship
from app.database.session import Base


class Employer(Base):
    __tablename__ = "t_employer"

    pk_id = Column(Integer, primary_key=True, autoincrement=True)

    user_id = Column(
        Integer,
        ForeignKey("t_user.pk_id", ondelete="CASCADE"),
        nullable=False,
    )

    company_name = Column(String(255), nullable=False)
    company_email = Column(String(255), nullable=True)
    company_logo = Column(String(255), nullable=True)
    company_contact = Column(String(50), nullable=True)
    company_address = Column(String(255), nullable=True)
    company_description = Column(Text, nullable=True)
    company_website = Column(String(255), nullable=True)
    is_active = Column(Boolean, nullable=False, default=True)

    created_date = Column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False,
    )

    # ORM relationship
    user = relationship("User", back_populates="employer")
    jobs = relationship(
        "Job",
        back_populates="employer",
        cascade="all, delete-orphan",
        passive_deletes=True
    )
