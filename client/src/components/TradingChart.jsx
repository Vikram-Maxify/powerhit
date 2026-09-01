import React, {
  useEffect,
  useRef,
} from "react";
import {
  createChart,
  CandlestickSeries,
  LineSeries,
} from "lightweight-charts";
import { useSelector } from "react-redux";

function calculateMA(candles, period) {
  const result = [];

  for (
    let i = period - 1;
    i < candles.length;
    i++
  ) {
    let sum = 0;

    for (
      let j = i - period + 1;
      j <= i;
      j++
    ) {
      sum += candles[j].close;
    }

    result.push({
      time: candles[i].time,
      value: sum / period,
    });
  }

  return result;
}

export default function TradingChart() {
  const containerRef =
    useRef(null);

  const chartRef =
    useRef(null);

  const candleRef =
    useRef(null);

  const fastRef =
    useRef(null);

  const slowRef =
    useRef(null);

  const candlesRef =
    useRef([]);

  const currentValue =
    useSelector(
      (state) =>
        state.trading.currentValue
    );

  useEffect(() => {
    if (!containerRef.current) {
      return;
    }

    const container =
      containerRef.current;

    const chart = createChart(
      container,
      {
        width: container.clientWidth,
        height: 520,

        layout: {
          background: {
            color: "#ffffff",
          },
          textColor: "#6b7280",
        },

        grid: {
          vertLines: {
            color: "#e5e7eb",
          },
          horzLines: {
            color: "#e5e7eb",
          },
        },

        rightPriceScale: {
          borderColor: "#e5e7eb",
        },

        timeScale: {
          borderColor: "#e5e7eb",
          timeVisible: true,
          secondsVisible: false,
        },

        crosshair: {
          mode: 1,
        },
      }
    );

    chartRef.current = chart;

    const candle =
      chart.addSeries(
        CandlestickSeries,
        {
          upColor: "#22c55e",
          downColor: "#ef4444",
          borderUpColor: "#22c55e",
          borderDownColor: "#ef4444",
          wickUpColor: "#22c55e",
          wickDownColor: "#ef4444",
          priceLineVisible: true,
          lastValueVisible: true,
        }
      );

    const fast =
      chart.addSeries(
        LineSeries,
        {
          color: "#ff9f43",
          lineWidth: 2,
          priceLineVisible: false,
          lastValueVisible: false,
        }
      );

    const slow =
      chart.addSeries(
        LineSeries,
        {
          color: "#e879f9",
          lineWidth: 2,
          priceLineVisible: false,
          lastValueVisible: false,
        }
      );

    candleRef.current = candle;
    fastRef.current = fast;
    slowRef.current = slow;

    const initial =
      Number(currentValue) || 107960;

    const now =
      Math.floor(Date.now() / 1000);

    const candles = [];

    let value = initial;

    for (
      let i = 120;
      i >= 0;
      i--
    ) {
      const time =
        now - i * 60;

      const open = value;

      const move =
        (Math.random() - 0.5) *
        value *
        0.003;

      const close =
        open + move;

      const high =
        Math.max(open, close) +
        Math.random() *
          value *
          0.0015;

      const low =
        Math.min(open, close) -
        Math.random() *
          value *
          0.0015;

      candles.push({
        time,
        open,
        high,
        low,
        close,
      });

      value = close;
    }

    candlesRef.current =
      candles;

    candle.setData(candles);

    fast.setData(
      calculateMA(candles, 9)
    );

    slow.setData(
      calculateMA(candles, 21)
    );

    chart.timeScale().fitContent();

    const resize =
      new ResizeObserver(() => {
        chart.applyOptions({
          width:
            container.clientWidth,
        });
      });

    resize.observe(container);

    return () => {
      resize.disconnect();
      chart.remove();
      chartRef.current = null;
      candleRef.current = null;
      fastRef.current = null;
      slowRef.current = null;
    };
  }, []);

  useEffect(() => {
    if (!candleRef.current) return;

    const value =
      Number(currentValue);

    if (!Number.isFinite(value)) {
      return;
    }

    const candles =
      candlesRef.current;

    if (!candles.length) return;

    const last =
      candles[candles.length - 1];

    const updated = {
      time: last.time,
      open: last.open,
      high: Math.max(
        last.high,
        value
      ),
      low: Math.min(
        last.low,
        value
      ),
      close: value,
    };

    candles[candles.length - 1] =
      updated;

    candleRef.current.update(
      updated
    );

    fastRef.current?.setData(
      calculateMA(candles, 9)
    );

    slowRef.current?.setData(
      calculateMA(candles, 21)
    );
  }, [currentValue]);

  return (
    <div
      ref={containerRef}
      style={{
        width: "100%",
        minHeight: 520,
      }}
    />
  );
}
