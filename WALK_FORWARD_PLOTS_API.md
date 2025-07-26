# Walk Forward Optimization Plots API Integration Guide

This guide explains how to integrate walk forward optimization plots into your frontend application using the new API endpoints.

## API Endpoints

### 1. Fetch Full Result with Plots
```
GET /api/walkforward-optimization-results/{id}/
```

Returns a complete result object including all plot image URLs in the `plots` field.

### 2. Fetch Individual Plot Images
```
GET /api/walkforward-optimization-result/{id}/plot-image/{plot_type}/
```

Returns a JSON object with the `image_url` for the specific plot type.

## Available Plot Types

- `split_graph` - Train/Validation Split Graph
- `equity_trend` - Equity Trend Over Folds
- `return_trend` - Return Trend Over Folds
- `max_drawdown` - Maximum Drawdown Over Folds
- `sharpe_ratio` - Sharpe Ratio Over Folds
- `trades` - Number of Trades Over Folds

## Frontend Integration Examples

### Method 1: Fetch Full Result (Recommended)

```javascript
// Fetch the API Data
const response = await fetch('/api/walkforward-optimization-results/16/');
const data = await response.json();

// Extract Image URLs
const plots = data.plots; // e.g., { split_graph: { image_url: ... }, equity_trend: { image_url: ... }, ... }

// Display Images in Your Component
<img src={plots.split_graph.image_url} alt="Train/Validation Split" />
<img src={plots.equity_trend.image_url} alt="Equity Trend" />
<img src={plots.return_trend.image_url} alt="Return Trend" />
<img src={plots.max_drawdown.image_url} alt="Max Drawdown" />
<img src={plots.sharpe_ratio.image_url} alt="Sharpe Ratio" />
<img src={plots.trades.image_url} alt="Number of Trades" />
```

### Method 2: Dynamic Plot Rendering

```javascript
// Loop through all available plots
{Object.entries(plots).map(([plotType, plotData]) => (
  <div key={plotType}>
    <h4>{plotType.replace('_', ' ').toUpperCase()}</h4>
    <img src={plotData.image_url} alt={plotType} style={{ maxWidth: '100%' }} />
  </div>
))}
```

### Method 3: Individual Plot Loading

```javascript
// Use the Direct Plot Image Endpoint
const response = await fetch('/api/walkforward-optimization-result/16/plot-image/split_graph/');
const data = await response.json();
// Returns: { image_url: "..." }

<img src={data.image_url} alt="Split Graph" />
```

## React Component Example

```jsx
import React, { useState, useEffect } from 'react';

function WalkForwardPlots({ optimizationId }) {
  const [data, setData] = useState(null);
  const [plots, setPlots] = useState({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const response = await fetch(`/api/walkforward-optimization-results/${optimizationId}/`);
        const result = await response.json();
        
        setData(result);
        if (result.plots) {
          setPlots(result.plots);
        }
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    if (optimizationId) {
      fetchData();
    }
  }, [optimizationId]);

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;
  if (!data) return <div>No data available</div>;

  return (
    <div>
      {/* Summary Data */}
      <div className="summary">
        <h3>Summary</h3>
        <p>Status: {data.status}</p>
        <p>z-statistic: {data.z_statistic?.toFixed(4) || 'N/A'}</p>
        <p>p-value: {data.p_value?.toFixed(4) || 'N/A'}</p>
        <p>Hypothesis Decision: {data.hypothesis_decision || 'N/A'}</p>
      </div>

      {/* Plot Images */}
      <div className="plots">
        <h3>Plots</h3>
        <div className="plot-grid">
          {Object.entries(plots).map(([plotType, plotData]) => (
            <div key={plotType} className="plot-item">
              <h4>{plotType.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}</h4>
              <img 
                src={plotData.image_url} 
                alt={plotType} 
                style={{ maxWidth: '100%' }}
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
```

## Vue.js Component Example

