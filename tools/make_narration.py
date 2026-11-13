#!/usr/bin/env python3
"""
Jumonkey - make the "Read to me" audio clips.

This is a developer tool. The website never runs it and never needs it:
it only plays the small audio files this script writes to audio/narration/.

What it does
    1. Reads every narration line from results-data.js (JumonkeyResultsData.narration).
    2. Speaks each line with Kokoro, a free text-to-speech model that runs
       on your own computer (no account, no API key, nothing sent online).
    3. Saves one small clip per line, plus audio/narration/clips.js, which
       records the exact words each clip was made from. The dashboard only
       plays a clip when those words still match the screen, so a text edit
       can never leave an out-of-date recording playing. It falls back to
       the device's own voice until you re-run this script.

Licences
    Kokoro-82M model + voices: Apache-2.0 (https://huggingface.co/hexgrad/Kokoro-82M)
    kokoro-onnx runner:        MIT        (https://github.com/thewh1teagle/kokoro-onnx)

One-time setup (needs Python 3.10 or newer; about 350 MB of downloads, kept outside the repo)
    python3 -m venv ~/.jumonkey-tts && source ~/.jumonkey-tts/bin/activate
    pip install kokoro-onnx soundfile
    curl -L -o ~/.jumonkey-tts/kokoro-v1.0.onnx https://github.com/thewh1teagle/kokoro-onnx/releases/download/model-files-v1.1/kokoro-v1.0.onnx
    curl -L -o ~/.jumonkey-tts/voices-v1.0.bin  https://github.com/thewh1teagle/kokoro-onnx/releases/download/model-files-v1.1/voices-v1.0.bin

Run (from the project folder, after any text change in results-data.js)
    python tools/make_narration.py --model ~/.jumonkey-tts/kokoro-v1.0.onnx --voices ~/.jumonkey-tts/voices-v1.0.bin

Audio format: AAC in .m4a (made with macOS "afconvert", or ffmpeg if installed).
Without either, .wav files are written instead (they work, but are larger).
"""

import argparse
import json
import re
import shutil
import subprocess
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
OUT_DIR = ROOT / "audio" / "narration"

# Spoken-only spellings, so the narrator says tricky words naturally.
# The words on screen are never changed.
SAY_IT_LIKE = [
    (r"1\.55 million", "one point five five million"),
]


def read_lines():
    """Ask Node for the narration lines, so they come from the same file the website uses."""
    script = (
        "global.window = {};"
        f"require({json.dumps(str(ROOT / 'results-data.js'))});"
        "process.stdout.write(JSON.stringify(window.JumonkeyResultsData.narration));"
    )
    out = subprocess.run(["node", "-e", script], check=True, capture_output=True, text=True).stdout
    return json.loads(out)


def spoken(text):
    for pattern, replacement in SAY_IT_LIKE:
        text = re.sub(pattern, replacement, text)
    return text


def to_m4a(wav, m4a, bitrate):
    if shutil.which("afconvert"):
        subprocess.run(["afconvert", "-f", "m4af", "-d", "aac", "-b", str(bitrate), str(wav), str(m4a)], check=True)
        return True
    if shutil.which("ffmpeg"):
        subprocess.run(["ffmpeg", "-y", "-loglevel", "error", "-i", str(wav), "-c:a", "aac", "-b:a", str(bitrate), str(m4a)], check=True)
        return True
    return False


def main():
    parser = argparse.ArgumentParser(description="Make Jumonkey's Read-to-me clips with Kokoro (local, free).")
    parser.add_argument("--model", required=True, help="path to kokoro-v1.0.onnx")
    parser.add_argument("--voices", required=True, help="path to voices-v1.0.bin")
    parser.add_argument("--voice", default="af_heart", help="Kokoro voice name (default: af_heart)")
    parser.add_argument("--speed", type=float, default=0.92, help="1.0 = normal; a little slower suits young listeners")
    parser.add_argument("--bitrate", type=int, default=64000, help="AAC bits per second")
    parser.add_argument("--only", default="", help="make just the ids containing this text (for testing)")
    parser.add_argument("--out", default=str(OUT_DIR), help="output folder")
    args = parser.parse_args()

    import numpy as np
    import soundfile as sf
    from kokoro_onnx import Kokoro

    out_dir = Path(args.out)
    out_dir.mkdir(parents=True, exist_ok=True)
    lines = read_lines()
    kokoro = Kokoro(args.model, args.voices)

    clips = {}
    total_bytes = 0
    for clip_id, text in lines.items():
        if args.only and args.only not in clip_id:
            continue
        samples, rate = kokoro.create(spoken(text), voice=args.voice, speed=args.speed, lang="en-us")
        # a short breath of silence at both ends, so clips never start or stop abruptly
        pad = np.zeros(int(rate * 0.15), dtype=samples.dtype)
        samples = np.concatenate([pad, samples, pad])

        wav = out_dir / f"{clip_id}.wav"
        sf.write(wav, samples, rate)
        m4a = out_dir / f"{clip_id}.m4a"
        if to_m4a(wav, m4a, args.bitrate):
            wav.unlink()
            final = m4a
        else:
            final = wav

        clips[clip_id] = {"file": final.name, "text": text}
        total_bytes += final.stat().st_size
        print(f"{final.name:34s} {len(samples) / rate:5.1f}s  {final.stat().st_size / 1024:6.1f} KB  {text}")

    if not args.only:
        header = (
            "/* Read-to-me clips: id -> { file, text }.\n"
            "   Made by tools/make_narration.py - do not edit by hand.\n"
            f"   Voice: Kokoro-82M \"{args.voice}\" (Apache-2.0), generated locally at speed {args.speed}.\n"
            "   A clip is only played while its text still matches results-data.js. */\n"
        )
        (out_dir / "clips.js").write_text(
            header + "window.JumonkeyNarrationClips = " + json.dumps(clips, indent=4, ensure_ascii=False) + ";\n",
            encoding="utf-8",
        )
    print(f"\n{len(clips)} clips, {total_bytes / 1024:.0f} KB in {out_dir}")


if __name__ == "__main__":
    sys.exit(main())
