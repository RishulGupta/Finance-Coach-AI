# chat_api.py - FastAPI-compatible chat handler

import os
import pandas as pd
from dotenv import load_dotenv
from langchain_openai import ChatOpenAI
from langchain_groq import ChatGroq
from langchain_core.messages import HumanMessage, AIMessage

# Import orchestration logic
try:
    from crewagent.mainagent import (
        main as news_agents_main,
        main_ipo_alerts_flow,
        main_stock_recommendations_flow,
    )
except ImportError:
    # Fallback if crewagent is not available
    def main_ipo_alerts_flow():
        return "IPO service temporarily unavailable"
    
    def main_stock_recommendations_flow(table, summary):
        return "Stock recommendation service temporarily unavailable"
    
    def news_agents_main(table, summary):
        return "Investment advice service temporarily unavailable"

load_dotenv()

# Initialize the model (try OpenAI first, fallback to Groq)
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")
GROQ_API_KEY = os.getenv("GROQ_API_KEY")

if OPENAI_API_KEY:
    model = ChatOpenAI(model="gpt-4o-mini", openai_api_key=OPENAI_API_KEY)
    print("[ChatAPI] Using OpenAI model")
elif GROQ_API_KEY:
    model = ChatGroq(model="llama-3.3-70b-versatile", groq_api_key=GROQ_API_KEY)
    print("[ChatAPI] Using Groq model")
else:
    raise ValueError("No API key found. Please set OPENAI_API_KEY or GROQ_API_KEY in .env")

def build_finance_summary(summary_df):
    """Build finance summary string from DataFrame"""
    if summary_df is None or summary_df.empty:
        return "No financial summary available."
    return summary_df.to_string()

def build_transaction_context(df):
    """Build transaction context from DataFrame"""
    if df is None or df.empty:
        return "No transaction data available."
    
    # Clean the data and remove problematic rows
    clean_df = df[df['description'].notna() & ~df['description'].str.contains(r'\*+', na=False)]
    return clean_df.to_string(
        index=False, 
        columns=['date', 'description', 'category', 'debit_inr', 'credit_inr']
    )

def final_personalized_suggestion(bank_summary_text, ipo_summary, stock_rec, investment_advice):
    """Generate final personalized investment suggestion"""
    prompt = f"""
    You are a seasoned personal financial advisor. Here is the user's bank spending summary:
    {bank_summary_text}
    
    IPO Alerts & Recommendations: {ipo_summary}
    Stock Recommendations: {stock_rec}
    General Financial News and Investment Suggestions: {investment_advice}
    
    Based on all of the above, write a **single, personalized investment plan**.
    - Ground recommendations in the user's real bank and spending data.
    - Suggest specific IPOs, stocks, mutual funds, or other instruments.
    - Allocate exact INR amounts or % of investable surplus.
    - Do NOT exceed the user's affordability.
    - Provide concise reasoning.
    - Present as a markdown table with columns: Investment Option | Allocation Amount | Reason
    """
    
    try:
        response = model.invoke([
            {"role": "system", "content": "You are a highly trusted financial expert advisor."},
            {"role": "user", "content": prompt}
        ])
        return response.content.strip()
    except Exception as e:
        print(f"[ERROR] Model invoke failed: {e}")
        return "Sorry, I couldn't generate investment recommendations right now."

