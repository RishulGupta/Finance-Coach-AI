from crewai import Task
from datetime import datetime

class AINewsTasks:
    def fetch_news_tasks(self, agent):
        return Task(
            description=(
                f'Fetch latest top news in the investment/Indian finance space in the '
                f'last 24 hours. The current time is {datetime.now()}'
            ),
            agent=agent,
            expected_output=(
                'A list of top news in the Indian finance space - title, URLs, brief summary '
                'for each from last 24 hours. Example output:\n\n'
                '{"title": "News Article Title",\n'
                '"url": "https://www.example.com",\n'
                '"summary": "Summary of the post"}\n\n'
            )
        )

    def analyze_news_task(self, agent, context):
        return Task(
            description='Analyze each news article to help deciding the investment decision.',
            agent=agent,
            context=context,
            expected_output=(
                'Analysis of each news article in a well formatted manner.\n'
                'Expected output:\nAnalysis of the subject\n'
            )
        )
        
    def fetch_ipo_data(self, agent):
        return Task(
            description='Fetch latest IPO and GMP updates from financial news.',
            agent=agent,
            expected_output='List of IPOs with GMP and demand analysis',
        )

    def analyze_ipo_data(self, agent, context):
        return Task(
            description='Analyze IPO data and generate investment notes.',
            agent=agent,
            context=context,
            expected_output='Insights and recommendations on IPOs',
        )
    
    def fetch_stock_recommendations(self, agent):
        task = Task(
            description='Fetch latest stock data and news relevant for recommendations.',
            agent=agent,
            expected_output='Raw stock information and relevant news',
        )
        print(f"[DEBUG] Created task: fetch_stock_recommendations for agent {agent.role}")
        print(f"[DEBUG] Task description: {task.description}")
        return task

    def analyze_stock_recommendations(self, agent, context):
        prompt = (
            "Based on the user's financial data and transaction history, create a detailed, actionable investment allocation plan. "
            "Allocate specific amounts (in INR or as a percentage of the user's investable surplus) to at least three distinct investment options such as stocks, IPOs, or mutual funds. "
            "For each investment option, provide a brief but clear reason supporting the recommendation. "
            "DO NOT provide vague or generic advice; be concrete and specific.\n\n"
            "Present your answer as a markdown table with columns: Investment Option | Recommended Amount | Reason.\n\n"
            "Example format:\n"
            "| Investment Option       | Recommended Amount (INR or %) | Reason                                   |\n"
            "|------------------------|-------------------------------|-----------------------------------------|\n"
            "| TCS (Stock)            | ₹150,000                      | Leading IT exporter with strong growth. |\n"
            "| Tata Motors IPO        | ₹50,000                       | High demand in the GMP market.           |\n"
            "| SBI Bluechip Mutual Fund| ₹100,000                     | Diversification and stability.          |\n\n"
            "Answer concisely and clearly."
        )

        task = Task(
            description=prompt,
            agent=agent,
            context=context,
            expected_output='Structured markdown table with detailed investment allocations and reasons.',
        )
        print(f"[DEBUG] Created task: analyze_stock_recommendations for agent {agent.role}")
        print(f"[DEBUG] Task description:\n{task.description}")
        print(f"[DEBUG] Context passed to task: {context}")
        return task
