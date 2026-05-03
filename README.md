# 🌍 COVID-19 Dashboard

A modern, responsive COVID-19 analytics dashboard built with **React**, **TypeScript**, and **Tailwind CSS**, powered by official WHO data.

## 🔗 Live Demo

👉 https://your-live-app-link.com

---

## 📊 Overview

This dashboard provides an interactive way to explore global COVID-19 data, including:

* Total cases and deaths
* Daily new cases and deaths
* Historical trends over time
* Country-level breakdowns
* Regional insights

Users can filter data dynamically by **region** and **country**, making it easy to analyze trends at different levels.

---

## ✨ Features

### 📈 Data Visualization

* Line charts for **monthly trends** (cases & deaths)
* Bar chart for **top 10 countries by cases**
* Donut chart for **regional distribution**

### 🌎 Interactive Filtering

* Filter by **WHO region**
* Filter by **country**
* Search countries with **debounced input**

### 📋 Data Table

* Sortable columns
* Pagination support
* Clean and responsive UI
* Country flags using emoji

### ⚡ Performance Optimizations

* `useMemo` for heavy computations
* `useCallback` for stable handlers
* Custom `useDebounce` hook for search input
* Efficient data preprocessing

---

## 🧠 Data Source

* WHO COVID-19 dataset (CSV)
* Processed and transformed into a structured format via a custom hook:

  ```
  useCovidData
  ```

---

## 🏗️ Tech Stack

* **React**
* **TypeScript**
* **Tailwind CSS**
* **ApexCharts** (via `react-apexcharts`)
* **React Vector Maps** (`@react-jvectormap`)

---

## 📁 Project Structure (Simplified)

```
src/
├── components/
│   └── common/
│       └── PageMeta.tsx
├── hooks/
│   └── useCovidData.ts
├── pages/
│   └── Home.tsx
public/
└── data/
    └── WHO-COVID-19-global-data.csv
```

---

## 🚀 Getting Started

### 1. Clone the repository

```bash
git clone https://github.com/tengkumuazabs/covid-19-dashboard.git
cd covid-19-dashboard
```

### 2. Install dependencies

```bash
npm install
```

### 3. Run the development server

```bash
npm run dev
```

---

## 📌 Key Functionalities

### 🔍 Filtering Logic

* Region and country filters dynamically update available options
* Filters are applied before aggregation for accurate metrics

### 📅 Latest Data Calculation

* Automatically detects the **latest available date**
* Aggregates totals based on the most recent dataset

### 📊 Trend Aggregation

* Groups data by **month (YYYY-MM)**
* Computes total new cases and deaths per month

### 🌐 Map Support (Optional)

* Includes world map visualization (currently commented out)
* Supports country-level case and death intensity

---

## ⚠️ Notes

* Large dataset files (CSV/ZIP) are included in the repository
* Consider using **Git LFS** if expanding dataset size
* Map visualization is currently disabled for performance/UI reasons

---

## 📸 Screenshots

*Add screenshots here if needed*

---

## 📄 License

This project is based on an open-source admin template and WHO public data.

---

## 🙌 Acknowledgements

* World Health Organization (WHO)
* TailAdmin template
* ApexCharts
