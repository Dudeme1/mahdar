from fastapi import FastAPI, UploadFile, File, Form, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse, JSONResponse
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

# Dodo payments
from dodopayments import DodoPayments

# Templates
import re
import zipfile
import mammoth, io
import httpx

import json
from datetime import datetime, date, timedelta
from dateutil.relativedelta import relativedelta
import time
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

# Mahdar Variables
KNOWN_VARIABLES = {
    "title":              {"type": "scalar"},
    "date":               {"type": "scalar"},
    "hijri_date":         {"type": "scalar"},
    "location":           {"type": "scalar"},
    "purpose":            {"type": "scalar"},
    "discussion":         {"type": "scalar"},
    "decisions":          {"type": "scalar"},
    "next_meeting":       {"type": "scalar"},
    "hijri_next_meeting": {"type": "scalar"},
    "attendees": {
        "type": "loop",
        "fields": ["name", "role", "email"],
    },
    "action_items": {
        "type": "loop",
        "fields": ["task", "owner", "deadline"],
    },
}

# Plan / Subscription Variables (pro / free)
PLAN_LIMITS = {
    "free": 4,
    "pro": 250
}

# Template Variables
_PREVIEW_SCALARS = {
    "title":              "Board Meeting – Q2 Review",
    "location":           "Conference Room B",
    "purpose":            "Quarterly progress review and planning",
    "discussion":         "Team discussed Q2 milestones, budget allocation, and upcoming product launch.",
    "decisions":          "Approved Q3 budget. Agreed to proceed with product launch on 1 July.",
    "hijri_date":         "15/11/1446 هـ",
    "hijri_next_meeting": "29/11/1446 هـ",
}
 
_PREVIEW_ATTENDEES = [
    {"name": "Sarah Al-Rashid", "role": "Project Manager",  "email": "sarah@example.com"},
    {"name": "Omar Khalid",     "role": "Lead Engineer",    "email": "omar@example.com"},
    {"name": "Layla Mahmoud",   "role": "Product Designer", "email": "layla@example.com"},
]
 
_PREVIEW_ACTIONS = [
    {"task": "Finalise Q3 roadmap",    "owner": "Sarah Al-Rashid", "deadline": "15 Jun 2025"},
    {"task": "Complete API migration", "owner": "Omar Khalid",     "deadline": "30 Jun 2025"},
]
 
# Robust patterns — handle {%tr %}, {%- -%}, any loop variable name
_PAT_FOR_ATTENDEES = re.compile(r'\{%-?\s*(?:tr\s+)?for\s+\w+\s+in\s+attendees\s*-?%\}')
_PAT_FOR_ACTIONS   = re.compile(r'\{%-?\s*(?:tr\s+)?for\s+\w+\s+in\s+action_items\s*-?%\}')
_PAT_ENDFOR        = re.compile(r'\{%-?\s*(?:tr\s+)?endfor\s*-?%\}')
 
# Match any loop-variable prefix: item.name, attendee.name, row.name, etc.
_PAT_FIELD = {
    "name":     re.compile(r'\{\{\s*\w+\.name\s*\}\}'),
    "role":     re.compile(r'\{\{\s*\w+\.role\s*\}\}'),
    "email":    re.compile(r'\{\{\s*\w+\.email\s*\}\}'),
    "task":     re.compile(r'\{\{\s*\w+\.task\s*\}\}'),
    "owner":    re.compile(r'\{\{\s*\w+\.owner\s*\}\}'),
    "deadline": re.compile(r'\{\{\s*\w+\.deadline\s*\}\}'),
}
 
_GREEN = '<mark class="pvg">{}</mark>'
_RED   = '<mark class="pvr" title="Unrecognised variable">{}</mark>'
_LOOP  = '<span class="pvl">[loop]</span>'

