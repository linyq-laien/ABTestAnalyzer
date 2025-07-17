# A/B Testing Analyzer - Web Application

A modern web application for analyzing A/B test results for paywall experiments, built with Next.js, NextUI, and Tailwind CSS. This web interface provides an intuitive step-by-step workflow for performing ARPU (Average Revenue Per User) and conversion rate analysis using z-tests.

## 🚀 Features

- **Step-by-Step Workflow**: Guided interface with numbered steps for easy analysis setup
- **Modern Web Interface**: Beautiful, responsive UI built with NextUI and Tailwind CSS
- **Multiple Input Methods**: Form-based input with tables or JSON upload
- **Real-time Analysis**: Instant statistical analysis with confidence intervals
- **Interactive Charts**: Visual comparison of group performance using Recharts
- **Sample Size Calculator**: Built-in calculator for planning experiments
- **Dark/Light Theme**: Toggle between themes for comfortable viewing
- **Export Results**: Download analysis results as JSON
- **Mobile Responsive**: Optimized for desktop and mobile devices
- **Helpful Tooltips**: Context-sensitive help for all input fields

## 📋 Analysis Capabilities

### Supported Metrics
- **ARPU Analysis**: Compare average revenue per user between groups
- **Conversion Rate Analysis**: Compare conversion rates between groups
- **Statistical Significance**: Z-tests with Bonferroni correction for multiple comparisons
- **Confidence Intervals**: 95% confidence intervals for all metrics and differences

### Input Formats
- **Form Input**: User-friendly step-by-step forms with table-based data entry
- **JSON Input**: Upload structured JSON data directly
- **Price Counts Format**: Specify different price points and their frequencies
- **Aggregated Format**: Provide total revenue and conversion counts

## 🛠️ Installation

### Prerequisites
- Node.js 18+ 
- npm or yarn

### Setup Steps

1. **Install Dependencies**
   ```bash
   npm install --legacy-peer-deps
   ```

2. **Start Development Server**
   ```bash
   npm run dev
   ```

3. **Build for Production**
   ```bash
   npm run build
   ```

4. **Preview Production Build**
   ```bash
   npx serve out -s
   ```

5. **Open in Browser**
   Navigate to `http://localhost:3000`

## 📊 Usage Guide

### Quick Setup (Form Method)

#### Step 1: Configure Your Analysis
1. **Choose Analysis Type**:
   - **Conversion Rate**: Compare how many users converted (clicked, signed up, etc.)
   - **Revenue (ARPU)**: Compare average revenue per user between groups

2. **Set Significance Level (α)**:
   - Default: 0.05 (95% confidence level)
   - Lower values = more strict requirements for significance

3. **Load Example Data**: Click to populate with sample data for testing

#### Step 2: Enter Your Experiment Data
1. **For Conversion Rate Analysis**:
   - Enter group names (Control, Treatment, etc.)
   - Enter total users who saw each version
   - Enter number of users who converted

2. **For ARPU Analysis** - Choose input method:
   - **Aggregated**: Enter total revenue + number of paying users
   - **Detailed**: Enter individual price points with user counts

3. **Add/Remove Groups**: Use buttons to manage experiment groups

4. **Quick Preview**: See live calculation preview as you type

#### Step 3: Run Analysis
- Click "Analyze Experiment" to get statistical results

### JSON Input Method
1. Switch to "JSON Import" tab
2. Paste or type your experiment data in JSON format
3. Click "Analyze JSON Data"

#### Example JSON for Conversion Rate Analysis:
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

#### Example JSON for ARPU Analysis (Aggregated):
```json
{
  "analysis_type": "arpu",
  "alpha": 0.05,
  "groups": [
    {
      "name": "Control Group",
      "users": 1000,
      "total_revenue": 2899.50,
      "conversion_count": 73
    },
    {
      "name": "Treatment Group",
      "users": 1000,
      "total_revenue": 6174.00,
      "conversion_count": 126
    }
  ]
}
```

#### Example JSON for ARPU Analysis (Detailed):
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

### Sample Size Calculator
1. Go to "Sample Size Calculator" tab
2. Select analysis type (Conversion Rate or ARPU)
3. Set confidence level and statistical power
4. Enter effect size and baseline metrics
5. Click "Calculate Sample Size"

