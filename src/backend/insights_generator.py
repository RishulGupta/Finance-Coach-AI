# insights_generator.py

import os
import pandas as pd
from dotenv import load_dotenv
# Pydantic is used for defining the data structure
from pydantic import BaseModel, Field
from typing import List
# LangChain components for interacting with the AI model
from langchain_openai import ChatOpenAI
from langchain_core.prompts import ChatPromptTemplate
from langchain_core.output_parsers import JsonOutputParser
from fastapi import HTTPException

# Load environment variables from .env file
load_dotenv()

# --- Initialize OpenAI Model ---
# This setup assumes your OPENAI_API_KEY is in your .env file
openai_api_key = os.getenv("OPENAI_API_KEY")
if not openai_api_key:
    raise ValueError("OPENAI_API_KEY not found in .env file. Please add it.")
# We initialize the model once here so it can be reused
model = ChatOpenAI(model="gpt-4o-mini", openai_api_key=openai_api_key, temperature=0)


# --- Pydantic Models for a Structured JSON Output ---
# These models ensure the AI's response is in a predictable format that the frontend can use.

class SpendingInsight(BaseModel):
    id: str = Field(description="A unique identifier for the insight, e.g., '1'")
    category: str = Field(description="The spending category, e.g., 'Food & Dining'")
    currentSpend: float = Field(description="Total amount spent in this category for the current month")
    avgSpend: float = Field(description="Total amount spent in this category for the previous month")
    trend: str = Field(description="The spending trend: 'up', 'down', or 'stable'")
    percentage: float = Field(description="The percentage change from the previous month")
    recommendation: str = Field(description="A brief, actionable recommendation for the user")
    severity: str = Field(description="The severity level: 'info', 'warning', or 'critical'")

class BudgetRecommendation(BaseModel):
    id: str = Field(description="A unique identifier for the recommendation, e.g., '1'")
    category: str = Field(description="The spending category")
    currentBudget: float = Field(description="The current spending in this category")
    recommendedBudget: float = Field(description="The AI-recommended budget for this category")
    reason: str = Field(description="A brief explanation for the recommendation")
    savings: float = Field(description="The potential monthly savings if the recommendation is followed")
    priority: str = Field(description="The priority of this recommendation: 'high', 'medium', or 'low'")

class InvestmentTip(BaseModel):
    id: str = Field(description="A unique identifier for the tip, e.g., '1'")
    title: str = Field(description="A catchy title for the investment tip")
    description: str = Field(description="A brief description of the investment idea")
    category: str = Field(description="The type of investment: 'stocks', 'bonds', 'crypto', 'savings', 'real-estate'")
    riskLevel: str = Field(description="The risk level: 'low', 'medium', or 'high'")
    expectedReturn: str = Field(description="The potential return, e.g., '8-12% annually'")
    timeHorizon: str = Field(description="The recommended time horizon, e.g., '5+ years'")
    priority: int = Field(description="A number indicating the priority of the tip, e.g., 1")

class FinancialInsights(BaseModel):
    """The main model that holds all three types of insights."""
    spendingAnalysis: List[SpendingInsight]
    budgetRecommendations: List[BudgetRecommendation]
    investmentTips: List[InvestmentTip]


# --- Core AI Insight Generation Logic ---
async def generate_financial_insights(tx_df: pd.DataFrame, sum_df: pd.DataFrame, prev_sum_df: pd.DataFrame) -> FinancialInsights:
    """
    Generates financial insights by calling an AI model with structured data.
    """
    parser = JsonOutputParser(pydantic_object=FinancialInsights)

    # Convert pandas DataFrames to a string format for the AI prompt
    current_summary_str = sum_df.to_string(index=False)
    prev_summary_str = prev_sum_df.to_string(index=False) if prev_sum_df is not None and not prev_sum_df.empty else "No data for the previous month is available."
    
    # Select the most important transactions to include in the context to avoid exceeding token limits
    top_transactions_str = tx_df.sort_values(by='debit_inr', ascending=False).head(25).to_string(index=False)

    # This prompt template guides the AI to produce the desired JSON output
    prompt_template = """
    You are an expert financial analyst AI. Your task is to analyze a user's monthly financial data and provide actionable insights in a structured JSON format.

    Analyze the provided data which includes the current month's spending summary, the previous month's summary for comparison, and a list of the top transactions for the current month.

    Generate a complete JSON object with three keys: "spendingAnalysis", "budgetRecommendations", and "investmentTips".
    - For "spendingAnalysis", compare current vs. previous month's spending for major categories. Identify significant trends.
    - For "budgetRecommendations", suggest realistic budget adjustments to help the user save money.
    - For "investmentTips", provide 3 diverse investment ideas suitable for someone with these spending and income patterns.

    FINANCIAL DATA:
    ---
    Current Month Spending Summary:
    {current_summary}
    ---
    Previous Month Spending Summary:
    {previous_summary}
    ---
    Current Month Top Transactions:
    {top_transactions}
    ---

    {format_instructions}
    """
    
    prompt = ChatPromptTemplate.from_template(
        template=prompt_template,
        partial_variables={"format_instructions": parser.get_format_instructions()}
    )

    # The "chain" links the prompt, the AI model, and the JSON parser together
    chain = prompt | model | parser
    
    try:
        # Asynchronously call the AI model
        insights = await chain.ainvoke({
            "current_summary": current_summary_str,
            "previous_summary": prev_summary_str,
            "top_transactions": top_transactions_str
        })
        return insights
    except Exception as e:
        print(f"[ERROR] AI insight generation failed: {e}")
        # Raise an exception that FastAPI can handle and show to the user
        raise HTTPException(status_code=500, detail="Failed to generate AI insights.")