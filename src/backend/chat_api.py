# chat_api.py - VERSION WITH MESSAGE HISTORY LIKE STREAMLIT

import os
import pandas as pd
from dotenv import load_dotenv
from langchain_openai import ChatOpenAI
from langchain_groq import ChatGroq
from langchain_core.messages import HumanMessage, AIMessage
from langchain_community.chat_message_histories import ChatMessageHistory
from langchain_core.chat_history import BaseChatMessageHistory

# Import orchestration logic
try:
    from crewagent.mainagent import (
        main as news_agents_main,
        main_ipo_alerts_flow,
        main_stock_recommendations_flow,
    )
    print("✅ [ChatAPI] CrewAgent modules loaded successfully")
    CREWAGENT_AVAILABLE = True
except ImportError as e:
    print(f"⚠️ [ChatAPI] CrewAgent not available: {e}")
    CREWAGENT_AVAILABLE = False
    
    # Fallback functions
    def main_ipo_alerts_flow():
        return "IPO service temporarily unavailable"
    
    def main_stock_recommendations_flow(table, summary):
        return "Stock recommendation service temporarily unavailable"
    
    def news_agents_main(table, summary):
        return "Investment advice service temporarily unavailable"

load_dotenv()

# Initialize the model
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")
GROQ_API_KEY = os.getenv("GROQ_API_KEY")

model = None
model_name = None

if OPENAI_API_KEY:
    try:
        model = ChatOpenAI(model="gpt-4o-mini", openai_api_key=OPENAI_API_KEY)
        model_name = "OpenAI GPT-4o-mini"
        print(f"✅ [ChatAPI] Using {model_name}")
    except Exception as e:
        print(f"❌ [ChatAPI] Failed to initialize OpenAI: {e}")
        model = None

if model is None and GROQ_API_KEY:
    try:
        model = ChatGroq(model="llama-3.3-70b-versatile", groq_api_key=GROQ_API_KEY)
        model_name = "Groq Llama-3.3-70b"
        print(f"✅ [ChatAPI] Using {model_name}")
    except Exception as e:
        print(f"❌ [ChatAPI] Failed to initialize Groq: {e}")
        model = None

if model is None:
    raise ValueError("❌ No valid API key found. Please set OPENAI_API_KEY or GROQ_API_KEY in .env")

# ==================== CHAT HISTORY IMPLEMENTATION ====================
# This is the same logic as in your Streamlit main_qa.py

# Global store for chat histories - same as Streamlit version
store: dict[str, ChatMessageHistory] = {}

def get_session_history(session_id: str) -> BaseChatMessageHistory:
    """Get session history - SAME as Streamlit version"""
    if session_id not in store:
        store[session_id] = ChatMessageHistory()
    return store[session_id]

def clear_session_history(session_id: str):
    """Clear specific session history"""
    if session_id in store:
        store[session_id].clear()
        print(f"✅ [ChatAPI] Cleared history for session: {session_id}")

def get_all_session_ids():
    """Get all active session IDs"""
    return list(store.keys())

# ==================== UTILITY FUNCTIONS ====================

def build_finance_summary(summary_df):
    """Build finance summary string from DataFrame"""
    if summary_df is None or summary_df.empty:
        return "No financial summary available."
    try:
        return summary_df.to_string()
    except Exception as e:
        print(f"⚠️ [ChatAPI] Error building finance summary: {e}")
        return "Error processing financial summary data."

def build_transaction_context(df):
    """Build transaction context from DataFrame"""
    if df is None or df.empty:
        return "No transaction data available."
    
    try:
        # Clean the data and remove problematic rows
        clean_df = df[df['description'].notna() & ~df['description'].str.contains(r'\\*+', na=False)]
        
        # Select relevant columns for context
        context_df = clean_df[['date', 'description', 'category', 'debit_inr', 'credit_inr']].copy()
        
        # Limit to most recent 100 transactions to avoid context overflow
        if len(context_df) > 100:
            context_df = context_df.head(100)
            
        return context_df.to_string(index=False)
        
    except Exception as e:
        print(f"⚠️ [ChatAPI] Error building transaction context: {e}")
        return "Error processing transaction data."

