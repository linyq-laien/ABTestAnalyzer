'use client'

import React, { useState } from 'react'
import {
  Card,
  CardBody,
  Input,
  Select,
  SelectItem,
  Button,
  Divider
} from '@nextui-org/react'
import { Calculator } from 'lucide-react'
import { SampleSizeInput, SampleSizeResult } from '@/types'

export default function SampleSizeCalculator() {
  const [input, setInput] = useState<SampleSizeInput>({
    confidence_level: 0.95,
    power: 0.80,
    effect_size: 0.05,
    baseline_rate: 0.05,
    analysis_type: 'conversion_rate'
  })
  
  const [result, setResult] = useState<SampleSizeResult | null>(null)
  const [loading, setLoading] = useState(false)

  const calculateSampleSize = () => {
    setLoading(true)
    
    // Simplified sample size calculation
    setTimeout(() => {
      const alpha = 1 - input.confidence_level
      const beta = 1 - input.power
      
      // Z-scores for alpha/2 and beta
      const z_alpha = getZScore(alpha / 2)
      const z_beta = getZScore(beta)
      
      let sampleSize: number
      
      if (input.analysis_type === 'conversion_rate') {
        // Sample size for conversion rate test
        const p1 = input.baseline_rate || 0.05
        const p2 = p1 + input.effect_size
        const pooledP = (p1 + p2) / 2
        const pooledSE = Math.sqrt(2 * pooledP * (1 - pooledP))
        const effectSE = Math.sqrt(p1 * (1 - p1) + p2 * (1 - p2))
        
        sampleSize = Math.pow((z_alpha * pooledSE + z_beta * effectSE) / input.effect_size, 2)
      } else {
        // Sample size for ARPU test
        const std = input.baseline_std || 50
        sampleSize = Math.pow((z_alpha + z_beta) * std / input.effect_size, 2)
      }
      
      sampleSize = Math.ceil(sampleSize)
      
      setResult({
        sample_size_per_group: sampleSize,
        total_sample_size: sampleSize * 2,
        assumptions: {
          confidence_level: input.confidence_level,
          power: input.power,
          effect_size: input.effect_size,
          baseline_metric: input.baseline_rate || input.baseline_arpu,
          baseline_std: input.baseline_std
        }
      })
      setLoading(false)
    }, 500)
  }

  const getZScore = (p: number): number => {
    // Approximation of inverse normal CDF for common values
    if (p <= 0.025) return 1.96  // 95% confidence
    if (p <= 0.05) return 1.645  // 90% confidence
    if (p <= 0.1) return 1.28    // 80% power
    if (p <= 0.2) return 0.84    // 80% power
    return 0
  }

  const updateInput = (updates: Partial<SampleSizeInput>) => {
    setInput({ ...input, ...updates })
    setResult(null)
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardBody className="space-y-3 md:space-y-4">
          <div className="flex flex-col sm:grid sm:grid-cols-2 gap-3 md:gap-4">
            <Select
              label="Analysis Type"
              selectedKeys={[input.analysis_type]}
              onSelectionChange={(keys) => {
                const value = Array.from(keys)[0] as 'conversion_rate' | 'arpu'
                updateInput({ analysis_type: value })
              }}
              size="md"
              className="sm:col-span-2"
            >
              <SelectItem key="conversion_rate">Conversion Rate</SelectItem>
              <SelectItem key="arpu">ARPU (Average Revenue Per User)</SelectItem>
            </Select>

            <Input
              type="number"
              label="Confidence Level"
              value={input.confidence_level.toString()}
              onChange={(e) => updateInput({ confidence_level: parseFloat(e.target.value) || 0.95 })}
              step="0.01"
              min="0.80"
              max="0.99"
              endContent="%"
              size="md"
            />

            <Input
              type="number"
              label="Statistical Power"
              value={input.power.toString()}
              onChange={(e) => updateInput({ power: parseFloat(e.target.value) || 0.80 })}
              step="0.01"
              min="0.50"
              max="0.99"
              endContent="%"
              size="md"
            />

            <Input
              type="number"
              label="Effect Size"
              value={input.effect_size.toString()}
              onChange={(e) => updateInput({ effect_size: parseFloat(e.target.value) || 0.05 })}
              step="0.001"
              min="0.001"
              endContent={input.analysis_type === 'conversion_rate' ? 'percentage points' : '$'}
              size="md"
              className="sm:col-span-2"
            />

            {input.analysis_type === 'conversion_rate' ? (
              <Input
                type="number"
                label="Baseline Conversion Rate"
                value={(input.baseline_rate || 0.05).toString()}
                onChange={(e) => updateInput({ baseline_rate: parseFloat(e.target.value) || 0.05 })}
                step="0.001"
                min="0.001"
                max="1"
                endContent="%"
                size="md"
                className="sm:col-span-2"
              />
            ) : (
              <>
                <Input
                  type="number"
                  label="Baseline ARPU"
                  value={(input.baseline_arpu || 0).toString()}
                  onChange={(e) => updateInput({ baseline_arpu: parseFloat(e.target.value) || 0 })}
                  step="0.01"
                  min="0"
                  startContent="$"
                  size="md"
                />
                <Input
                  type="number"
                  label="Revenue Standard Deviation"
                  value={(input.baseline_std || 50).toString()}
                  onChange={(e) => updateInput({ baseline_std: parseFloat(e.target.value) || 50 })}
                  step="0.01"
                  min="0.01"
                  startContent="$"
                  size="md"
                />
              </>
            )}
          </div>

          <Button
            color="primary"
            size="lg"
            onPress={calculateSampleSize}
            isLoading={loading}
            startContent={!loading && <Calculator size={20} />}
            className="w-full min-h-[48px] sm:col-span-2"
          >
            {loading ? 'Calculating...' : 'Calculate Sample Size'}
          </Button>
        </CardBody>
      </Card>

      {result && (
        <Card>
          <CardBody className="space-y-3 md:space-y-4">
            <h3 className="text-lg font-semibold">Sample Size Results</h3>
            
            <div className="flex flex-col sm:grid sm:grid-cols-2 gap-3 md:gap-4">
              <div className="text-center p-3 md:p-4 bg-primary-50 dark:bg-primary-900/20 rounded-lg">
                <p className="text-sm text-gray-600 dark:text-gray-300">Per Group</p>
                <p className="text-xl md:text-2xl font-bold text-primary break-all">
                  {result.sample_size_per_group.toLocaleString()}
                </p>
                <p className="text-xs text-gray-500">users each</p>
              </div>
              
              <div className="text-center p-3 md:p-4 bg-secondary-50 dark:bg-secondary-900/20 rounded-lg">
                <p className="text-sm text-gray-600 dark:text-gray-300">Total Required</p>
                <p className="text-xl md:text-2xl font-bold text-secondary break-all">
                  {result.total_sample_size.toLocaleString()}
                </p>
                <p className="text-xs text-gray-500">users total</p>
              </div>
            </div>

            <Divider />

            <div>
              <h4 className="font-medium mb-2">Assumptions</h4>
              <div className="text-sm text-gray-600 dark:text-gray-300 space-y-1">
                <div className="flex justify-between">
                  <span>Confidence Level:</span>
                  <span className="font-medium">{(result.assumptions.confidence_level * 100).toFixed(1)}%</span>
                </div>
                <div className="flex justify-between">
                  <span>Statistical Power:</span>
                  <span className="font-medium">{(result.assumptions.power * 100).toFixed(1)}%</span>
                </div>
                <div className="flex justify-between">
                  <span>Effect Size:</span>
                  <span className="font-medium break-all">{input.analysis_type === 'conversion_rate' 
                    ? `${(result.assumptions.effect_size * 100).toFixed(2)} pp`
                    : `$${result.assumptions.effect_size.toFixed(2)}`
                  }</span>
                </div>
                {result.assumptions.baseline_metric && (
                  <div className="flex justify-between">
                    <span>Baseline {input.analysis_type === 'conversion_rate' ? 'CVR' : 'ARPU'}:</span>
                    <span className="font-medium break-all">{
                      input.analysis_type === 'conversion_rate' 
                        ? `${(result.assumptions.baseline_metric * 100).toFixed(2)}%`
                        : `$${result.assumptions.baseline_metric.toFixed(2)}`
                    }</span>
                  </div>
                )}
                {result.assumptions.baseline_std && (
                  <div className="flex justify-between">
                    <span>Revenue Std Dev:</span>
                    <span className="font-medium break-all">${result.assumptions.baseline_std.toFixed(2)}</span>
                  </div>
                )}
              </div>
            </div>
          </CardBody>
        </Card>
      )}
    </div>
  )
} 