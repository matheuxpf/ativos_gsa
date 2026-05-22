from pydantic import BaseModel
from typing import Optional

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
    team_id: int
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
