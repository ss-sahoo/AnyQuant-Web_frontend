"use client"

import { useEffect, useRef } from "react"

export function ChartView() {
  const chartRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!chartRef.current) return

    const drawChart = () => {
      const canvas = document.createElement("canvas")
      const ctx = canvas.getContext("2d")
      if (!ctx) return

      // Set canvas size to match container with proper pixel ratio
      const dpr = window.devicePixelRatio || 1
      const rect = chartRef.current!.getBoundingClientRect()
      canvas.width = rect.width * dpr
      canvas.height = rect.height * dpr
      canvas.style.width = `${rect.width}px`
      canvas.style.height = `${rect.height}px`
      ctx.scale(dpr, dpr)

      // Clear existing content and append canvas
      while (chartRef.current!.firstChild) {
        chartRef.current!.removeChild(chartRef.current!.firstChild)
      }
      chartRef.current!.appendChild(canvas)

      // Draw grid
      ctx.strokeStyle = "#D9E3F1"
      ctx.lineWidth = 1

      // Horizontal grid lines
      const rowCount = 4
      const rowHeight = rect.height / rowCount
      for (let i = 1; i < rowCount; i++) {
        ctx.beginPath()
        ctx.moveTo(0, i * rowHeight)
        ctx.lineTo(rect.width, i * rowHeight)
        ctx.stroke()
      }

      // Vertical grid lines
      const colCount = 6
      const colWidth = rect.width / colCount
      for (let i = 1; i < colCount; i++) {
        ctx.beginPath()
        ctx.moveTo(i * colWidth, 0)
        ctx.lineTo(i * colWidth, rect.height)
        ctx.stroke()
      }

      // Generate candlestick data
      const candleCount = 30
      const candleWidth = rect.width / candleCount
      const candleData = []

      let price = 100
      for (let i = 0; i < candleCount; i++) {
        const change = (Math.random() - 0.5) * 5
        const open = price
        price += change
        const close = price
        const high = Math.max(open, close) + Math.random() * 2
        const low = Math.min(open, close) - Math.random() * 2

        candleData.push({ open, close, high, low })
      }

      // Find min/max for scaling
      const allPrices = candleData.flatMap((candle) => [candle.high, candle.low])
      const minPrice = Math.min(...allPrices)
      const maxPrice = Math.max(...allPrices)
      const priceRange = maxPrice - minPrice

      // Draw candlesticks
      const scaleY = (price: number) => {
        return rect.height - ((price - minPrice) / priceRange) * (rect.height * 0.8) - rect.height * 0.1
      }

      candleData.forEach((candle, i) => {
        const x = i * candleWidth + candleWidth / 2
        const y1 = scaleY(candle.open)
        const y2 = scaleY(candle.close)
        const isUp = candle.close > candle.open

        // Draw wick (high-low line)
        ctx.beginPath()
        ctx.strokeStyle = isUp ? "#0052CC" : "#FF5630"
        ctx.moveTo(x, scaleY(candle.high))
        ctx.lineTo(x, scaleY(candle.low))
        ctx.stroke()

        // Draw body
        ctx.fillStyle = isUp ? "#0052CC" : "#FF5630"
        const bodyHeight = Math.abs(y2 - y1)
        const bodyY = Math.min(y1, y2)
        ctx.fillRect(x - candleWidth * 0.3, bodyY, candleWidth * 0.6, bodyHeight)

        // Draw doji crosses for small candles
        if (bodyHeight < 1) {
          ctx.beginPath()
          ctx.moveTo(x - candleWidth * 0.3, y1)
          ctx.lineTo(x + candleWidth * 0.3, y1)
          ctx.stroke()
        }
      })
    }

    drawChart()

    const handleResize = () => {
      drawChart()
    }

    window.addEventListener("resize", handleResize)
    return () => {
      window.removeEventListener("resize", handleResize)
    }
  }, [])

  return <div ref={chartRef} className="w-full h-[375px] bg-[#EDF2F7] rounded-lg overflow-hidden"></div>
}
