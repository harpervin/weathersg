# WeatherSG 🌦️

A weather visualization dashboard built with [Next.js](https://nextjs.org/), with a geospatial map of Singapore and interactive visualizations to display local weather data.

## Features

- 🗺️ **Interactive Geospatial Map**: Visualize Singapore’s weather patterns with overlays for wind directions, rainfall, humidity, and air temperature using [Leaflet](https://leafletjs.com/).
- 📊 **Dynamic Data Visualizations**: Bar charts and regression graphs built with [Chart.js](https://www.chartjs.org/), and Python scripts for weather data collection.

---

## Getting Started

### Prerequisites

Ensure you have the following installed on your machine:
- [Node.js](https://nodejs.org/) (v16 or later)
- [npm](https://www.npmjs.com/) or [Yarn](https://yarnpkg.com/)

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/your-username/weathersg-app.git
   cd weathersg-app
   ```

2. Install dependencies:
   ```bash
   npm install
   ```
   or
   ```bash
   yarn install
   ```

3. Start the development server:
   ```bash
   npm run dev
   ```
   or
   ```bash
   yarn dev
   ```

4. Visit [http://localhost:3000](http://localhost:3000) in your browser.

---

## Project Structure

```
weather_data/            # (Backend) Python scripts to collect weather data, and JSON files which contain raw weather data
weathersg-app/           # (Frontend)
├── public/              # Static assets (images, fonts, etc.)
├── src/
│   ├── app/             # Next.js main page
│   ├── components/      # Reusable UI components (e.g., map, charts)
│   ├── styles/          # Global and module-specific styles
│   └── types/           # Helper functions and utilities
├── .gitignore           # Git ignore rules
├── next.config.js       # Next.js configuration
├── tailwind.config.js   # TailwindCSS configuration
└── README.md            # Project documentation
```

---

## Deployment


---

## How to Use


