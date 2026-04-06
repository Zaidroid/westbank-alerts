from fastapi import FastAPI
from fastapi.testclient import TestClient

app = FastAPI()

@app.get("/alerts/sirens")
def get_sirens(): return "sirens"

@app.get("/alerts/{alert_id}")
def get_alert(alert_id: int): return alert_id

client = TestClient(app)
response = client.get("/alerts/sirens")
print(response.status_code, response.text)
