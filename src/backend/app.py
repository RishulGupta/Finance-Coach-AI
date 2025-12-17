# app.py - VERSION WITH MULTI-USER SUPPORT & CHAT HISTORY SUPPORT & INVESTMENT ENDPOINTS

from fastapi import FastAPI, HTTPException, UploadFile, File, Depends, Header
from fastapi.middleware.cors import CORSMiddleware
import pandas as pd
from datetime import datetime
from upload_and_process import process_and_upload
from firebase_helper import FirebaseManager
import traceback
import os
from main_qa import process_chat_query, get_session_history, store
from insights_generator import generate_financial_insights, FinancialInsights
from typing import Optional


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

app = FastAPI(title="Financial Management API", version="2.0.0")

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # Allow any origin for development - restrict in production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Dependency to extract user ID from headers
async def get_current_user_id(x_user_id: Optional[str] = Header(None)) -> str:
    """Extract user ID from X-User-ID header"""
    if not x_user_id:
        raise HTTPException(
            status_code=401, 
            detail="Authentication required. Please provide X-User-ID header."
        )
    return x_user_id

@app.get("/")
async def root():
    return {"message": "Financial Management API is running", "status": "healthy", "version": "2.0.0", "multi_user": True}

@app.post("/api/upload")
async def upload_file(
    file: UploadFile = File(...), 
    year: int = 2024, 
    month: int = 1,
    user_id: str = Depends(get_current_user_id)
):
    # This endpoint contains extensive print statements for debugging purposes.
    # For production, consider replacing these with a structured logger.
    print(f"\n=== UPLOAD REQUEST START ===")
    print(f"[DEBUG] User: {user_id}, Received upload for period: {month}/{year}")
    
    try:
        if not file.filename:
            raise HTTPException(status_code=400, detail="No file provided")

        file_extension = file.filename.lower().split('.')[-1]
        if file_extension not in ['csv', 'xlsx', 'xls']:
            raise HTTPException(status_code=400, detail="Unsupported file type. Please upload CSV or Excel files.")

        print(f"[DEBUG] Processing file: {file.filename} for user: {user_id}")
        df_cat, df_sum = process_and_upload(user_id, year, month, file)
        
        if df_cat.empty:
            raise HTTPException(status_code=400, detail="No valid transaction data found in the file")
            
        # --- ✅ IMPORTANT FIX: Invalidate the insights cache after a successful upload ---
        # This ensures that old insights are not shown after data has been updated.
        print(f"[INFO] Invalidating insights cache for user {user_id}: {month}/{year} due to new upload.")
        FirebaseManager.delete_insights(user_id, year, month)
        # --- End of fix ---

        success_response = {
            "success": True,
            "message": "File processed successfully and insights cache cleared",
            "transactions": len(df_cat),
            "categories": df_cat["category"].nunique() if not df_cat.empty else 0,
            "year": year,
            "month": month,
            "user_id": user_id
        }
        
        print(f"[DEBUG] Upload successful for user {user_id}. Response: {success_response}")
        return success_response

    except Exception as e:
        print(f"[ERROR] Exception during upload for user {user_id}: {type(e).__name__}: {str(e)}")
        traceback.print_exc()
        raise HTTPException(status_code=400, detail=f"Upload processing failed: {str(e)}")
    finally:
        print(f"=== UPLOAD REQUEST END ===\n")

@app.get("/api/data/{year}/{month}")
async def get_financial_data(
    year: int, 
    month: int,
    user_id: str = Depends(get_current_user_id)
):
    try:
        print(f"[DEBUG] Loading data for user {user_id}: {month}/{year}")
        data = FirebaseManager.load(user_id, year, month)
        if data is None:
            return {"exists": False}

        tx_df, sum_df, meta = data
        transactions = tx_df.to_dict("records") if not tx_df.empty else []
        summary = sum_df.to_dict("records") if not sum_df.empty else []

        return {
            "exists": True, "transactions": transactions, "summary": summary, "metadata": meta,
            "metrics": {
                "totalSpent": float(meta.get("spent", 0)),
                "totalIncome": float(meta.get("income", 0)),
                "transactionCount": int(meta.get("rows", 0)),
                "categories": int(meta.get("categories", 0))
            },
            "user_id": user_id
        }
    except Exception as e:
        print(f"[ERROR] Failed to retrieve data for user {user_id}: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to retrieve data: {str(e)}")

@app.get("/api/months")
async def get_months(user_id: str = Depends(get_current_user_id)):
    try:
        print(f"[DEBUG] Loading months for user {user_id}")
        months = FirebaseManager.list_months(user_id)
        return {"months": [{"year": y, "month": m} for y, m in months], "user_id": user_id}
    except Exception as e:
        print(f"[ERROR] Failed to retrieve months for user {user_id}: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to retrieve months: {str(e)}")

