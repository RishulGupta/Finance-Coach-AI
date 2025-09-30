''' for open ai'''

'''

import os

import pandas as pd

import streamlit as st

import plotly.graph_objects as go

import matplotlib.pyplot as plt

import numpy as np

from mpl_toolkits.mplot3d.art3d import Poly3DCollection

from dotenv import load_dotenv

# === Import orchestration logic ===

from crewagent.mainagent import main as news_agents_main

from crewagent.mainagent import main_ipo_alerts_flow, main_stock_recommendations_flow

# 🔄 SWITCHED from Groq to OpenAI

from langchain_openai import ChatOpenAI

load_dotenv()

OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")

if not OPENAI_API_KEY:

st.error("OPENAI_API_KEY not found. Please set it in .env")

st.stop()

# 🔄 Init OpenAI model instead of ChatGroq

# Pick a suitable GPT model: "gpt-4o-mini", "gpt-4o", or "gpt-4.1"

model = ChatOpenAI(model="gpt-4o-mini", openai_api_key=OPENAI_API_KEY)

'''

import os
import pandas as pd
import streamlit as st
import plotly.graph_objects as go
import numpy as np
from dotenv import load_dotenv
from langchain_groq import ChatGroq
from langchain_openai import ChatOpenAI
# === Import orchestration logic ===
from crewagent.mainagent import main as news_agents_main
from crewagent.mainagent import main_ipo_alerts_flow, main_stock_recommendations_flow

# === Import LangChain components for chat history ===
from langchain_core.prompts import ChatPromptTemplate, MessagesPlaceholder
from langchain_core.runnables import RunnableLambda
from langchain_core.runnables.history import RunnableWithMessageHistory
from langchain_community.chat_message_histories import ChatMessageHistory
from langchain_core.chat_history import BaseChatMessageHistory
from langchain_core.messages import HumanMessage, AIMessage

load_dotenv()
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")
if not OPENAI_API_KEY:

 st.error("OPENAI_API_KEY not found. Please set it in .env")

 st.stop()
model = ChatOpenAI(model="gpt-4o-mini", openai_api_key=OPENAI_API_KEY)
'''
GROQ_API_KEY = os.getenv("GROQ_API_KEY")
if not GROQ_API_KEY:
    st.error("GROQ_API_KEY not found. Please set it in .env")
    st.stop()

model = ChatGroq(model="llama-3.3-70b-versatile", groq_api_key=GROQ_API_KEY)

'''
# Chat history store
store = {}

def get_session_history(session_id: str) -> BaseChatMessageHistory:
    """Gets the chat history for a given session ID."""
    if session_id not in store:
        store[session_id] = ChatMessageHistory()
    return store[session_id]

@st.cache_data
def load_data():
    df = pd.read_csv("data1/categorized_transactions.csv")
    summary = pd.read_csv("data1/spending_summary.csv")
    if 'month' in summary.columns:
        summary['month'] = pd.to_datetime(
            summary['month'].astype(str), errors='coerce'
        ).dt.to_period('M')
    else:
        st.warning("Warning: 'month' column not in spending_summary CSV.")
    
    df['date'] = pd.to_datetime(df['date'], errors='coerce')
    return df, summary

def build_finance_summary(summary):
    return summary.to_string()

def build_transaction_context(df):
    clean_df = df[df['description'].notna() & ~df['description'].str.contains(r'\*+', na=False)]
    return clean_df.to_string(
        index=False,
        columns=['date', 'description', 'category', 'debit_inr', 'credit_inr']
    )

def final_personalized_suggestion(
    bank_summary_text, ipo_summary, stock_rec, investment_advice
):
    prompt = f"""
You are a seasoned personal financial advisor.

Here is the user's bank spending summary:
{bank_summary_text}

IPO Alerts & Recommendations:
{ipo_summary}

Stock Recommendations:
{stock_rec}

General Financial News and Investment Suggestions:
{investment_advice}

Based on all of the above, write a **single, personalized investment plan**.

- Ground recommendations in the user's real bank and spending data.
- Suggest specific IPOs, stocks, mutual funds, or other instruments.
- Allocate exact INR amounts or % of investable surplus.
- Do NOT exceed the user's affordability.
- Provide concise reasoning.
- Present as a markdown table with columns:
Investment Option | Allocation Amount | Reason
"""
    
    response = model.invoke([
        {"role": "system", "content": "You are a highly trusted financial expert advisor."},
        {"role": "user", "content": prompt}
    ])
    return response.content.strip()

