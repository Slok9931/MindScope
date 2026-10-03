from typing import Literal

from pydantic import BaseModel, Field, model_validator

Gender = Literal["Male", "Female"]
Academic = Literal["High School", "Undergraduate", "Graduate"]
Platform = Literal["Facebook", "Instagram", "KakaoTalk", "LINE", "LinkedIn", "Snapchat", "TikTok", "Twitter", "VKontakte", "WeChat", "WhatsApp", "YouTube"]
Purpose = Literal["Education", "Entertainment", "Networking", "News"]
Stress = Literal["Low", "Medium", "High", "Very High"]


class PredictionRequest(BaseModel):
    """Raw (un-encoded) features - the saved pipeline performs all preprocessing itself."""

    Age: int = Field(ge=14, le=60)
    Avg_Daily_Usage_Hours: float = Field(ge=0, le=18)
    Daily_Unlocks: int = Field(ge=0, le=600)
    Study_Hours: float = Field(ge=0, le=18)
    Sleep_Hours_Per_Night: float = Field(ge=0, le=16)
    Physical_Activity_Hours: float = Field(ge=0, le=10)
    Stress_Level: Stress
    Gender: Gender
    Academic_Level: Academic
    Most_Used_Platform: Platform
    Purpose_Of_Use: Purpose
    Country: str = Field(min_length=2, max_length=60)

    @model_validator(mode="after")
    def day_must_fit_in_24_hours(self):
        total = self.Avg_Daily_Usage_Hours + self.Study_Hours + self.Sleep_Hours_Per_Night + self.Physical_Activity_Hours
        if total > 24:
            raise ValueError(f"Usage + study + sleep + activity add up to {total:.1f} h, which is more than 24 h in a day.")
        return self


class Band(BaseModel):
    label: str
    tone: str
    message: str


class PredictionResponse(BaseModel):
    score: float
    low: float = Field(description="10th percentile of the individual tree predictions")
    high: float = Field(description="90th percentile of the individual tree predictions")
    percentile: float = Field(description="Share of students in the dataset with a lower score")
    dataset_mean: float
    delta_vs_mean: float
    band: Band
    warnings: list[str]
    sensitivity: dict
