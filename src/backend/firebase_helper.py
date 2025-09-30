import os
import io
import tempfile
import pandas as pd
from typing import Optional, Tuple, Dict, List
import json
from dotenv import load_dotenv

# Try Firebase Admin SDK first, fallback to Pyrebase if needed
try:
    import firebase_admin
    from firebase_admin import credentials, db, storage as admin_storage
    from google.cloud import storage as gcs
    ADMIN_SDK_AVAILABLE = True
except ImportError:
    ADMIN_SDK_AVAILABLE = False

import pyrebase
load_dotenv()


class FirebaseManager:
    """Firebase manager that works with both Admin SDK and Pyrebase"""

    def __init__(self):
        self._initialized = False
        self._use_admin_sdk = False

    def _initialize(self):
        if self._initialized:
            return
        if ADMIN_SDK_AVAILABLE and self._try_admin_sdk_init():
            self._use_admin_sdk = True
            print("[FirebaseManager] Using Firebase Admin SDK")
        else:
            self._init_pyrebase()
            print("[FirebaseManager] Using Pyrebase fallback")
        self._initialized = True

    def _try_admin_sdk_init(self) -> bool:
        try:
            if firebase_admin._apps:
                self._bucket = admin_storage.bucket()
                return True

            cred_path = os.getenv("GOOGLE_APPLICATION_CREDENTIALS")
            if cred_path and os.path.exists(cred_path):
                cred = credentials.Certificate(cred_path)
            elif os.getenv("FIREBASE_SERVICE_ACCOUNT_JSON"):
                cred_dict = json.loads(os.getenv("FIREBASE_SERVICE_ACCOUNT_JSON"))
                cred = credentials.Certificate(cred_dict)
            else:
                service_account = {
                    "type": "service_account",
                    "project_id": os.getenv("FIREBASE_PROJECT_ID"),
                    "private_key_id": os.getenv("FIREBASE_PRIVATE_KEY_ID"),
                    "private_key": os.getenv("FIREBASE_PRIVATE_KEY", "").replace('\\n', '\n'),
                    "client_email": os.getenv("FIREBASE_CLIENT_EMAIL"),
                    "client_id": os.getenv("FIREBASE_CLIENT_ID"),
                    "auth_uri": "https://accounts.google.com/o/oauth2/auth",
                    "token_uri": "https://oauth2.googleapis.com/token",
                    "auth_provider_x509_cert_url": "https://www.googleapis.com/oauth2/v1/certs",
                    "client_x509_cert_url": f"https://www.googleapis.com/robot/v1/metadata/x509/{os.getenv('FIREBASE_CLIENT_EMAIL', '')}"
                }
                if not all([service_account.get(k) for k in ["project_id", "private_key", "client_email"]]):
                    return False
                cred = credentials.Certificate(service_account)

            firebase_admin.initialize_app(cred, {
                "databaseURL": os.getenv("FIREBASE_DATABASE_URL"),
                "storageBucket": os.getenv("FIREBASE_STORAGE_BUCKET")
            })
            self._bucket = admin_storage.bucket()
            return True
        except Exception as e:
            print(f"[FirebaseManager] Admin SDK init failed: {e}")
            return False

    def _init_pyrebase(self):
        firebase_config = {
            "apiKey": os.getenv("FIREBASE_API_KEY"),
            "authDomain": os.getenv("FIREBASE_AUTH_DOMAIN"),
            "databaseURL": os.getenv("FIREBASE_DATABASE_URL"),
            "projectId": os.getenv("FIREBASE_PROJECT_ID"),
            "storageBucket": os.getenv("FIREBASE_STORAGE_BUCKET"),
            "messagingSenderId": os.getenv("FIREBASE_MESSAGING_SENDER_ID"),
            "appId": os.getenv("FIREBASE_APP_ID"),
        }
        self._firebase = pyrebase.initialize_app(firebase_config)
        self._db = self._firebase.database()
        self._storage = self._firebase.storage()

    @staticmethod
    def _db_path(user_id: str, year: int, month: int) -> str:
       return f"users/{user_id}/transactions/{year}_{int(month):02d}"


    @staticmethod
    def _storage_path(user_id: str, year: int, month: int, file_type: str) -> str:
        return f"users/{user_id}/csv/{year}_{int(month):02d}/{file_type}.csv"


    def save(self, user_id: str, year: int, month: int,
             categorized_df: pd.DataFrame, summary_df: pd.DataFrame) -> None:
        self._initialize()
        self._upload_csv(user_id, year, month, "categorized_transactions", categorized_df)
        self._upload_csv(user_id, year, month, "spending_summary", summary_df)

        metadata = {
            "upload_ts": pd.Timestamp.utcnow().isoformat(),
            "rows": int(len(categorized_df)),
            "spent": float(categorized_df.get("debit_inr", pd.Series()).sum()),
            "income": float(categorized_df.get("credit_inr", pd.Series()).sum()),
            "categories": int(categorized_df.get("category", pd.Series()).nunique()),
            "storage_paths": {
                "categorized_csv": self._storage_path(user_id, year, month, "categorized_transactions"),
                "summary_csv": self._storage_path(user_id, year, month, "spending_summary")
            }
        }
        if self._use_admin_sdk:
            db.reference(f"{self._db_path(user_id, year, month)}/metadata").set(metadata)
        else:
            self._db.child(self._db_path(user_id, year, month)).child("metadata").set(metadata)

    def _upload_csv(self, user_id: str, year: int, month: int, file_type: str, df: pd.DataFrame) -> None:
        # Ensure headers even if empty
        if df.empty:
            print(f"[WARN] Uploading empty {file_type} with only headers")
            if file_type == "spending_summary":
                df = pd.DataFrame(columns=['month', 'category', 'total_spent', 'transactions', 'total_income'])
            else:
                df = pd.DataFrame(columns=["date", "description", "debit_inr", "credit_inr", "balance_inr", "category", "month"])

        if self._use_admin_sdk:
            blob_name = self._storage_path(user_id, year, month, file_type)
            blob = self._bucket.blob(blob_name)
            with tempfile.NamedTemporaryFile(mode="w", suffix=".csv", delete=False) as tmp:
                df.to_csv(tmp.name, index=False)
                tmp_path = tmp.name
            blob.upload_from_filename(tmp_path, content_type="text/csv")
            os.remove(tmp_path)
        else:
            storage_path = self._storage_path(user_id, year, month, file_type)
            with tempfile.NamedTemporaryFile(mode="w", suffix=".csv", delete=False) as tmp:
                df.to_csv(tmp.name, index=False)
                tmp_path = tmp.name
            self._storage.child(storage_path).put(tmp_path)
            os.remove(tmp_path)

    def _download_csv(self, user_id: str, year: int, month: int, file_type: str) -> Optional[pd.DataFrame]:
        if self._use_admin_sdk:
            blob = self._bucket.blob(self._storage_path(user_id, year, month, file_type))
            if not blob.exists():
                return pd.DataFrame()
            data = blob.download_as_bytes()
            if not data:
                return pd.DataFrame()
            return pd.read_csv(io.BytesIO(data))
        else:
            storage_path = self._storage_path(user_id, year, month, file_type)
            try:
                url = self._storage.child(storage_path).get_url(token=None)
                import requests
                resp = requests.get(url, timeout=30)
                resp.raise_for_status()
                if not resp.text.strip():
                    return pd.DataFrame()
                return pd.read_csv(io.StringIO(resp.text))
            except Exception as e:
                print(f"[FirebaseManager] URL download failed: {e}")
                return pd.DataFrame()

    def exists(self, user_id: str, year: int, month: int) -> bool:
        self._initialize()
        if self._use_admin_sdk:
            return db.reference(f"{self._db_path(user_id, year, month)}/metadata").get() is not None
        else:
            return bool(self._db.child(self._db_path(user_id, year, month)).child("metadata").get().val())

    def load(self, user_id: str, year: int, month: int) -> Optional[Tuple[pd.DataFrame, pd.DataFrame, Dict]]:
        self._initialize()
        metadata = db.reference(f"{self._db_path(user_id, year, month)}/metadata").get() if self._use_admin_sdk else self._db.child(self._db_path(user_id, year, month)).child("metadata").get().val()
        if not metadata:
            return None
        return self._download_csv(user_id, year, month, "categorized_transactions"), self._download_csv(user_id, year, month, "spending_summary"), metadata

    def list_months(self, user_id: str) -> List[Tuple[int, int]]:
        self._initialize()
        all_keys = db.reference(f"users/{user_id}/transactions").get() if self._use_admin_sdk else self._db.child(f"users/{user_id}/transactions").get().val() or {}
        months = []
        for key in (all_keys or {}):
            try:
                y, m = key.split("_")
                months.append((int(y), int(m)))
            except:
                continue
        return sorted(months, reverse=True)


FirebaseManager = FirebaseManager()
