/**
 * Performance monitoring and optimization utilities
 */

interface PerformanceMetric {
  name: string
  value: number
  timestamp: number
  metadata?: Record<string, any>
}

class PerformanceMonitor {
  private metrics: PerformanceMetric[] = []
  private timers: Map<string, number> = new Map()

  /**
   * Start timing an operation
   */
  startTimer(name: string): void {
    this.timers.set(name, performance.now())
  }

  /**
   * End timing an operation and record the metric
   */
  endTimer(name: string, metadata?: Record<string, any>): number {
    const startTime = this.timers.get(name)
    if (!startTime) {
      console.warn(`Timer '${name}' was not started`)
      return 0
    }

    const duration = performance.now() - startTime
    this.timers.delete(name)

    this.recordMetric(name, duration, metadata)
    return duration
  }

  /**
   * Record a performance metric
   */
  recordMetric(name: string, value: number, metadata?: Record<string, any>): void {
    this.metrics.push({
      name,
      value,
      timestamp: Date.now(),
      metadata
    })

    // Keep only last 100 metrics to prevent memory leaks
    if (this.metrics.length > 100) {
      this.metrics = this.metrics.slice(-100)
    }
  }

  /**
   * Get performance metrics
   */
  getMetrics(name?: string): PerformanceMetric[] {
    if (name) {
      return this.metrics.filter(metric => metric.name === name)
    }
    return [...this.metrics]
  }

  /**
   * Get average performance for a metric
   */
  getAveragePerformance(name: string): number {
    const metrics = this.getMetrics(name)
    if (metrics.length === 0) return 0

    const sum = metrics.reduce((acc, metric) => acc + metric.value, 0)
    return sum / metrics.length
  }

  /**
   * Clear all metrics
   */
  clearMetrics(): void {
    this.metrics = []
    this.timers.clear()
  }

  /**
   * Log performance summary
   */
  logSummary(): void {
    const summary = this.metrics.reduce((acc, metric) => {
      if (!acc[metric.name]) {
        acc[metric.name] = { count: 0, total: 0, min: Infinity, max: -Infinity }
      }
      
      acc[metric.name].count++
      acc[metric.name].total += metric.value
      acc[metric.name].min = Math.min(acc[metric.name].min, metric.value)
      acc[metric.name].max = Math.max(acc[metric.name].max, metric.value)
      
      return acc
    }, {} as Record<string, { count: number; total: number; min: number; max: number }>)

    console.table(
      Object.entries(summary).map(([name, stats]) => ({
        Metric: name,
        Count: stats.count,
        Average: `${(stats.total / stats.count).toFixed(2)}ms`,
        Min: `${stats.min.toFixed(2)}ms`,
        Max: `${stats.max.toFixed(2)}ms`
      }))
    )
  }
}

// Global performance monitor instance
export const performanceMonitor = new PerformanceMonitor()

/**
 * Decorator for timing function execution
 */
export function timed(name?: string) {
  return function (target: any, propertyKey: string, descriptor: PropertyDescriptor) {
    const originalMethod = descriptor.value
    const timerName = name || `${target.constructor.name}.${propertyKey}`

    descriptor.value = async function (...args: any[]) {
      performanceMonitor.startTimer(timerName)
      try {
        const result = await originalMethod.apply(this, args)
        performanceMonitor.endTimer(timerName, { success: true })
        return result
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error'
        performanceMonitor.endTimer(timerName, { success: false, error: errorMessage })
        throw error
      }
    }

    return descriptor
  }
}

/**
 * Measure Web Vitals
 */
export function measureWebVitals() {
  if (typeof window === 'undefined') return

  // Measure Largest Contentful Paint (LCP)
  new PerformanceObserver((list) => {
    const entries = list.getEntries()
    const lastEntry = entries[entries.length - 1]
    performanceMonitor.recordMetric('LCP', lastEntry.startTime)
  }).observe({ entryTypes: ['largest-contentful-paint'] })

  // Measure First Input Delay (FID)
  new PerformanceObserver((list) => {
    const entries = list.getEntries()
    entries.forEach((entry: any) => {
      performanceMonitor.recordMetric('FID', entry.processingStart - entry.startTime)
    })
  }).observe({ entryTypes: ['first-input'] })

  // Measure Cumulative Layout Shift (CLS)
  let clsValue = 0
  new PerformanceObserver((list) => {
    const entries = list.getEntries()
    entries.forEach((entry: any) => {
      if (!entry.hadRecentInput) {
        clsValue += entry.value
      }
    })
    performanceMonitor.recordMetric('CLS', clsValue)
  }).observe({ entryTypes: ['layout-shift'] })
}

/**
 * Debounce function for performance optimization
 */
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout | null = null

  return (...args: Parameters<T>) => {
    if (timeout) clearTimeout(timeout)
    timeout = setTimeout(() => func(...args), wait)
  }
}

/**
 * Throttle function for performance optimization
 */
export function throttle<T extends (...args: any[]) => any>(
  func: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle: boolean = false

  return (...args: Parameters<T>) => {
    if (!inThrottle) {
      func(...args)
      inThrottle = true
      setTimeout(() => (inThrottle = false), limit)
    }
  }
}

/**
 * Lazy load images with Intersection Observer
 */
export function lazyLoadImages(selector: string = 'img[data-src]'): void {
  if (typeof window === 'undefined' || !('IntersectionObserver' in window)) return

  const images = document.querySelectorAll(selector)
  
  const imageObserver = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        const img = entry.target as HTMLImageElement
        const src = img.dataset.src
        
        if (src) {
          img.src = src
          img.removeAttribute('data-src')
          imageObserver.unobserve(img)
        }
      }
    })
  })

  images.forEach((img) => imageObserver.observe(img))
}

/**
 * Preload critical resources
 */
export function preloadResource(href: string, as: string, type?: string): void {
  if (typeof document === 'undefined') return

  const link = document.createElement('link')
  link.rel = 'preload'
  link.href = href
  link.as = as
  if (type) link.type = type

  document.head.appendChild(link)
}

/**
 * Memory usage monitoring
 */
export function getMemoryUsage(): Record<string, number> | null {
  if (typeof performance === 'undefined' || !('memory' in performance)) {
    return null
  }

  const memory = (performance as any).memory
  return {
    usedJSHeapSize: memory.usedJSHeapSize,
    totalJSHeapSize: memory.totalJSHeapSize,
    jsHeapSizeLimit: memory.jsHeapSizeLimit
  }
}

/**
 * Bundle size analyzer (development only)
 */
export function analyzeBundleSize(): void {
  if (process.env.NODE_ENV !== 'development') return

  const scripts = Array.from(document.querySelectorAll('script[src]'))
  const styles = Array.from(document.querySelectorAll('link[rel="stylesheet"]'))

  console.group('Bundle Analysis')
  
  scripts.forEach((script: any) => {
    fetch(script.src, { method: 'HEAD' })
      .then(response => {
        const size = response.headers.get('content-length')
        if (size) {
          console.log(`Script: ${script.src} - ${(parseInt(size) / 1024).toFixed(2)}KB`)
        }
      })
      .catch(() => {})
  })

  styles.forEach((style: any) => {
    fetch(style.href, { method: 'HEAD' })
      .then(response => {
        const size = response.headers.get('content-length')
        if (size) {
          console.log(`Style: ${style.href} - ${(parseInt(size) / 1024).toFixed(2)}KB`)
        }
      })
      .catch(() => {})
  })

  console.groupEnd()
}