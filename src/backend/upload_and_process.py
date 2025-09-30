# upload_and_process.py - COMPREHENSIVE DEBUG VERSION

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
import traceback

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
    "FEES": "Education:Tuition",
    "SCHOOL": "Education:Tuition",
    "COLLEGE": "Education:Tuition",
    "TUITION": "Education:Tuition",
    "RENT": "Bills:Rent",
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
    print(f"\n=== PROCESS_FILE DEBUG START ===")
    print(f"[DEBUG][process_file] Input type: {type(uploaded_file)}")
    print(f"[DEBUG][process_file] Input attributes: {dir(uploaded_file)}")
    
    filename = getattr(uploaded_file, 'filename', 'unknown')
    print(f"[INFO] Starting data pipeline for file: {filename}")
    
    try:
        print(f"[DEBUG][process_file] Calling extract_data...")
        df_raw = extract_data(uploaded_file)
        print(f"[DEBUG][process_file] extract_data returned df with shape: {df_raw.shape}")
        
        if df_raw.empty:
            print(f"[ERROR][process_file] No data extracted from file")
            raise ValueError("No valid transaction data found.")
            
        print(f"[DEBUG][process_file] Calling transform_data...")
        df_categorized, df_summary = transform_data(df_raw)
        print(f"[DEBUG][process_file] transform_data returned:")
        print(f"[DEBUG][process_file] - df_categorized shape: {df_categorized.shape}")
        print(f"[DEBUG][process_file] - df_summary shape: {df_summary.shape}")
        
        print("[INFO] Data processing complete.")
        return df_categorized, df_summary
        
    except Exception as e:
        print(f"[ERROR] Pipeline failed: {e}")
        print(f"[ERROR] Full traceback:")
        traceback.print_exc()
        return pd.DataFrame(), pd.DataFrame()
    finally:
        print(f"=== PROCESS_FILE DEBUG END ===\n")