# ==================== PIE CHART SECTION ====================
def show_3d_pie_chart(df):
    if 'category' not in df.columns or 'debit_inr' not in df.columns:
        st.warning("Pie chart unavailable: category or debit_inr column missing.")
        return
    
    pie_data = df.groupby('category')['debit_inr'].sum().reset_index()
    pie_data = pie_data[pie_data['debit_inr'] > 0]
    
    if pie_data.empty:
        st.info("No expenses found to plot.")
        return
    
    colors = [
        '#F3C623', '#F99015', '#A55F55', '#4287F5', '#63C5DA', '#46B1C9',
        '#6894AA', '#536B78', '#5D6D7E', '#7F8C8D'
    ]
    
    fig = go.Figure(data=[go.Pie(
        labels=pie_data['category'],
        values=pie_data['debit_inr'],
        hole=0.4,
        marker=dict(colors=colors, line=dict(color='#000000', width=1)),
        hoverinfo='label+percent+value',
        textinfo='label+percent',
        pull=[0.05] * len(pie_data),
        textfont_size=12,
        textposition='outside',
        insidetextorientation='radial',
    )])
    
    fig.update_layout(
        autosize=True,
        height=500,
        margin=dict(t=50, b=50, l=70, r=70),
        showlegend=True,
        legend=dict(
            orientation="h",
            yanchor="bottom",
            y=1.07,
            xanchor="center",
            x=0.5,
            font=dict(size=12)
        ),
        paper_bgcolor='rgba(0,0,0,0)',
        plot_bgcolor='rgba(0,0,0,0)'
    )
    
    total_spent_formatted = f"₹ {pie_data['debit_inr'].sum():,.0f}"
    fig.add_annotation(
        text=f"Total Spent: {total_spent_formatted}",
        x=0.5, y=0.5,
        showarrow=False,
        font=dict(size=20, color='#2C3E50')
    )
    
    st.plotly_chart(fig, use_container_width=True)

# ================== END PIE CHART SECTION ==================

# COMPLETELY REWRITTEN: Simple approach that works with RunnableWithMessageHistory
def create_financial_advisor_with_history():
    """Create a financial advisor that works with chat history."""
    
    # Simple function that processes queries with financial context
    def process_query_with_context(inputs):
        """Process the financial query with context and chat history."""
        user_input = inputs.get("user_input", "")
        df = inputs.get("df")  
        summary_df = inputs.get("summary_df")
        prev_summary_df = inputs.get("prev_summary_df")
        
        # Build comprehensive financial context
        context_parts = []
        
        if summary_df is not None and not summary_df.empty:
            context_parts.append("CURRENT MONTH SPENDING SUMMARY:")
            context_parts.append(summary_df.to_string())
        
        if prev_summary_df is not None and not prev_summary_df.empty:
            context_parts.append("\nPREVIOUS MONTH SPENDING SUMMARY:")
            context_parts.append(prev_summary_df.to_string())
        
        if df is not None and not df.empty:
            context_parts.append("\nTRANSACTIONS DATA:")
            context_parts.append(df[['date', 'description', 'category', 'debit_inr', 'credit_inr']].to_string())
        
        financial_context = "\n".join(context_parts)
        
        # Create the enhanced prompt with financial context
        enhanced_prompt = f"""Based on my financial data below, please answer this question: {user_input}

FINANCIAL DATA:
{financial_context}

Please provide a helpful response based on this financial information. If asked about specific spending amounts or transactions, search through the data carefully and provide exact figures."""
        
        return enhanced_prompt
    
    # Create a simple prompt template
    prompt = ChatPromptTemplate.from_messages([
        ("system", "You are a helpful financial assistant. Use the provided financial data to answer questions accurately."),
        MessagesPlaceholder(variable_name="chat_history"),
        ("human", "{input}")
    ])
    
    # Create the runnable chain
    def financial_chain(inputs):
        # Get the enhanced prompt
        enhanced_input = process_query_with_context(inputs)
        
        # Create the message for the model
        messages = [
            {"role": "system", "content": "You are a helpful financial assistant. Use the provided financial data to answer questions accurately."},
            {"role": "user", "content": enhanced_input}
        ]
        
        # Get response from model
        response = model.invoke(messages)
        return response.content
    
    # Return a simple runnable
    return RunnableLambda(financial_chain)

