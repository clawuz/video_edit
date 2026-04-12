# whisper_service/server.py
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from typing import Literal
import os

from faster_whisper import WhisperModel

app = FastAPI()

# Model cache — ilk istekte yüklenir
_models: dict = {}


def get_model(language: str) -> WhisperModel:
    """TR için fine-tuned model, diğerleri için large-v3."""
    model_key = "tr" if language == "tr" else "en"
    if model_key not in _models:
        if language == "tr":
            # Türkçe fine-tuned model (HuggingFace'den ilk çalıştırmada indirilir)
            model_id = "selimc/whisper-large-v3-turbo-turkish"
        else:
            model_id = "large-v3"
        # CPU kullanımı; GPU varsa device="cuda" yap
        _models[model_key] = WhisperModel(model_id, device="cpu", compute_type="int8")
    return _models[model_key]


class TranscribeRequest(BaseModel):
    media_path: str
    language: Literal["tr", "en"] = "tr"
    split_mode: Literal["sentence", "word", "chunk"] = "sentence"
    chunk_size: int = 5


class WordSegment(BaseModel):
    word: str
    startMs: int
    endMs: int


class SubtitleEntry(BaseModel):
    startMs: int
    endMs: int
    text: str


class TranscribeResponse(BaseModel):
    segments: list[WordSegment]
    subtitles: list[SubtitleEntry]


SENTENCE_END = {".", "!", "?", "…"}


def split_to_subtitles(
    words: list[WordSegment], mode: str, chunk_size: int
) -> list[SubtitleEntry]:
    if not words:
        return []

    if mode == "word":
        return [SubtitleEntry(startMs=w.startMs, endMs=w.endMs, text=w.word) for w in words]

    if mode == "chunk":
        result = []
        for i in range(0, len(words), chunk_size):
            chunk = words[i : i + chunk_size]
            result.append(SubtitleEntry(
                startMs=chunk[0].startMs,
                endMs=chunk[-1].endMs,
                text=" ".join(w.word for w in chunk),
            ))
        return result

    # sentence mode
    result = []
    current: list[WordSegment] = []
    for w in words:
        current.append(w)
        if w.word and w.word[-1] in SENTENCE_END:
            result.append(SubtitleEntry(
                startMs=current[0].startMs,
                endMs=current[-1].endMs,
                text=" ".join(c.word for c in current),
            ))
            current = []
    if current:
        result.append(SubtitleEntry(
            startMs=current[0].startMs,
            endMs=current[-1].endMs,
            text=" ".join(c.word for c in current),
        ))
    return result


@app.get("/health")
def health():
    return {"status": "ok"}


@app.post("/transcribe", response_model=TranscribeResponse)
def transcribe(req: TranscribeRequest):
    if not os.path.exists(req.media_path):
        raise HTTPException(status_code=400, detail=f"Dosya bulunamadı: {req.media_path}")

    model = get_model(req.language)

    segments_iter, _ = model.transcribe(
        req.media_path,
        language=req.language,
        word_timestamps=True,
    )

    word_segments: list[WordSegment] = []
    for seg in segments_iter:
        if seg.words:
            for w in seg.words:
                word_segments.append(WordSegment(
                    word=w.word.strip(),
                    startMs=int(w.start * 1000),
                    endMs=int(w.end * 1000),
                ))

    subtitles = split_to_subtitles(word_segments, req.split_mode, req.chunk_size)

    return TranscribeResponse(segments=word_segments, subtitles=subtitles)


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8765)