def extract_data(uploaded_file):
    """Extracts raw transaction data from a file with robust header detection."""
    print(f"\n=== EXTRACT_DATA DEBUG START ===")
    
    # Handle both UploadFile objects and regular file objects
    if hasattr(uploaded_file, 'filename') and hasattr(uploaded_file, 'file'):
        # This is a FastAPI UploadFile object
        print(f"[DEBUG][extract_data] Detected FastAPI UploadFile object")
        file_name = uploaded_file.filename
        file_content = uploaded_file.file
        print(f"[DEBUG][extract_data] filename: {file_name}")
        print(f"[DEBUG][extract_data] file_content type: {type(file_content)}")
    else:
        # Fallback for regular file objects
        print(f"[DEBUG][extract_data] Detected regular file object")
        file_name = getattr(uploaded_file, 'name', 'unknown.csv')
        file_content = uploaded_file
        print(f"[DEBUG][extract_data] filename: {file_name}")
        print(f"[DEBUG][extract_data] file_content type: {type(file_content)}")
    
    if not file_name:
        raise ValueError("No filename provided")
        
    file_type = file_name.lower().split('.')[-1]
    print(f"[DEBUG][extract_data] file_type: {file_type}")
    df_raw = pd.DataFrame()
    
    if file_type in ["xls", "xlsx"]:
        print(f"[DEBUG][extract_data] Processing Excel file")
        try:
            # Reset file pointer to beginning
            file_content.seek(0)
            print(f"[DEBUG][extract_data] File pointer reset to beginning")
            
            # Try to read all sheets
            print(f"[DEBUG][extract_data] Reading Excel sheets...")
            sheets = pd.read_excel(file_content, sheet_name=None, header=None)
            print(f"[DEBUG][extract_data] Found sheets: {list(sheets.keys())}")
            
            for sheet_name, sheet_df in sheets.items():
                print(f"[DEBUG][extract_data] Processing sheet: {sheet_name}")
                print(f"[DEBUG][extract_data] Sheet shape: {sheet_df.shape}")
                
                # Find header row containing 'date' and either 'narration' or 'description'
                header_idx = None
                for idx, row in sheet_df.iterrows():
                    row_str = str(row.values).lower()
                    if "date" in row_str and ("narration" in row_str or "description" in row_str):
                        header_idx = idx
                        print(f"[DEBUG][extract_data] Found header at row {header_idx}")
                        break
                
                if header_idx is not None:
                    # Reset file pointer and read with correct header
                    file_content.seek(0)
                    df_raw = pd.read_excel(file_content, sheet_name=sheet_name, header=header_idx)
                    print(f"[DEBUG] Found header at row {header_idx} in sheet '{sheet_name}'.")
                    print(f"[DEBUG][extract_data] Loaded data shape: {df_raw.shape}")
                    print(f"[DEBUG][extract_data] Columns: {list(df_raw.columns)}")
                    break
                    
        except Exception as e:
            print(f"[ERROR] Failed to read Excel file: {e}")
            traceback.print_exc()
            raise ValueError(f"Failed to read Excel file: {e}")
            
    elif file_type == "csv":
        print(f"[DEBUG][extract_data] Processing CSV file")
        try:
            # Reset file pointer to beginning
            file_content.seek(0)
            print(f"[DEBUG][extract_data] File pointer reset to beginning")
            
            # Read a sample to find header
            print(f"[DEBUG][extract_data] Reading sample data...")
            sample_data = file_content.read(4096)
            print(f"[DEBUG][extract_data] Sample data type: {type(sample_data)}")
            print(f"[DEBUG][extract_data] Sample data length: {len(sample_data)}")
            
            # Handle bytes vs string
            if isinstance(sample_data, bytes):
                sample_data = sample_data.decode("utf-8", errors='ignore')
                print(f"[DEBUG][extract_data] Decoded sample data")
            
            print(f"[DEBUG][extract_data] Sample content: {sample_data[:200]}...")
            
            # Find header row
            header_idx = None
            lines = sample_data.splitlines()
            print(f"[DEBUG][extract_data] Found {len(lines)} lines in sample")
            
            for i, line in enumerate(lines):
                line_lower = line.lower()
                print(f"[DEBUG][extract_data] Line {i}: {line[:100]}...")
                if "date" in line_lower and ("narration" in line_lower or "description" in line_lower):
                    header_idx = i
                    print(f"[DEBUG][extract_data] Found header at line {header_idx}")
                    break
            
            # Reset file pointer and read CSV
            file_content.seek(0)
            print(f"[DEBUG][extract_data] File pointer reset, reading CSV...")
            
            if header_idx is not None:
                df_raw = pd.read_csv(file_content, skiprows=header_idx)
                print(f"[DEBUG] Found header at row {header_idx} in CSV file.")
            else:
                # Try reading without skipping rows
                df_raw = pd.read_csv(file_content)
                print("[DEBUG] Using first row as header in CSV file.")
                
            print(f"[DEBUG][extract_data] Loaded CSV shape: {df_raw.shape}")
            print(f"[DEBUG][extract_data] CSV columns: {list(df_raw.columns)}")
                
        except Exception as e:
            print(f"[ERROR] Failed to read CSV file: {e}")
            traceback.print_exc()
            raise ValueError(f"Failed to read CSV file: {e}")
    else:
        print(f"[ERROR] Unsupported file type: {file_type}")
        raise ValueError(f"Unsupported file type: {file_type}")
    
    if df_raw.empty:
        print(f"[ERROR] No data found in file after processing")
        raise ValueError("No data found in file")
        
    print(f"[DEBUG][extract_data] Final df_raw shape: {df_raw.shape}")
    print(f"[DEBUG][extract_data] Final df_raw columns: {list(df_raw.columns)}")
    print(f"=== EXTRACT_DATA DEBUG END ===\n")
    return df_raw

