# local-ocr-command

OpenClaw plugin that adds `/ocr` as a local no-LLM OCR fast-path for inbound images.

## What it does

- avoids OpenAI vision entirely
- looks for the latest inbound image under a configured folder
- runs local OCR through a Tesseract CLI wrapper
- replies with extracted text

## Requirements

This plugin is self-contained and runs OCR through Dockerized Tesseract.
It does not depend on a workspace-local OCR CLI path.

## Install

```bash
openclaw plugins install git+https://github.com/vovka93/local-ocr-command.git
```

## Enable / configure

```json
{
  "plugins": {
    "allow": ["local-ocr-command"],
    "entries": {
      "local-ocr-command": {
        "enabled": true,
        "config": {
          "inboundDir": "~/.openclaw/media/inbound",
          "dockerImage": "tesseractshadow/tesseract4re:latest",
          "defaultLang": "eng+ukr",
          "maxAgeMinutes": 10
        }
      }
    }
  }
}
```

Restart gateway after config changes.

## Usage

1. Send an image to OpenClaw
2. Send `/ocr`

Optional:

```text
/ocr --lang=eng
/ocr /absolute/path/to/file.jpg
```
