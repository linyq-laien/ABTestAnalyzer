'use client'

import React, { useState } from 'react'
import {
  Card,
  CardBody,
  CardHeader,
  Textarea,
  Button,
  Select,
  SelectItem,
  Input,
  Tabs,
  Tab,
  Divider,
  Chip,
  Table,
  TableHeader,
  TableColumn,
  TableBody,
  TableRow,
  TableCell,
  RadioGroup,
  Radio,
  Tooltip,
  InputProps
} from '@nextui-org/react'
import { Upload, FileText, Plus, Trash2, Lightbulb, HelpCircle } from 'lucide-react'
import { ExperimentData, Group, PriceCount } from '@/types'

interface DataInputProps {
  onAnalyze: (data: ExperimentData) => void
  loading: boolean
}

// Helper component for input with tooltip
const InputWithTooltip = ({ tooltip, label, ...inputProps }: InputProps & { tooltip: string }) => {
  return (
    <Tooltip content={tooltip} placement="right" className="max-w-xs">
      <Input {...inputProps} label={label} />
    </Tooltip>
  )
}

export default function DataInput({ onAnalyze, loading }: DataInputProps) {
  const [inputMethod, setInputMethod] = useState<'json' | 'form'>('form')
  const [jsonInput, setJsonInput] = useState('')
  const [analysisType, setAnalysisType] = useState<'arpu' | 'conversion_rate'>('conversion_rate')
  const [arpuInputMethod, setArpuInputMethod] = useState<'aggregated' | 'detailed'>('aggregated')
  const [alpha, setAlpha] = useState(0.05)
  const [groups, setGroups] = useState<Group[]>([
    { name: 'Control', users: 1000, conversions: 73 },
    { name: 'Treatment', users: 1000, conversions: 126 }
  ])

  const handleJsonSubmit = () => {
    try {
      const data = JSON.parse(jsonInput) as ExperimentData
      onAnalyze(data)
    } catch (error) {
      alert('Invalid JSON format. Please check your input.')
    }
  }

  const handleFormSubmit = () => {
    const data: ExperimentData = {
      analysis_type: analysisType,
      alpha,
      groups
    }
    onAnalyze(data)
  }

  const addGroup = () => {
    const newGroup: Group = {
      name: `Group ${groups.length + 1}`,
      users: 1000,
      ...(analysisType === 'conversion_rate' 
        ? { conversions: 0 } 
        : arpuInputMethod === 'aggregated'
          ? { total_revenue: 0, conversion_count: 0 }
          : { price_counts: [{ price: 0, count: 0 }] }
      )
    }
    setGroups([...groups, newGroup])
  }

  const removeGroup = (index: number) => {
    if (groups.length > 2) {
      setGroups(groups.filter((_, i) => i !== index))
    }
  }

  const updateGroup = (index: number, field: string, value: any) => {
    const newGroups = [...groups]
    newGroups[index] = { ...newGroups[index], [field]: value }
    setGroups(newGroups)
  }

  const addPriceCount = (groupIndex: number) => {
    const newGroups = [...groups]
    if (!newGroups[groupIndex].price_counts) {
      newGroups[groupIndex].price_counts = []
    }
    newGroups[groupIndex].price_counts!.push({ price: 0, count: 0 })
    setGroups(newGroups)
  }

  const removePriceCount = (groupIndex: number, priceIndex: number) => {
    const newGroups = [...groups]
    if (newGroups[groupIndex].price_counts && newGroups[groupIndex].price_counts!.length > 1) {
      newGroups[groupIndex].price_counts!.splice(priceIndex, 1)
      setGroups(newGroups)
    }
  }

  const updatePriceCount = (groupIndex: number, priceIndex: number, updates: Partial<PriceCount>) => {
    const newGroups = [...groups]
    if (newGroups[groupIndex].price_counts) {
      newGroups[groupIndex].price_counts![priceIndex] = {
        ...newGroups[groupIndex].price_counts![priceIndex],
        ...updates
      }
      setGroups(newGroups)
    }
  }

  const loadExampleData = () => {
    if (analysisType === 'conversion_rate') {
      setGroups([
        { name: 'Control', users: 1000, conversions: 73 },
        { name: 'Treatment', users: 1000, conversions: 126 }
      ])
    } else {
      if (arpuInputMethod === 'aggregated') {
        setGroups([
          { name: 'Control', users: 1000, total_revenue: 2899.50, conversion_count: 73 },
          { name: 'Treatment', users: 1000, total_revenue: 6174.00, conversion_count: 126 }
        ])
      } else {
        setGroups([
          { 
            name: 'Control', 
            users: 1000, 
            price_counts: [
              { price: 39.99, count: 50 },
              { price: 49.99, count: 23 }
            ]
          },
          { 
            name: 'Treatment', 
            users: 1000, 
            price_counts: [
              { price: 39.99, count: 86 },
              { price: 49.99, count: 40 }
            ]
          }
        ])
      }
    }
  }

  // Handle switching between ARPU input methods
  const handleArpuMethodChange = (method: 'aggregated' | 'detailed') => {
    setArpuInputMethod(method)
    
    // Clear conflicting data when switching methods
    const newGroups = groups.map(group => {
      const baseGroup = { name: group.name, users: group.users }
      
      if (method === 'aggregated') {
        // Switch to aggregated: remove price_counts, keep/add total_revenue and conversion_count
        return {
          ...baseGroup,
          total_revenue: group.total_revenue || 0,
          conversion_count: group.conversion_count || 0
        }
      } else {
        // Switch to detailed: remove total_revenue and conversion_count, add price_counts
        return {
          ...baseGroup,
          price_counts: group.price_counts || [{ price: 0, count: 0 }]
        }
      }
    })
    
    setGroups(newGroups)
  }

  return (
    <div className="space-y-6">
      <Tabs
        selectedKey={inputMethod}
        onSelectionChange={(key) => setInputMethod(key as 'json' | 'form')}
        className="w-full"
      >
        <Tab key="form" title="Quick Setup">
          <div className="space-y-6 mt-4">
            {/* Step 1: Choose Analysis Type */}
            <Card className="border-2 border-primary/20">
              <CardHeader className="pb-3">
                <h3 className="text-lg font-semibold flex items-center gap-2">
                  <span className="flex items-center justify-center w-6 h-6 rounded-full bg-primary text-white text-sm font-bold">1</span>
                  Configure your analysis
                </h3>
              </CardHeader>
              <CardBody className="pt-0 space-y-4">
                <div className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                  Choose what metric you want to analyze and set your statistical parameters
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <Button
                    variant={analysisType === 'conversion_rate' ? 'solid' : 'bordered'}
                    color={analysisType === 'conversion_rate' ? 'primary' : 'default'}
                    onPress={() => {
                      setAnalysisType('conversion_rate')
                      loadExampleData()
                    }}
                    className="h-auto p-4 justify-start"
                  >
                    <div className="text-left">
                      <div className="font-medium">Conversion Rate</div>
                      <div className="text-xs opacity-70">How many users converted?</div>
                    </div>
                  </Button>
                  <Button
                    variant={analysisType === 'arpu' ? 'solid' : 'bordered'}
                    color={analysisType === 'arpu' ? 'primary' : 'default'}
                    onPress={() => {
                      setAnalysisType('arpu')
                      loadExampleData()
                    }}
                    className="h-auto p-4 justify-start"
                  >
                    <div className="text-left">
                      <div className="font-medium">Revenue (ARPU)</div>
                      <div className="text-xs opacity-70">How much money per user?</div>
                    </div>
                  </Button>
                </div>

                <div className="flex flex-col sm:flex-row gap-3">
                  <InputWithTooltip
                    type="number"
                    label="Significance Level (α)"
                    value={alpha.toString()}
                    onChange={(e) => setAlpha(parseFloat(e.target.value) || 0.05)}
                    step="0.01"
                    min="0.01"
                    max="0.1"
                    size="md"
                    description="Statistical threshold for significance (commonly 0.05)"
                    className="flex-1"
                    variant="bordered"
                    tooltip="How strict you want to be. 0.05 = 95% confidence, 0.01 = 99% confidence. Lower = more strict."
                  />
                  <Button
                    variant="flat"
                    onPress={loadExampleData}
                    startContent={<Lightbulb size={16} />}
                    className="sm:w-auto w-full"
                  >
                    Load Example Data
                  </Button>
                </div>
              </CardBody>
            </Card>

            {/* Step 2: Enter Data */}
            <Card className="border-2 border-primary/20">
              <CardHeader className="pb-3 flex-row justify-between items-center">
                <h3 className="text-lg font-semibold flex items-center gap-2">
                  <span className="flex items-center justify-center w-6 h-6 rounded-full bg-primary text-white text-sm font-bold">2</span>
                  Enter your experiment data
                </h3>
                <Button
                  size="sm"
                  variant="flat"
                  onPress={addGroup}
                  startContent={<Plus size={14} />}
                >
                  Add Group
                </Button>
              </CardHeader>
              <CardBody className="pt-0 space-y-4">
                {/* ARPU Input Method Toggle */}
                {analysisType === 'arpu' && (
                  <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                    <RadioGroup
                      label="Revenue Input Method"
                      value={arpuInputMethod}
                      onValueChange={(value) => handleArpuMethodChange(value as 'aggregated' | 'detailed')}
                      orientation="horizontal"
                      size="sm"
                    >
                      <Radio value="aggregated">📊 Aggregated (Total Revenue + Conversions)</Radio>
                      <Radio value="detailed">🔍 Detailed (Individual Price Points)</Radio>
                    </RadioGroup>
                  </div>
                )}

                {/* Data Input Tables */}
                {analysisType === 'conversion_rate' ? (
                  <Table aria-label="Conversion rate experiment groups" removeWrapper>
                    <TableHeader>
                      <TableColumn>GROUP NAME</TableColumn>
                      <TableColumn>USERS</TableColumn>
                      <TableColumn>CONVERSIONS</TableColumn>
                      <TableColumn>ACTION</TableColumn>
                    </TableHeader>
                    <TableBody>
                      {groups.map((group, index) => (
                        <TableRow key={index}>
                          <TableCell>
                            <InputWithTooltip
                              size="sm"
                              value={group.name}
                              onChange={(e) => updateGroup(index, 'name', e.target.value)}
                              variant="bordered"
                              tooltip="Give each group a clear name (Control, Treatment A, etc.)"
                            />
                          </TableCell>
                          <TableCell>
                            <InputWithTooltip
                              size="sm"
                              type="number"
                              value={group.users.toString()}
                              onChange={(e) => updateGroup(index, 'users', parseInt(e.target.value) || 0)}
                              variant="bordered"
                              tooltip="Total users who saw this version (e.g., 1000)"
                            />
                          </TableCell>
                          <TableCell>
                            <InputWithTooltip
                              size="sm"
                              type="number"
                              value={(group.conversions || 0).toString()}
                              onChange={(e) => updateGroup(index, 'conversions', parseInt(e.target.value) || 0)}
                              variant="bordered"
                              tooltip="Users who took action (signed up, bought, etc.)"
                            />
                          </TableCell>
                          <TableCell>
                            {groups.length > 2 && (
                              <Button
                                size="sm"
                                color="danger"
                                variant="light"
                                isIconOnly
                                onPress={() => removeGroup(index)}
                              >
                                <Trash2 size={14} />
                              </Button>
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                ) : arpuInputMethod === 'aggregated' ? (
                  <Table aria-label="ARPU aggregated experiment groups" removeWrapper>
                    <TableHeader>
                      <TableColumn>GROUP NAME</TableColumn>
                      <TableColumn>USERS</TableColumn>
                      <TableColumn>TOTAL REVENUE</TableColumn>
                      <TableColumn>CONVERSIONS</TableColumn>
                      <TableColumn>ACTION</TableColumn>
                    </TableHeader>
                    <TableBody>
                      {groups.map((group, index) => (
                        <TableRow key={index}>
                          <TableCell>
                            <InputWithTooltip
                              size="sm"
                              value={group.name}
                              onChange={(e) => updateGroup(index, 'name', e.target.value)}
                              variant="bordered"
                              tooltip="Give each group a clear name (Control, Treatment A, etc.)"
                            />
                          </TableCell>
                          <TableCell>
                            <InputWithTooltip
                              size="sm"
                              type="number"
                              value={group.users.toString()}
                              onChange={(e) => updateGroup(index, 'users', parseInt(e.target.value) || 0)}
                              variant="bordered"
                              tooltip="Total users who saw this version (e.g., 1000)"
                            />
                          </TableCell>
                          <TableCell>
                            <InputWithTooltip
                              size="sm"
                              type="number"
                              step="0.01"
                              value={(group.total_revenue || 0).toString()}
                              onChange={(e) => updateGroup(index, 'total_revenue', parseFloat(e.target.value) || 0)}
                              variant="bordered"
                              startContent="$"
                              tooltip="Total money made from this group (e.g., $2,500)"
                            />
                          </TableCell>
                          <TableCell>
                            <InputWithTooltip
                              size="sm"
                              type="number"
                              value={(group.conversion_count || 0).toString()}
                              onChange={(e) => updateGroup(index, 'conversion_count', parseInt(e.target.value) || 0)}
                              variant="bordered"
                              tooltip="How many users actually paid (must be ≤ total users)"
                            />
                          </TableCell>
                          <TableCell>
                            {groups.length > 2 && (
                              <Button
                                size="sm"
                                color="danger"
                                variant="light"
                                isIconOnly
                                onPress={() => removeGroup(index)}
                              >
                                <Trash2 size={14} />
                              </Button>
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                ) : (
                  <div className="space-y-4">
                    {groups.map((group, groupIndex) => (
                      <Card key={groupIndex} className="border border-gray-200 dark:border-gray-700">
                        <CardHeader className="pb-2">
                          <div className="flex justify-between items-center w-full">
                            <InputWithTooltip
                              size="sm"
                              value={group.name}
                              onChange={(e) => updateGroup(groupIndex, 'name', e.target.value)}
                              variant="bordered"
                              className="flex-1 mr-2"
                              tooltip="Give each group a clear name (Control, Treatment A, etc.)"
                            />
                            {groups.length > 2 && (
                              <Button
                                size="sm"
                                color="danger"
                                variant="light"
                                isIconOnly
                                onPress={() => removeGroup(groupIndex)}
                              >
                                <Trash2 size={14} />
                              </Button>
                            )}
                          </div>
                        </CardHeader>
                        <CardBody className="space-y-3">
                          <InputWithTooltip
                            size="sm"
                            type="number"
                            label="Total Users"
                            value={group.users.toString()}
                            onChange={(e) => updateGroup(groupIndex, 'users', parseInt(e.target.value) || 0)}
                            variant="bordered"
                            tooltip="Total users who saw this version (e.g., 1000)"
                          />
                          
                          <div className="space-y-2">
                            <div className="flex justify-between items-center">
                              <span className="text-sm font-medium">Price Points</span>
                              <Button
                                size="sm"
                                variant="flat"
                                onPress={() => addPriceCount(groupIndex)}
                                startContent={<Plus size={12} />}
                              >
                                Add Price
                              </Button>
                            </div>
                            
                            {(group.price_counts || []).map((priceCount, priceIndex) => (
                              <div key={priceIndex} className="flex gap-2 items-end">
                                <InputWithTooltip
                                  size="sm"
                                  type="number"
                                  step="0.01"
                                  label="Price"
                                  value={priceCount.price.toString()}
                                  onChange={(e) => updatePriceCount(groupIndex, priceIndex, { 
                                    price: parseFloat(e.target.value) || 0 
                                  })}
                                  variant="bordered"
                                  startContent="$"
                                  className="flex-1"
                                  tooltip="Price of this tier ($39.99, $49.99, or $0 for free)"
                                />
                                <InputWithTooltip
                                  size="sm"
                                  type="number"
                                  label="Count"
                                  value={priceCount.count.toString()}
                                  onChange={(e) => updatePriceCount(groupIndex, priceIndex, { 
                                    count: parseInt(e.target.value) || 0 
                                  })}
                                  variant="bordered"
                                  className="flex-1"
                                  tooltip="How many users paid this exact price"
                                />
                                {(group.price_counts?.length || 0) > 1 && (
                                  <Button
                                    size="sm"
                                    color="danger"
                                    variant="light"
                                    isIconOnly
                                    onPress={() => removePriceCount(groupIndex, priceIndex)}
                                  >
                                    <Trash2 size={12} />
                                  </Button>
                                )}
                              </div>
                            ))}
                          </div>
                        </CardBody>
                      </Card>
                    ))}
                  </div>
                )}

                {/* Quick Stats Preview */}
                {groups.length > 0 && groups[0].users > 0 && (
                  <div className="mt-4 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                    <div className="text-sm font-medium mb-2">Quick Preview:</div>
                    <div className="grid grid-cols-2 gap-4 text-xs">
                      {groups.map((group, index) => (
                        <div key={index}>
                          <span className="font-medium">{group.name}:</span>{' '}
                          {analysisType === 'conversion_rate' 
                            ? `${((group.conversions || 0) / group.users * 100).toFixed(1)}% conversion`
                            : `$${((group.total_revenue || 0) / group.users).toFixed(2)} ARPU`
                          }
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </CardBody>
            </Card>

            {/* Analyze Button */}
            <Button
              color="primary"
              size="lg"
              onPress={handleFormSubmit}
              isLoading={loading}
              startContent={!loading && <Upload size={20} />}
              className="w-full"
            >
              {loading ? 'Analyzing...' : 'Analyze Experiment'}
            </Button>
          </div>
        </Tab>

        <Tab key="json" title="JSON Import">
          <div className="space-y-4 mt-4">
            <Textarea
              label="Experiment Data (JSON)"
              placeholder='{"analysis_type": "conversion_rate", "alpha": 0.05, "groups": [...]}'
              value={jsonInput}
              onChange={(e) => setJsonInput(e.target.value)}
              minRows={10}
              maxRows={20}
            />
            
            <Button
              color="primary"
              size="lg"
              onPress={handleJsonSubmit}
              isLoading={loading}
              startContent={!loading && <Upload size={20} />}
              className="w-full"
            >
              {loading ? 'Analyzing...' : 'Analyze JSON Data'}
            </Button>
          </div>
        </Tab>
      </Tabs>
    </div>
  )
} 