def transform_data(df_raw):
    """Cleans, normalizes, and categorizes the raw data."""
    print(f"\n=== TRANSFORM_DATA DEBUG START ===")
    print(f"[DEBUG][transform_data] Input df shape: {df_raw.shape}")
    print(f"[DEBUG][transform_data] Input columns: {list(df_raw.columns)}")
    
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
    
    print(f"[DEBUG][transform_data] Column mapping: {col_mapping}")
    df.rename(columns=col_mapping, inplace=True)
    print(f"[DEBUG][transform_data] After renaming columns: {list(df.columns)}")
    
    # Ensure required columns exist
    required_cols = ['date', 'description', 'debit_inr', 'credit_inr']
    for col in required_cols:
        if col not in df.columns:
            df[col] = ''
            print(f"[DEBUG][transform_data] Added missing column: {col}")
    
    print(f"[DEBUG][transform_data] Before cleaning - df shape: {df.shape}")
    
    # Clean numeric columns
    for col in ['debit_inr', 'credit_inr']:
        print(f"[DEBUG][transform_data] Cleaning numeric column: {col}")
        original_values = df[col].head(3).tolist()
        print(f"[DEBUG][transform_data] Original {col} values: {original_values}")
        
        df[col] = pd.to_numeric(
            df[col].astype(str).str.replace('[^0-9.]', '', regex=True).replace('', '0'),
            errors='coerce'
        ).fillna(0)
        
        cleaned_values = df[col].head(3).tolist()
        print(f"[DEBUG][transform_data] Cleaned {col} values: {cleaned_values}")
    
    # Clean date column
    print(f"[DEBUG][transform_data] Cleaning date column")
    original_dates = df['date'].head(3).tolist()
    print(f"[DEBUG][transform_data] Original date values: {original_dates}")
    
    df['date'] = pd.to_datetime(df['date'], dayfirst=True, errors='coerce')
    
    cleaned_dates = df['date'].head(3).tolist()
    print(f"[DEBUG][transform_data] Cleaned date values: {cleaned_dates}")
    
    # Remove rows with missing critical data
    print(f"[DEBUG][transform_data] Before removing null rows: {df.shape}")
    df.dropna(subset=['date', 'description'], inplace=True)
    print(f"[DEBUG][transform_data] After removing null rows: {df.shape}")
    
    if df.empty:
        print(f"[ERROR][transform_data] DataFrame is empty after cleaning")
        return pd.DataFrame(), pd.DataFrame()
    
    # Categorize transactions
    print(f"[DEBUG][transform_data] Starting categorization...")
    sample_descriptions = df['description'].head(3).tolist()
    print(f"[DEBUG][transform_data] Sample descriptions: {sample_descriptions}")
    
    df['category'] = df['description'].apply(classify)
    
    sample_categories = df['category'].head(3).tolist()
    print(f"[DEBUG][transform_data] Sample categories: {sample_categories}")
    
    # Create monthly summary
    print(f"[DEBUG][transform_data] Creating monthly summary...")
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
    
    print(f"[DEBUG][transform_data] Final categorized df shape: {df.shape}")
    print(f"[DEBUG][transform_data] Final summary df shape: {summary_df.shape}")
    print(f"=== TRANSFORM_DATA DEBUG END ===\n")
    
    return df, summary_df

from firebase_helper import FirebaseManager

def process_and_upload(user_id: str, year: int, month: int, uploaded_file):
    """Main function to process a file and upload results to Firebase."""
    print(f"\n=== PROCESS_AND_UPLOAD DEBUG START ===")
    print(f"[DEBUG][process_and_upload] user_id: {user_id}")
    print(f"[DEBUG][process_and_upload] year: {year}")
    print(f"[DEBUG][process_and_upload] month: {month}")
    print(f"[DEBUG][process_and_upload] uploaded_file type: {type(uploaded_file)}")
    
    try:
        df_cat, df_sum = process_file(uploaded_file)
        
        if df_cat.empty:
            print("[WARN] No usable transactions to save.")
            return pd.DataFrame(), pd.DataFrame()
        
        print(f"[DEBUG][process_and_upload] Saving to Firebase...")
        FirebaseManager.save(user_id, year, month, df_cat, df_sum)
        print(f"[DEBUG][process_and_upload] Successfully saved to Firebase")
        
        return df_cat, df_sum
    except Exception as e:
        print(f"[ERROR][process_and_upload] Exception: {e}")
        traceback.print_exc()
        return pd.DataFrame(), pd.DataFrame()
    finally:
        print(f"=== PROCESS_AND_UPLOAD DEBUG END ===\n")