## 📈 Understanding Results

### Group Statistics Table
- **Conversion Rate**: Percentage with confidence intervals
- **ARPU**: Average revenue per user with confidence intervals
- **Total Revenue**: Sum of all revenue for the group
- **Sample Size**: Number of users in each group

### Pairwise Comparisons Table
- **Difference**: Absolute difference between groups
- **95% CI**: Confidence interval for the difference
- **P-Value**: Statistical significance value (lower = more significant)
- **Z-Score**: Test statistic
- **Significant**: Whether the difference is statistically significant

### Visual Charts
- **Bar Charts**: Compare conversion rates and ARPU across groups
- **Dual Y-Axis**: Display both conversion and revenue metrics simultaneously
- **Interactive**: Hover for detailed values

### Export Options
- **Download JSON**: Save complete analysis results
- **Copy Results**: Share formatted results

## 🎨 User Interface Features

### Step-by-Step Workflow
- **Numbered Steps**: Clear progression through analysis setup
- **Visual Cards**: Organized sections with primary/secondary styling
- **Progress Indicators**: Always know where you are in the process

### Data Input Tables
- **Conversion Rate**: Simple 4-column table (Name, Users, Conversions, Actions)
- **ARPU Aggregated**: 5-column table (Name, Users, Revenue, Conversions, Actions)
- **ARPU Detailed**: Card-based interface for complex price point data

### Interactive Elements
- **Tooltips**: Hover over help icons for context-sensitive guidance
- **Example Data**: One-click loading of sample data for testing
- **Live Preview**: See calculations update as you type
- **Responsive Design**: Works on desktop, tablet, and mobile

## 🔧 Technical Architecture

### Frontend Stack
- **Next.js 14**: React framework with static site generation
- **NextUI**: Modern React component library
- **Tailwind CSS**: Utility-first CSS framework
- **Recharts**: Data visualization library
- **TypeScript**: Type safety and developer experience

### Analysis Engine
- **Z-Test Implementation**: Statistical significance testing
- **Confidence Intervals**: Bootstrap and analytical methods
- **Multiple Comparisons**: Bonferroni correction
- **Type Safety**: Full TypeScript coverage for data structures

### Build & Deployment
- **Static Export**: Generates static HTML/CSS/JS
- **Asset Optimization**: Automatic image and font optimization
- **Bundle Size**: ~415KB total with optimal loading
- **Performance**: Pre-rendered pages for fast initial load

## 🚀 Deployment

The application builds to static files and can be deployed anywhere:

```bash
npm run build
```

Deploy the `out/` directory to:
- **Netlify**: Drag and drop the `out` folder
- **Vercel**: Connect GitHub repository
- **GitHub Pages**: Upload `out` contents
- **AWS S3**: Static website hosting
- **Any web server**: Standard HTML/CSS/JS files

## 🔍 Troubleshooting

### Common Issues
1. **Build Errors**: Ensure Node.js 18+ and run `npm install --legacy-peer-deps`
2. **Import Errors**: Check JSON format matches the examples above
3. **Mobile Issues**: Clear browser cache and refresh
4. **Tooltip Problems**: Try clicking the help icons if hover doesn't work

### Data Validation
- **Users > 0**: All groups must have positive user counts
- **Conversions ≤ Users**: Conversion counts cannot exceed total users
- **Revenue ≥ 0**: Revenue values must be non-negative
- **Price Counts**: At least one price point required for detailed ARPU

### Performance
- **Large Datasets**: Use JSON import for experiments with many groups
- **Mobile Performance**: Tables scroll horizontally on small screens
- **Memory Usage**: Browser handles up to ~50 groups efficiently

## 📚 Additional Resources

- **Original Python Tool**: See `ab_testing_analyzer.py` for backend analysis
- **Sample Data**: Multiple JSON examples included in project
- **Mobile Optimizations**: See `MOBILE_OPTIMIZATIONS.md` for responsive design details
- **Deployment Guide**: See `DEPLOYMENT.md` for hosting instructions

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📄 License

MIT License - see LICENSE file for details. 