```vue
<template>
  <div>
    <div v-if="loading">Loading...</div>
    <div v-else-if="error">Error: {{ error }}</div>
    <div v-else-if="data">
      <!-- Summary Data -->
      <div class="summary">
        <h3>Summary</h3>
        <p>Status: {{ data.status }}</p>
        <p>z-statistic: {{ formatNumber(data.z_statistic) }}</p>
        <p>p-value: {{ formatNumber(data.p_value) }}</p>
        <p>Hypothesis Decision: {{ data.hypothesis_decision || 'N/A' }}</p>
      </div>

      <!-- Plot Images -->
      <div class="plots">
        <h3>Plots</h3>
        <div class="plot-grid">
          <div 
            v-for="(plotData, plotType) in plots" 
            :key="plotType" 
            class="plot-item"
          >
            <h4>{{ formatPlotName(plotType) }}</h4>
            <img 
              :src="plotData.image_url" 
              :alt="plotType" 
              style="max-width: 100%"
            />
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  props: {
    optimizationId: {
      type: Number,
      required: true
    }
  },
  data() {
    return {
      data: null,
      plots: {},
      loading: false,
      error: null
    };
  },
  async mounted() {
    await this.fetchData();
  },
  methods: {
    async fetchData() {
      this.loading = true;
      try {
        const response = await fetch(`/api/walkforward-optimization-results/${this.optimizationId}/`);
        const result = await response.json();
        
        this.data = result;
        if (result.plots) {
          this.plots = result.plots;
        }
      } catch (err) {
        this.error = err.message;
      } finally {
        this.loading = false;
      }
    },
    formatNumber(value) {
      return value ? value.toFixed(4) : 'N/A';
    },
    formatPlotName(plotType) {
      return plotType.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
    }
  }
};
</script>
```

## Angular Component Example

```typescript
import { Component, Input, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';

@Component({
  selector: 'app-walk-forward-plots',
  template: `
    <div>
      <div *ngIf="loading">Loading...</div>
      <div *ngIf="error">Error: {{ error }}</div>
      <div *ngIf="data && !loading">
        <!-- Summary Data -->
        <div class="summary">
          <h3>Summary</h3>
          <p>Status: {{ data.status }}</p>
          <p>z-statistic: {{ formatNumber(data.z_statistic) }}</p>
          <p>p-value: {{ formatNumber(data.p_value) }}</p>
          <p>Hypothesis Decision: {{ data.hypothesis_decision || 'N/A' }}</p>
        </div>

        <!-- Plot Images -->
        <div class="plots">
          <h3>Plots</h3>
          <div class="plot-grid">
            <div 
              *ngFor="let plot of plots | keyvalue" 
              class="plot-item"
            >
              <h4>{{ formatPlotName(plot.key) }}</h4>
              <img 
                [src]="plot.value.image_url" 
                [alt]="plot.key" 
                style="max-width: 100%"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  `
})
export class WalkForwardPlotsComponent implements OnInit {
  @Input() optimizationId!: number;
  
  data: any = null;
  plots: { [key: string]: { image_url: string } } = {};
  loading = false;
  error: string | null = null;

  constructor(private http: HttpClient) {}

  ngOnInit() {
    this.fetchData();
  }

  async fetchData() {
    this.loading = true;
    try {
      const result = await this.http.get(`/api/walkforward-optimization-results/${this.optimizationId}/`).toPromise();
      this.data = result;
      if (result && (result as any).plots) {
        this.plots = (result as any).plots;
      }
    } catch (err: any) {
      this.error = err.message;
    } finally {
      this.loading = false;
    }
  }

  formatNumber(value: number | undefined): string {
    return value ? value.toFixed(4) : 'N/A';
  }

  formatPlotName(plotType: string): string {
    return plotType.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  }
}
```

## Error Handling

```javascript
// Handle loading and errors as needed
if (!data) return <div>Loading...</div>;
if (data.error) return <div>Error: {data.error}</div>;

// For individual plot loading
try {
  const response = await fetch(`/api/walkforward-optimization-result/${id}/plot-image/${plotType}/`);
  if (!response.ok) {
    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
  }
  const data = await response.json();
  // Use data.image_url
} catch (error) {
  console.error('Failed to load plot:', error);
  // Handle error (show fallback, retry button, etc.)
}
```

## Styling Recommendations

```css
.plot-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 1rem;
  margin: 1rem 0;
}

.plot-item {
  background: white;
  padding: 1rem;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
}

.plot-item img {
  width: 100%;
  height: auto;
  border-radius: 4px;
}

.plot-item h4 {
  margin-bottom: 0.5rem;
  color: #333;
  font-weight: 600;
}
```

## Best Practices

1. **Use Method 1 (Full Result)** for initial load when you need all plots
2. **Use Method 3 (Individual Plots)** for lazy loading or when you only need specific plots
3. **Implement proper error handling** for network failures
4. **Add loading states** to improve user experience
5. **Use responsive design** for plot display
6. **Cache plot images** when appropriate to reduce API calls
7. **Implement retry logic** for failed plot loads

## Testing

Test your integration with a known optimization ID (e.g., 16):

```javascript
// Test the full result endpoint
const response = await fetch('/api/walkforward-optimization-results/16/');
const data = await response.json();
console.log('Full result:', data);
console.log('Available plots:', Object.keys(data.plots || {}));

// Test individual plot endpoint
const plotResponse = await fetch('/api/walkforward-optimization-result/16/plot-image/split_graph/');
const plotData = await plotResponse.json();
console.log('Plot data:', plotData);
``` 