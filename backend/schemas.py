from pydantic import BaseModel

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
