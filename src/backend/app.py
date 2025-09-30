# app.py - COMPREHENSIVE DEBUG VERSION

from fastapi import FastAPI, HTTPException, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
import pandas as pd
from datetime import datetime
from upload_and_process import process_and_upload
from firebase_helper import FirebaseManager
import traceback
import sys

# Import the fixed chat handler
from chat_api import answer_user_internal_api

# Import crewagent functions with error handling
try:
    from crewagent.mainagent import (
        main as news_agents_main,
        main_ipo_alerts_flow,
        main_stock_recommendations_flow,
    )
except ImportError as e:
    print(f"[WARNING] CrewAgent not available: {e}")
    # Provide fallback functions
    def main_ipo_alerts_flow():
        return "IPO service temporarily unavailable"
    def main_stock_recommendations_flow(table, summary):
        return "Stock recommendation service temporarily unavailable"
    def news_agents_main(table, summary):
        return "Investment advice service temporarily unavailable"

app = FastAPI()

# Updated CORS configuration to allow frontend connection
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",  # Vite dev server
        "http://localhost:3000",  # Alternative React dev server
        "http://127.0.0.1:5173",
        "http://127.0.0.1:3000",
        "http://localhost:8080",  # Original config
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

USER_ID = "demo_user"

@app.get("/")
async def root():
    return {"message": "Financial Management API is running", "status": "healthy"}

@app.post("/api/upload")
async def upload_file(file: UploadFile = File(...), year: int = 2024, month: int = 1):
    print(f"\n=== UPLOAD DEBUG START ===")
    print(f"[DEBUG] Received file upload request")
    print(f"[DEBUG] Year: {year}, Month: {month}")
    print(f"[DEBUG] File object type: {type(file)}")
    print(f"[DEBUG] File object attributes: {dir(file)}")
    
    try:
        # Validate file is provided
        print(f"[DEBUG] Checking file.filename: {file.filename}")
        if not file.filename:
            print(f"[ERROR] No filename provided")
            raise HTTPException(status_code=400, detail="No file provided")
            
        # Validate file type
        print(f"[DEBUG] File name: {file.filename}")
        file_extension = file.filename.lower().split('.')[-1]
        print(f"[DEBUG] File extension: {file_extension}")
        
        if file_extension not in ['csv', 'xlsx', 'xls']:
            print(f"[ERROR] Unsupported file type: {file_extension}")
            raise HTTPException(status_code=400, detail="Unsupported file type. Please upload CSV or Excel files.")
        
        # Check file size
        file_size = 0
        try:
            await file.seek(0, 2)  # Seek to end
            file_size = await file.tell()  # Get size
            await file.seek(0)  # Reset to beginning
            print(f"[DEBUG] File size: {file_size} bytes")
        except Exception as size_error:
            print(f"[ERROR] Could not determine file size: {size_error}")
        
        # Read a small sample to verify file content
        try:
            sample_content = await file.read(100)
            print(f"[DEBUG] File sample (first 100 bytes): {sample_content[:50]}...")
            await file.seek(0)  # Reset to beginning
        except Exception as sample_error:
            print(f"[ERROR] Could not read file sample: {sample_error}")
        
        print(f"[DEBUG] About to call process_and_upload with:")
        print(f"[DEBUG] - USER_ID: {USER_ID}")
        print(f"[DEBUG] - year: {year}")
        print(f"[DEBUG] - month: {month}")
        print(f"[DEBUG] - file object: {file}")
        print(f"[DEBUG] - file.filename: {file.filename}")
        print(f"[DEBUG] - file.file: {file.file}")
        
        # Process the file - Pass the UploadFile object
        df_cat, df_sum = process_and_upload(USER_ID, year, month, file)
        
        print(f"[DEBUG] process_and_upload returned:")
        print(f"[DEBUG] - df_cat shape: {df_cat.shape if not df_cat.empty else 'EMPTY'}")
        print(f"[DEBUG] - df_sum shape: {df_sum.shape if not df_sum.empty else 'EMPTY'}")
        
        if df_cat.empty:
            print(f"[ERROR] No transactions found after processing")
            raise HTTPException(status_code=400, detail="No valid transaction data found in the file")
            
        success_response = {
            "success": True,
            "message": "File processed successfully",
            "transactions": len(df_cat),
            "categories": df_cat["category"].nunique() if not df_cat.empty else 0,
            "year": year,
            "month": month
        }
        print(f"[DEBUG] Returning success response: {success_response}")
        return success_response
        
    except HTTPException as http_err:
        print(f"[ERROR] HTTP Exception: {http_err.detail}")
        # Re-raise HTTP exceptions without modification
        raise
    except Exception as e:
        print(f"[ERROR] Unexpected exception in upload_file:")
        print(f"[ERROR] Exception type: {type(e).__name__}")
        print(f"[ERROR] Exception message: {str(e)}")
        print(f"[ERROR] Full traceback:")
        traceback.print_exc()
        
        # Provide more detailed error information
        error_detail = f"Upload processing failed: {type(e).__name__}: {str(e)}"
        print(f"[ERROR] Sending error response: {error_detail}")
        raise HTTPException(status_code=400, detail=error_detail)
    finally:
        print(f"=== UPLOAD DEBUG END ===\n")

