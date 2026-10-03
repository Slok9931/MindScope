"""Single source of truth for feature definitions (shared by training and serving)."""

TARGET = "Mental_Health_Score"

NUMERIC_FEATURES = [
    "Age",
    "Avg_Daily_Usage_Hours",
    "Daily_Unlocks",
    "Study_Hours",
    "Sleep_Hours_Per_Night",
    "Physical_Activity_Hours",
]
ORDINAL_FEATURES = ["Stress_Level"]
ORDINAL_ORDER = [["Low", "Medium", "High", "Very High"]]
NOMINAL_FEATURES = ["Gender", "Academic_Level", "Most_Used_Platform", "Purpose_Of_Use", "Country"]

FEATURE_COLUMNS = NUMERIC_FEATURES + ORDINAL_FEATURES + NOMINAL_FEATURES

LABELS = {
    "Age": "Age",
    "Avg_Daily_Usage_Hours": "Daily usage (h)",
    "Daily_Unlocks": "Daily unlocks",
    "Study_Hours": "Study hours",
    "Sleep_Hours_Per_Night": "Sleep (h)",
    "Physical_Activity_Hours": "Physical activity (h)",
    "Stress_Level": "Stress level",
    "Gender": "Gender",
    "Academic_Level": "Academic level",
    "Most_Used_Platform": "Platform",
    "Purpose_Of_Use": "Purpose of use",
    "Country": "Country",
    TARGET: "Mental health score",
}
