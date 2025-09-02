import { ExperimentData, GroupStats, Comparison, AnalysisResult, Group, PriceCount } from '@/types'

// Normal distribution functions
function normalCDF(x: number): number {
  return (1 + erf(x / Math.sqrt(2))) / 2
}

function normalPPF(p: number): number {
  // Beasley-Springer-Moro algorithm for inverse normal CDF
  const a = [0, -3.969683028665376e+01, 2.209460984245205e+02, -2.759285104469687e+02, 1.383577518672690e+02, -3.066479806614716e+01, 2.506628277459239e+00]
  const b = [0, -5.447609879822406e+01, 1.615858368580409e+02, -1.556989798598866e+02, 6.680131188771972e+01, -1.328068155288572e+01]
  const c = [0, -7.784894002430293e-03, -3.223964580411365e-01, -2.400758277161838e+00, -2.549732539343734e+00, 4.374664141464968e+00, 2.938163982698783e+00]
  const d = [0, 7.784695709041462e-03, 3.224671290700398e-01, 2.445134137142996e+00, 3.754408661907416e+00]

  if (p < 0.02425) {
    const q = Math.sqrt(-2 * Math.log(p))
    return (((((c[1] * q + c[2]) * q + c[3]) * q + c[4]) * q + c[5]) * q + c[6]) / ((((d[1] * q + d[2]) * q + d[3]) * q + d[4]) * q + 1)
  } else if (p < 0.97575) {
    const q = p - 0.5
    const r = q * q
    return (((((a[1] * r + a[2]) * r + a[3]) * r + a[4]) * r + a[5]) * r + a[6]) * q / (((((b[1] * r + b[2]) * r + b[3]) * r + b[4]) * r + b[5]) * r + 1)
  } else {
    const q = Math.sqrt(-2 * Math.log(1 - p))
    return -(((((c[1] * q + c[2]) * q + c[3]) * q + c[4]) * q + c[5]) * q + c[6]) / ((((d[1] * q + d[2]) * q + d[3]) * q + d[4]) * q + 1)
  }
}

function erf(x: number): number {
  // Abramowitz and Stegun approximation
  const a1 = 0.254829592
  const a2 = -0.284496736
  const a3 = 1.421413741
  const a4 = -1.453152027
  const a5 = 1.061405429
  const p = 0.3275911

  const sign = x >= 0 ? 1 : -1
  x = Math.abs(x)

  const t = 1.0 / (1.0 + p * x)
  const y = 1.0 - (((((a5 * t + a4) * t) + a3) * t + a2) * t + a1) * t * Math.exp(-x * x)

  return sign * y
}

// Calculate group statistics
function calculateGroupStats(group: Group, alpha: number = 0.05): GroupStats {
  const stats: GroupStats = {
    name: group.name,
    users: group.users
  }

  if (group.conversions !== undefined) {
    // Conversion rate analysis
    const conversions = group.conversions
    const conversionRate = conversions / group.users
    const se = Math.sqrt((conversionRate * (1 - conversionRate)) / group.users)
    const zCritical = normalPPF(1 - alpha / 2)
    
    stats.conversions = conversions
    stats.conversion_rate = conversionRate
    stats.conversion_rate_ci = [
      Math.max(0, conversionRate - zCritical * se),
      Math.min(1, conversionRate + zCritical * se)
    ]
  }

  if (group.price_counts || (group.total_revenue !== undefined && group.conversion_count !== undefined)) {
    // ARPU analysis
    let totalRevenue: number
    let conversionCount: number

    if (group.price_counts) {
      totalRevenue = group.price_counts.reduce((sum, pc) => sum + pc.price * pc.count, 0)
      conversionCount = group.price_counts.reduce((sum, pc) => sum + pc.count, 0)
    } else {
      totalRevenue = group.total_revenue!
      conversionCount = group.conversion_count!
    }

    const arpu = totalRevenue / group.users
    
    // Calculate revenue variance
    let revenues: number[] = []
    if (group.price_counts) {
      // Create individual revenue array
      group.price_counts.forEach(pc => {
        for (let i = 0; i < pc.count; i++) {
          revenues.push(pc.price)
        }
      })
      // Add zeros for non-converted users
      for (let i = 0; i < group.users - conversionCount; i++) {
        revenues.push(0)
      }
    } else {
      // Approximate revenue distribution
      const avgConversionValue = totalRevenue / conversionCount
      for (let i = 0; i < conversionCount; i++) {
        revenues.push(avgConversionValue)
      }
      for (let i = 0; i < group.users - conversionCount; i++) {
        revenues.push(0)
      }
    }

    const mean = revenues.reduce((sum, r) => sum + r, 0) / revenues.length
    const variance = revenues.reduce((sum, r) => sum + Math.pow(r - mean, 2), 0) / (revenues.length - 1)
    const se = Math.sqrt(variance / group.users)
    const zCritical = normalPPF(1 - alpha / 2)

    stats.arpu = arpu
    stats.arpu_ci = [
      arpu - zCritical * se,
      arpu + zCritical * se
    ]
    stats.total_revenue = totalRevenue
    stats.avg_conversion_value = conversionCount > 0 ? totalRevenue / conversionCount : 0
    stats.std_error = se
  }

  return stats
}

