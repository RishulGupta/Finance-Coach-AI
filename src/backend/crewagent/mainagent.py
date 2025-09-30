import os
from dotenv import load_dotenv
from crewai import Crew, Process, LLM
from crewagent.agent import FinNewsAgent
from crewagent.task import AINewsTasks
from crewagent.agent import StockRecommendationAgent
from openai import OpenAI
from crewagent.agent import IPOAlertsAgent
import re

load_dotenv()

OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")
if not OPENAI_API_KEY:
    raise RuntimeError("OPENAI_API_KEY not set in environment")

# OpenAI client instance, needed for direct API calls
client = OpenAI(api_key=OPENAI_API_KEY)

# Crew's LLM wrapper for orchestration manager
manager_llm = LLM(
    api_key=OPENAI_API_KEY,
    model="gpt-3.5-turbo",
)

def extract_compiler_output(results):
    """
    Recursively extract output from nested Crew kickoff result structure.
    Includes debug logs to trace the structure of results.
    """
    # DEBUG print full structure - comment this out if output too large
    # print(f"[DEBUG] extract_compiler_output received results:\n{results}")

    if isinstance(results, dict):
        res_list = results.get("results") or results.get("children") or []
        print(f"[DEBUG] extract_compiler_output found {len(res_list)} results/children in dict")
        for res in res_list:
            agent_name = res.get("agent", "").lower()
            print(f"[DEBUG] Found agent in extract_compiler_output: '{agent_name}'")
            if "newscompiler" in agent_name:
                out = res.get("output") or res.get("result") or str(res)
                print(f"[DEBUG] NewsCompiler output snippet: {out[:200]}...")
                return out
            output = extract_compiler_output(res)
            if output:
                return output
        # fallback to root output keys if no children found that match
        if "output" in results:
            print(f"[DEBUG] Returning fallback output from root 'output' key")
            return results["output"]
        if "result" in results:
            print(f"[DEBUG] Returning fallback output from root 'result' key")
            return results["result"]
    elif isinstance(results, list):
        print(f"[DEBUG] extract_compiler_output processing list of length {len(results)}")
        for item in results:
            output = extract_compiler_output(item)
            if output:
                return output
    print("[DEBUG] extract_compiler_output found no suitable output")
    return None

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
        manager_llm=manager_llm,
    )
    results = crew.kickoff()
    print("[DEBUG] Completed Crew kickoff for IPO alerts")
    print(f"[DEBUG] Raw IPO results preview: {str(results)[:300]}")

    ipo_summary = extract_compiler_output(results)
    if ipo_summary is None:
        print("[ERROR] IPO summary extraction failed; returning fallback")
        ipo_summary = "Could not generate IPO summary."
    else:
        print(f"[DEBUG] Extracted IPO Summary: {ipo_summary[:300]}...")
    return ipo_summary

def summarize_news(news_summary: str):
    """
    Summarize the news articles into 2-3 concise bullet points using OpenAI GPT-3.5.
    """
    print(f"[DEBUG] Summarizing news; input length={len(news_summary)} chars")
    prompt = f"""
Summarize these news items in 2-3 concise bullet points capturing the most important investment-related information. Be brief.

News articles:
{news_summary}
"""
    messages = [
        {"role": "system", "content": "You are a financial news summarizer."},
        {"role": "user", "content": prompt}
    ]

    try:
        response = client.chat.completions.create(
            model="gpt-3.5-turbo",
            messages=messages,
            max_tokens=256,
            temperature=0.5,
        )
        summary = response.choices[0].message.content.strip()
        print(f"[DEBUG] News summary generated: {summary[:300]}...")
        return summary
    except Exception as e:
        print(f"[ERROR] Error summarizing news: {e}")
        return "Could not summarize news at this time."
    
def calculate_investable_surplus_from_df(summary_df):
    if 'total_income' in summary_df.columns and 'total_spent' in summary_df.columns:
        income = summary_df['total_income'].sum()
        expenses = summary_df['total_spent'].sum()
        surplus = max(income - expenses, 0)
        print(f"[DEBUG] Calculated surplus: Income={income}, Expenses={expenses}, Surplus={surplus}")
        return surplus
    print("[DEBUG] Cannot find total_income or total_spent columns in summary dataframe.")
    return 0

def calculate_investable_surplus(transactions_table_str, finance_summary_str):
    """
    Calculate investable surplus from financial summary by parsing income and expenses.
    """
    print("[DEBUG] Calculating investable surplus from finance summary.")
    income_matches = re.findall(r"total_income.*?:\s*([\d,.]+)", finance_summary_str, flags=re.I)
    spent_matches = re.findall(r"total_spent.*?:\s*([\d,.]+)", finance_summary_str, flags=re.I)
  
    print(f"[DEBUG] Income regex matches: {income_matches}")
    print(f"[DEBUG] Spent regex matches: {spent_matches}")

    if income_matches and spent_matches:
        try:
            income = sum(float(x.replace(',', '')) for x in income_matches)
            spent = sum(float(x.replace(',', '')) for x in spent_matches)
            surplus = max(income - spent, 0)
            print(f"[DEBUG] Computed surplus: Income={income}, Spent={spent}, Surplus={surplus}")
            return surplus
        except Exception as e:
            print(f"[ERROR] Surplus calculation error: {e}")
            return 0
    else:
        print("[DEBUG] Insufficient data to calculate surplus, defaulting to 0")
    return 0