# Dodopayments initialization
dodo = DodoPayments(
    bearer_token=os.getenv("DODO_API_KEY"),
    environment="live_mode"
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

import time

# ─── Template preprocessor ────────────────────────────────────────────────────
def fix_bare_table_loops(template_bytes: bytes) -> bytes:
    """
    Upgrade bare {% for x in y %} / {% endfor %} tags that are the sole text
    content of a table row to {%tr for x in y %} / {%tr endfor %}.

    docxtpl removes the entire <w:tr> for {%tr ...} loop-marker rows, so no
    blank row appears in the output. Without this, templates that use the plain
    {% %} form keep their row structure alive and produce an empty row between
    every repeated data row.
    """
    buf = io.BytesIO()
    with zipfile.ZipFile(io.BytesIO(template_bytes)) as zin:
        with zipfile.ZipFile(buf, 'w', zipfile.ZIP_DEFLATED) as zout:
            for item in zin.infolist():
                data = zin.read(item.filename)
                if item.filename == 'word/document.xml':
                    xml = data.decode('utf-8', errors='replace')

                    def upgrade_loop_row(m):
                        row = m.group(0)
                        if '{%tr ' in row:
                            return row
                        plain = re.sub(r'<[^>]+>', '', row)
                        plain = re.sub(r'\s+', ' ', plain).strip()
                        if re.match(r'^\{%-?\s*(?:for\s+\w+\s+in\s+[\w.]+|endfor)\s*-?%\}$', plain):
                            row = row.replace('{%', '{%tr', 1)
                        return row

                    xml = re.sub(r'<w:tr[ >].*?</w:tr>', upgrade_loop_row, xml, flags=re.DOTALL)
                    data = xml.encode('utf-8')
                zout.writestr(item, data)
    buf.seek(0)
    return buf.read()


# ─── Filename sanitizer ────────────────────────────────────────────────────────
def sanitize_filename(filename: str) -> str:
    """Return a Supabase-storage-safe filename: ASCII-only, no spaces, safe chars."""
    if '.' in filename:
        name, ext = filename.rsplit('.', 1)
        ext = '.' + re.sub(r'[^\w]', '', ext).lower()
    else:
        name, ext = filename, ''
    name = name.replace(' ', '_')
    name = name.encode('ascii', 'ignore').decode('ascii')  # strip non-ASCII (e.g. Arabic)
    name = re.sub(r'[^\w\-]', '_', name)
    name = re.sub(r'_+', '_', name).strip('_')
    if not name:
        name = f"file_{int(time.time())}"
    return name + ext


def call_claude_with_retry(claude, messages, model, max_tokens, max_retries=3):
    for attempt in range(max_retries):
        try:
            return claude.messages.create(
                model=model,
                max_tokens=max_tokens,
                messages=messages
            )
        except Exception as e:
            if attempt < max_retries - 1:
                print(f"Claude API error, retrying... attempt {attempt + 1}")
                time.sleep(2)  # wait 2 seconds before retry
            else:
                raise e

def check_and_reset_if_needed(subscription):
    last_reset = datetime.strptime(subscription["last_reset_date"], "%Y-%m-%d").date()
    today = date.today()
    
    # Has a month passed since last reset?
    if today >= last_reset + relativedelta(months=1):
        # Reset the count!
        supabase.table("subscriptions").update({
            "mahdar_count_this_month": 0,
            "last_reset_date": today.isoformat()
        }).eq("user_id", subscription["user_id"]).execute()
        subscription["mahdar_count_this_month"] = 0
    
    return subscription

def _build_preview_html(raw_bytes: bytes) -> str:
    today = date.today()
    scalars = {
        **_PREVIEW_SCALARS,
        "date":         today.strftime("%d %B %Y"),
        "next_meeting": (today + timedelta(weeks=2)).strftime("%d %B %Y"),
    }
 
    html = mammoth.convert_to_html(io.BytesIO(raw_bytes)).value
 
    # Step 1 — loop control tags first (before red catch-all fires)
    html = _PAT_FOR_ATTENDEES.sub(_LOOP, html)
    html = _PAT_FOR_ACTIONS.sub(_LOOP,   html)
    html = _PAT_ENDFOR.sub(_LOOP,        html)
 
    # Step 2 — loop field values (any variable prefix)
    html = _PAT_FIELD["name"].sub(
        _GREEN.format(", ".join(a["name"] for a in _PREVIEW_ATTENDEES)), html)
    html = _PAT_FIELD["role"].sub(
        _GREEN.format(", ".join(a["role"] for a in _PREVIEW_ATTENDEES)), html)
    html = _PAT_FIELD["email"].sub(
        _GREEN.format(", ".join(a["email"] for a in _PREVIEW_ATTENDEES)), html)
    html = _PAT_FIELD["task"].sub(
        _GREEN.format(" / ".join(a["task"] for a in _PREVIEW_ACTIONS)), html)
    html = _PAT_FIELD["owner"].sub(
        _GREEN.format(" / ".join(a["owner"] for a in _PREVIEW_ACTIONS)), html)
    html = _PAT_FIELD["deadline"].sub(
        _GREEN.format(" / ".join(a["deadline"] for a in _PREVIEW_ACTIONS)), html)
 
    # Step 3 — scalar substitutions
    for var, val in scalars.items():
        html = re.sub(r'\{\{\s*' + re.escape(var) + r'\s*\}\}', _GREEN.format(val), html)
 
    # Step 4 — anything remaining is truly unrecognised → red
    html = re.sub(r'\{\{.*?\}\}', lambda m: _RED.format(m.group()), html)
    html = re.sub(r'\{%.*?%\}',   lambda m: _RED.format(m.group()), html)
 
    return f"""<!DOCTYPE html>
            <html>
            <head>
            <meta charset="utf-8">
            <style>
            body {{
                font-family: 'Segoe UI', Arial, sans-serif;
                font-size: 13px; line-height: 1.75;
                color: #1a1a1a; background: #fff;
                padding: 28px 36px; margin: 0;
            }}
            p  {{ margin: 0 0 7px; }}
            table {{ border-collapse: collapse; width: 100%; margin: 8px 0 14px; }}
            td, th {{ border: 1px solid #ddd; padding: 6px 10px; font-size: 12px; }}
            th {{ background: #f4f4f4; font-weight: 600; }}
            strong {{ color: #1a2e22; }}
            mark.pvg {{
                background: #d1fae5; color: #065f46;
                border-radius: 4px; padding: 1px 5px; font-weight: 600; font-style: normal;
            }}
            mark.pvr {{
                background: #fee2e2; color: #991b1b;
                border-radius: 4px; padding: 1px 5px; font-style: normal;
            }}
            span.pvl {{
                font-size: 10px; color: #64748b;
                background: #f1f5f9; border-radius: 3px;
                padding: 1px 5px; font-style: italic;
            }}
            </style>
            </head>
            <body>{html}</body>
            </html>"""

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
        model="gpt-4o-transcribe",
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

    # Check subscription and limits
    sub_result = supabase.table("subscriptions").select("*").eq("user_id", user_id).maybe_single().execute()
    sub_data = sub_result.data if sub_result else None
    if not sub_data:
        # Auto-create free subscription if missing
        supabase.table("subscriptions").insert({
            "user_id": user_id,
            "plan": "free",
            "status": "active",
            "mahdar_count_this_month": 0,
            "last_reset_date": datetime.now().date().isoformat()
        }).execute()
    
    # Re-fetch after creating
    sub_result = supabase.table("subscriptions").select("*").eq("user_id", user_id).maybe_single().execute()
    
    subscription = check_and_reset_if_needed(sub_result.data)
    plan = subscription["plan"]
    count = subscription["mahdar_count_this_month"]
    limit = PLAN_LIMITS[plan]
    
    if count >= limit:
        print("YOUVE REACHED YOUR LIMIT BRUV")
        return {
            "error": "limit_reached",
            "message": f"You've used all {limit} mahdars this month! {'Upgrade to Pro for 250/month.' if plan == 'free' else 'Limit resets next month.'}"
        }

    today = datetime.today()
    day_name = today.strftime("%A")
    message = call_claude_with_retry(
        claude,
        model="claude-opus-4-6",
        max_tokens=10000,
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
                    - discussion: a JSON array of strings, each string being one key discussion point. Example: ["Point one", "Point two"]. Be thorough and cover all main topics discussed.
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

    # Normalize discussion: Claude may return a list or a string
    disc = mom_data.get("discussion", "")
    if isinstance(disc, list):
        mom_data["discussion"] = "\n".join(
            f"{i+1}. {str(p).strip()}"
            for i, p in enumerate(disc)
            if p and str(p).strip()
        )

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

    # Increment mahdar count
    supabase.table("subscriptions").update({
        "mahdar_count_this_month": count + 1
    }).eq("user_id", user_id).execute()

    # Save to supabase
    supabase.table("mahdars").insert({
        "user_id": user_id,
        "title": mom_data.get("title", ""),
        "content": mom_data
    }).execute()

    return mom_data

@app.post("/preview-mahdar")
async def preview_mahdar(
    template:          UploadFile = File(...),
    token:             str        = Form(""),
    date:              str        = Form(""),
    hijri_date:        str        = Form(""),
    title:             str        = Form(""),
    location:          str        = Form(""),
    purpose:           str        = Form(""),
    discussion:        str        = Form(""),
    decisions:         str        = Form(""),
    next_meeting:      str        = Form(""),
    hijri_next_meeting:str        = Form(""),
    attendees:         str        = Form("[]"),   # JSON string
    action_items:      str        = Form("[]"),   # JSON string
):
    """
    Converts a .docx template to HTML preview with the REAL meeting data
    substituted in (green highlights), not placeholders.
    Unknown variables are shown in red.
    """
    user = supabase.auth.get_user(token)
    if not user:
        return {"error": "Not logged in!"}
 
    raw = await template.read()
 
    import json as _json
    try:
        attendees_list   = _json.loads(attendees)
        action_items_list = _json.loads(action_items)
    except Exception:
        attendees_list   = []
        action_items_list = []
 
    real_scalars = {
        "title":              title,
        "date":               date,
        "hijri_date":         hijri_date,
        "location":           location,
        "purpose":            purpose,
        "discussion":         discussion,
        "decisions":          decisions,
        "next_meeting":       next_meeting,
        "hijri_next_meeting": hijri_next_meeting,
    }
 
    _G = '<mark class="pvg">{}</mark>'
    _R = '<mark class="pvr" title="Unrecognised variable">{}</mark>'
    _L = '<span class="pvl">[loop]</span>'
 
    # Reuse the robust loop patterns from the preview endpoint
    _pat_for_attendees = re.compile(r'\{%-?\s*(?:tr\s+)?for\s+\w+\s+in\s+attendees\s*-?%\}')
    _pat_for_actions   = re.compile(r'\{%-?\s*(?:tr\s+)?for\s+\w+\s+in\s+action_items\s*-?%\}')
    _pat_endfor        = re.compile(r'\{%-?\s*(?:tr\s+)?endfor\s*-?%\}')
 
    try:
        html = mammoth.convert_to_html(io.BytesIO(raw)).value
    except Exception as e:
        return {"error": f"Could not convert template: {str(e)}"}
 
    # Step 1 — loop control tags → dim label
    html = _pat_for_attendees.sub(_L, html)
    html = _pat_for_actions.sub(_L,   html)
    html = _pat_endfor.sub(_L,        html)
 
    # Step 2 — loop field values with real data
    # Show comma-separated for attendees fields, slash-separated for action items
    loop_map = {}
    if attendees_list:
        loop_map["name"]     = ", ".join(a.get("name","")     for a in attendees_list if a.get("name"))
        loop_map["role"]     = ", ".join(a.get("role","")     for a in attendees_list if a.get("role"))
        loop_map["email"]    = ", ".join(a.get("email","")    for a in attendees_list if a.get("email"))
    if action_items_list:
        loop_map["task"]     = " / ".join(i.get("task","")    for i in action_items_list if i.get("task"))
        loop_map["owner"]    = " / ".join(i.get("owner","")   for i in action_items_list if i.get("owner"))
        loop_map["deadline"] = " / ".join(i.get("deadline","")for i in action_items_list if i.get("deadline"))
 
    for field, val in loop_map.items():
        if val:
            html = re.sub(
                r'\{\{\s*\w+\.' + re.escape(field) + r'\s*\}\}',
                _G.format(val),
                html
            )
 
    # Step 3 — scalar replacements with real values
    for var, val in real_scalars.items():
        if val:
            html = re.sub(
                r'\{\{\s*' + re.escape(var) + r'\s*\}\}',
                _G.format(val),
                html
            )
 
    # Step 4 — remaining {{ }} and {% %} are unknown → red
    html = re.sub(r'\{\{.*?\}\}', lambda m: _R.format(m.group()), html)
    html = re.sub(r'\{%.*?%\}',   lambda m: _R.format(m.group()), html)
 
    full_html = f"""<!DOCTYPE html>
                    <html>
                    <head>
                    <meta charset="utf-8">
                    <style>
                    body {{ font-family:'Segoe UI',Arial,sans-serif;font-size:13px;line-height:1.75;color:#1a1a1a;background:#fff;padding:28px 36px;margin:0; }}
                    p {{ margin:0 0 7px; }}
                    table {{ border-collapse:collapse;width:100%;margin:8px 0 14px; }}
                    td,th {{ border:1px solid #ddd;padding:6px 10px;font-size:12px; }}
                    th {{ background:#f4f4f4;font-weight:600; }}
                    strong {{ color:#1a2e22; }}
                    mark.pvg {{ background:#d1fae5;color:#065f46;border-radius:4px;padding:1px 5px;font-weight:600;font-style:normal; }}
                    mark.pvr {{ background:#fee2e2;color:#991b1b;border-radius:4px;padding:1px 5px;font-style:normal; }}
                    span.pvl {{ font-size:10px;color:#64748b;background:#f1f5f9;border-radius:3px;padding:1px 5px;font-style:italic; }}
                    </style>
                    </head>
                    <body>{html}</body>
                    </html>"""
 
    return {"html": full_html}

@app.post("/export")
async def export(
    template: UploadFile = File(...),
    date: str = Form(""),
    hijri_date: str = Form(""),
    title: str = Form(""),
    location: str = Form(""),
    attendees: str = Form(""),
    purpose: str = Form(""),
    discussion: str = Form(""),
    decisions: str = Form(""),
    action_items: str = Form(""),
    next_meeting: str = Form(""),
    hijri_next_meeting: str = Form("")
):
    template_bytes = await template.read()
    template_bytes = fix_bare_table_loops(template_bytes)

    tmp_path = "temp_template.docx"
    output_path = "temp_output.docx"

    with open(tmp_path, "wb") as f:
        f.write(template_bytes)

    doc = DocxTemplate(tmp_path)

    context = {
        "date": date,
        "hijri_date": hijri_date,
        "title": title,
        "location": location,
        "attendees": json.loads(attendees) if attendees else [],
        "purpose": purpose,
        "discussion": discussion,
        "decisions": decisions,
        "action_items": json.loads(action_items) if action_items else [],
        "next_meeting": next_meeting,
        "hijri_next_meeting": hijri_next_meeting,
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
    safe_name = sanitize_filename(file.filename)
    file_path = f"{user_id}/{safe_name}"

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

@app.post("/scan-template")
async def scan_template(file: UploadFile = File(...), token: str = Form("")):
    user = supabase.auth.get_user(token)
    if not user:
        return {"error": "Not logged in!"}
 
    file_bytes = await file.read()
    try:
        with zipfile.ZipFile(io.BytesIO(file_bytes)) as z:
            doc_xml = z.read("word/document.xml").decode("utf-8", errors="replace")
    except Exception as e:
        return {"error": f"Could not read .docx: {str(e)}"}
 
    plain = re.sub(r"<[^>]+>", "", doc_xml)
 
    found, not_found = [], []
 
    for var, meta in KNOWN_VARIABLES.items():
        if meta["type"] == "scalar":
            if re.search(r'\{\{\s*' + re.escape(var) + r'\s*\}\}', plain):
                found.append(var)
            else:
                not_found.append(var)
 
        elif meta["type"] == "loop":
            # Match BOTH paragraph loop {{% for x in collection %}}
            # AND docxtpl table-row loop {%tr for x in collection %}
            loop_pat = re.compile(
                r'\{%-?\s*(?:tr\s+)?for\s+\w+\s+in\s+' + re.escape(var) + r'\s*-?%\}'
            )
            if loop_pat.search(plain):
                found.append(var)
                for field in meta["fields"]:
                    if not re.search(r'\{\{\s*\w+\.' + re.escape(field) + r'\s*\}\}', plain):
                        not_found.append(field)
            else:
                not_found.append(var)
 
    # Detect unrecognised {{ }} variables
    all_doc_vars = re.findall(r'\{\{\s*([\w.]+)\s*\}\}', plain)
    known_fields = {
        f"{var}.{field}"
        for var, meta in KNOWN_VARIABLES.items()
        if meta["type"] == "loop"
        for field in meta["fields"]
    }
    unknown_vars = [
        v for v in set(all_doc_vars)
        if v not in KNOWN_VARIABLES and v not in known_fields
        # also exclude any x.field where field is known (handles arbitrary loop var names)
        and not any(v.endswith("." + f) for meta in KNOWN_VARIABLES.values()
                    for f in meta.get("fields", []))
    ]
 
    return {"found": found, "not_found": not_found, "unknown_vars": unknown_vars}
 

@app.post("/preview-template")
async def preview_template(file: UploadFile = File(...), token: str = Form("")):
    user = supabase.auth.get_user(token)
    if not user:
        return {"error": "Not logged in!"}
    raw = await file.read()
    try:
        return {"html": _build_preview_html(raw)}
    except Exception as e:
        return {"error": f"Preview failed: {str(e)}"}
 
 
@app.post("/preview-template-by-url")
async def preview_template_by_url(request: Request):
    body  = await request.json()
    token = body.get("token", "")
    url   = body.get("url", "")
    user  = supabase.auth.get_user(token)
    if not user:
        return {"error": "Not logged in!"}
    async with httpx.AsyncClient() as client:
        resp = await client.get(url)
    if resp.status_code != 200:
        return {"error": "Could not fetch template file."}
    try:
        return {"html": _build_preview_html(resp.content)}
    except Exception as e:
        return {"error": f"Preview failed: {str(e)}"}

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

@app.get("/starter-template")
async def starter_template():
    """Serves the pre-built starter .docx for users to download and customise."""
    path = "mahdari_starter_template.docx"   # put the file next to main.py
    if not os.path.exists(path):
        return JSONResponse(status_code=404, content={"error": "Starter template not found on server."})
    return FileResponse(
        path,
        media_type="application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        filename="mahdari_starter_template.docx"
    )
 
 
@app.post("/scan-template")
async def scan_template(
    file: UploadFile = File(...),
    token: str = Form("")
):
    """
    Reads a .docx upload and returns which known variables were found vs missing.
    Called automatically by the frontend when the user picks a file — before upload.
    """
    user = supabase.auth.get_user(token)
    if not user:
        return {"error": "Not logged in!"}
 
    file_bytes = await file.read()
 
    # A .docx is a ZIP — pull the main document XML out of it
    try:
        with zipfile.ZipFile(io.BytesIO(file_bytes)) as z:
            doc_xml = z.read("word/document.xml").decode("utf-8", errors="replace")
    except Exception as e:
        return {"error": f"Could not read .docx file: {str(e)}"}
 
    # Strip all XML tags so we're searching plain text only
    plain_text = re.sub(r"<[^>]+>", "", doc_xml)
 
    found = []
    missing = []
 
    for var, meta in KNOWN_VARIABLES.items():
        if meta["type"] == "scalar":
            pattern = r"\{\{[\s]*" + re.escape(var) + r"[\s]*\}\}"
            if re.search(pattern, plain_text):
                found.append(var)
            else:
                missing.append(var)
 
        elif meta["type"] == "loop":
            loop_var = meta["loop_var"]
            loop_pattern = (
                r"\{%[\s]*for[\s]+" +
                re.escape(loop_var) +
                r"[\s]+in[\s]+" +
                re.escape(var) +
                r"[\s]*%\}"
            )
            if re.search(loop_pattern, plain_text):
                found.append(var)
                # Check sub-fields within the loop too
                for field in meta["fields"]:
                    field_pattern = r"\{\{[\s]*" + re.escape(field) + r"[\s]*\}\}"
                    if not re.search(field_pattern, plain_text):
                        missing.append(field)
            else:
                missing.append(var)
 
    # Detect any {{ something }} the user wrote that we don't recognise
    all_vars_in_doc = re.findall(r"\{\{[\s]*([\w.]+)[\s]*\}\}", plain_text)
    known_fields = {
        field
        for meta in KNOWN_VARIABLES.values()
        for field in meta.get("fields", [])
    }
    unknown_vars = [
        v for v in set(all_vars_in_doc)
        if v not in KNOWN_VARIABLES and v not in known_fields
    ]
 
    required_missing = [v for v in missing if KNOWN_VARIABLES.get(v, {}).get("required")]
    optional_missing  = [v for v in missing if not KNOWN_VARIABLES.get(v, {}).get("required")]
 
    return {
        "is_valid":             len(required_missing) == 0,
        "found":                found,
        "required_missing":     required_missing,
        "optional_missing":     optional_missing,
        "unknown_vars":         unknown_vars,
        "summary": {
            "total_known":              len(KNOWN_VARIABLES),
            "found_count":              len(found),
            "required_missing_count":   len(required_missing),
        }
    }

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

class SubscribeRequest(BaseModel):
    token: str

class CancelSubscriptionRequest(BaseModel):
    token: str
    reason: str = ""
    message: str = ""

# Subscriptions
@app.post("/get-subscription")
async def get_subscription(request: TokenRequest):
    user = supabase.auth.get_user(request.token)
    if not user:
        return {"error": "Not logged in!"}
 
    user_id = user.user.id
 
    result = supabase.table("subscriptions").select("*").eq("user_id", user_id).maybe_single().execute()
 
    if not result.data:
        # Auto-create free subscription if somehow missing
        supabase.table("subscriptions").insert({
            "user_id": user_id,
            "plan": "free",
            "status": "active",
            "mahdar_count_this_month": 0,
            "last_reset_date": datetime.now().date().isoformat()
        }).execute()
        result = supabase.table("subscriptions").select("*").eq("user_id", user_id).maybe_single().execute()
 
    # Run the monthly reset check while we're here
    subscription = check_and_reset_if_needed(result.data)
 
    return {"subscription": subscription}

@app.post("/create-subscription")
async def create_subscription(request: TokenRequest):
    user = supabase.auth.get_user(request.token)
    if not user:
        return {"error": "Not logged in!"}
    
    user_id = user.user.id
    
    # Check if subscription already exists
    existing = supabase.table("subscriptions").select("*").eq("user_id", user_id).maybe_single().execute()
    
    if not existing.data:
        supabase.table("subscriptions").insert({
            "user_id": user_id,
            "plan": "free",
            "status": "active",
            "mahdar_count_this_month": 0,
            "last_reset_date": datetime.now().date().isoformat()
        }).execute()
    
    return {"message": "Subscription created!"}

@app.post("/subscribe")
async def subscribe(request: SubscribeRequest):
    user = supabase.auth.get_user(request.token)
    if not user:
        return {"error": "Not logged in!"}
    
    email = user.user.email

    session = dodo.checkout_sessions.create(
        product_cart=[{
            "product_id": os.getenv("DODO_PRODUCT_ID"),
            "quantity": 1
        }],
        customer={"email": email, "name": email},
        return_url=os.getenv("VITE_APP_URL", "https://www.mahdari.com") + "/subscription",
    )

    return {"url": session.checkout_url}

@app.post("/webhook")
async def webhook(request: Request):
    payload = await request.body()
    headers = dict(request.headers)

    try:
        event = dodo.webhooks.unwrap(
            payload,
            headers,
            os.getenv("DODO_WEBHOOK_SECRET")
        )

        data = event.data
        email = data.customer.email
        user_result = supabase.table("users").select("*").eq("email", email).maybe_single().execute()

        if not user_result.data:
            print(f"Webhook: no user found for {email}")
            return {"received": True}

        user_id = user_result.data["user_id"]

        if event.type == "subscription.active":
            update = {
                "plan": "pro",
                "status": "active",
                "ends_at": data.next_billing_date.isoformat() if data.next_billing_date else None,
                "dodo_subscription_id": data.subscription_id,
                "dodo_customer_id": data.customer.customer_id,
                "cancel_at_next_billing_date": data.cancel_at_next_billing_date,
            }
            supabase.table("subscriptions").update(update).eq("user_id", user_id).execute()
            print(f"Subscription activated: {email}")

        elif event.type == "subscription.renewed":
            update = {
                "plan": "pro",
                "status": "active",
                "ends_at": data.next_billing_date.isoformat() if data.next_billing_date else None,
                "cancel_at_next_billing_date": False,
            }
            supabase.table("subscriptions").update(update).eq("user_id", user_id).execute()
            print(f"Subscription renewed: {email}")

        elif event.type == "subscription.cancelled":
            supabase.table("subscriptions").update({
                "plan": "free",
                "status": "cancelled",
                "cancel_at_next_billing_date": False,
            }).eq("user_id", user_id).execute()
            print(f"Subscription cancelled: {email}")

        elif event.type == "subscription.expired":
            supabase.table("subscriptions").update({
                "plan": "free",
                "status": "expired",
            }).eq("user_id", user_id).execute()
            print(f"Subscription expired: {email}")

        return {"received": True}
    except Exception as e:
        print(f"Webhook error: {e}")
        return JSONResponse(status_code=400, content={"error": str(e)})

@app.post("/cancel-subscription")
async def cancel_subscription(request: CancelSubscriptionRequest):
    user = supabase.auth.get_user(request.token)
    if not user:
        return {"error": "Not logged in!"}

    user_id = user.user.id
    result = supabase.table("subscriptions").select("*").eq("user_id", user_id).maybe_single().execute()
    if not result.data:
        return {"error": "No subscription found"}

    dodo_sub_id = result.data.get("dodo_subscription_id")
    if not dodo_sub_id:
        return {"error": "No Dodo subscription ID on record — contact support."}

    try:
        dodo.subscriptions.update(dodo_sub_id, cancel_at_next_billing_date=True)
    except Exception as e:
        return {"error": f"Failed to cancel with payment provider: {str(e)}"}

    # Persist cancellation in DB — columns may need to be added (see README)
    try:
        supabase.table("subscriptions").update({
            "cancel_at_next_billing_date": True,
            "cancellation_reason": request.reason,
            "cancellation_message": request.message,
        }).eq("user_id", user_id).execute()
    except Exception as e:
        print(f"DB cancellation update warning: {e}")

    return {"message": "Subscription will cancel at the end of the current billing period."}


@app.post("/get-payment-history")
async def get_payment_history(request: TokenRequest):
    user = supabase.auth.get_user(request.token)
    if not user:
        return {"error": "Not logged in!"}

    user_id = user.user.id
    result = supabase.table("subscriptions").select("*").eq("user_id", user_id).maybe_single().execute()
    if not result.data:
        return {"payments": []}

    dodo_customer_id = result.data.get("dodo_customer_id")
    if not dodo_customer_id:
        return {"payments": []}

    try:
        page = dodo.payments.list(customer_id=dodo_customer_id, page_size=20)
        payments = []
        for p in page.items:
            payments.append({
                "payment_id": p.payment_id,
                "date": p.created_at.isoformat() if p.created_at else None,
                "amount": round(p.total_amount / 100, 2),
                "currency": str(p.currency).upper() if p.currency else "USD",
                "status": str(p.status) if p.status else "unknown",
                "payment_method": p.payment_method,
                "card_last_four": p.card_last_four,
                "subscription_id": p.subscription_id,
            })
        return {"payments": payments}
    except Exception as e:
        print(f"Payment history error: {e}")
        return {"payments": [], "error": str(e)}