@app.post("/api/chat")
async def chat(request: dict, user_id: str = Depends(get_current_user_id)):
    try:
        question = request.get("question")
        if not question:
            raise HTTPException(status_code=400, detail="Question is required")

        year, month = request.get("year", 2024), request.get("month", 1)
        session_id = f"{user_id}_{year}_{month}"
        
        print(f"[DEBUG] Processing chat for user {user_id}, session: {session_id}")
        
        data = FirebaseManager.load(user_id, year, month)
        if data is None:
            return {"response": f"No financial data found for {month}/{year}. Please upload a statement first.", "user_id": user_id}

        tx_df, sum_df, _ = data
        prev_date = datetime(year, month, 1) - pd.DateOffset(months=1)
        prev_data = FirebaseManager.load(user_id, prev_date.year, prev_date.month)
        prev_sum_df = prev_data[1] if prev_data else pd.DataFrame()
        
        response_text = process_chat_query(question, tx_df, sum_df, prev_sum_df, session_id)
        
        history = get_session_history(session_id)
        return {
            "response": response_text, 
            "session_id": session_id, 
            "history_length": len(history.messages),
            "user_id": user_id
        }
    except Exception as e:
        print(f"[ERROR] Chat processing failed for user {user_id}: {str(e)}")
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Chat processing failed: {str(e)}")

# ==================== CHAT HISTORY MANAGEMENT ENDPOINTS ====================
@app.post("/api/chat/clear")
async def clear_chat_history(request: dict, user_id: str = Depends(get_current_user_id)):
    year, month = request.get("year", 2024), request.get("month", 1)
    session_id = f"{user_id}_{year}_{month}"
    print(f"[DEBUG] Clearing chat history for user {user_id}, session: {session_id}")
    clear_session_history(session_id)
    return {
        "success": True, 
        "message": f"Chat history cleared for {month}/{year}", 
        "session_id": session_id,
        "user_id": user_id
    }

@app.get("/api/chat/history/{year}/{month}")
async def get_chat_history(year: int, month: int, user_id: str = Depends(get_current_user_id)):
    session_id = f"{user_id}_{year}_{month}"
    print(f"[DEBUG] Getting chat history for user {user_id}, session: {session_id}")
    history = get_session_history(session_id)
    return {
        "session_id": session_id,
        "history": [{"role": m.type, "content": m.content} for m in history.messages],
        "message_count": len(history.messages),
        "user_id": user_id
    }

@app.get("/api/chat/sessions")
async def get_chat_sessions(user_id: str = Depends(get_current_user_id)):
    # Filter sessions for current user only
    user_stats = {}
    for session_id, history in store.items():
        if session_id.startswith(f"{user_id}_"):
            count = len(history.messages)
            last = history.messages[-1].content if count else ""
            user_stats[session_id] = {
                "message_count": count,
                "last_message": last[:50] + ("..." if len(last) > 50 else "")
            }
    return {"sessions": user_stats, "total_sessions": len(user_stats), "user_id": user_id}

# ==================== INSIGHTS ENDPOINT WITH CACHING ====================
@app.get("/api/insights/{year}/{month}", response_model=FinancialInsights)
async def get_financial_insights_endpoint(year: int, month: int, user_id: str = Depends(get_current_user_id)):
    
    # 1. First, try to load insights from the cache
    print(f"[DEBUG] Loading insights for user {user_id}: {month}/{year}")
    cached_insights = FirebaseManager.load_insights(user_id, year, month)
    if cached_insights:
        return cached_insights # Return cached data immediately if found

    # 2. If no cache exists, proceed to generate them
    print(f"ℹ️ [API] No cache found for user {user_id}: {month}/{year}. Generating new insights...")
    
    # Load the financial data required for generation
    current_data = FirebaseManager.load(user_id, year, month)
    if current_data is None:
        raise HTTPException(status_code=404, detail=f"No data found for {month}/{year} to generate insights.")
    tx_df, sum_df, _ = current_data

    # Load previous month data for comparison
    prev_date = datetime(year, month, 1) - pd.DateOffset(months=1)
    prev_data = FirebaseManager.load(user_id, prev_date.year, prev_date.month)
    prev_sum_df = prev_data[1] if prev_data else pd.DataFrame()

    # 3. Call the AI model to generate new insights
    new_insights = await generate_financial_insights(tx_df, sum_df, prev_sum_df)
    
    # --- ✅ FIX ---
    # The 'new_insights' variable is already a dictionary. The conversion line below caused the error and has been removed.
    # OLD LINE: new_insights_dict = new_insights.model_dump() if hasattr(new_insights, 'model_dump') else new_insights.dict()

    # 4. Save the newly generated insights (which is already a dict) to the cache for next time
    FirebaseManager.save_insights(user_id, year, month, new_insights)

    # 5. Return the new insights
    return new_insights

