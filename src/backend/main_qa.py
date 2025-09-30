import streamlit as st
import pandas as pd
from datetime import datetime
from upload_and_process import process_and_upload
from firebase_helper import FirebaseManager
from chatqa2 import answer_user_internal, show_3d_pie_chart, get_session_history, store
import io
import tempfile
from dateutil.relativedelta import relativedelta
from langchain_community.chat_message_histories import ChatMessageHistory
from langchain_core.chat_history import BaseChatMessageHistory
from langchain_groq import ChatGroq
import os
from dotenv import load_dotenv

load_dotenv()

GROQ_API_KEY = os.getenv("GROQ_API_KEY")
if not GROQ_API_KEY:
    st.error("GROQ_API_KEY not found. Please set it in .env")
    st.stop()

model = ChatGroq(model="llama-3.3-70b-versatile", groq_api_key=GROQ_API_KEY)

USER_ID = "demo_user"  # Replace with auth logic

def load_data_from_firebase(user_id, year, month):
    """
    Load data from Firebase Storage (CSV files) and metadata from Realtime Database
    """
    data = FirebaseManager.load(user_id, year, month)
    if data is None:
        return None, None, None
    
    tx_df, sum_df, meta = data
    return tx_df, sum_df, meta

def get_csv_download_data(user_id, year, month, file_type):
    """
    Get CSV data for download button from Firebase Storage
    """
    try:
        if file_type == "categorized":
            df = FirebaseManager._download_csv(user_id, year, month, "categorized_transactions")
        elif file_type == "summary":
            df = FirebaseManager._download_csv(user_id, year, month, "spending_summary")
        else:
            return None
        
        if df is not None:
            csv_string = df.to_csv(index=False)
            return csv_string
        return None
    except Exception as e:
        print(f"[ERROR] Failed to get CSV download data: {e}")
        return None

def load_previous_month_summary(user_id, year, month):
    """Load previous month's summary_df from Firebase."""
    prev_date = datetime(year, month, 1) - relativedelta(months=1)
    prev_year, prev_month = prev_date.year, prev_date.month
    
    if not FirebaseManager.exists(user_id, prev_year, prev_month):
        return None, prev_year, prev_month
    
    _, sum_df_prev, _ = load_data_from_firebase(user_id, prev_year, prev_month)
    return sum_df_prev, prev_year, prev_month

def compare_summaries(curr_df, prev_df):
    if curr_df is None or prev_df is None or curr_df.empty or prev_df.empty:
        return pd.DataFrame()
    
    merged = pd.merge(
        curr_df[['category', 'total_spent']],
        prev_df[['category', 'total_spent']],
        on='category', how='outer', suffixes=('_curr', '_prev')
    ).fillna(0)
    
    merged['diff'] = merged['total_spent_curr'] - merged['total_spent_prev']
    merged['change_%'] = ((merged['diff'] / merged['total_spent_prev'].replace(0, pd.NA)) * 100).fillna(0)
    
    return merged.sort_values(by='diff', ascending=False)

# SIMPLIFIED: Direct chat without complex chains
def process_chat_query(user_input, df, summary_df, prev_summary_df, session_id):
    """Process chat query with simple history management."""
    
    # Get chat history
    chat_history = get_session_history(session_id)
    
    # Build context from financial data
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
    
    # Create messages list with chat history
    messages = [
        {"role": "system", "content": "You are a helpful financial assistant. Use the provided financial data to answer questions accurately. When users ask about specific transactions or spending amounts, search through the data carefully and provide exact amounts and details."}
    ]
    
    # Add chat history
    for message in chat_history.messages:
        if hasattr(message, 'content'):
            if message.type == "human":
                messages.append({"role": "user", "content": message.content})
            elif message.type == "ai":
                messages.append({"role": "assistant", "content": message.content})
    
    # Add current query with financial context
    enhanced_input = f"""Based on my financial data below, please answer this question: {user_input}

FINANCIAL DATA:
{financial_context}

Please provide a helpful response based on this financial information. If asked about specific spending amounts or transactions, provide exact figures from the data."""
    
    messages.append({"role": "user", "content": enhanced_input})
    
    try:
        # Get response from model
        response = model.invoke(messages)
        result = response.content
        
        # Add to chat history
        chat_history.add_user_message(user_input)
        chat_history.add_ai_message(result)
        
        return result
        
    except Exception as e:
        error_msg = f"Sorry, I encountered an error: {str(e)}"
        return error_msg

