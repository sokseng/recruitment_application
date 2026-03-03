# models/application_attachment_model.py

from sqlalchemy import Column, Integer, String, ForeignKey, DateTime, BigInteger
from sqlalchemy.orm import relationship
from app.database.session import Base
from datetime import datetime

class ApplicationAttachment(Base):
    __tablename__ = "t_application_attachment"

    id = Column(Integer, primary_key=True, autoincrement=True)
    application_id = Column(
        Integer,
        ForeignKey("t_job_application.pk_id", ondelete="CASCADE"),
        nullable=False,
        index=True
    )
    filename = Column(String(255), nullable=False)
    original_name = Column(String(255), nullable=True)
    file_type = Column(String(50), nullable=True)          # "image", "pdf", "doc" etc.
    size_bytes = Column(BigInteger, nullable=True)
    uploaded_at = Column(DateTime(timezone=True), default=datetime.utcnow, nullable=False)
    sort_order = Column(Integer, default=0, nullable=False)

    application = relationship("JobApplication", back_populates="attachments")