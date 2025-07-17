'use client'

import React from 'react'
import {
  Card,
  CardHeader,
  CardBody,
  Table,
  TableHeader,
  TableColumn,
  TableBody,
  TableRow,
  TableCell,
  Chip,
  Progress,
  Button,
  Divider
} from '@nextui-org/react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts'
import { Download, TrendingUp, TrendingDown, Minus, BarChart3 } from 'lucide-react'
import { AnalysisResult } from '@/types'

interface ResultsDisplayProps {
  results: AnalysisResult | null
  loading: boolean
}

export default function ResultsDisplay({ results, loading }: ResultsDisplayProps) {
  if (loading) {
    return (
      <div className="space-y-4">
        <div className="text-center">
          <Progress
            size="md"
            isIndeterminate
            aria-label="Analyzing..."
            className="max-w-md mx-auto"
          />
          <p className="mt-2 text-gray-600 dark:text-gray-300">
            Running statistical analysis...
          </p>
        </div>
      </div>
    )
  }

  if (!results) {
    return (
      <div className="text-center text-gray-500 dark:text-gray-400 py-8">
        <BarChart3 size={48} className="mx-auto mb-4 opacity-50" />
        <p>No analysis results yet.</p>
        <p className="text-sm">Submit your experiment data to see results here.</p>
      </div>
    )
  }

  const formatNumber = (num: number, decimals: number = 3) => {
    return num.toFixed(decimals)
  }

  const formatPercentage = (num: number) => {
    return `${(num * 100).toFixed(2)}%`
  }

  const formatCurrency = (num: number) => {
    return `$${num.toFixed(2)}`
  }

  const getSignificanceColor = (isSignificant: boolean) => {
    return isSignificant ? 'success' : 'default'
  }

  const getTrendIcon = (difference: number) => {
    if (difference > 0) return <TrendingUp size={16} className="text-green-500" />
    if (difference < 0) return <TrendingDown size={16} className="text-red-500" />
    return <Minus size={16} className="text-gray-500" />
  }

  const downloadResults = () => {
    const dataStr = JSON.stringify(results, null, 2)
    const dataBlob = new Blob([dataStr], { type: 'application/json' })
    const url = URL.createObjectURL(dataBlob)
    const link = document.createElement('a')
    link.href = url
    link.download = 'ab_test_results.json'
    link.click()
    URL.revokeObjectURL(url)
  }

  const chartData = results.groups.map(group => ({
    name: group.name,
    conversion_rate: group.conversion_rate ? group.conversion_rate * 100 : 0,
    arpu: group.arpu || 0
  }))

  return (
    <div className="space-y-6">
      {/* Summary */}
      <Card>
        <CardHeader className="flex flex-col sm:flex-row sm:justify-between gap-3">
          <h3 className="text-lg font-semibold">Analysis Summary</h3>
          <Button
            color="primary"
            variant="bordered"
            size="sm"
            onPress={downloadResults}
            startContent={<Download size={16} />}
            className="w-full sm:w-auto"
          >
            <span className="sm:hidden">Download</span>
            <span className="hidden sm:inline">Download Results</span>
          </Button>
        </CardHeader>
        <CardBody className="space-y-3 md:space-y-4">
          <div className="flex flex-col sm:grid sm:grid-cols-2 gap-3 md:gap-4">
            <div className="text-center sm:text-left">
              <p className="text-sm text-gray-600 dark:text-gray-300">Best Performing Group</p>
              <p className="text-base md:text-lg font-semibold text-primary break-words">
                {results.bestGroup || 'No significant difference'}
              </p>
            </div>
            <div className="text-center sm:text-left">
              <p className="text-sm text-gray-600 dark:text-gray-300">Significant Difference</p>
              <div className="flex justify-center sm:justify-start mt-1">
                <Chip
                  color={results.hasSignificantDifference ? 'success' : 'default'}
                  variant="flat"
                  size="md"
                >
                  {results.hasSignificantDifference ? 'Yes' : 'No'}
                </Chip>
              </div>
            </div>
          </div>
          {results.alpha && (
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-300">
                Significance Level: α = {results.alpha}
                {results.bonferroni_alpha && (
                  <span className="ml-2">
                    (Bonferroni corrected: α = {results.bonferroni_alpha.toFixed(4)})
                  </span>
                )}
              </p>
            </div>
          )}
        </CardBody>
      </Card>

      {/* Group Statistics */}
      <Card>
        <CardHeader>
          <h3 className="text-lg font-semibold">Group Statistics</h3>
        </CardHeader>
        <CardBody>
          <div className="overflow-x-auto custom-scrollbar">
            <Table aria-label="Group statistics" className="min-w-full">
              <TableHeader>
                <TableColumn className="min-w-[120px]">GROUP</TableColumn>
                <TableColumn className="min-w-[80px]">USERS</TableColumn>
                <TableColumn className="min-w-[120px]">CONVERSION RATE</TableColumn>
                <TableColumn className="min-w-[100px]">ARPU</TableColumn>
                <TableColumn className="min-w-[120px]">TOTAL REVENUE</TableColumn>
              </TableHeader>
              <TableBody>
              {results.groups.map((group, index) => (
                <TableRow key={index}>
                  <TableCell className="font-medium">{group.name}</TableCell>
                  <TableCell>{group.users.toLocaleString()}</TableCell>
                  <TableCell>
                    {group.conversion_rate !== undefined ? (
                      <div>
                        <div>{formatPercentage(group.conversion_rate)}</div>
                        {group.conversion_rate_ci && (
                          <div className="text-xs text-gray-500">
                            CI: [{formatPercentage(group.conversion_rate_ci[0])}, {formatPercentage(group.conversion_rate_ci[1])}]
                          </div>
                        )}
                      </div>
                    ) : '-'}
                  </TableCell>
                  <TableCell>
                    {group.arpu !== undefined ? (
                      <div>
                        <div>{formatCurrency(group.arpu)}</div>
                        {group.arpu_ci && (
                          <div className="text-xs text-gray-500">
                            CI: [{formatCurrency(group.arpu_ci[0])}, {formatCurrency(group.arpu_ci[1])}]
                          </div>
                        )}
                      </div>
                    ) : '-'}
                  </TableCell>
                  <TableCell>
                    {group.total_revenue !== undefined 
                      ? formatCurrency(group.total_revenue)
                      : '-'
                    }
                  </TableCell>
                </TableRow>
              ))}
              </TableBody>
            </Table>
          </div>
        </CardBody>
      </Card>

      {/* Charts */}
      <Card>
        <CardHeader>
          <h3 className="text-lg font-semibold">Visual Comparison</h3>
        </CardHeader>
        <CardBody>
          <div className="h-48 sm:h-64 w-full overflow-hidden">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 10, right: 10, left: 10, bottom: 10 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="name" 
                  fontSize={12}
                  tick={{ fontSize: 11 }}
                  interval={0}
                  angle={-45}
                  textAnchor="end"
                  height={60}
                />
                <YAxis yAxisId="left" orientation="left" fontSize={11} />
                <YAxis yAxisId="right" orientation="right" fontSize={11} />
                <Tooltip 
                  formatter={(value, name) => [
                    name === 'conversion_rate' ? `${value}%` : `$${value}`,
                    name === 'conversion_rate' ? 'Conversion Rate' : 'ARPU'
                  ]}
                  contentStyle={{ fontSize: '12px' }}
                />
                <Bar yAxisId="left" dataKey="conversion_rate" fill="#3b82f6" name="conversion_rate" />
                <Bar yAxisId="right" dataKey="arpu" fill="#10b981" name="arpu" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardBody>
      </Card>

      {/* Comparisons */}
      {results.comparisons.length > 0 && (
        <Card>
          <CardHeader>
            <h3 className="text-lg font-semibold">Pairwise Comparisons</h3>
          </CardHeader>
          <CardBody>
            <div className="overflow-x-auto custom-scrollbar">
              <Table aria-label="Pairwise comparisons" className="min-w-full">
                <TableHeader>
                  <TableColumn className="min-w-[140px]">COMPARISON</TableColumn>
                  <TableColumn className="min-w-[100px]">DIFFERENCE</TableColumn>
                  <TableColumn className="min-w-[120px]">95% CI</TableColumn>
                  <TableColumn className="min-w-[80px]">P-VALUE</TableColumn>
                  <TableColumn className="min-w-[80px]">Z-SCORE</TableColumn>
                  <TableColumn className="min-w-[100px]">SIGNIFICANT</TableColumn>
                </TableHeader>
                <TableBody>
                {results.comparisons.map((comparison, index) => (
                  <TableRow key={index}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {getTrendIcon(comparison.difference)}
                        <span className="font-medium">
                          {comparison.group2} vs {comparison.group1}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      {comparison.metric_type === 'conversion_rate' 
                        ? formatPercentage(Math.abs(comparison.difference))
                        : formatCurrency(Math.abs(comparison.difference))
                      }
                    </TableCell>
                    <TableCell>
                      [{comparison.metric_type === 'conversion_rate' 
                        ? formatPercentage(comparison.difference_ci[0])
                        : formatCurrency(comparison.difference_ci[0])
                      }, {comparison.metric_type === 'conversion_rate' 
                        ? formatPercentage(comparison.difference_ci[1])
                        : formatCurrency(comparison.difference_ci[1])
                      }]
                    </TableCell>
                    <TableCell>{formatNumber(comparison.p_value, 4)}</TableCell>
                    <TableCell>{formatNumber(comparison.z_score, 3)}</TableCell>
                    <TableCell>
                      <Chip
                        color={getSignificanceColor(comparison.is_significant)}
                        size="sm"
                        variant="flat"
                      >
                        {comparison.is_significant ? 'Yes' : 'No'}
                      </Chip>
                    </TableCell>
                  </TableRow>
                ))}
                </TableBody>
              </Table>
            </div>
          </CardBody>
        </Card>
      )}
    </div>
  )
} 