def safe_model_invoke(messages):
    """Safely invoke the model with error handling"""
    try:
        if model is None:
            return "I apologize, but the AI model is not available right now. Please check the system configuration."
        
        print(f"🤖 [ChatAPI] Invoking {model_name}...")
        response = model.invoke(messages)
        
        if hasattr(response, 'content'):
            return response.content.strip()
        else:
            return str(response).strip()
            
    except Exception as e:
        print(f"❌ [ChatAPI] Model invocation failed: {e}")
        return f"I apologize, but I encountered an error while processing your request: {str(e)}"

def clean_response_formatting(response_text):
    """Clean the AI response for better UI display - NO ASTERISKS"""
    
    # Basic cleanup
    formatted = response_text.strip()
    
    # Remove all markdown asterisks and replace with clean formatting
    formatted = formatted.replace('**', '')  # Remove all bold asterisks
    formatted = formatted.replace('*', '')   # Remove all italic asterisks
    
    # Clean up headers but keep them simple
    formatted = formatted.replace('###', '\n')
    formatted = formatted.replace('##', '\n')
    formatted = formatted.replace('#', '')
    
    # Fix spacing issues
    formatted = formatted.replace('\n\n\n\n', '\n\n')  # Remove excessive line breaks
    formatted = formatted.replace('\n\n\n', '\n\n')    # Remove excessive line breaks
    
    return formatted.strip()

# ==================== MAIN CHAT FUNCTION WITH HISTORY ====================

def answer_user_internal_api(
    question: str,
    df: pd.DataFrame,
    summary_df: pd.DataFrame,
    prev_summary_df: pd.DataFrame = None,
    session_id: str = "default_session"
):
    """
    MAIN CHAT PROCESSING FUNCTION - WITH MESSAGE HISTORY like Streamlit
    
    This matches your Streamlit process_chat_query function
    """
    
    print(f"🔍 [ChatAPI] Processing question: '{question[:50]}...' for session: {session_id}")
    print(f"📊 [ChatAPI] Data available - Transactions: {len(df) if df is not None else 0}, Summary: {len(summary_df) if summary_df is not None else 0}")
    
    # Get chat history - SAME AS STREAMLIT
    chat_history = get_session_history(session_id)
    
    # Build context from financial data - SAME AS STREAMLIT
    context_parts = []
    
    if summary_df is not None and not summary_df.empty:
        context_parts.append("CURRENT MONTH SPENDING SUMMARY:")
        context_parts.append(summary_df.to_string())
    
    if prev_summary_df is not None and not prev_summary_df.empty:
        context_parts.append("\nPREVIOUS MONTH SPENDING SUMMARY:")
        context_parts.append(prev_summary_df.to_string())
    
    if df is not None and not df.empty:
        context_parts.append("\nTRANSACTIONS DATA:")
        context_df = df[['date', 'description', 'category', 'debit_inr', 'credit_inr']]
        # Limit transactions to avoid context overflow
        if len(context_df) > 100:
            context_df = context_df.head(100)
        context_parts.append(context_df.to_string())
    
    financial_context = "\n".join(context_parts)
    
    # Create messages list with chat history - SAME AS STREAMLIT
    messages = [
        {
            "role": "system", 
            "content": "You are a helpful financial assistant. Use the provided financial data to answer questions accurately. When users ask about specific transactions or spending amounts, search through the data carefully and provide exact amounts and details. Do NOT use asterisks (*) for formatting - use plain text. Use bullet points with • symbol only."
        }
    ]
    
    # Add chat history - SAME AS STREAMLIT
    for message in chat_history.messages:
        if hasattr(message, 'content'):
            if message.type == "human":
                messages.append({"role": "user", "content": message.content})
            elif message.type == "ai":
                messages.append({"role": "assistant", "content": message.content})
    
    # Add current query with financial context - SAME AS STREAMLIT
    enhanced_input = f"""Based on my financial data below, please answer this question: {question}

FINANCIAL DATA:
{financial_context}

Please provide a helpful response based on this financial information. If asked about specific spending amounts or transactions, provide exact figures from the data. Do NOT use asterisks (*) for formatting."""

    messages.append({"role": "user", "content": enhanced_input})
    
    try:
        # Get response from model
        response = model.invoke(messages)
        result = response.content.strip() if hasattr(response, 'content') else str(response).strip()
        
        # Clean formatting
        result = clean_response_formatting(result)
        
        # Add to chat history - SAME AS STREAMLIT
        chat_history.add_user_message(question)
        chat_history.add_ai_message(result)
        
        print(f"✅ [ChatAPI] Response generated and added to history. History size: {len(chat_history.messages)}")
        
        return result
    
    except Exception as e:
        error_msg = f"Sorry, I encountered an error: {str(e)}"
        print(f"❌ [ChatAPI] Error: {error_msg}")
        
        # Still add to history for consistency
        chat_history.add_user_message(question)
        chat_history.add_ai_message(error_msg)
        
        return error_msg

