from pathlib import Path

from pydantic_settings import BaseSettings, SettingsConfigDict

ROOT_DIR = Path(__file__).resolve().parents[2]


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=ROOT_DIR / ".env", extra="ignore")

    openrouter_api_key: str
    openai_api_key: str
    chat_model: str = "openai/gpt-5-mini"
    embedding_model: str = "text-embedding-3-small"
    openrouter_base_url: str = "https://openrouter.ai/api/v1"
    knowledgebase_dir: Path = ROOT_DIR / "knowledgebase"
    chroma_dir: Path = ROOT_DIR / "backend" / "chroma_db"


settings = Settings()
