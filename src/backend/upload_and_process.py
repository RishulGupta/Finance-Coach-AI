# upload_and_process.py - FIXED VERSION

import os
import pandas as pd
import pyrebase
from dotenv import load_dotenv
from langchain_groq import ChatGroq
from langchain_openai import ChatOpenAI
from langchain_core.messages import SystemMessage, HumanMessage, AIMessage
from io import StringIO, BytesIO
import json
from fastapi import UploadFile

# === Load Environment Variables ===
load_dotenv()

# === Security: Load Firebase Config from Service Account ===
FIREBASE_SERVICE_ACCOUNT = os.getenv("FIREBASE_SERVICE_ACCOUNT_PATH")
if FIREBASE_SERVICE_ACCOUNT and os.path.exists(FIREBASE_SERVICE_ACCOUNT):
    with open(FIREBASE_SERVICE_ACCOUNT, 'r') as f:
        firebase_config = json.load(f)
else:
    print("[WARN] Using client-side Firebase API keys. Please switch to a service account for production.")
    firebase_config = {
        "apiKey": os.getenv("FIREBASE_API_KEY"),
        "authDomain": os.getenv("FIREBASE_AUTH_DOMAIN"),
        "databaseURL": os.getenv("FIREBASE_DATABASE_URL"),
        "projectId": os.getenv("FIREBASE_PROJECT_ID"),
        "storageBucket": os.getenv("FIREBASE_STORAGE_BUCKET"),
        "messagingSenderId": os.getenv("FIREBASE_MESSAGING_SENDER_ID"),
        "appId": os.getenv("FIREBASE_APP_ID"),
    }

firebase = pyrebase.initialize_app(firebase_config)
db = firebase.database()

'''
# === Groq Categorizer Model ===
GROQ_API_KEY = os.getenv("GROQ_API_KEY")
if not GROQ_API_KEY:
    raise ValueError("Please set GROQ_API_KEY in .env")
model = ChatGroq(model="Gemma2-9b-It", groq_api_key=GROQ_API_KEY)
'''

OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")
if not OPENAI_API_KEY:
    print("open ai not found")
model = ChatOpenAI(model="gpt-4o-mini", openai_api_key=OPENAI_API_KEY)

# === Expanded & More Granular Categories ===
CATEGORIES = [
    "Income:Salary", "Income:Bonus", "Income:Investment", "Income:Rental", "Income:Interest", "Income:Other",
    "Bills:Rent", "Bills:Utilities", "Bills:Phone", "Bills:Internet", "Bills:Subscription", "Bills:Credit Card", "Bills:Insurance",
    "Food:Groceries", "Food:Restaurants", "Food:Coffee",
    "Shopping:Apparel", "Shopping:Electronics", "Shopping:HomeGoods", "Shopping:General",
    "Travel:Flights", "Travel:Accommodation", "Travel:Transport",
    "Entertainment:Movies", "Entertainment:Concerts", "Entertainment:Streaming",
    "Healthcare:Doctor", "Healthcare:Pharmacy",
    "Investments:Equity", "Investments:MutualFund", "Investments:Crypto",
    "Education:Tuition", "Education:Books",
    "Personal:Fitness", "Personal:Beauty",
    "Other:ATM Withdrawal", "Other:Bank Fee", "Other:Transfer", "Other"
]

# === Rules-Based Engine for High-Confidence Classification ===
RULE_BASED_CATEGORIES = {
    # Food & Groceries
    "ZOMATO": "Food:Restaurants",
    "SWIGGY": "Food:Restaurants",
    "GROCERY": "Food:Groceries",
    "BIG BASKET": "Food:Groceries",
    # Shopping
    "AMAZON": "Shopping:General",
    "FLIPKART": "Shopping:General",
    # Subscriptions & Bills
    "NETFLIX": "Bills:Subscription",
    "SPOTIFY": "Bills:Subscription",
    "CREDIT CARD BILL": "Bills:Credit Card",
    "INSURANCE": "Bills:Insurance",
    "ELECTRICITY": "Bills:Utilities",
    # Travel
    "UBER": "Travel:Transport",
    "OLA": "Travel:Transport",
    "MAKEMYTRIP": "Travel:Flights",
    "IRCTC": "Travel:Transport",
    # Income
    "UPI REFUND": "Income:Other",
    "DIVIDEND": "Income:Investment",
    "SALARY": "Income:Salary",
    # Other
    "ATM WDL": "Other:ATM Withdrawal",
    # MODIFIED: Added specific rules for Education and Rent
    "FEES": "Education:Tuition",
    "SCHOOL": "Education:Tuition",
    "COLLEGE": "Education:Tuition",
    "TUITION": "Education:Tuition",
    "RENT": "Bills:Rent",
    # MODIFIED: Removed the overly broad "FUND TRANSFER" rule.
    # This allows the AI to correctly categorize UPI payments to merchants.
}

