from fastapi import FastAPI, UploadFile, File, Form
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from dotenv import load_dotenv

# Database
from supabase import create_client
from urllib.parse import urlparse

# AI 
import openai
import anthropic
from pydantic import BaseModel

# Fuzzy matching
from rapidfuzz import fuzz, process

import json
from datetime import datetime
from hijri_converter import Gregorian
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

def match_attendee(name: str, saved_attendees: list, threshold: int = 75):
    if not saved_attendees:
        return None
    
    # Build list of (search_string, attendee) pairs — duplicates preserved!
    candidates = []
    for attendee in saved_attendees:
        candidates.append((attendee["name"], attendee))
        for alias in (attendee.get("aliases") or []):
            candidates.append((alias, attendee))
    
    # Extract just the strings for matching
    search_strings = [c[0] for c in candidates]
    
    # Find best match
    result = process.extractOne(
        name,
        search_strings,
        scorer=fuzz.WRatio,
        score_cutoff=threshold
    )
    
    if result:
        matched_string = result[0]
        matched_index = result[2]  # index of match in search_strings
        return candidates[matched_index][1]  # return the attendee object
    
    return None

class TranscriptRequest(BaseModel):
    transcript: str
    language: str = "english"
    token: str = ""

class AttendeeRequest(BaseModel):
    token: str
    name: str
    email: str = ""
    role: str = ""
    aliases: list = []

class DeleteAttendeeRequest(BaseModel):
    token: str
    attendee_id: int

class UpdateAttendeeRequest(BaseModel):
    token: str
    attendee_id: int
    name: str
    email: str = ""
    role: str = ""
    aliases: list = []