# ==================== INVESTMENT RECOMMENDATION ENDPOINTS ====================

@app.get("/api/recommendations/ipo")
async def get_ipo_recommendations(user_id: str = Depends(get_current_user_id)):
    """Get IPO recommendations using CrewAI agents"""
    try:
        print(f"[INFO] Generating IPO recommendations for user {user_id}...")
        recommendations = main_ipo_alerts_flow()
        return {"recommendations": recommendations, "user_id": user_id}
    except Exception as e:
        print(f"[ERROR] IPO recommendations failed for user {user_id}: {str(e)}")
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"IPO recommendations failed: {str(e)}")

@app.post("/api/recommendations/stocks")
async def get_stock_recommendations(request: dict, user_id: str = Depends(get_current_user_id)):
    """Get personalized stock recommendations based on user's financial data"""
    try:
        year = request.get("year", 2024)
        month = request.get("month", 1)
        
        print(f"[INFO] Generating stock recommendations for user {user_id}: {month}/{year}...")
        
        # Load user's financial data
        data = FirebaseManager.load(user_id, year, month)
        if data is None:
            raise HTTPException(status_code=404, detail=f"No financial data found for {month}/{year}")
        
        tx_df, sum_df, _ = data
        
        # Convert dataframes to string format for CrewAI processing
        tx_string = tx_df.to_string() if not tx_df.empty else "No transaction data"
        
        # --- ✅ FIX: Convert summary DataFrame to a string before passing it ---
        sum_string = sum_df.to_string() if not sum_df.empty else "No summary data"
        
        # Call CrewAI stock recommendation flow with consistent string types
        recommendations = main_stock_recommendations_flow(tx_string, sum_string)
        
        return {"recommendations": recommendations, "user_id": user_id}
    except HTTPException:
        raise
    except Exception as e:
        print(f"[ERROR] Stock recommendations failed for user {user_id}: {str(e)}")
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Stock recommendations failed: {str(e)}")

@app.post("/api/recommendations/investment")
async def get_investment_advice(request: dict, user_id: str = Depends(get_current_user_id)):
    """Get comprehensive investment advice based on user's financial profile"""
    try:
        year = request.get("year", 2024)
        month = request.get("month", 1)
        
        print(f"[INFO] Generating investment advice for user {user_id}: {month}/{year}...")
        
        # Load user's financial data
        data = FirebaseManager.load(user_id, year, month)
        if data is None:
            raise HTTPException(status_code=404, detail=f"No financial data found for {month}/{year}")
        
        tx_df, sum_df, _ = data
        
        # Convert dataframes to string format for CrewAI processing
        tx_string = tx_df.to_string() if not tx_df.empty else "No transaction data"
        sum_string = sum_df.to_string() if not sum_df.empty else "No summary data"
        
        # Call CrewAI investment advice flow
        advice = news_agents_main(tx_string, sum_string)
        
        return {"advice": advice, "user_id": user_id}
    except HTTPException:
        raise
    except Exception as e:
        print(f"[ERROR] Investment advice failed for user {user_id}: {str(e)}")
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Investment advice failed: {str(e)}")


if __name__ == "__main__":
    import uvicorn
    print("[INFO] Starting Financial Management API v2.0.0 with MULTI-USER SUPPORT...")
    print("[INFO] Available endpoints:")
    print("  - GET  /           : Health check")
    print("  - POST /api/upload : File upload (requires X-User-ID header)")
    print("  - GET  /api/data/{year}/{month} : Get financial data (requires X-User-ID header)")
    print("  - GET  /api/months : Get available data periods (requires X-User-ID header)")
    print("  - POST /api/chat   : Chat with AI advisor (requires X-User-ID header)")
    print("  - POST /api/chat/clear : Clear chat history (requires X-User-ID header)")
    print("  - GET  /api/chat/history/{year}/{month} : Get chat history (requires X-User-ID header)")
    print("  - GET  /api/chat/sessions : Get all chat sessions (requires X-User-ID header)")
    print("  - GET  /api/insights/{year}/{month} : Get AI insights (requires X-User-ID header)")
    print("  - GET  /api/recommendations/ipo : Get IPO recommendations (requires X-User-ID header)")
    print("  - POST /api/recommendations/stocks : Get stock recommendations (requires X-User-ID header)")
    print("  - POST /api/recommendations/investment : Get investment advice (requires X-User-ID header)")
    print("[INFO] Starting server on http://0.0.0.0:8000") 
    uvicorn.run("app:app", host="0.0.0.0", port=8000, reload=True)
#uvicorn app:app --host 0.0.0.0 --port 8000 --reload