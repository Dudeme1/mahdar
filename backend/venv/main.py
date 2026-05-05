from fastapi import FastAPI, UploadFile, File, Form
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from dotenv import load_dotenv

# Database
from supabase import create_client

# AI 
import openai
import anthropic
from pydantic import BaseModel

import json
from datetime import datetime
from docxtpl import DocxTemplate
import tempfile
import os

load_dotenv()

# Set up AI API keys
# OPENAI
openai.api_key = os.getenv("OPENAI_API_KEY")
# Claude
claude = anthropic.Anthropic(api_key=os.getenv("ANTHROPIC_API_KEY"))

# Database inintialization
supabase = create_client(
    os.getenv("SUPABASE_URL"),
    os.getenv("SUPABASE_KEY")
)

class TranscriptRequest(BaseModel):
    transcript: str
    language: str = "english"
    token: str = ""


app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
async def root():
    return {"message": "Mahdar API is alive!"}

@app.get("/test-db")
async def test_db():
    data = supabase.table("users").select("*").execute()
    return {"message": "DB connected!", "data": data.data}

@app.post("/transcribe")
async def transcribe(file: UploadFile = File (...)):
    audio_bytes = await file.read()

    transcript = openai.audio.transcriptions.create(
        model="whisper-1",
        file=(file.filename, audio_bytes, file.content_type)
    )

    return {"transcript": transcript.text}

@app.post("/generate")
async def generate(request: TranscriptRequest):
    # Verify user
    user = supabase.auth.get_user(request.token)
    if not user:
        return {"error": "Not logged in!"}
    email = user.user.email
    today = datetime.today()
    day_name = today.strftime("%A")
    message = claude.messages.create(
        model="claude-opus-4-5",
        max_tokens=2000,
        messages=[
            {
                "role": "user",
                "content": f"""You are a professional meeting minutes assistant.
                
                    Extract and structure the following meeting transcript into a formal Minutes of Meeting (MoM) report in {request.language}.

                    Return ONLY a JSON object with these exact keys:
                    - title: meeting title
                    - date: meeting date if mentioned
                    - location: location or online/in-person
                    - attendees: list of attendees mentioned
                    - purpose: purpose/objective of the meeting
                    - discussion: key discussion points
                    - decisions: decisions made
                    - action_items: list of action items with owner and deadline if mentioned
                    - next_meeting: next meeting date if mentioned
                    
                    For context, todays date is {day_name} {today}
                    If the date was not provided use todays date: {today}. If any future dates are mentioned, calculate them based on todays date: {day_name} {today}
                    If location is not specified, try to infer if it was online, or in-person and return either.
                    If you can't infer any of the keys from the text, leave the value as an empty string.

                    Transcript:
                    {request.transcript}"""
            }
        ]
    )
    content = message.content[0].text
    clean = content.replace("```json", "").replace("```", "").strip()
    mom_data = json.loads(clean)

    # Save to supabase
    supabase.table("mahdars").insert({
        "user_id": user.user.id,
        "title": mom_data.get("title", ""),
        "content": mom_data
    }).execute()

    return mom_data

@app.post("/export")
async def export(
    template: UploadFile = File(...),
    date: str = Form(""),
    title: str = Form(""),
    location: str = Form(""),
    attendees: str = Form(""),
    purpose: str = Form(""),
    discussion: str = Form(""),
    decisions: str = Form(""),
    action_items: str = Form(""),
    next_meeting: str = Form("")
):
    template_bytes = await template.read()
    
    tmp_path = "arabic_test_template_1.docx"
    output_path = "temp_output.docx"
    
    with open(tmp_path, "wb") as f:
        f.write(template_bytes)

    doc = DocxTemplate(tmp_path)
    
    context = {
        "date": date,
        "title": title,
        "location": location,
        "attendees": attendees,
        "purpose": purpose,
        "discussion": discussion,
        "decisions": decisions,
        "action_items": action_items,
        "next_meeting": next_meeting
    }
    
    doc.render(context)
    doc.save(output_path)
    
    return FileResponse(
        output_path,
        media_type="application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        filename="mahdar_report.docx"
    )