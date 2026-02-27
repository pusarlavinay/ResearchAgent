# Notebook Pack

This folder contains ready-to-run Jupyter notebooks for this project.

## Files

- `00_setup_healthcheck.ipynb`: Environment, config, and DB connectivity check.
- `01_database_explorer.ipynb`: Inspect tables, documents, and chunks.
- `02_document_ingestion.ipynb`: Batch-ingest PDF/TXT/DOCX files from `Data/`.
- `03_query_playground.ipynb`: Run and inspect `process_enhanced_query` responses.

## Recommended order

1. `00_setup_healthcheck.ipynb`
2. `02_document_ingestion.ipynb` (if DB is empty)
3. `01_database_explorer.ipynb`
4. `03_query_playground.ipynb`

## Notes

- Start Jupyter from project root (`C:\Researchaiagent`) so relative paths work.
- These notebooks call backend modules directly (`backend/app/...`).
- Ensure backend dependencies are installed in the active notebook kernel.
