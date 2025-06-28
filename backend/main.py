from fastapi import FastAPI, Request, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import json
import uuid
import os
import re
from PyPDF2 import PdfReader
import docx


#Initialiize FastAPI app
app = FastAPI()

#Implementing cors middleware for frontend integration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

#Ensure the saves directory exists
os.makedirs("saves", exist_ok=True)


#Request for AI enhancement of resume sections
# This endpoint receives a section name and content, enhances it, and returns the enhanced content.
class EnhanceRequest(BaseModel):
    section: str
    content: str


# Route: Enhance a specific resume section using simple logic
@app.post("/ai-enhance")
async def enhance_section(req: EnhanceRequest):
    section = req.section.strip().lower()
    content = req.content.strip()

    if section == "summary":
        enhanced = (
            "An ambitious and results-oriented professional recognized for exceptional problem-solving skills, adaptability, and a relentless drive for excellence. "
            + content.capitalize()
        )
    elif section == "experience":
        enhanced = (
            "Successfully contributed to key projects, collaborated with teams, and applied knowledge to real-world challenges. "
            + content.capitalize()
        )
    elif section == "education":
        if any(x in content.lower() for x in ["btech", "b.tech", "bachelor"]):
            enhanced = (
                "Completed my Bachelor of Technology with consistently strong academic performance and a growing CGPA each semester. "
                + content.capitalize()
            )
        else:
            enhanced = (
                "Completed education with strong academic performance and a focus on personal and professional growth. "
                + content.capitalize()
            )
    elif section == "skills":
        if "react" in content.lower():
            enhanced = (
                "Experienced in React and JavaScript, with a strong grasp of frontend development principles."
                + content.capitalize()
            )
        elif "python" in content.lower():
            enhanced = (
                "Skilled in Python, especially with libraries like NumPy and Pandas, with strong scripting and automation abilities. "
                + content.capitalize()
            )
        else:
            enhanced = (
                "Possess strong technical skills in modern tools and frameworks relevant to today's tech roles. "
                + content.capitalize()
            )
    elif section == "projects":
        enhanced = (
            "Demonstrated ability to lead and contribute to impactful projects, showcasing technical skills and teamwork. "
            + content.capitalize()
        )
    else:
        enhanced = f"{content.capitalize()} — enhanced with a more polished and professional tone."

    return {"content": enhanced}


# Helper function to extract content sections from uploaded resume
def extract_sections(text):
    sections = {
        "summary": "",
        "experience": "",
        "education": "",
        "skills": "",
        "projects": ""
    }
 # Define patterns for section headers (matching the key words that provided and seperating accordingly)
    section_patterns = {
        "summary": re.compile(r"\b(objective|summary)\b", re.IGNORECASE),
        "experience": re.compile(r"\b(experience|work experience|professional experience)\b", re.IGNORECASE),
        "education": re.compile(r"\b(education|academic background)\b", re.IGNORECASE),
        "skills": re.compile(r"\b(skills|technical skills|technical skill)\b", re.IGNORECASE),
        "projects": re.compile(r"\b(projects|key projects|personal projects)\b", re.IGNORECASE)
    }


    current = None
    buffer = []

# Loop through each line to classify it into sections
    for line in text.splitlines():
        line = line.strip()
        if not line:
            continue

        matched = None
        for key, pattern in section_patterns.items():
            if pattern.search(line):
                matched = key
                break

        if matched:
            if current and buffer:
                sections[current] += "\n".join(buffer).strip() + "\n"
            current = matched
            buffer = []
        else:
            buffer.append(line)

 # Append the last buffered section
    if current and buffer:
        sections[current] += "\n".join(buffer).strip()

    return sections

# Route: Upload and parse resume file (.pdf or .docx)
@app.post("/upload-resume")
async def upload_resume(file: UploadFile = File(...)):
    contents = ""
    temp_path = f"temp_{file.filename}"
    with open(temp_path, "wb") as f:
        f.write(await file.read())

# Parse based on file extension

#For PDF files, use PyPDF2 to extract text
    if file.filename.endswith(".pdf"):
        reader = PdfReader(temp_path)
        for page in reader.pages:
            contents += page.extract_text() or ""
            # For DOCX files, use python-docx to extract text
    elif file.filename.endswith(".docx"):
        doc = docx.Document(temp_path)
        contents = "\n".join([p.text for p in doc.paragraphs])
    else:
        return {"error": "Unsupported file type."}

    #Clean up the temporary file
    os.remove(temp_path)

    parsed = extract_sections(contents)

    return {"content": parsed}

# Route: Save enhanced resume as JSON file
@app.post("/save-resume")
async def save_resume(request: Request):
    try:
        data = await request.json()
        file_name = f"saves/resume_{uuid.uuid4().hex[:6]}.json"
        with open(file_name, "w") as f:
            json.dump(data, f, indent=2)
        return {"status": "success", "filename": file_name}
    except Exception as e:
        return {"status": "error", "message": str(e)}