def answer_user_internal_api(
    question: str, 
    df: pd.DataFrame, 
    summary_df: pd.DataFrame, 
    prev_summary_df: pd.DataFrame = None
):
    """
    FastAPI-compatible version of answer_user_internal
    This version removes Streamlit dependencies and focuses on pure logic
    """
    question_lower = question.lower()
    
    # Keywords for different types of queries
    ipo_keywords = ["ipo", "initial public offering", "grey market premium", "gmp"]
    stock_recommend_keywords = [
        "stock recommend", "stock advice", "buy stock", "sell stock", "stock tips"
    ]
    news_keywords = [
        "news", "market update", "financial news", "latest news", "stock news", 
        "economy news", "investment option", "where to invest", "invest"
    ]
    transaction_keywords = [
        "transaction", "payment", "spent on", "paid to", "bought", "purchase", 
        "debit", "credit", "amazon", "zomato", "uber", "individual", "specific", 
        "detail", "when did i", "how much did i", "show me", "list", "mcdonalds", 
        "grand bazaar", "spotify", "rapido", "delhi metro", "google play"
    ]
    
    answers = []
    
    # 1. IPO flow
    if any(kw in question_lower for kw in ipo_keywords):
        try:
            ipo_advice = main_ipo_alerts_flow()
            answers.append(("IPO Alerts & Recommendations", ipo_advice))
        except Exception as e:
            print(f"[ERROR] IPO alerts failed: {e}")
            answers.append(("IPO Alerts & Recommendations", "Error fetching IPO alerts."))
    
    # 2. Stock recommendations flow
    if any(kw in question_lower for kw in stock_recommend_keywords):
        try:
            tx_table = df[['date', 'description', 'category', 'debit_inr', 'credit_inr']].to_string(index=False)
            fin_sum = build_finance_summary(summary_df)
            stock_rec = main_stock_recommendations_flow(tx_table, fin_sum)
            answers.append(("Stock Recommendations", stock_rec))
        except Exception as e:
            print(f"[ERROR] Stock recommendations failed: {e}")
            answers.append(("Stock Recommendations", "Error fetching stock recommendations."))
    
    # 3. News/investment flow
    if any(kw in question_lower for kw in news_keywords):
        try:
            tx_table = df[['date', 'description', 'category', 'debit_inr', 'credit_inr']].to_string(index=False)
            fin_sum = build_finance_summary(summary_df)
            invest_advice = news_agents_main(tx_table, fin_sum)
            answers.append(("Investment Suggestions", invest_advice))
        except Exception as e:
            print(f"[ERROR] Investment suggestions failed: {e}")
            answers.append(("Investment Suggestions", "Error generating investment suggestions."))
    
    # 4. Enhanced fallback for other queries (including transaction-specific queries)
    if not answers:
        try:
            summary_ctx = build_finance_summary(summary_df)
            
            # Append previous month data if available
            if prev_summary_df is not None and not prev_summary_df.empty:
                summary_ctx += "\n\nPREVIOUS MONTH SUMMARY:\n" + build_finance_summary(prev_summary_df)
            
            tx_ctx = build_transaction_context(df)
            
            full_ctx = (
                "SPENDING SUMMARY:\n" + summary_ctx + 
                "\n\nALL TRANSACTIONS:\n" + tx_ctx
            )
            
            prompt = (
                "You are a financial assistant helping a user understand their finances.\n"
                f"Please answer based on the data below:\n{full_ctx}\n\n"
                f"User question: {question}\n"
                "If the question involves a comparison (e.g., more/less spending in a category than last month), "
                "use both current and previous month summaries to determine the difference."
            )
            
            resp = model.invoke([
                {"role": "system", "content": "You are a helpful financial assistant."},
                {"role": "user", "content": prompt}
            ])
            return resp.content.strip()
            
        except Exception as e:
            print(f"[ERROR] Language model call failed: {e}")
            return "Sorry, I couldn't process your request right now."
    
    # 5. Final synthesis combining any agent outputs
    bank_summary_text = build_finance_summary(summary_df)
    if prev_summary_df is not None and not prev_summary_df.empty:
        bank_summary_text += "\n\nPREVIOUS MONTH SUMMARY:\n" + build_finance_summary(prev_summary_df)
    
    ipo_text = next((t for sec, t in answers if sec == "IPO Alerts & Recommendations"), "")
    stock_text = next((t for sec, t in answers if sec == "Stock Recommendations"), "")
    invest_text = next((t for sec, t in answers if sec == "Investment Suggestions"), "")
    
    return final_personalized_suggestion(
        bank_summary_text, ipo_text, stock_text, invest_text
    )