from crewai import Agent
from crewagent.method.search_method import SearchTool

class FinNewsAgent:

    def news_fetcher_agent(self):
        agent = Agent(
            role='NewsFetcher',
            goal='Fetch latest news in Indian financial space',
            backstory=(
                'You are a passionate and skilled financial/investment analyst. '
                'Find latest relevant articles to help make investment decisions.'
            ),
            tools=[SearchTool.search_internet], 
            verbose=True,
            allow_delegation=True,
            max_iter=5
        )
        print(f"[DEBUG] Created agent: {agent.role}")
        return agent

    def news_analyser_agent(self):
        agent = Agent(
            role='NewsAnalyzer',
            goal='Analyze the news articles and create a conclusion summary on the subject.',
            backstory=(
                'You are a skilled investor who understands market movements and sentiments. '
                'Based on the article, have a conclusion about the subject.'
            ),
            tools=[SearchTool.search_internet],
            verbose=True,
            allow_delegation=True
        )
        print(f"[DEBUG] Created agent: {agent.role}")
        return agent

    def news_compiler_agent(self):
        agent = Agent(
            role='NewsCompiler',
            goal='Compile the analyzed news articles to have a final conclusion on the subject.',
            backstory=(
                'Give a final verdict to the compiled news articles on the subject. '
                'The final conclusion you give will be used for investment decision.'
            ),
            verbose=True
        )
        print(f"[DEBUG] Created agent: {agent.role}")
        return agent

class IPOAlertsAgent:

    def ipo_fetcher_agent(self):
        agent = Agent(
            role='IPOFetcher',
            goal='Fetch latest IPO details and GMP updates',
            backstory='You are a financial analyst specialized in IPO market data.',
            tools=[SearchTool.search_internet],
            verbose=True,
            allow_delegation=True,
            max_iter=3,
        )
        print(f"[DEBUG] Created agent: {agent.role}")
        return agent

    def ipo_analyser_agent(self):
        agent = Agent(
            role='IPOAnalyzer',
            goal=(
                'Analyze IPO data and GMP trends and prepare alerts. '
                'Provide actionable IPO investment advice with allocation amounts.'
            ),
            backstory='Provide valuable insights and investment advice on IPOs.',
            tools=[],
            verbose=True,
            allow_delegation=False,
        )
        print(f"[DEBUG] Created agent: {agent.role}")
        return agent

class StockRecommendationAgent:
    def stock_fetcher_agent(self):
        agent = Agent(
            role='StockFetcher',
            goal='Fetch latest stock market data and news relevant for recommendations.',
            backstory='You are an expert financial analyst specializing in stock market data.',
            tools=[SearchTool.search_internet],
            verbose=True,
            allow_delegation=True,
            max_iter=3,
        )
        print(f"[DEBUG] Created agent: {agent.role}")
        return agent

    def stock_analyser_agent(self):
        agent = Agent(
            role='StockAnalyzer',
            goal=(
                'Analyze stock data and user portfolio to generate personalized stock recommendations. '
                'Return a detailed allocation table with investment options, amounts (INR or %), '
                'and concise reasons for each.'
            ),
            backstory=(
                'You are an expert financial analyst and advisor. Generate clear, specific investment allocations '
                'to stocks, IPOs, or mutual funds. Provide your response as a markdown table.'
            ),
            tools=[],
            verbose=True,
            allow_delegation=False,
        )
        print(f"[DEBUG] Created agent: {agent.role}")
        return agent
