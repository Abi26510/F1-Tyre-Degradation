import json
import os
from pathlib import Path
from typing import Any, Optional
import pandas as pd
from backend.app.core.config import DATA_CACHE_DIR

class CacheManager:
    """Manages persistent disk caching for session queries and telemetry/lap tables."""

    def __init__(self, cache_dir: Path = DATA_CACHE_DIR):
        self.cache_dir = cache_dir
        self.cache_dir.mkdir(parents=True, exist_ok=True)

    def _get_json_path(self, key: str) -> Path:
        safe_key = "".join(c if c.isalnum() or c in ("-", "_") else "_" for c in key)
        return self.cache_dir / f"{safe_key}.json"

    def _get_parquet_path(self, key: str) -> Path:
        safe_key = "".join(c if c.isalnum() or c in ("-", "_") else "_" for c in key)
        return self.cache_dir / f"{safe_key}.parquet"

    def get_json(self, key: str) -> Optional[Any]:
        path = self._get_json_path(key)
        if path.exists():
            try:
                with open(path, "r", encoding="utf-8") as f:
                    return json.load(f)
            except Exception:
                return None
        return None

    def set_json(self, key: str, data: Any) -> None:
        path = self._get_json_path(key)
        try:
            with open(path, "w", encoding="utf-8") as f:
                json.dump(data, f, indent=2)
        except Exception as e:
            print(f"[CacheManager] Warning: failed to write JSON cache {key}: {e}")

    def get_df(self, key: str) -> Optional[pd.DataFrame]:
        path = self._get_parquet_path(key)
        if path.exists():
            try:
                return pd.read_parquet(path)
            except Exception:
                return None
        return None

    def set_df(self, key: str, df: pd.DataFrame) -> None:
        path = self._get_parquet_path(key)
        try:
            df.to_parquet(path, index=False)
        except Exception as e:
            print(f"[CacheManager] Warning: failed to write Parquet cache {key}: {e}")

cache_manager = CacheManager()
