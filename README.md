# A/B Testing Analyzer for Paywall Experiments

A comprehensive tool for analyzing A/B test results for paywall experiments, supporting both ARPU (Average Revenue Per User) and conversion rate analysis using z-tests. Available as both a **Python command-line tool** and a **modern web application**.

## 🚀 Choose Your Interface

### 🌐 Web Application (Recommended)
**Modern, user-friendly interface built with Next.js**
- Step-by-step guided workflow
- Interactive charts and visualizations  
- No coding required
- Mobile responsive design
- Real-time analysis preview

[📖 **Web App Documentation →**](README_WEB.md)

### 🐍 Python Command-Line Tool
**Original tool for programmatic analysis**
- Batch processing capabilities
- Script integration
- Command-line automation
- JSON input/output

[📖 **CLI Documentation →**](#python-cli-usage)

---

## 🌐 Web Application Quick Start

### Installation
```bash
npm install --legacy-peer-deps
npm run build
npx serve out -s
```

### Usage
1. Open `http://localhost:3000`
2. Choose analysis type (Conversion Rate or ARPU)
3. Enter your experiment data
4. Get instant statistical results with charts

---

## 🐍 Python CLI Usage

### Features
- **ARPU comparison** between multiple groups using z-test
- **Conversion rate comparison** between multiple groups using z-test
- **Confidence intervals** for individual group metrics and group differences
- **Multiple input formats** for conversion data
- **Bonferroni correction** for multiple comparisons
- **Command-line interface** for interactive or batch analysis
- **JSON template generator** for easy experiment setup
- **Export results** to JSON

### Installation
```bash
pip install numpy pandas scipy
```

### Supported Input Formats

#### For ARPU Analysis:
**Price Counts Format (Recommended)**
```json
{
  "users": 1000,
  "price_counts": [
    {"price": 39.99, "count": 50},
    {"price": 49.99, "count": 20}
  ]
}
```

**Aggregated Format**
```json
{
  "users": 1000,
  "total_revenue": 1999.50,
  "conversion_count": 50
}
```

#### For Conversion Rate Analysis:
```json
{
  "users": 1000,
  "conversions": 73
}
```

### Example Usage

#### Interactive Mode
```bash
python ab_testing_analyzer.py
```

#### Batch Mode with JSON
```bash
python ab_testing_analyzer.py --json experiment_data.json
```

#### Generate Templates
```bash
python ab_testing_analyzer.py --template conversion_rate
python ab_testing_analyzer.py --template arpu_aggregated
python ab_testing_analyzer.py --template arpu_detailed
```

### Example JSON Files

#### ARPU Analysis (Price Counts)
```json
{
  "analysis_type": "arpu",
  "alpha": 0.05,
  "groups": [
    {
      "name": "Control Group",
      "users": 1000,
      "price_counts": [
        {"price": 39.99, "count": 50},
        {"price": 49.99, "count": 23}
      ]
    },
    {
      "name": "Treatment Group",
      "users": 1000,
      "price_counts": [
        {"price": 39.99, "count": 86},
        {"price": 49.99, "count": 40}
      ]
    }
  ]
}
```

#### Conversion Rate Analysis
```json
{
  "analysis_type": "conversion_rate",
  "alpha": 0.05,
  "groups": [
    {
      "name": "Control Group",
      "users": 1000,
      "conversions": 73
    },
    {
      "name": "Treatment Group", 
      "users": 1000,
      "conversions": 126
    }
  ]
}
```

## 📊 Statistical Methods

### Z-Tests
- Used for both ARPU and conversion rate comparisons
- Normal approximation for large sample sizes
- Two-tailed tests for difference detection

### Confidence Intervals
- Calculated using normal distribution
- 95% confidence level by default (adjustable)
- Includes both individual metrics and differences

### Multiple Comparisons
- Bonferroni correction applied automatically
- Adjusted significance level for multiple group comparisons
- Reduces Type I error rate

## 🔧 Sample Size Calculator

Both interfaces include a sample size calculator for planning experiments:

```bash
python sample_size_calculator.py
```

Or use the web interface calculator tab.

## 📁 Project Structure

```
├── ab_testing_analyzer.py          # Python CLI tool
├── sample_size_calculator.py       # Sample size calculator
├── requirements.txt                # Python dependencies
├── README_WEB.md                   # Web app documentation
├── DEPLOYMENT.md                   # Deployment guide
├── MOBILE_OPTIMIZATIONS.md         # Mobile design details
├── package.json                    # Node.js dependencies
├── app/                           # Next.js application
├── components/                    # React components
├── lib/                          # Analysis logic
├── types/                        # TypeScript types
└── example_*.json                # Sample data files
```

## 🎯 Use Cases

### Python CLI - Best For:
- **Data Scientists**: Programmatic analysis and automation
- **CI/CD Integration**: Automated testing pipelines
- **Batch Processing**: Analyzing multiple experiments
- **Advanced Users**: Custom scripting and integration

### Web Application - Best For:
- **Product Managers**: Quick analysis without coding
- **Growth Teams**: Interactive exploration of results
- **Stakeholder Presentations**: Visual charts and reports
- **Mobile Users**: Analysis on phones and tablets

## 📚 Additional Resources

- **Web App Guide**: [README_WEB.md](README_WEB.md)
- **Deployment Options**: [DEPLOYMENT.md](DEPLOYMENT.md)
- **Mobile Optimizations**: [MOBILE_OPTIMIZATIONS.md](MOBILE_OPTIMIZATIONS.md)
- **Sample Data**: Various `example_*.json` files included

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

MIT License - see LICENSE file for details.

---

*Choose the interface that works best for your workflow - powerful Python CLI for automation or beautiful web interface for interactive analysis.* 