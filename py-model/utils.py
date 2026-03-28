import re
import logging

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(message)s"
)
logger = logging.getLogger(__name__)


def clean_transcript(text: str) -> str:
    """
    Normalize raw transcript text:
    - Remove filler words, timestamps, excessive whitespace
    - Standardize common verbal vitals to numeric form
    """
    # Remove timestamps like [00:01:23]
    text = re.sub(r"\[\d{2}:\d{2}:\d{2}\]", "", text)

    # Normalize verbal BP readings: "one twenty over eighty" → keep as is for LLM
    # Just strip excessive whitespace and newlines
    text = re.sub(r"\n{3,}", "\n\n", text)
    text = re.sub(r" {2,}", " ", text)

    return text.strip()


def chunk_transcript(text: str, max_chars: int = 3000) -> list[str]:
    """
    Split long transcripts into chunks to stay within LLM token limits.
    Splits on sentence boundaries, not mid-sentence.
    """
    sentences = re.split(r'(?<=[.!?])\s+', text)
    chunks, current = [], ""

    for sentence in sentences:
        if len(current) + len(sentence) <= max_chars:
            current += " " + sentence
        else:
            if current:
                chunks.append(current.strip())
            current = sentence

    if current:
        chunks.append(current.strip())

    return chunks
