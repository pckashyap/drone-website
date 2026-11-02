# How Drones Fly

An educational website that explains what a drone is, how it works, and how its propellers create lift. It includes a narrated animated video, an interactive flight-control demo and a quiz.

It is plain HTML, CSS and JavaScript with no build step: open `index.html` in a browser.

## Editing the narration

The video script is in `narration.js`. After changing it, re-record the voice (Kokoro TTS, see the setup notes at the top of `tools/make_narration.py`):

```
~/.cache/drone-website-tts/venv/bin/python tools/make_narration.py
```