# ==================== UTILITY FUNCTIONS FOR HISTORY MANAGEMENT ====================

def get_chat_history_for_session(session_id: str):
    """Get chat history as a list of dictionaries for API responses"""
    if session_id not in store:
        return []
    
    history = []
    for message in store[session_id].messages:
        if hasattr(message, 'content'):
            history.append({
                "type": message.type,
                "content": message.content
            })
    
    return history

def get_session_stats():
    """Get statistics about all active sessions"""
    stats = {}
    for session_id, history in store.items():
        stats[session_id] = {
            "message_count": len(history.messages),
            "last_message": history.messages[-1].content[:50] + "..." if history.messages else "No messages"
        }
    return stats

# ==================== SPECIALIZED AGENT FUNCTIONS ====================

def final_personalized_suggestion(bank_summary_text, ipo_summary, stock_rec, investment_advice):
    """Generate final personalized investment suggestion with clean formatting"""
    
    # If all agent responses are empty, provide a basic financial analysis
    if not any([ipo_summary.strip(), stock_rec.strip(), investment_advice.strip()]):
        prompt = f"""
        You are a financial advisor. Based on the user's bank spending data below, provide practical financial advice.

        FINANCIAL DATA:
        {bank_summary_text}

        Please provide a well-structured response with:
        1. A brief analysis of their spending patterns
        2. Practical budgeting suggestions  
        3. General investment advice based on their spending capacity
        4. Any areas where they could optimize expenses

        IMPORTANT: Do NOT use asterisks (*) for formatting - use plain text. Use bullet points with • symbol only.
        Keep currency amounts simple like: Rs 1000 or 1000 INR.
        """
    else:
        prompt = f"""
        You are a seasoned personal financial advisor. Here is the user's bank spending summary:

        FINANCIAL DATA:
        {bank_summary_text}

        SPECIALIZED RECOMMENDATIONS:
        IPO Alerts & Opportunities: {ipo_summary}
        Stock Market Recommendations: {stock_rec}
        Investment News & Market Analysis: {investment_advice}

        Based on all the above information, create a comprehensive, personalized financial plan.

        IMPORTANT: Do NOT use asterisks (*) for formatting - use plain text. Use bullet points with • symbol only.
        Keep currency amounts simple like: Rs 1000 or 1000 INR.
        """

    messages = [
        {"role": "system", "content": "You are a highly trusted financial expert advisor. Provide clear, well-structured advice using simple text without asterisks. Use bullet points with • symbol and plain text headers."},
        {"role": "user", "content": prompt}
    ]
    
    return safe_model_invoke(messages)

# ==================== TESTING FUNCTION ====================

def test_chat_api():
    """Test function to verify chat API with history is working"""
    try:
        print("🧪 [ChatAPI] Running test with history...")
        
        # Create dummy data for testing
        test_df = pd.DataFrame({
            'date': ['2024-01-01', '2024-01-02'],
            'description': ['Test Transaction 1', 'Test Transaction 2'],
            'category': ['Food', 'Transport'],
            'debit_inr': [100, 50],
            'credit_inr': [0, 0]
        })
        
        test_summary_df = pd.DataFrame({
            'category': ['Food', 'Transport'],
            'total_spent': [100, 50]
        })
        
        # Test with session ID
        test_session_id = "test_session_123"
        
        # First message
        response1 = answer_user_internal_api(
            "What did I spend on food?",
            test_df,
            test_summary_df,
            session_id=test_session_id
        )
        
        # Second message to test history
        response2 = answer_user_internal_api(
            "And what about transport?",
            test_df,
            test_summary_df,
            session_id=test_session_id
        )
        
        # Check history
        history = get_chat_history_for_session(test_session_id)
        
        print(f"✅ [ChatAPI] Test successful!")
        print(f"   - Response 1: {response1[:50]}...")
        print(f"   - Response 2: {response2[:50]}...")
        print(f"   - History length: {len(history)} messages")
        
        return True
        
    except Exception as e:
        print(f"❌ [ChatAPI] Test failed: {e}")
        return False

if __name__ == "__main__":
    # Run test when script is executed directly
    test_chat_api()