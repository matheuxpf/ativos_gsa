from sqlalchemy import Column, Integer, String, Boolean, ForeignKey
from sqlalchemy.orm import relationship
from database import Base

class Team(Base):
    __tablename__ = "teams"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, index=True)
    region = Column(String)
    channel = Column(String)
    
    # Relação: Uma equipe tem várias vagas
    roles = relationship("Role", back_populates="team")

class Role(Base):
    __tablename__ = "roles"
    id = Column(Integer, primary_key=True, index=True)
    code = Column(String, unique=True, index=True)
    description = Column(String)
    region = Column(String)
    team_id = Column(Integer, ForeignKey("teams.id"))
    
    # Travas de Hardware da Vaga
    req_notebook = Column(Boolean, default=False)
    req_desktop = Column(Boolean, default=False)
    req_mobile = Column(Boolean, default=False)
    req_sim = Column(Boolean, default=False)
    status = Column(String, default="ATIVA")
    
    team = relationship("Team", back_populates="roles")
