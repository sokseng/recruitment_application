
from sqlalchemy import Column, Integer, Text
from app.database.session import Base


class GlobalSetting(Base):
    __tablename__ = "t_global_setting"
    pk_id = Column(Integer, primary_key=True, autoincrement=True)
    code = Column(Text, unique=True, nullable=False)
    name = Column(Text, nullable=False)
    value = Column(Text, nullable=False)
    type = Column(Text, nullable=False)
