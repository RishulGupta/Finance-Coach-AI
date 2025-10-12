import os
from dotenv import load_dotenv
from crewai import Crew, Process
from crewagent.agent import FinNewsAgent
from crewagent.task import AINewsTasks
from crewagent.agent import StockRecommendationAgent
from openai import OpenAI
from crewagent.agent import IPOAlertsAgent
import re
from langchain_openai import ChatOpenAI


load_dotenv()

OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")
if not OPENAI_API_KEY:
    raise RuntimeError("OPENAI_API_KEY not set in environment")

# OpenAI client instance, needed for direct API calls
client = OpenAI(api_key=OPENAI_API_KEY)

# A single, correctly configured LLM for all agents and direct calls
agent_llm = ChatOpenAI(
    model="gpt-4o-mini",
    temperature=0,
    openai_api_key=OPENAI_API_KEY
)

def extract_compiler_output(results):
    if isinstance(results, dict):
        res_list = results.get("results") or results.get("children") or []
        for res in res_list:
            output = extract_compiler_output(res)
            if output:
                return output
    elif isinstance(results, list):
        for item in results:
            output = extract_compiler_output(item)
            if output:
                return output
    return str(results) if results else "No output could be extracted."

def main_ipo_alerts_flow():
    print("[DEBUG] Starting main_ipo_alerts_flow")
    agents = IPOAlertsAgent()
    tasks = AINewsTasks()
    ipo_fetcher = agents.ipo_fetcher_agent()
    ipo_analyser = agents.ipo_analyser_agent()
    fetch_ipo_task = tasks.fetch_ipo_data(ipo_fetcher)
    analyze_ipo_task = tasks.analyze_ipo_data(ipo_analyser, context=[fetch_ipo_task])
    crew = Crew(
        agents=[ipo_fetcher, ipo_analyser],
        tasks=[fetch_ipo_task, analyze_ipo_task],
        process=Process.hierarchical,
        manager_llm=agent_llm,
        llm=agent_llm
    )
    results = crew.kickoff()
    print(f"[DEBUG] Raw IPO results preview: {str(results)[:300]}")
    return str(results)

def calculate_investable_surplus(transactions_table_str, finance_summary_str):
    print("[DEBUG] Calculating investable surplus.")
    try:
        income_match = re.search(r"total_income\s+([\d,.]+)", finance_summary_str, re.I)
        spent_match = re.search(r"total_spent\s+([\d,.]+)", finance_summary_str, re.I)
        if income_match and spent_match:
            income = float(income_match.group(1).replace(',', ''))
            spent = float(spent_match.group(1).replace(',', ''))
            return max(income - spent, 0)
    except Exception as e:
        print(f"[ERROR] Surplus calculation error: {e}")
    return 0

def main_stock_recommendations_flow(full_transaction_table: str, finance_summary_str: str):
    print("[DEBUG] Starting main_stock_recommendations_flow")
    agents = StockRecommendationAgent()
    tasks = AINewsTasks()
    surplus = calculate_investable_surplus(full_transaction_table, finance_summary_str)
    
    fetch_task = tasks.fetch_stock_recommendations(agents.stock_fetcher_agent())
    analyze_context = [fetch_task, f"User investable surplus: ₹{surplus}"]
    analyze_task = tasks.analyze_stock_recommendations(agents.stock_analyser_agent(), context=analyze_context)

    crew = Crew(
        agents=[agents.stock_fetcher_agent(), agents.stock_analyser_agent()],
        tasks=[fetch_task, analyze_task],
        process=Process.hierarchical,
        manager_llm=agent_llm,
        llm=agent_llm
    )
    results = crew.kickoff()
    print(f"[DEBUG] Raw stock recommendation results preview: {str(results)[:300]}")
    return str(results)

# --- ✅ NEW, DIRECT INVESTMENT ADVICE FUNCTION ---
# This function replaces the old news-fetching crew for a more direct approach.
def generate_direct_investment_advice(full_transaction_table: str, finance_summary_str: str):
    """
    Generates direct, personalized investment advice based solely on the user's financial data.
    """
    print("[DEBUG] Generating direct investment advice based on financial data.")
    
    # Calculate surplus for context
    surplus = calculate_investable_surplus(full_transaction_table, finance_summary_str)
    
    prompt = f"""
You are a friendly and practical financial advisor in India. Your goal is to provide simple, actionable investment advice to a user based on their bank statement.

Analyze the user's financial data below to understand their income, spending habits, and potential savings.

**User's Financial Summary:**
{finance_summary_str}

**User's Recent Transactions (for context):**
{full_transaction_table}

**Calculated Monthly Investable Surplus:** ₹{surplus:,.2f}

Based on this data, provide a personalized investment plan. Be specific and suggest concrete actions. Your advice should cover:
1.  **Emergency Fund:** Recommend an amount to set aside in a liquid, safe account (like a standard savings account or liquid fund).
2.  **High-Yield Savings:** Suggest putting a portion of the surplus into a high-yield savings account for short-to-medium term goals.
3.  **Long-Term Investments:** Recommend 1-2 specific and diversified investment options for long-term growth (e.g., a NIFTY 50 index fund, a specific type of mutual fund).
4.  **Actionable Steps:** Conclude with a clear, step-by-step summary of what the user should do next.

Your tone should be encouraging and easy to understand. Avoid complex jargon. Structure your response with clear headings (e.g., **Step 1: Build Your Emergency Fund**).
"""
    
    messages = [
        {"role": "system", "content": "You are a helpful and practical financial advisor providing simple, actionable advice for a user in India."},
        {"role": "user", "content": prompt}
    ]

    try:
        # Use the globally defined agent_llm
        response = agent_llm.invoke(messages)
        advice = response.content.strip()
        print(f"[DEBUG] Direct investment advice generated: {advice[:300]}...")
        return advice
    except Exception as e:
        print(f"[ERROR] Error generating direct investment advice: {e}")
        return "Sorry, I couldn't generate personalized investment advice at this time."


# --- ✅ Main function now calls the new direct advice generator ---
# This is the function called by your API's "/api/recommendations/investment" endpoint.
def main(full_transaction_table: str, finance_summary: str):
    """
    Main orchestration function: generates direct investment advice based on financial data.
    """
    return generate_direct_investment_advice(full_transaction_table, finance_summary)