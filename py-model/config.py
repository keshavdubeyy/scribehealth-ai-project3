import os
from dotenv import load_dotenv

load_dotenv()

OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")
LLM_MODEL      = "gpt-4o"
LLM_TEMP       = 0.0           # always deterministic for medical use

SCI_MODEL_LARGE = "en_core_sci_lg"       # general biomedical NER
SCI_MODEL_BC5   = "en_ner_bc5cdr_md"     # disease + chemical NER
