export interface PriceCount {
  price: number
  count: number
}

export interface Group {
  name: string
  users: number
  conversions?: number
  price_counts?: PriceCount[]
  total_revenue?: number
  conversion_count?: number
}

export interface ExperimentData {
  analysis_type?: 'arpu' | 'conversion_rate'
  alpha: number
  groups: Group[]
}

export interface GroupStats {
  name: string
  users: number
  conversions?: number
  conversion_rate?: number
  conversion_rate_ci?: [number, number]
  arpu?: number
  arpu_ci?: [number, number]
  total_revenue?: number
  avg_conversion_value?: number
  std_error?: number
}

export interface Comparison {
  group1: string
  group2: string
  difference: number
  difference_ci: [number, number]
  p_value: number
  is_significant: boolean
  z_score: number
  metric_type: 'arpu' | 'conversion_rate'
}

export interface AnalysisResult {
  groups: GroupStats[]
  comparisons: Comparison[]
  bestGroup: string | null
  hasSignificantDifference: boolean
  alpha?: number
  bonferroni_alpha?: number
}

export interface SampleSizeInput {
  confidence_level: number
  power: number
  effect_size: number
  baseline_rate?: number
  baseline_arpu?: number
  baseline_std?: number
  analysis_type: 'conversion_rate' | 'arpu'
}

export interface SampleSizeResult {
  sample_size_per_group: number
  total_sample_size: number
  assumptions: {
    confidence_level: number
    power: number
    effect_size: number
    baseline_metric?: number
    baseline_std?: number
  }
} 