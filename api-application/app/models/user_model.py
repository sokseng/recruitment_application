from sqlalchemy import (
    Column,
    Integer,
    DateTime,
    String,
    Date,
    Boolean,
    func,
    text,
    Text
)
from app.database.session import Base
from sqlalchemy.orm import relationship


class User(Base):
    __tablename__ = "t_user"
    pk_id = Column(Integer, primary_key=True, autoincrement=True)
    user_name = Column(String(100), nullable=False)
    email = Column(String(255), nullable=False, unique=True)
    password = Column(String, nullable=False)
    user_type = Column(Integer, nullable=False)
    gender = Column(String(10), nullable=True)
    phone = Column(String(20), nullable=True)
    date_of_birth = Column(Date, nullable=True)
    address = Column(String(255), nullable=True)
    wrong_password = Column(Integer, default=0)
    bio = Column(Text, nullable=True)
    profile_image = Column(String(255), nullable=True)

    created_date = Column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False,
    )

    is_active = Column(
        Boolean,
        server_default=text("TRUE"),
        nullable=False,
    )
    approved = Column(Boolean, default=False, nullable=False)

    updated_date = Column(
        DateTime(timezone=True),
        onupdate=func.now(),
        nullable=True,
    )

    sessions = relationship(
        "UserSession",
        back_populates="user",
        cascade="all, delete-orphan",
    )

    employer = relationship(
        "Employer",
        uselist=False,
        back_populates="user",
        cascade="all, delete-orphan",
    )

    candidate = relationship(
        "Candidate",
        back_populates="user",
        uselist=False,                # One-to-one relationship
        cascade="all, delete-orphan",
        passive_deletes=True
    )
    chat_rooms_as_candidate = relationship(
        "ChatRoom",
        foreign_keys="[ChatRoom.candidate_user_id]",
        back_populates="candidate_user"
    )

    chat_rooms_as_employer = relationship(
        "ChatRoom",
        foreign_keys="[ChatRoom.employer_user_id]",
        back_populates="employer_user"
    )
