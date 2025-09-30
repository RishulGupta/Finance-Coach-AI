import json
import os
import requests
from crewai.tools import tool
from dotenv import load_dotenv

load_dotenv()

class SearchTool:
    @staticmethod
    @tool("Search internet")
    def search_internet(query: str) -> str:
        """Search internet for the given query"""
        print("searching internet...")
        top_result_to_return = 5
        url = "https://google.serper.dev/search"
        payload = json.dumps({
            "q": query,
            "num": top_result_to_return,
            "tbm": "nws"
        })
        headers = {
            'X-API-KEY': os.environ.get('SERPER_API_KEY', ''),
            'content-type': 'application/json'
        }
        response = requests.post(url, headers=headers, data=payload)
        if not response.ok:
            return f"Error from search API: {response.status_code}"
        json_response = response.json()
        if 'organic' not in json_response:
            return "Sorry, couldn't find anything."
        results = json_response['organic']
        string = []
        print('Results: ', results[:top_result_to_return])
        for result in results[:top_result_to_return]:
            try:
                date = result.get('date', 'date not found')
                snippet = result.get('snippet', '')
                string.append('\n'.join([
                    f"Title: {result['title']}",
                    f"Link: {result['link']}",
                    f"Date: {date}",
                    f"Snippet: {snippet}",
                    "\n--------------"
                ]))
            except KeyError:
                continue
        return '\n'.join(string)