def app():
    st.set_page_config(page_title="Financial Advisor QA", layout="wide")
    st.title("💬 Financial Advisor Chatbot")

    if "messages" not in st.session_state:
        st.session_state.messages = []
    if "last_period" not in st.session_state:
        st.session_state.last_period = None

    # Year and Month selectors
    col1, col2, col3 = st.columns([1, 1, 3])
    with col1:
        year = st.selectbox("Select Year", list(range(2020, 2026)), index=4)
    with col2:
        month = st.selectbox("Select Month", list(range(1, 13)), index=datetime.now().month - 1)

    prev_months = FirebaseManager.list_months(USER_ID)
    prev_month_strings = [f"{y}-{m:02d}" for y, m in prev_months]
    with col3:
        selected_previous = st.selectbox("Or Select Previously Uploaded Month", ["--"] + prev_month_strings)
        if selected_previous != "--":
            year, month = map(int, selected_previous.split("-"))

    current_period = f"{year}_{month}"
    if st.session_state.last_period != current_period:
        # Clear chat history in store if exists
        if st.session_state.last_period and st.session_state.last_period in store:
            store[st.session_state.last_period].clear()
        # Clear session state messages
        st.session_state.messages = []
        st.session_state.last_period = current_period

    st.markdown("---")

    exists = FirebaseManager.exists(USER_ID, year, month)

    tx_df, sum_df, meta, sum_df_prev = None, None, None, None

    if exists:
        with st.spinner("Loading data from Firebase..."):
            tx_df, sum_df, meta = load_data_from_firebase(USER_ID, year, month)
            if tx_df is None or sum_df is None:
                st.error("Failed to load data from Firebase Storage.")
                st.stop()

        st.success(f"Data loaded from Firebase for {month:02d}/{year}.")

        sum_df_prev, prev_year, prev_month = load_previous_month_summary(USER_ID, year, month)

        # Overview section above chatbot
        st.markdown("## 🥧 Spending Breakdown & Summary")
        c1, c2 = st.columns([2, 3])
        with c1:
            if tx_df is not None and not tx_df.empty:
                show_3d_pie_chart(tx_df)
            else:
                st.info("No transaction data to show pie chart.")
        with c2:
            with st.expander("### Spending Summary", expanded=False):
             if sum_df is not None and not sum_df.empty:
                st.dataframe(sum_df, use_container_width=True)
             else:
                st.info("No spending summary available.")

        st.markdown("---")
        with st.expander("### 📊 Categorized Transactions", expanded=False):
         if tx_df is not None and not tx_df.empty:
            st.dataframe(tx_df[['date', 'description', 'category', 'debit_inr', 'credit_inr']], use_container_width=True)
         else:
            st.info("No transactions to display.")

        st.markdown("---")

        # Show metadata metrics in columns
        if meta:
            c1m, c2m, c3m, c4m = st.columns(4)
            with c1m:
                st.metric("Total Transactions", meta.get("rows", 0))
            with c2m:
                st.metric("Total Spent (₹)", f"{meta.get('spent', 0):,.0f}")
            with c3m:
                st.metric("Total Income (₹)", f"{meta.get('income', 0):,.0f}")
            with c4m:
                st.metric("Categories", meta.get("categories", 0))

        # CSV download buttons below metadata
        c1d, c2d = st.columns(2)
        with c1d:
            categorized_csv = get_csv_download_data(USER_ID, year, month, "categorized")
            if categorized_csv:
                st.download_button(
                    "⬇ Download Categorized Transactions CSV",
                    data=categorized_csv,
                    file_name=f"categorized_{year}_{month:02d}.csv",
                    mime="text/csv"
                )
            else:
                st.warning("Categorized CSV not available")
        with c2d:
            summary_csv = get_csv_download_data(USER_ID, year, month, "summary")
            if summary_csv:
                st.download_button(
                    "⬇ Download Spending Summary CSV",
                    data=summary_csv,
                    file_name=f"summary_{year}_{month:02d}.csv",
                    mime="text/csv"
                )
            else:
                st.warning("Summary CSV not available")

        # Previous month comparison
        if sum_df_prev is not None:
            with st.expander(f"### 📊 Comparison with {prev_month:02d}/{prev_year}", expanded=False):
            
             comparison_df = compare_summaries(sum_df, sum_df_prev)
             if not comparison_df.empty:
                st.dataframe(comparison_df, use_container_width=True)
                st.bar_chart(comparison_df.set_index('category')['diff'])
             else:
                st.info("No category differences found.")
        else:
            st.info("No previous month data found for comparison.")

    else:
        st.warning(f"No data found for {month:02d}/{year}. Please upload your statement.")
        upload_file = st.file_uploader("Upload your bank statement file", type=["xls", "xlsx", "csv"])
        if upload_file is not None:
            with st.spinner("Processing file & uploading to Firebase..."):
                tx_df, sum_df = process_and_upload(USER_ID, year, month, upload_file)
                st.success("File processed and uploaded successfully.")
                st.experimental_rerun()
        else:
            st.stop()

    # Chatbot Interface below all summaries
    if exists:
        st.markdown("## 🤖 Ask Your Financial Advisor")
        session_id = f"{USER_ID}_{year}_{month}"
        for message in st.session_state.messages:
            with st.chat_message(message["role"]):
                st.markdown(message["content"])
        if prompt := st.chat_input("Ask a financial question:"):
            st.session_state.messages.append({"role": "user", "content": prompt})
            with st.chat_message("user"):
                st.markdown(prompt)
            with st.chat_message("assistant"):
                with st.spinner("Generating answer..."):
                    try:
                        response = process_chat_query(prompt, tx_df, sum_df, sum_df_prev, session_id)
                        st.markdown(response)
                        st.session_state.messages.append({"role": "assistant", "content": response})
                    except Exception as e:
                        error_msg = f"Sorry, I encountered an error: {str(e)}"
                        st.error(error_msg)
                        st.session_state.messages.append({"role": "assistant", "content": error_msg})

    # Sidebar with manual clear button and metadata
    with st.sidebar:
        st.header("Dashboard Controls")
        if st.button("Clear Chat History"):
            session_id = f"{USER_ID}_{year}_{month}"
            if session_id in store:
                store[session_id].clear()
            st.session_state.messages = []
            st.experimental_rerun()
        st.info("Your data is securely stored in Firebase Storage 🔐")
        if exists and meta:
            st.markdown("### Storage Details")
            st.write(f"**Upload Time:** {meta.get('upload_ts', 'N/A')[:10]}")
            storage_paths = meta.get('storage_paths', {})
            if storage_paths:
                st.markdown("### File Locations")
                for file_type, path in storage_paths.items():
                    st.code(path, language="text")
        st.markdown("---")
        st.markdown("### Available Months")
        if prev_months:
            for y, m in prev_months[:5]:
                st.write(f"📅 {y}-{m:02d}")
        else:
            st.write("No data uploaded yet")
        if st.checkbox("Show Debug Info"):
            st.markdown("### Debug Information")
            st.write(f"**User ID:** {USER_ID}")
            st.write(f"**Selected Period:** {year}-{month:02d}")
            st.write(f"**Data Exists:** {exists}")
            if exists and meta:
                st.json(meta)
            if session_id in store:
                st.write(f"**Chat History Messages:** {len(store[session_id].messages)}")


if __name__ == "__main__":
    app()