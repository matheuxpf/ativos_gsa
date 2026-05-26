from sqlalchemy import Column, Integer, String, Boolean, ForeignKey, Float, DateTime
from sqlalchemy.orm import relationship
from database import Base
import datetime

class Team(Base):
    __tablename__ = "teams"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, index=True)
    region = Column(String)
    channel = Column(String)
    leader_id = Column(String, nullable=True)
    
    roles = relationship("Role", back_populates="team")
    employees = relationship("Employee", back_populates="team")

class Role(Base):
    __tablename__ = "roles"
    
    id = Column(Integer, primary_key=True, index=True)
    code = Column(String, unique=True, index=True)
    description = Column(String)
    region = Column(String)
    team_id = Column(Integer, ForeignKey("teams.id"), nullable=True)
    
    req_notebook = Column(Boolean, default=False)
    req_desktop = Column(Boolean, default=False)
    req_mobile = Column(Boolean, default=False)
    req_sim = Column(Boolean, default=False)
    status = Column(String, default="ATIVA")
    
    team = relationship("Team", back_populates="roles")
    employees = relationship("Employee", back_populates="role_rel")

class Employee(Base):
    __tablename__ = "employees"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, index=True)
    role = Column(String, nullable=True) # Legacy role text
    region = Column(String)
    status = Column(String, default="Ativo")
    
    team_id = Column(Integer, ForeignKey("teams.id"), nullable=True)
    role_id = Column(Integer, ForeignKey("roles.id"), nullable=True)
    
    team = relationship("Team", back_populates="employees")
    role_rel = relationship("Role", back_populates="employees")

class Asset(Base):
    __tablename__ = "assets"

    id = Column(Integer, primary_key=True, index=True)
    type = Column(String)
    brand = Column(String)
    asset_tag = Column(String, unique=True, index=True, nullable=True)
    primary_id = Column(String, index=True, nullable=True)
    status = Column(String)
    state = Column(String)
    color = Column(String, nullable=True)
    details = Column(String, nullable=True)
    value = Column(Float, nullable=True)
    
    current_owner_type = Column(String)
    current_owner_id = Column(String)
    current_owner_name = Column(String)

class Movement(Base):
    __tablename__ = "movements"

    id = Column(Integer, primary_key=True, index=True)
    asset_id = Column(Integer, ForeignKey("assets.id"))
    date = Column(DateTime, default=datetime.datetime.utcnow)
    
    from_owner_type = Column(String)
    from_owner_id = Column(String)
    from_owner_name = Column(String)
    
    to_owner_type = Column(String)
    to_owner_id = Column(String)
    to_owner_name = Column(String)
    
    reason = Column(String)
    observations = Column(String, nullable=True)
    registered_by = Column(String)

class AuditLog(Base):
    __tablename__ = "audit_logs"

    id = Column(Integer, primary_key=True, index=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    actor_name = Column(String)
    action_type = Column(String)
    entity_type = Column(String)
    description = Column(String)