class TokenRequest(BaseModel):
    token: str

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "https://www.mahdari.com"],
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
    user_id = user.user.id
    today = datetime.today()
    day_name = today.strftime("%A")
    message = claude.messages.create(
        model="claude-opus-4-6",
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
                    - purpose: purpose of the meeting
                    - attendees: list of objects.Extract names from transcript, leave email and role as empty string if not mentioned.
                    - discussion: key discussion points
                    - decisions: decisions made
                    - action_items: list of objects with the following keys: "task", "owner", "deadline" (leave empty string if unknown)
                    - next_meeting: next meeting date if mentioned
                    
                    For context, todays date is {day_name} {today}
                    If the date was not provided use todays date: {today}. If any future dates are mentioned, calculate them based on todays date: {day_name} {today}
                    If location is not specified, try to infer if it was online, or in-person and return either.
                    If you can't infer any values from the text, leave the value as an empty string or empty objects.

                    Transcript:
                    {request.transcript}"""
            }
        ]
    )
    content = message.content[0].text
    clean = content.replace("```json", "").replace("```", "").strip()
    mom_data = json.loads(clean)
    print(mom_data)
    # Add Hijri Dates
    try:
        if mom_data.get("date"):
            gregorian_date = mom_data["date"].split("-")
            hijri = Gregorian(int(gregorian_date[0]), int(gregorian_date[1]), int(gregorian_date[2])).to_hijri()
            mom_data["hijri_date"] = f"{hijri.day}/{hijri.month}/{hijri.year} هـ"
        else:
            mom_data["hijri_date"] = ""
    except:
        mom_data["hijri_date"] = ""

    try:
        if mom_data.get("next_meeting"):
            next_date = mom_data["next_meeting"].split("-")
            hijri_next = Gregorian(int(next_date[0]), int(next_date[1]), int(next_date[2])).to_hijri()
            mom_data["hijri_next_meeting"] = f"{hijri_next.day}/{hijri_next.month}/{hijri_next.year} هـ"
        else:
            mom_data["hijri_next_meeting"] = ""
    except:
        mom_data["hijri_next_meeting"] = ""
    
    # Fetch saved attendees
    saved = supabase.table("attendees").select("*").eq("user_id", user_id).execute()
    saved_attendees = saved.data or []

    enriched_attendees = []
    for attendee in mom_data.get("attendees", []):
        match = match_attendee(attendee["name"], saved_attendees)
        if match:
            enriched_attendees.append({
                "name": match["name"],
                "email": match.get("email", ""),
                "role": match.get("role", "")
            })
        else:
            enriched_attendees.append(attendee)
    
    mom_data["attendees"] = enriched_attendees

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
    
    tmp_path = "temp_template.docx"
    output_path = "temp_output.docx"
    
    with open(tmp_path, "wb") as f:
        f.write(template_bytes)

    doc = DocxTemplate(tmp_path)
    
    context = {
        "date": date,
        "title": title,
        "location": location,
        "attendees": json.loads(attendees),       # parse JSON string to list
        "purpose": purpose,
        "discussion": discussion,
        "decisions": decisions,
        "action_items": json.loads(action_items), # parse JSON string to list
        "next_meeting": next_meeting
    }
    
    doc.render(context)
    doc.save(output_path)
    
    return FileResponse(
        output_path,
        media_type="application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        filename="mahdar_report.docx"
    )

@app.post("/save-attendee")
async def save_attendee(request: AttendeeRequest):
    user = supabase.auth.get_user(request.token)
    if not user:
        return {"error": "Not logged in!"}
    
    user_id = user.user.id
    
    # Check if attendee already exists
    existing = supabase.table("attendees").select("*").eq("user_id", user_id).eq("name", request.name).execute()
    
    if existing.data:
        return {"message": "Attendee already exists!"}
    
    supabase.table("attendees").insert({
        "user_id": user_id,
        "name": request.name,
        "email": request.email,
        "role": request.role,
        "aliases": request.aliases
    }).execute()
    
    return {"message": "Attendee saved!"}

@app.post("/get-attendees")
async def get_attendees(request: TokenRequest):
    user = supabase.auth.get_user(request.token)
    if not user:
        return {"error": "Not logged in!"}
    
    result = supabase.table("attendees").select("*").eq("user_id", user.user.id).execute()
    return {"attendees": result.data} 

@app.post("/delete-attendee")
async def delete_attendee(request: DeleteAttendeeRequest):
    user = supabase.auth.get_user(request.token)
    if not user:
        return {"error": "Not logged in!"}
    
    supabase.table("attendees").delete().eq("id", request.attendee_id).eq("user_id", user.user.id).execute()
    return {"message": "Attendee deleted!"}

@app.post("/update-attendee")
async def update_attendee(request: UpdateAttendeeRequest):
    user = supabase.auth.get_user(request.token)
    if not user:
        return {"error": "Not logged in!"}
    
    supabase.table("attendees").update({
        "name": request.name,
        "email": request.email,
        "role": request.role,
        "aliases": request.aliases
    }).eq("id", request.attendee_id).eq("user_id", user.user.id).execute()
    return {"message": "Attendee updated!"}

# templates
@app.post("/upload-template")
async def upload_template(
    file: UploadFile = File(...),
    name: str = Form(""),
    token: str = Form("")
):
    user = supabase.auth.get_user(token)
    if not user:
        return {"error": "Not logged in!"}
    
    user_id = user.user.id
    file_bytes = await file.read()
    file_path = f"{user_id}/{file.filename}"
    
    # Upload to Supabase Storage
    supabase.storage.from_("templates").upload(
        file_path,
        file_bytes,
        {"content-type": "application/vnd.openxmlformats-officedocument.wordprocessingml.document"}
    )
    
    # Save the STORAGE PATH (not the public URL) — makes delete reliable
    supabase.table("templates").insert({
        "user_id": user_id,
        "name": name or file.filename,
        "file_path": file_path          # <-- store path, not URL
    }).execute()
    
    return {"message": "Template uploaded!", "file_path": file_path}


@app.post("/get-templates")
async def get_templates(request: TokenRequest):
    user = supabase.auth.get_user(request.token)
    if not user:
        return {"error": "Not logged in!"}
    
    user_id = user.user.id
    result = supabase.table("templates").select("*").eq("user_id", user_id).execute()
    
    templates = []
    for t in result.data:
        # Generate a fresh signed URL for each template (valid 1 hour)
        signed = supabase.storage.from_("templates").create_signed_url(
            t["file_path"], 3600
        )
        templates.append({
            **t,
            "download_url": signed.get("signedURL") or signed.get("signed_url")
        })
    
    return {"templates": templates}


class DeleteTemplateRequest(BaseModel):
    token: str
    template_id: int
    file_path: str          # <-- accept file_path directly, not file_url


@app.post("/delete-template")
async def delete_template(request: DeleteTemplateRequest):
    user = supabase.auth.get_user(request.token)
    if not user:
        return {"error": "Not logged in!"}
    
    user_id = user.user.id
    
    # Security check: make sure the path belongs to this user
    if not request.file_path.startswith(f"{user_id}/"):
        return {"error": "Unauthorized"}
    
    # Delete from storage using the exact path
    storage_result = supabase.storage.from_("templates").remove([request.file_path])
    print("Storage delete result:", storage_result)   # log this to verify
    
    # Delete from table
    supabase.table("templates").delete().eq("id", request.template_id).eq("user_id", user_id).execute()
    
    return {"message": "Template deleted!"}

@app.post("/get-mahdars")
async def get_mahdars(request: TokenRequest):
    user = supabase.auth.get_user(request.token)
    if not user:
        return {"error": "Not logged in!"}
    
    result = supabase.table("mahdars").select("*").eq("user_id", user.user.id).order("created_at", desc=True).execute()
    return {"mahdars": result.data}

class GetMahdarRequest(BaseModel):
    token: str
    mahdar_id: int

@app.post("/get-mahdar")
async def get_mahdar(request: GetMahdarRequest):
    user = supabase.auth.get_user(request.token)
    if not user:
        return {"error": "Not logged in!"}
    
    result = supabase.table("mahdars").select("*").eq("id", request.mahdar_id).eq("user_id", user.user.id).single().execute()
    return {"mahdar": result.data}