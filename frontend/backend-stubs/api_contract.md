# API Contract (FastAPI)
## POST /analyze
- Body: `{ "image": "base64-string" }`
- Response: { boxes[], pie[], severity, severityScore }