def answer_user_internal(
    question: str, 
    df: pd.DataFrame, 
    summary_df: pd.DataFrame, 
    prev_summary_df: pd.DataFrame = None
):
    """Internal function to process user queries without chat history."""
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
            st.error(f"Error fetching IPO alerts: {e}")
            answers.append(("IPO Alerts & Recommendations", "Error fetching IPO alerts."))
    
    # 2. Stock recommendations flow
    if any(kw in question_lower for kw in stock_recommend_keywords):
        try:
            tx_table = df[['date', 'description', 'category', 'debit_inr', 'credit_inr']].to_string(index=False)
            fin_sum = build_finance_summary(summary_df)
            stock_rec = main_stock_recommendations_flow(tx_table, fin_sum)
            answers.append(("Stock Recommendations", stock_rec))
        except Exception as e:
            st.error(f"Error fetching stock recommendations: {e}")
            answers.append(("Stock Recommendations", "Error fetching stock recommendations."))
    
    # 3. News/investment flow
    if any(kw in question_lower for kw in news_keywords):
        try:
            tx_table = df[['date', 'description', 'category', 'debit_inr', 'credit_inr']].to_string(index=False)
            fin_sum = build_finance_summary(summary_df)
            invest_advice = news_agents_main(tx_table, fin_sum)
            answers.append(("Investment Suggestions", invest_advice))
        except Exception as e:
            st.error(f"Error generating investment suggestions: {e}")
            answers.append(("Investment Suggestions", "Error generating investment suggestions."))
    
    # 4. Enhanced fallback for other queries (including transaction-specific queries)
    if not answers:
        is_tx_query = any(kw in question_lower for kw in transaction_keywords)
        
        summary_ctx = build_finance_summary(summary_df)
        
        # ✅ Append previous month data if available
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
        
        try:
            resp = model.invoke([
                {"role": "system", "content": "You are a helpful financial assistant."},
                {"role": "user", "content": prompt}
            ])
            return resp.content.strip()
        except Exception as e:
            st.error(f"Error calling language model: {e}")
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

def answer_user(inputs):
    """Wrapper function for the chain that handles the input format."""
    user_input = inputs.get("user_input", "")
    df = inputs.get("df")
    summary_df = inputs.get("summary_df")
    prev_summary_df = inputs.get("prev_summary_df")
    
    # Get the response using existing logic
    response = answer_user_internal(user_input, df, summary_df, prev_summary_df)
    
    # Format for chat history - return the response content
    return response

def main():
    st.set_page_config(page_title="Financial Advisor", layout="wide")
    st.title("💼 Financial Advisor Dashboard")
    
    df, summary = load_data()
    
    col_left, col_right = st.columns([3, 1])
    
    with col_left:
        st.subheader("🔍 Ask Your Advisor")
        user_q = st.text_input("Type your question here:")
        
        if user_q:
            with st.spinner("Processing..."):
                st.markdown(answer_user_internal(user_q, df, summary))
        
        st.markdown("---")
        
        # Transactions table inside a collapsed expander for tidiness
        with st.expander("📊 Categorized Transactions", expanded=False):
            st.dataframe(df[['date', 'description', 'category', 'debit_inr', 'credit_inr']])
    
    with col_right:
        # Add a vertical spacer: adjust px to suit (lower=larger px)
        st.markdown('<div style="margin-top: 150px;"></div>', unsafe_allow_html=True)
        
        st.markdown("### 🥧 Spending Breakdown")
        show_3d_pie_chart(df)

if __name__ == "__main__":
    main()