// Perform pairwise comparison
function performComparison(group1: GroupStats, group2: GroupStats, metricType: 'arpu' | 'conversion_rate', alpha: number): Comparison {
  let difference: number
  let se: number
  let metric1: number
  let metric2: number

  if (metricType === 'conversion_rate') {
    metric1 = group1.conversion_rate!
    metric2 = group2.conversion_rate!
    difference = metric2 - metric1

    // Standard error for difference in proportions
    const p1 = metric1
    const p2 = metric2
    const n1 = group1.users
    const n2 = group2.users
    
    se = Math.sqrt((p1 * (1 - p1)) / n1 + (p2 * (1 - p2)) / n2)
  } else {
    metric1 = group1.arpu!
    metric2 = group2.arpu!
    difference = metric2 - metric1

    // Standard error for difference in means
    const se1 = group1.std_error!
    const se2 = group2.std_error!
    se = Math.sqrt(se1 * se1 + se2 * se2)
  }

  const zScore = se > 0 ? difference / se : 0
  const pValue = 2 * (1 - normalCDF(Math.abs(zScore)))
  const isSignificant = pValue < alpha

  const zCritical = normalPPF(1 - alpha / 2)
  const differenceCi: [number, number] = [
    difference - zCritical * se,
    difference + zCritical * se
  ]

  return {
    group1: group1.name,
    group2: group2.name,
    difference,
    difference_ci: differenceCi,
    p_value: pValue,
    is_significant: isSignificant,
    z_score: zScore,
    metric_type: metricType
  }
}

// Main analysis function
export function analyzeExperiment(data: ExperimentData): AnalysisResult {
  const alpha = data.alpha || 0.05
  const analysisType = data.analysis_type || (data.groups[0].conversions !== undefined ? 'conversion_rate' : 'arpu')
  
  // Calculate group statistics
  const groupStats = data.groups.map(group => calculateGroupStats(group, alpha))

  // Perform pairwise comparisons
  const comparisons: Comparison[] = []
  const numGroups = groupStats.length
  const bonferroniAlpha = alpha / (numGroups * (numGroups - 1) / 2)

  for (let i = 0; i < numGroups; i++) {
    for (let j = i + 1; j < numGroups; j++) {
      const comparison = performComparison(
        groupStats[i], 
        groupStats[j], 
        analysisType, 
        bonferroniAlpha
      )
      comparisons.push(comparison)
    }
  }

  // Determine best group
  let bestGroup: string | null = null
  const hasSignificantDifference = comparisons.some(c => c.is_significant)

  if (hasSignificantDifference) {
    if (analysisType === 'conversion_rate') {
      const bestGroupStats = groupStats.reduce((best, current) => 
        (current.conversion_rate || 0) > (best.conversion_rate || 0) ? current : best
      )
      bestGroup = bestGroupStats.name
    } else {
      const bestGroupStats = groupStats.reduce((best, current) => 
        (current.arpu || 0) > (best.arpu || 0) ? current : best
      )
      bestGroup = bestGroupStats.name
    }
  }

  return {
    groups: groupStats,
    comparisons,
    bestGroup,
    hasSignificantDifference,
    alpha,
    bonferroni_alpha: bonferroniAlpha
  }
} 