# === Few-Shot Prompting to Improve LLM Accuracy ===
FEW_SHOT_PROMPT = [
    SystemMessage(content=(
        "You are an expert financial transaction classifier. "
        "Your task is to classify a given transaction description into one and only one of the following granular categories: "
        f"{', '.join(CATEGORIES)}.\n"
        "Ensure your response is ONLY the category name, without any other text or explanation."
    )),
    HumanMessage(content="PAYMENT RECIEVED FROM ABC CORP"),
    AIMessage(content="Income:Salary"),
    HumanMessage(content="LULU HYPERMARKET SPENT"),
    AIMessage(content="Food:Groceries"),
    HumanMessage(content="INVESTMENT IN MUTUAL FUND"),
    AIMessage(content="Investments:MutualFund"),
    HumanMessage(content="RENT FOR APARTMENT"),
    AIMessage(content="Bills:Rent"),
    HumanMessage(content="UPI TO DELHI PUBLIC SCHOOL"),
    AIMessage(content="Education:Tuition"),
]

def classify(description: str) -> str:
    """Classifies a transaction description using a hybrid approach."""
    # Step 1: Check for keyword matches in the description (case-insensitive)
    for keyword, category in RULE_BASED_CATEGORIES.items():
        if keyword.lower() in description.lower():
            return category
    
    # Step 2: If no keyword match, use the LLM as a fallback
    try:
        res = model.invoke(FEW_SHOT_PROMPT + [HumanMessage(content=description)])
        tag = res.content.strip()
        
        # Fallback to "Other" if the model hallucinates or is unsure
        return tag if tag in CATEGORIES else "Other"
    except Exception as e:
        print(f"[ERROR][Categorize] Exception: {e}")
        return "Other"

def process_file(uploaded_file):
    """Orchestrates the data processing pipeline for a bank statement."""
    print(f"[INFO] Starting data pipeline for file: {getattr(uploaded_file, 'filename', 'unknown')}")
    try:
        df_raw = extract_data(uploaded_file)
        if df_raw.empty:
            raise ValueError("No valid transaction data found.")
        df_categorized, df_summary = transform_data(df_raw)
        print("[INFO] Data processing complete.")
        return df_categorized, df_summary
    except Exception as e:
        print(f"[ERROR] Pipeline failed: {e}")
        return pd.DataFrame(), pd.DataFrame()

