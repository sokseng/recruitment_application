
from app.database.session import Base
from sqlalchemy import Integer, String, Column, LargeBinary, DateTime, func

class Candidate(Base):
    __tablename__ = "t_candidate"
    pk_id = Column(Integer, primary_key=True, autoincrement=True)
    file_name = Column(String(70), nullable=True)
    content = Column(LargeBinary, nullable=True)
    type = Column(String(20), nullable=True)
    recommendation_letter = Column(String, nullable=True)
    status = Column(String(30), nullable=False)
    description = Column(String(250), nullable=True)
    created_date = Column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False
    )