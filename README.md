# TrueSpec — Intelligent Laptop Recommendation & Sentiment Engine 💻🇮🇳

TrueSpec is a full-stack, ML-powered platform that analyzes laptop hardware specifications and verified customer reviews. It filters out fake/spam reviews using heuristic shields, translates complex hardware specifications into plain English, and provides objective recommendations priced in **Indian Rupees (INR / ₹)**.

---

## 🚀 Quick Start: How to Run Locally

You can run TrueSpec locally on **Windows (cmd / PowerShell)**, **macOS**, or **Linux**.

### Prerequisites
- **Node.js**: v18 or higher (v20+ recommended)
- **npm**: v9 or higher
- **Python**: 3.9+ (only if you want to re-run the offline ML/NLP pipelines)
- **Database**: 
  - **MySQL (Recommended)**: Running on `localhost:3306` with user `root` (password can be blank or configured in `.env`).
  - **SQLite (Automatic Fallback)**: If MySQL is not running, the backend **automatically switches to local SQLite** (`truespec.sqlite`) with zero configuration required!

---

### Step 1: Clone or Navigate to the Project Folder
```bash
cd D:\truespec
```

---

### Step 2: Set Up & Run the Backend Service

1. Open a terminal and navigate into the `backend` folder:
   ```bash
   cd backend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Configure Environment (Optional):
   The backend defaults to:
   - `PORT=5000`
   - `DB_TYPE=mysql` (auto-falls back to SQLite if MySQL is unavailable)
   - `DB_NAME=truespec_db`
   
   If you wish to customize ports or credentials, create a `.env` file in the `backend/` folder:
   ```env
   PORT=5000
   DB_TYPE=mysql
   DB_HOST=localhost
   DB_PORT=3306
   DB_USER=root
   DB_PASSWORD=
   DB_NAME=truespec_db
   ```

4. Start the Backend:
   ```bash
   npm run dev
   ```

   > **Note on Database Auto-Initialization**:
   > When the backend boots, `ensureSchemaAndSeed()` checks if the tables exist and automatically creates all required tables (`laptops`, `reviews`, `laptop_scores`) and seeds 36+ laptops and 600+ reviews with authentic INR pricing.

---

### Step 3: Set Up & Run the Frontend Web App

1. Open a **second terminal** and navigate into the `frontend` folder:
   ```bash
   cd frontend
   ```

2. Install frontend dependencies:
   ```bash
   npm install
   ```

3. Start the Vite development server:
   ```bash
   npm run dev
   ```

4. Open your browser and navigate to:
   ```
   http://localhost:5173
   ```
   *(or the URL shown in your Vite terminal)*

---

### 🔧 Troubleshooting: How to Fix `EADDRINUSE 5000`

If you encounter:
```
Error: listen EADDRINUSE: address already in use 0.0.0.0:5000
```
This means an existing Node.js or Python process is already listening on port 5000.

#### On Windows:
1. Open PowerShell or Command Prompt as Administrator and find the process using port 5000:
   ```cmd
   netstat -ano | findstr :5000
   ```
   *(Look at the PID number at the far right of the line, for example `14280`)*

2. Terminate the process:
   ```cmd
   taskkill /PID 14280 /F
   ```
   *(Replace `14280` with your actual PID)*

3. Restart the backend:
   ```cmd
   npm run dev
   ```

#### Alternative: Change the Port
You can also change the port by setting `PORT=5001` in `backend/.env`, or by running:
```cmd
set PORT=5001 && npm run dev
```

---

### Step 4 (Optional): Running the ML / NLP Pipeline

The repository already comes preloaded with precomputed sentiment scores and clean INR dataset (`laptops_cleaned.csv` and `reviews_cleaned.csv`). 

If you want to re-run the ML aspect sentiment extraction and Wilson score pipeline:
1. Navigate to the `ml` directory:
   ```bash
   cd ml
   ```
2. Activate your virtual environment:
   ```cmd
   venv\Scripts\activate
   ```
3. Install Python requirements:
   ```bash
   pip install -r requirements.txt
   ```
4. Run the end-to-end ingestion and scoring pipeline:
   ```bash
   python pipeline.py
   ```

---

## 🌟 Key Features for Everyday Users

1. **Indian Rupee (₹) Pricing**:
   - All laptop listings, comparison matrices, and recommendation budget sliders use standard Indian number formatting (e.g. `₹74,990`, `₹1,24,900`, `₹2,49,990`).

2. **Plain-English Spec Guides**:
   - Jargon-free explanations of CPU cores, GPU tiers, RAM multitasking limits, and battery watt-hour (Wh) runtimes.
   - Dynamic badges on cards highlight specific everyday strengths (e.g., *"Featherlight Mobility"*, *"All-Day Battery"*, *"High-Performance CPU"*).

3. **Fake Review Shield**:
   - Automated detection filters out duplicate reviews, promotional spam bots, and unverified purchases before computing scores.

4. **Statistical Confidence Score (0–100)**:
   - Uses Wilson 95% binomial confidence bounds so laptops with large volumes of genuine positive reviews score higher than those with a handful of unverified ratings.

5. **Interactive Advisor**:
   - 4-step wizard matching your daily workload (Office, Student, Coding, Creative, Gaming) and target budget in INR.