def extract_data(uploaded_file):
    """Extracts raw transaction data from a file with robust header detection."""
    # Handle both UploadFile objects and regular file objects
    if hasattr(uploaded_file, 'filename') and hasattr(uploaded_file, 'file'):
        # This is a FastAPI UploadFile object
        file_name = uploaded_file.filename
        file_content = uploaded_file.file
    else:
        # Fallback for regular file objects
        file_name = getattr(uploaded_file, 'name', 'unknown.csv')
        file_content = uploaded_file
    
    if not file_name:
        raise ValueError("No filename provided")
        
    file_type = file_name.lower().split('.')[-1]
    df_raw = pd.DataFrame()
    
    if file_type in ["xls", "xlsx"]:
        # Read Excel file
        try:
            # Reset file pointer to beginning
            file_content.seek(0)
            
            # Try to read all sheets
            sheets = pd.read_excel(file_content, sheet_name=None, header=None)
            
            for sheet_name, sheet_df in sheets.items():
                # Find header row containing 'date' and either 'narration' or 'description'
                header_idx = None
                for idx, row in sheet_df.iterrows():
                    row_str = str(row.values).lower()
                    if "date" in row_str and ("narration" in row_str or "description" in row_str):
                        header_idx = idx
                        break
                
                if header_idx is not None:
                    # Reset file pointer and read with correct header
                    file_content.seek(0)
                    df_raw = pd.read_excel(file_content, sheet_name=sheet_name, header=header_idx)
                    print(f"[DEBUG] Found header at row {header_idx} in sheet '{sheet_name}'.")
                    break
                    
        except Exception as e:
            print(f"[ERROR] Failed to read Excel file: {e}")
            raise ValueError(f"Failed to read Excel file: {e}")
            
    elif file_type == "csv":
        try:
            # Reset file pointer to beginning
            file_content.seek(0)
            
            # Read a sample to find header
            sample_data = file_content.read(4096)
            
            # Handle bytes vs string
            if isinstance(sample_data, bytes):
                sample_data = sample_data.decode("utf-8", errors='ignore')
            
            # Find header row
            header_idx = None
            lines = sample_data.splitlines()
            for i, line in enumerate(lines):
                line_lower = line.lower()
                if "date" in line_lower and ("narration" in line_lower or "description" in line_lower):
                    header_idx = i
                    break
            
            # Reset file pointer and read CSV
            file_content.seek(0)
            
            if header_idx is not None:
                df_raw = pd.read_csv(file_content, skiprows=header_idx)
                print(f"[DEBUG] Found header at row {header_idx} in CSV file.")
            else:
                # Try reading without skipping rows
                df_raw = pd.read_csv(file_content)
                print("[DEBUG] Using first row as header in CSV file.")
                
        except Exception as e:
            print(f"[ERROR] Failed to read CSV file: {e}")
            raise ValueError(f"Failed to read CSV file: {e}")
    else:
        raise ValueError(f"Unsupported file type: {file_type}")
    
    if df_raw.empty:
        raise ValueError("No data found in file")
        
    return df_raw

def transform_data(df_raw):
    """Cleans, normalizes, and categorizes the raw data."""
    df = df_raw.copy()
    cols = df.columns
    
    # Map column names to standard names
    col_mapping = {}
    for c in cols:
        low = str(c).lower()
        if "date" in low:
            col_mapping[c] = 'date'
        elif "narration" in low or "description" in low:
            col_mapping[c] = 'description'
        elif "withdraw" in low or "debit" in low:
            col_mapping[c] = 'debit_inr'
        elif "deposit" in low or "credit" in low:
            col_mapping[c] = 'credit_inr'
        elif "balance" in low:
            col_mapping[c] = 'balance_inr'
        else:
            col_mapping[c] = c
    
    df.rename(columns=col_mapping, inplace=True)
    
    # Ensure required columns exist
    required_cols = ['date', 'description', 'debit_inr', 'credit_inr']
    for col in required_cols:
        if col not in df.columns:
            df[col] = ''
    
    # Clean numeric columns
    for col in ['debit_inr', 'credit_inr']:
        df[col] = pd.to_numeric(
            df[col].astype(str).str.replace('[^0-9.]', '', regex=True).replace('', '0'),
            errors='coerce'
        ).fillna(0)
    
    # Clean date column
    df['date'] = pd.to_datetime(df['date'], dayfirst=True, errors='coerce')
    
    # Remove rows with missing critical data
    df.dropna(subset=['date', 'description'], inplace=True)
    
    if df.empty:
        return pd.DataFrame(), pd.DataFrame()
    
    # Categorize transactions
    df['category'] = df['description'].apply(classify)
    
    # Create monthly summary
    df['month'] = df['date'].dt.to_period("M")
    
    summary_df = (
        df.groupby(['month', 'category'])
        .agg(
            total_spent=('debit_inr', 'sum'),
            total_income=('credit_inr', 'sum'),
            transactions=('category', 'count')
        )
        .reset_index()
    )
    
    return df, summary_df

from firebase_helper import FirebaseManager

def process_and_upload(user_id: str, year: int, month: int, uploaded_file):
    """Main function to process a file and upload results to Firebase."""
    df_cat, df_sum = process_file(uploaded_file)
    
    if df_cat.empty:
        print("[WARN] No usable transactions to save.")
        return pd.DataFrame(), pd.DataFrame()
    
    FirebaseManager.save(user_id, year, month, df_cat, df_sum)
    return df_cat, df_sum