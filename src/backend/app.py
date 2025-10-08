# app.py - VERSION WITH CHAT HISTORY SUPPORT

from fastapi import FastAPI, HTTPException, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
import pandas as pd
from datetime import datetime
from upload_and_process import process_and_upload
from firebase_helper import FirebaseManager
import traceback
import os
from main_qa import process_chat_query, get_session_history, store
from insights_generator import generate_financial_insights, FinancialInsights


def clear_session_history(session_id: str):
    """Clear chat history for a given session ID."""
    if session_id in store:
        store[session_id].clear()
        print(f"[INFO] Cleared chat history for {session_id}")

def get_session_stats():
    """Get statistics for all active chat sessions."""
    stats = {}
    for session_id, history in store.items():
        count = len(history.messages)
        last = history.messages[-1].content if count else ""
        stats[session_id] = {
            "message_count": count,
            "last_message": last[:50] + ("..." if len(last) > 50 else "")
        }
    return stats



try:
    from crewagent.mainagent import (
        main as news_agents_main,
        main_ipo_alerts_flow,
        main_stock_recommendations_flow,
    )
    print("[INFO] CrewAgent modules imported successfully")
except ImportError as e:
    print(f"[WARNING] CrewAgent not available: {e}")
    # Provide fallback functions
    def main_ipo_alerts_flow():
        return "IPO service temporarily unavailable - please check your CrewAgent installation"
    
    def main_stock_recommendations_flow(table, summary):
        return "Stock recommendation service temporarily unavailable - please check your CrewAgent installation"
    
    def news_agents_main(table, summary):
        return "Investment advice service temporarily unavailable - please check your CrewAgent installation"

app = FastAPI(title="Financial Management API", version="1.0.0")

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",  # Vite dev server
        "http://localhost:3000",  # Alternative React dev server
        "http://127.0.0.1:5173",
        "http://127.0.0.1:3000",
        "http://localhost:8080",  # Original config
        "*"  # Allow any origin for development - restrict in production
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

USER_ID = "demo_user"

@app.get("/")
async def root():
    return {"message": "Financial Management API is running", "status": "healthy", "version": "1.0.0"}

@app.post("/api/upload")
async def upload_file(file: UploadFile = File(...), year: int = 2024, month: int = 1):
    print(f"\n=== UPLOAD DEBUG START ===")
    print(f"[DEBUG] Received file upload request")
    print(f"[DEBUG] Year: {year}, Month: {month}")
    print(f"[DEBUG] File object type: {type(file)}")
    
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

        print(f"[DEBUG] About to call process_and_upload")
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
        raise

    except Exception as e:
        print(f"[ERROR] Unexpected exception in upload_file:")
        print(f"[ERROR] Exception type: {type(e).__name__}")
        print(f"[ERROR] Exception message: {str(e)}")
        print(f"[ERROR] Full traceback:")
        traceback.print_exc()
        
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
        print(f"\n=== CHAT DEBUG START ===")
        
        # Extract request data
        question = request.get("question")
        if not question:
            raise HTTPException(status_code=400, detail="Question is required")

        year = request.get("year", 2024)
        month = request.get("month", 1)
        
        # Create session ID based on user and period - SAME AS STREAMLIT
        session_id = f"{USER_ID}_{year}_{month}"
        
        print(f"[INFO] Processing chat query: '{question}' for {month}/{year}")
        print(f"[INFO] Session ID: {session_id}")
        print(f"[INFO] Request data: {request}")

        # Load current month data
        print(f"[INFO] Loading data for {USER_ID}, {year}, {month}")
        data = FirebaseManager.load(USER_ID, year, month)
        
        if data is None:
            print(f"[WARNING] No data found for {month}/{year}")
            return {
                "response": f"No financial data found for {month}/{year}. Please upload your bank statements first to get personalized insights."
            }

        tx_df, sum_df, meta = data
        print(f"[INFO] Loaded data: {len(tx_df)} transactions, {len(sum_df)} summary records")

        # Load previous month data for comparison
        prev_date = datetime(year, month, 1) - pd.DateOffset(months=1)
        prev_data = FirebaseManager.load(USER_ID, prev_date.year, prev_date.month)
        prev_sum = prev_data[1] if prev_data else None
        
        
        # Call the main chat processing function with session ID
        response_text = process_chat_query(question, tx_df, sum_df, prev_sum, session_id)
        
        print(f"[INFO] Got response from answer_user_internal_api: {response_text[:100]}...")
        
        # Get current history length
        history = get_session_history(session_id)
        
        final_response = {
            "response": response_text,
            "session_id": session_id,
            "history_length": len(history.messages)
        }
        
        
        return final_response

   # except HTTPException:
   #     print(f"[ERROR] HTTP Exception in chat endpoint")
     #   raise
    
    except Exception as e:
        print(f"[ERROR] Chat processing failed: {str(e)}")
        print(f"[ERROR] Full traceback:")
        traceback.print_exc()
        
        error_msg = f"Chat processing failed: {str(e)}"
        print(f"[ERROR] Returning error: {error_msg}")
        raise HTTPException(status_code=500, detail=error_msg)

