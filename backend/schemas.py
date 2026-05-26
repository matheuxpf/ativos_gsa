from pydantic import BaseModel
from typing import Optional
import datetime

# --- TEAMS ---
class TeamBase(BaseModel):
    name: str
    region: str
    channel: str

class TeamCreate(TeamBase):
    pass

class Team(TeamBase):
    id: int
    class Config:
        from_attributes = True

# --- ROLES (VAGAS) ---
class RoleBase(BaseModel):
    code: str
    description: str
    region: str
    team_id: Optional[int] = None
    req_notebook: bool = False
    req_desktop: bool = False
    req_mobile: bool = False
    req_sim: bool = False
    status: str = "ATIVA"

class RoleCreate(RoleBase):
    pass

class Role(RoleBase):
    id: int
    team: Optional[Team] = None

    class Config:
        from_attributes = True

# --- EMPLOYEES ---
class EmployeeBase(BaseModel):
    name: str
    role: Optional[str] = None
    region: str
    status: str = "Ativo"
    team_id: Optional[int] = None
    role_id: Optional[int] = None

class EmployeeCreate(EmployeeBase):
    pass

class Employee(EmployeeBase):
    id: int
    team: Optional[Team] = None
    role_rel: Optional[Role] = None

    class Config:
        from_attributes = True

# --- ASSETS ---
class AssetBase(BaseModel):
    type: str
    brand: str
    asset_tag: Optional[str] = None
    primary_id: Optional[str] = None
    status: str
    state: str
    color: Optional[str] = None
    details: Optional[str] = None
    value: Optional[float] = None
    current_owner_type: str
    current_owner_id: str
    current_owner_name: str

class AssetCreate(AssetBase):
    pass

class Asset(AssetBase):
    id: int

    class Config:
        from_attributes = True

# --- MOVEMENTS ---
class MovementBase(BaseModel):
    asset_id: int
    date: Optional[datetime.datetime] = None
    from_owner_type: str
    from_owner_id: str
    from_owner_name: str
    to_owner_type: str
    to_owner_id: str
    to_owner_name: str
    reason: str
    observations: Optional[str] = None
    registered_by: str

class MovementCreate(MovementBase):
    pass

class Movement(MovementBase):
    id: int

    class Config:
        from_attributes = True

# --- AUDIT LOGS ---
class AuditLogBase(BaseModel):
    actor_name: str
    action_type: str
    entity_type: str
    description: str

class AuditLogCreate(AuditLogBase):
    pass

class AuditLog(AuditLogBase):
    id: int
    created_at: datetime.datetime

    class Config:
        from_attributes = True
