from fastapi import FastAPI
from pydantic import BaseModel
app = FastAPI()
class AnalyzeIn(BaseModel):
    image: str
@app.post("/analyze")
def analyze(inp: AnalyzeIn):
    return {
        "boxes":[{"x":0.2,"y":0.25,"w":0.15,"h":0.12,"label":"Acne"}],
        "pie":[{"name":"Acne","value":3},{"name":"Melasma","value":1},{"name":"Freckles","value":2},{"name":"Dark Spots","value":1}],
        "severity":"Moderate","severityScore":62
    }