# ==================== CHAT HISTORY MANAGEMENT ENDPOINTS ====================

@app.post("/api/chat/clear")
async def clear_chat_history(request: dict):
    """Clear chat history for a specific session"""
    try:
        year = request.get("year", 2024)
        month = request.get("month", 1)
        session_id = f"{USER_ID}_{year}_{month}"
        
        clear_session_history(session_id)
        
        return {
            "success": True,
            "message": f"Chat history cleared for {month}/{year}",
            "session_id": session_id
        }
    except Exception as e:
        print(f"[ERROR] Clear chat history failed: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to clear chat history: {str(e)}")

@app.get("/api/chat/history/{year}/{month}")
async def get_chat_history(year: int, month: int):
    """Get chat history for a specific period"""
    try:
        session_id = f"{USER_ID}_{year}_{month}"
        history = get_session_history(session_id)
        
        return {
            "session_id": session_id,
            "history": [{"role": m.type, "content": m.content} for m in history.messages],
            "message_count": len(history.messages),
        }
    except Exception as e:
        print(f"[ERROR] Get chat history failed: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to get chat history: {str(e)}")

@app.get("/api/chat/sessions")
async def get_chat_sessions():
    try:
        stats = get_session_stats()
        return {"sessions": stats, "total_sessions": len(stats)}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Get sessions failed: {str(e)}")
# ==================== ORIGINAL ENDPOINTS ====================

@app.get("/api/recommendations/ipo")
async def ipo():
    try:
        print(f"[INFO] Processing IPO recommendations request")
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
        
        print(f"[INFO] Processing stock recommendations for {month}/{year}")
        
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
        
        print(f"[INFO] Processing investment advice for {month}/{year}")
        
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
        months = FirebaseManager.list_months(USER_ID)
        session_stats = get_session_stats()
        env_vars = {
            "OPENAI_API_KEY": "set" if os.getenv("OPENAI_API_KEY") else "not set",
            "GROQ_API_KEY": "set" if os.getenv("GROQ_API_KEY") else "not set",
        }
        return {
            "status": "healthy",
            "firebase_months": len(months),
            "chat_sessions": len(session_stats),
            "environment": env_vars,
        }
    except Exception as e:
        return {"status": "degraded", "error": str(e)}


# --- NEW INSIGHTS ENDPOINT (Now much simpler) ---
@app.get("/api/insights/{year}/{month}", response_model=FinancialInsights)
async def get_financial_insights_endpoint(year: int, month: int):
    # 1. Load current month data using the existing helper
    current_data = FirebaseManager.load(USER_ID, year, month)
    if current_data is None:
        raise HTTPException(status_code=404, detail=f"No data found for {month}/{year}.")
    tx_df, sum_df, _ = current_data

    # 2. Load previous month data for comparison
    prev_date = datetime(year, month, 1) - pd.DateOffset(months=1)
    prev_data = FirebaseManager.load(USER_ID, prev_date.year, prev_date.month)
    prev_sum_df = prev_data[1] if prev_data else pd.DataFrame()

    # 3. Call the generation function from the other file and return the result
    return await generate_financial_insights(tx_df, sum_df, prev_sum_df)


if __name__ == "__main__":
    import uvicorn
    print("[INFO] Starting Financial Management API with CHAT HISTORY support...")
    print("[INFO] Available endpoints:")
    print("  - GET  /           : Health check")
    print("  - POST /api/upload : File upload")
    print("  - GET  /api/data/{year}/{month} : Get financial data")
    print("  - GET  /api/months : Get available data periods")
    print("  - POST /api/chat   : Chat with AI advisor (WITH HISTORY)")
    print("  - POST /api/chat/clear : Clear chat history")
    print("  - GET  /api/chat/history/{year}/{month} : Get chat history")
    print("  - GET  /api/chat/sessions : Get all chat sessions")
    print("  - GET  /api/health : System health check")
    print("[INFO] Starting server on http://0.0.0.0:8000")
    uvicorn.run("app:app", host="0.0.0.0", port=8000, reload=True)
#uvicorn app:app --host 0.0.0.0 --port 8000 --reload