# 💰 Finance Coach AI 

A **comprehensive, production-ready financial management platform** that seamlessly integrates **React (frontend)**, **FastAPI (backend)**, and **AI-driven insights** to deliver intelligent, data-backed financial decisions. 

---

## 🌟 Key Highlights

### 🔹 Intelligent Financial Management
- **Automated Data Uploads**: Import CSV or Excel statements effortlessly.
- **AI Categorization**: Smart transaction classification using NLP models.
- **Interactive Dashboard**: Real-time visual analytics and financial KPIs.
- **Multi-Period Analysis**: Compare spending across months or years.
- **Advanced Search & Filters**: Quickly locate transactions by category, keyword, or date.

### 🤖 AI & Analytics Engine
- **Chat-Based Financial Advisor**: Query your data in natural language.
- **Spending Insights**: Get AI summaries of your financial health.
- **Smart Budgeting**: Personalized budget recommendations.
- **Investment Advisory**: Tailored stock and IPO suggestions using CrewAI agents.
- **Trend Forecasting**: Pattern recognition for predictive insights.

### 💼 Investment Intelligence
- **IPO Alerts**: Real-time updates on relevant IPOs.
- **Portfolio Recommendations**: Risk-adjusted stock suggestions.
- **Financial Risk Assessment**: Evaluate and balance your investment risk.

### ⚙️ Engineering Excellence
- **Responsive Design** with Shadcn/UI components.
- **Real-Time Data Sync** between frontend and backend.
- **Persistent Chat Memory** per financial period.
- **Firebase Integration** for secure data management.
- **Optimized Caching & Performance** for large datasets.
---

## 🏗️ System Overview

**Frontend**: React + TypeScript + Shadcn/UI  
**Backend**: FastAPI (Python 3.8+)  
**Database**: Firebase Firestore  
**AI Layer**: OpenAI + CrewAI Agents  
---

## 🚀 Quick Start


### 1️⃣ Clone Repository
```bash
git clone <your-repo-url>
cd financial-management-system
```

### 2️⃣ Frontend Setup
```bash
cd src
npm install     # or pnpm install
cp .env.example .env.local
```

Configure:
```bash
VITE_API_BASE_URL=http://localhost:8000
VITE_FIREBASE_CONFIG=your_firebase_config
```

### 3️⃣ Backend Setup
```bash
cd src/backend
python -m venv venv
source venv/bin/activate      # Windows: venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env
```

Backend `.env` example:
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
# Opens http://localhost:5173
```

---

## 🔌 API Overview

| Endpoint | Description |
|-----------|--------------|
| `POST /api/upload` | Upload financial data |
| `GET /api/data/{year}/{month}` | Retrieve monthly insights |
| `POST /api/chat` | Query AI financial assistant |
| `GET /api/insights/{year}/{month}` | AI-generated insights |

---

## 🤝 Contributing

1. Fork this repository  
2. Create a new branch (`feature/your-feature`)  
3. Commit and push changes  
4. Submit a Pull Request  

---


