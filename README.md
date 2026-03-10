# local-ocr-command

OpenClaw plugin that adds `/ocr` as a local no-LLM OCR fast-path for inbound images.

## What it does

- avoids OpenAI vision entirely
- looks for the latest inbound image under a configured folder
- runs local OCR through a Tesseract CLI wrapper
- replies with extracted text

## Requirements

This plugin expects a working local OCR CLI, for example the Tesseract MCP/CLI created at:

`/home/vova/.openclaw/workspace/mcp/tesseract-ocr/src/cli.js`

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
          "inboundDir": "/home/vova/.openclaw/media/inbound",
          "ocrCliPath": "/home/vova/.openclaw/workspace/mcp/tesseract-ocr/src/cli.js",
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