def main_stock_recommendations_flow(full_transaction_table: str, summary_df):
    print("[DEBUG] Starting main_stock_recommendations_flow")
    agents = StockRecommendationAgent()
    tasks = AINewsTasks()

    surplus = calculate_investable_surplus_from_df(summary_df)
    print(f"[DEBUG] Passing investable surplus to analyze context: ₹{surplus}")

    fetch_task = tasks.fetch_stock_recommendations(agents.stock_fetcher_agent())
    analyze_context = [fetch_task, f"User investable surplus: ₹{surplus}"]

    analyze_task = tasks.analyze_stock_recommendations(agents.stock_analyser_agent(), context=analyze_context)

    crew = Crew(
        agents=[agents.stock_fetcher_agent(), agents.stock_analyser_agent()],
        tasks=[fetch_task, analyze_task],
        process=Process.hierarchical,
        manager_llm=manager_llm,
    )

    results = crew.kickoff()
    print("[DEBUG] Completed Crew kickoff for stock recommendations")
    print(f"[DEBUG] Raw stock recommendation results preview: {str(results)[:300]}")

    stock_rec = extract_compiler_output(results)
    if stock_rec is None:
        print("[ERROR] Stock recommendation extraction failed; returning fallback")
        stock_rec = "Could not generate detailed stock recommendations."
    else:
        print(f"[DEBUG] Extracted stock recommendations:\n{stock_rec[:800]}...")
    return stock_rec


def generate_investment_advice(full_table: str, finance_summary: str, summarized_news: str):
    """
    Generate personalized investment suggestions with specific allocations
    """
    print("[DEBUG] Generating investment advice.")
    
    # Calculate surplus for context
    surplus = calculate_investable_surplus(full_table, finance_summary)
    
    prompt = f"""
You are an expert financial advisor. Based on the user's financial data, create a detailed investment allocation plan.

User's recent transactions:
{full_table}

User's spending summary:
{finance_summary}

User's investable surplus: ₹{surplus}

Latest financial news:
{summarized_news}

IMPORTANT: Create a specific investment allocation plan with exact amounts. Allocate the user's surplus across at least 3 investment options.

Format your response as a markdown table:

| Investment Option | Recommended Amount (INR) | Reason |
|------------------|-------------------------|--------|
| [Stock/Fund Name] | ₹[Amount] | [Brief reason] |
| [Stock/Fund Name] | ₹[Amount] | [Brief reason] |
| [Stock/Fund Name] | ₹[Amount] | [Brief reason] |

Do NOT give generic advice. Provide specific stock names, IPO names, or mutual fund names with exact rupee amounts to invest.
"""
    
    messages = [
        {"role": "system", "content": "You are a financial advisor who provides specific, actionable investment allocations with exact amounts."},
        {"role": "user", "content": prompt}
    ]

    try:
        response = client.chat.completions.create(
            model="gpt-3.5-turbo",
            messages=messages,
            max_tokens=500,  # Increased for detailed output
            temperature=0.7,
        )
        advice = response.choices[0].message.content.strip()
        print(f"[DEBUG] Investment advice generated: {advice[:300]}...")
        return advice
    except Exception as e:
        print(f"[ERROR] Error generating investment advice: {e}")
        return "Sorry, I couldn't generate investment advice at this time."


def main(full_transaction_table: str, finance_summary: str):
    """
    Main orchestration function: fetch, analyze news; summarize; then generate investment advice.
    """
    print("[DEBUG] Starting main orchestration function")

    agents = FinNewsAgent()
    tasks = AINewsTasks()

    news_fetcher_agent = agents.news_fetcher_agent()
    news_analyser_agent = agents.news_analyser_agent()
    news_compiler_agent = agents.news_compiler_agent()

    fetch_news_task = tasks.fetch_news_tasks(news_fetcher_agent)
    analyze_news_task = tasks.analyze_news_task(news_analyser_agent, [fetch_news_task])

    crew = Crew(
        agents=[news_fetcher_agent, news_analyser_agent, news_compiler_agent],
        tasks=[fetch_news_task, analyze_news_task],
        process=Process.hierarchical,
        manager_llm=manager_llm,  # Required for hierarchical orchestration
    )

    results = crew.kickoff()
    print("[DEBUG] Completed Crew kickoff for financial news")
    print(f"[DEBUG] Raw news results preview: {str(results)[:300]}")

    news_summary_raw = extract_compiler_output(results)
    if news_summary_raw is None:
        print("[ERROR] Failed to extract news summary.")
        news_summary_raw = "No news summary available."

    print(f"[DEBUG] Extracted news summary (raw snippet): {news_summary_raw[:500]}")

    news_summary_short = summarize_news(news_summary_raw)

    # Generate final investment suggestions combining financial data and summarized news
    investment_suggestions = generate_investment_advice(
        full_table=full_transaction_table,
        finance_summary=finance_summary,
        summarized_news=news_summary_short,
    )

    print("[DEBUG] Final investment suggestions generated.")
    return investment_suggestions


if __name__ == "__main__":
    # Example usage, replace with your actual data inputs

    sample_table = """DATE | DESCRIPTION | CATEGORY | DEBIT | CREDIT
2024-07-20 | Amazon | Shopping | 500 | 0
2024-07-21 | Electricity Bill | Utilities | 1500 | 0
2024-07-22 | Salary | Income | 0 | 50000
"""

    sample_summary = """
month category total_spent total_income transactions_count
2024-07 Shopping 500 0 1
2024-07 Utilities 1500 0 1
2024-07 Income 0 50000 1
"""

    print("[DEBUG] Running main() with sample data")
    advice = main(sample_table, sample_summary)
    print("\n[RESULT] Investment Suggestions:\n", advice)
