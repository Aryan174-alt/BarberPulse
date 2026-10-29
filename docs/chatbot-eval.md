# Assistant parser evaluation

Evaluation data: `backend/assistant/eval/test_messages.json` (50 labeled English/Hinglish requests).

Run from `backend/`:

```powershell
.\.venv\Scripts\python.exe -m assistant.eval.run_eval
```

Recorded result: **50/50 messages exact (100%); 200/200 labeled fields correct (100%)** on the supplied rule-based cases. This is a small hand-labeled smoke set, not evidence of general language understanding.
