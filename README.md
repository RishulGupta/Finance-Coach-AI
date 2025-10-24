# 💰 Finance Coach AI  
Finance Coach AI is an **intelligent, all-in-one financial management platform** that transforms your bank statements into actionable insights.  

It helps you **track expenses, understand spending patterns, chat with an AI financial advisor**, and make **smarter investment and budgeting decisions** — all from one intuitive dashboard.  

Whether you want to analyze your monthly spending, compare habits over time, or receive investment recommendations, **Finance Coach AI** does it all with **clarity, precision, and ease**.  

---
<p align="center">
  <div style="display: flex; flex-direction: column; gap: 10px; align-items: center;">
    <img src="https://github.com/RishulGupta/Finance-Coach-AI/blob/2fd9b9bd42434f63412ddff6d34ea23a0a28940e/Screenshot%202025-10-24%20005818.png" style="width: auto; height: auto; max-width: 100%;" />
    <img src="https://github.com/RishulGupta/Finance-Coach-AI/blob/2fd9b9bd42434f63412ddff6d34ea23a0a28940e/Screenshot%202025-10-24%20005921.png" style="width: auto; height: auto; max-width: 100%;" />
    <img src="https://github.com/RishulGupta/Finance-Coach-AI/blob/2fd9b9bd42434f63412ddff6d34ea23a0a28940e/Screenshot%202025-10-24%20010124.png" style="width: auto; height: auto; max-width: 100%;" />
    <img src="https://github.com/RishulGupta/Finance-Coach-AI/blob/2fd9b9bd42434f63412ddff6d34ea23a0a28940e/Screenshot%202025-10-24%20010151.png" style="width: auto; height: auto; max-width: 100%;" />
  </div>
</p>



## 🌟 Key Features  

### 📤 Upload Center  
- **Effortlessly upload** bank statements in **CSV or Excel** formats.  
- **Automatically parses and classifies** transactions using **AI-driven categorization**.  
- **Securely stores** and syncs data across sessions with **Firebase Firestore**.  

### 📊 Financial Dashboard  
A **visually rich and data-driven dashboard** to understand your financial journey:  
- **Total Income & Spending:** Instant monthly summaries.  
- **Spending Analysis:** Bar and pie charts showing spending distribution.  
- **Category Breakdown:** AI-organized categories (Food, Transport, Subscriptions, etc.).  
- **Multi-Period Comparison:** View spending, income, and transaction trends over time.  
- **Smart KPIs:** Track highest spend, average spend, and category diversity.  

### 🧠 AI Financial Advisor  
A **conversational assistant** that helps you make sense of your money:  
- **Ask in Natural Language:**  
  - *"What did I spend the most on this month?"*  
  - *"Give me investment recommendations."*  
  - *"How does my spending compare to last month?"*  
- **Real-Time Analysis:** Uses your **actual uploaded data** for contextual responses.  
- **Investment Advisory:** **Personalized recommendations** based on your financial habits and goals.  
- **Quick Prompts:** Ready-made templates for instant insights.  

### 📈 Insights Hub  
Dive deeper into your financial behavior with:  
- **Spending Analysis:** Month-over-month expense comparisons by category.  
- **AI Recommendations:** Actionable tips like *"Maintain current spending"* or *"Reduce coffee expenses."*  
- **Budget Planning:** Simple tools for forecasting and goal setting.  
- **Investment Tips:** AI-generated guidance to optimize your portfolio.  

---

## 🧩 Tech Stack  

| Layer | Technology |
|-------|-------------|
| **Frontend** | **React + TypeScript + Shadcn/UI** |
| **Backend** | **FastAPI (Python 3.8+)** |
| **Database** | **Firebase Firestore** |
| **AI Layer** | **OpenAI + CrewAI Agents** |
| **Design** | **Fully responsive dark UI** for a premium user experience |

---

## 🚀 Quick Start  

### 1️⃣ Clone Repository  
```bash
git clone <https://github.com/RishulGupta/Finance-Coach-AI.git>
```

### 2️⃣ Frontend Setup  
```bash
cd src
npm install
cp .env.example .env.local
```

**Configure environment variables** in `.env.local`:  
```bash
VITE_API_BASE_URL=http://localhost:8000
VITE_FIREBASE_CONFIG=your_firebase_config
```

### 3️⃣ Backend Setup  
```bash
cd src/backend
python -m venv venv
source venv/bin/activate       # Windows: venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env
```

**Example `.env` file** for backend:
```bash
OPENAI_API_KEY=your_openai_key
CREWAI_API_KEY=your_crewai_key
FIREBASE_PROJECT_ID=your_project_id
DEBUG=True
```

### 4️⃣ Run Application  
**Start Backend:**  
```bash
cd src/backend
uvicorn app:app --reload --port 8000
```

**Start Frontend:**  
```bash
npm run dev
```
**App runs at:** [http://localhost:5173](http://localhost:5173)

---

## 🔌 API Overview  

| Endpoint | Description |
|-----------|-------------|
| **POST /api/upload** | **Upload financial statements** |
| **GET /api/data/{year}/{month}** | **Retrieve monthly analytics** |
| **GET /api/insights/{year}/{month}** | **Fetch AI-generated insights** |
| **POST /api/chat** | **Query the AI-based financial advisor** |

---

## 🤝 Contributing  

1. **Fork** this repository  
2. Create a new branch (`feature/your-feature`)  
3. **Commit and push** your changes  
4. Submit a **Pull Request**  