@app.get("/api/data/{year}/{month}")
async def get_financial_data(year: int, month: int):
    try:
        data = FirebaseManager.load(USER_ID, year, month)
        if data is None:
            return {"exists": False}
            
        tx_df, sum_df, meta = data
        
        # Convert DataFrames to records for JSON serialization
        transactions = tx_df.to_dict("records") if not tx_df.empty else []
        summary = sum_df.to_dict("records") if not sum_df.empty else []
        
        return {
            "exists": True,
            "transactions": transactions,
            "summary": summary,
            "metadata": meta,
            "metrics": {
                "totalSpent": float(meta.get("spent", 0)),
                "totalIncome": float(meta.get("income", 0)),
                "transactionCount": int(meta.get("rows", 0)),
                "categories": int(meta.get("categories", 0))
            }
        }
        
    except Exception as e:
        print(f"[ERROR] Data retrieval failed: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to retrieve data: {str(e)}")

@app.get("/api/months")
async def get_months():
    try:
        months = FirebaseManager.list_months(USER_ID)
        return {"months": [{"year": y, "month": m} for y, m in months]}
    except Exception as e:
        print(f"[ERROR] Months retrieval failed: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to retrieve months: {str(e)}")

@app.post("/api/chat")
async def chat(request: dict):
    try:
        question = request.get("question")
        if not question:
            raise HTTPException(status_code=400, detail="Question is required")
            
        year = request.get("year", 2024)
        month = request.get("month", 1)
        
        print(f"[INFO] Processing chat query: '{question}' for {month}/{year}")
        
        # Load current month data
        data = FirebaseManager.load(USER_ID, year, month)
        if data is None:
            return {
                "response": f"No financial data found for {month}/{year}. Please upload your bank statements first to get personalized insights."
            }
            
        tx_df, sum_df, meta = data
        print(f"[INFO] Loaded data: {len(tx_df)} transactions, {len(sum_df)} summary records")
        
        # Load previous month data for comparison
        prev_date = datetime(year, month, 1) - pd.DateOffset(months=1)
        prev_data = FirebaseManager.load(USER_ID, prev_date.year, prev_date.month)
        prev_sum = prev_data[1] if prev_data else None
        
        # Get AI response using the fixed chat handler
        resp = answer_user_internal_api(question, tx_df, sum_df, prev_sum)
        
        return {"response": resp}
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"[ERROR] Chat processing failed: {str(e)}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Chat processing failed: {str(e)}")

@app.get("/api/recommendations/ipo")
async def ipo():
    try:
        out = main_ipo_alerts_flow()
        return {"recommendations": out}
    except Exception as e:
        print(f"[ERROR] IPO recommendations failed: {str(e)}")
        raise HTTPException(status_code=500, detail=f"IPO recommendations failed: {str(e)}")

@app.post("/api/recommendations/stocks")
async def stocks(request: dict):
    try:
        year = request.get("year", 2024)
        month = request.get("month", 1)
        
        data = FirebaseManager.load(USER_ID, year, month)
        if data is None:
            return {"recommendations": "No financial data available for stock recommendations. Please upload your bank statements first."}
            
        tx_df, sum_df, meta = data
        table = tx_df[["date", "description", "category", "debit_inr", "credit_inr"]].to_string(index=False)
        
        out = main_stock_recommendations_flow(table, sum_df)
        return {"recommendations": out}
    except Exception as e:
        print(f"[ERROR] Stock recommendations failed: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Stock recommendations failed: {str(e)}")

@app.post("/api/recommendations/investment")
async def invest(request: dict):
    try:
        year = request.get("year", 2024)
        month = request.get("month", 1)
        
        data = FirebaseManager.load(USER_ID, year, month)
        if data is None:
            return {"advice": "No financial data available for investment advice. Please upload your bank statements first."}
            
        tx_df, sum_df, meta = data
        table = tx_df[["date", "description", "category", "debit_inr", "credit_inr"]].to_string(index=False)
        fin = sum_df.to_string()
        
        out = news_agents_main(table, fin)
        return {"advice": out}
    except Exception as e:
        print(f"[ERROR] Investment advice failed: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Investment advice failed: {str(e)}")

# Health check endpoint for debugging
@app.get("/api/health")
async def health_check():
    try:
        # Test Firebase connection
        months = FirebaseManager.list_months(USER_ID)
        return {
            "status": "healthy",
            "firebase": "connected",
            "available_months": len(months),
            "user_id": USER_ID
        }
    except Exception as e:
        return {
            "status": "degraded",
            "firebase": "error",
            "error": str(e)
        }

# NEW: Debug endpoint to test file upload without processing
@app.post("/api/debug/upload")
async def debug_upload(file: UploadFile = File(...)):
    """Debug endpoint to test file upload reception"""
    try:
        info = {
            "filename": file.filename,
            "content_type": file.content_type,
            "file_size": 0,
            "file_type": type(file).__name__,
            "has_file_attr": hasattr(file, 'file'),
            "has_filename_attr": hasattr(file, 'filename'),
        }
        
        # Try to get file size
        try:
            await file.seek(0, 2)
            info["file_size"] = await file.tell()
            await file.seek(0)
        except Exception as e:
            info["size_error"] = str(e)
        
        # Try to read first few bytes
        try:
            sample = await file.read(50)
            info["sample_content"] = str(sample)
            await file.seek(0)
        except Exception as e:
            info["read_error"] = str(e)
            
        return info
    except Exception as e:
        return {"error": str(e), "traceback": traceback.format_exc()}

if __name__ == "__main__":
    import uvicorn
    print("[INFO] Starting Financial Management API with DEBUG logging...")
    uvicorn.run("app:app", host="0.0.0.0", port=8000, reload=True)
#uvicorn app:app --host 0.0.0.0 --port 8000 --reload