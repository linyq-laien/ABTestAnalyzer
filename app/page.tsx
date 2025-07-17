'use client'

import React, { useState } from 'react'
import { 
  Card, 
  CardHeader, 
  CardBody, 
  Tabs, 
  Tab,
  Button,
  Divider
} from '@nextui-org/react'
import { BarChart3, Calculator, Upload, FileText } from 'lucide-react'
import Header from '@/components/Header'
import DataInput from '@/components/DataInput'
import ResultsDisplay from '@/components/ResultsDisplay'
import SampleSizeCalculator from '@/components/SampleSizeCalculator'
import { AnalysisResult, ExperimentData } from '@/types'
import { analyzeExperiment } from '@/lib/analysis'

export default function Home() {
  const [analysisResults, setAnalysisResults] = useState<AnalysisResult | null>(null)
  const [loading, setLoading] = useState(false)

  const handleAnalysis = (data: ExperimentData) => {
    setLoading(true)
    try {
      // Use the actual analysis function
      const results = analyzeExperiment(data)
      setAnalysisResults(results)
    } catch (error) {
      console.error('Analysis failed:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 safe-area-padding">
      <Header />
      
      <main className="container mx-auto px-3 sm:px-4 py-4 sm:py-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-6 md:mb-8 px-4">
            <h1 className="text-2xl md:text-4xl font-bold text-gray-900 dark:text-white mb-3 md:mb-4">
              A/B Testing Analyzer
            </h1>
            <p className="text-sm md:text-lg text-gray-600 dark:text-gray-300 max-w-3xl mx-auto">
              Analyze paywall experiments with ARPU and conversion rate analysis using z-tests. 
              Get confidence intervals, statistical significance, and actionable insights.
            </p>
          </div>

          <Tabs 
            aria-label="Analysis Options" 
            className="w-full"
            classNames={{
              tabList: "flex w-full flex-col sm:grid sm:grid-cols-3 p-0 rounded-lg bg-default-100",
              cursor: "w-full bg-primary",
              tab: "w-full px-2 py-3 h-auto min-h-[48px] text-center",
              tabContent: "group-data-[selected=true]:text-white text-xs sm:text-sm"
            }}
          >
            <Tab
              key="analyze"
              title={
                <div className="flex items-center justify-center space-x-1 sm:space-x-2">
                  <BarChart3 size={16} className="sm:w-5 sm:h-5" />
                  <span className="hidden sm:inline">Analyze Experiment</span>
                  <span className="sm:hidden">Analyze</span>
                </div>
              }
            >
              <div className="flex flex-col lg:grid lg:grid-cols-2 gap-4 lg:gap-8 mt-4 lg:mt-6">
                <Card className="shadow-lg">
                  <CardHeader>
                    <div className="flex items-center space-x-2">
                      <Upload size={24} className="text-primary" />
                      <h2 className="text-xl font-semibold">Data Input</h2>
                    </div>
                  </CardHeader>
                  <CardBody>
                    <DataInput onAnalyze={handleAnalysis} loading={loading} />
                  </CardBody>
                </Card>

                <Card className="shadow-lg">
                  <CardHeader>
                    <div className="flex items-center space-x-2">
                      <FileText size={24} className="text-primary" />
                      <h2 className="text-xl font-semibold">Results</h2>
                    </div>
                  </CardHeader>
                  <CardBody>
                    <ResultsDisplay results={analysisResults} loading={loading} />
                  </CardBody>
                </Card>
              </div>
            </Tab>

            <Tab
              key="calculator"
              title={
                <div className="flex items-center justify-center space-x-1 sm:space-x-2">
                  <Calculator size={16} className="sm:w-5 sm:h-5" />
                  <span className="hidden sm:inline">Sample Size Calculator</span>
                  <span className="sm:hidden">Calculator</span>
                </div>
              }
            >
              <div className="mt-6">
                <Card className="shadow-lg max-w-4xl mx-auto">
                  <CardHeader>
                    <h2 className="text-xl font-semibold">Sample Size Calculator</h2>
                  </CardHeader>
                  <CardBody>
                    <SampleSizeCalculator />
                  </CardBody>
                </Card>
              </div>
            </Tab>

            <Tab
              key="help"
              title={
                <div className="flex items-center justify-center space-x-1 sm:space-x-2">
                  <FileText size={16} className="sm:w-5 sm:h-5" />
                  <span className="hidden sm:inline">Documentation</span>
                  <span className="sm:hidden">Help</span>
                </div>
              }
            >
              <div className="mt-6">
                <Card className="shadow-lg">
                  <CardHeader>
                    <h2 className="text-xl font-semibold">How to Use</h2>
                  </CardHeader>
                  <CardBody className="space-y-4">
                    <div>
                      <h3 className="font-medium text-lg mb-2">Supported Data Formats</h3>
                      <div className="space-y-2 text-sm text-gray-600 dark:text-gray-300">
                        <p><strong>ARPU Analysis:</strong></p>
                        <ul className="list-disc list-inside ml-4 space-y-1">
                          <li>Price Counts Format: Specify different price points and their counts</li>
                          <li>Aggregated Format: Provide total revenue and conversion count</li>
                        </ul>
                        <p><strong>Conversion Rate Analysis:</strong></p>
                        <ul className="list-disc list-inside ml-4 space-y-1">
                          <li>Simple Format: Just users and conversions count</li>
                        </ul>
                      </div>
                    </div>
                    
                    <Divider />
                    
                    <div>
                      <h3 className="font-medium text-lg mb-2">Statistical Methods</h3>
                      <ul className="list-disc list-inside text-sm text-gray-600 dark:text-gray-300 space-y-1">
                        <li>Z-tests for ARPU and conversion rate comparisons</li>
                        <li>Confidence intervals for individual metrics and differences</li>
                        <li>Bonferroni correction for multiple comparisons</li>
                        <li>Normal approximation for statistical inference</li>
                      </ul>
                    </div>
                  </CardBody>
                </Card>
              </div>
            </Tab>
          </Tabs>
        </div>
      </main>
    </div>
  )
}

 