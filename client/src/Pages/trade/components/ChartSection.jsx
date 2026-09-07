import { ChevronDown, Plus, ChevronLeft, ChevronRight } from "lucide-react";
import { useState, useEffect, useRef, useMemo } from "react";
import ReactApexChart from "react-apexcharts";
import { useDispatch, useSelector } from "react-redux";
import { getBetGrapgResult } from "../../../redux/slices/tradingReducer";
import {
  FaArrowDown,
  FaArrowUp,
  FaPlus,
  FaRegStar,
  FaSearch,
  FaStar,
  FaTimes,
  FaWindowClose,
} from "react-icons/fa";
import flag1 from "../assets/universalImage/circle-flag-of-usa-free-png.webp";
import flag2 from "../assets/universalImage/circle-flag-of-japan-free-png.webp";
import flag3 from "../assets/universalImage/Bangladesh-512.webp";
import flag4 from "../assets/universalImage/brazil.webp";
import flag5 from "../assets/universalImage/can.webp";
import flag6 from "../assets/universalImage/col.webp";
import flag7 from "../assets/universalImage/turky.webp";
import { useNavigate } from "react-router";
import { subscribeSocket } from "../Redux/socket";

function ChartSection({ investment }) {
  const dispatch = useDispatch();
  const { betResult, allTrade } = useSelector((state) => state.trading);
  const [series, setSeries] = useState([{ data: [] }]);
  const [comming, setComming] = useState(false);
  const [latestPrice, setLatestPrice] = useState("1.44634");
  const [currentCandle, setCurrentCandle] = useState(null);
  const isInitialFetchDone = useRef(false);
  const [xAxisRange, setXAxisRange] = useState({
    min: undefined,
    max: undefined,
  });
  const [touchState, setTouchState] = useState({
    startDistance: null,
    startRange: null
  });
  
  const [zoomOutStep, setZoomOutStep] = useState(2); // values: 0, 1, 2

  // const dragState = useRef({ isDragging: false, startX: 0, startRange: null });

  const [times, setTime] = useState({
    minute: 0,
    secondtime1: 0,
    secondtime2: 0,
  });
  const navigate = useNavigate();

  const [isCandleMoving, setIsCandleMoving] = useState(false);
  const dragState = useRef({
    isDragging: false,
    startX: 0,
    startRange: { min: null, max: null },
    chartX: 0,
    chartWidth: 0,
  });
  const [isManualPan, setIsManualPan] = useState(false);
  const [ann, setAnn] = useState(70);
  const newestCandleTimeRef = useRef(null);
  const liveCandleRef = useRef(null);
  const initialRangeSet = useRef(false);
  const DEFAULT_VISIBLE_CANDLES = 40;
  const CANDLE_INTERVAL = 10000;
  const candleStartTimeRef = useRef(null);
  const initialAnimationDone = useRef(false);
  useEffect(() => {
    if (investment > 0) {
      setAnn(investment);
    }
  }, [investment]);
  // Shared Socket.IO connection for synchronized trading time.
  // This component does not create its own socket.
  useEffect(() => {
    const unsubscribe = subscribeSocket((data) => {
      // Synchronized server clock.
      if (data.event === "timeUpdate_20") {
        setTime({
          minute: Number(data.minute) || 0,
          secondtime1: Number(data.secondtime1) || 0,
          secondtime2: Number(data.secondtime2) || 0,
        });
        return;
      }

      // Real-time candle tick from Socket.IO.
      if (data.event === "candleUpdate" && data.candle) {
        const incoming = data.candle;
        const candleTime = new Date(incoming.x).getTime();
        if (!Number.isFinite(candleTime)) return;

        const live = {
          x: new Date(candleTime),
          y: [
            Number(incoming.open),
            Number(incoming.high),
            Number(incoming.low),
            Number(incoming.close),
          ],
        };

        if (live.y.some((value) => !Number.isFinite(value))) return;

        // Keep the server candle outside Redux so a timer tick / Redux refresh
        // cannot immediately overwrite the live candle with stale OHLC values.
        liveCandleRef.current = live;

        setLatestPrice(live.y[3].toFixed(5));

        // =====================================================
        // LIVE CANDLE UPDATE
        // =====================================================
        // IMPORTANT: update the exact candle by timestamp. Do not wait for
        // Redux/API refresh. The server candleUpdate is the source of truth
        // for the currently forming candle.
        setSeries((prev) => {
          const current = Array.isArray(prev?.[0]?.data)
            ? prev[0].data
            : [];

          const next = [...current];
          const existingIndex = next.findIndex(
            (item) => new Date(item.x).getTime() === candleTime
          );

          if (existingIndex >= 0) {
            // Same candle: replace OHLC so it visibly moves up/down.
            next[existingIndex] = live;
          } else {
            // New candle: add it and keep chronological order.
            next.push(live);
            next.sort(
              (a, b) => new Date(a.x).getTime() - new Date(b.x).getTime()
            );
          }

          return [{
            data: next.slice(-MAX_CANDLE_HISTORY),
          }];
        });

        // Keep the live candle visible and make the price axis follow it.
        setXAxisRange((prev) => {
          const currentMin = Number(prev?.min);
          const currentMax = Number(prev?.max);
          const currentRange =
            Number.isFinite(currentMin) &&
            Number.isFinite(currentMax) &&
            currentMax > currentMin
              ? currentMax - currentMin
              : DEFAULT_VISIBLE_CANDLES * CANDLE_INTERVAL + RIGHT_PADDING;

          const right = Math.max(
            currentMax,
            candleTime + RIGHT_PADDING
          );
          const left = right - currentRange;

          return { min: left, max: right };
        });

        // Use the current server OHLC to keep the candle fully visible.
        setYAxisRange((prev) => {
          const prices = [
            Number(live.y[0]),
            Number(live.y[1]),
            Number(live.y[2]),
            Number(live.y[3]),
          ].filter(Number.isFinite);

          if (!prices.length) return prev;

          const candleMin = Math.min(...prices);
          const candleMax = Math.max(...prices);
          const center = Number(live.y[3]);
          const candleRange = Math.max(candleMax - candleMin, 0.001);
          const padding = Math.max(candleRange * 0.25, 0.00025);

          // Center the visible price range around the live close while still
          // including the live high/low.
          const min = Math.min(candleMin, center - padding);
          const max = Math.max(candleMax, center + padding);

          return {
            min: Number(Math.max(0, min).toFixed(5)),
            max: Number(max.toFixed(5)),
          };
        });
      }
    });

    return unsubscribe;
  }, []);

  // Initial data fetch
  useEffect(() => {
    if (!isInitialFetchDone.current) {
      dispatch(getBetGrapgResult());
      isInitialFetchDone.current = true;
    }
  }, [dispatch]);
  // No periodic Redux/API refresh.
  // The Socket.IO `candleUpdate` event is the live source of truth.
  // Periodic API refresh was causing the chart to jump/reset after several candles.

  // Transform trade data for chart
  const transformedData = useMemo(() => {
    if (!allTrade) return [];
    return allTrade
      .map((trade) => ({
        y: [
          parseFloat(trade.open),
          parseFloat(trade.high),
          parseFloat(trade.low),
          parseFloat(trade.close),
        ],
        x: new Date(trade.x),
      }))
      .sort((a, b) => a.x - b.x); // Ensure chronological order
  }, [allTrade]);

  const prevPriceRef = useRef("1.44634");
  const MIN_ZOOM_RANGE = 100 * 1000;
  const MAX_ZOOM_RANGE = 200 * 1000;
  const DEFAULT_WINDOW_SIZE = 40;
  const MAX_CANDLE_HISTORY = 350;
  const RIGHT_PADDING = 130000;
  const SHIFT_AMOUNT = 5 * 10000;

  const generatePriceMovement = (basePrice) => {
    const direction = betResult > 4 ? 1 : -1;
    const change = direction * (0.00005 + Math.random() * 0.0002);
    return Number((basePrice + change).toFixed(5));
  };

  const latestClose = Number(transformedData[transformedData.length - 1]?.y?.[3]);
  const safeLatestClose = Number.isFinite(latestClose) ? latestClose : Number(latestPrice) || 1.44634;
  const offset = 0.0002;
  // console.log(offset, 'latestClose')

  const [yAxisRange, setYAxisRange] = useState({
    min: safeLatestClose - offset,
    max: safeLatestClose + offset,
  });

  // Chart options configuration
  const options = useMemo(
    () => ({
      chart: {
        type: "candlestick",
        height: 1000,
        background: "#1c1f2d",
        animations: {
          enabled: true,
          easing: "easeinout",
          speed: 800,
          animateGradually: {
            enabled: true,
            delay: 150,
          },
          dynamicAnimation: {
            enabled: true,
            speed: 350,
          },
        },
        toolbar: {
          show: false,
          tools: {
            download: false,
            selection: true,
            zoom: true,
            zoomin: true,
            zoomout: true,
            pan: true,
            reset: true,
          },
          autoSelected: "zoom", // Default to zoom mode
        },
        zoom: {
          enabled: true,
          type: "xy",
          autoScaleYaxis: true,
          limits: {
    y: {
      min: 0.00100, // Minimum y-axis range
      max: undefined
    }
  },
          zoomedArea: {
            fill: {
              color: "#90CAF9",
              opacity: 0.4,
            },
            stroke: {
              color: "#0D47A1",
              opacity: 0.8,
              width: 1,
            },
          },
        },
        pan: { enabled: true, mode: "xy" },
        events: {
          zoomed: (chartContext, { xaxis, yaxis }) => {
            const newMin = xaxis.min;
            const newMax = xaxis.max;
            const zoomRange = newMax - newMin;
            const center = (newMin + newMax) / 2;
            const visibleData = transformedData.filter(
              (d) => d.x >= xaxis.min && d.x <= xaxis.max
            );

            // Calculate min/max of visible prices
            let minPrice = Infinity;
            let maxPrice = -Infinity;

            visibleData.forEach((d) => {
              minPrice = Math.min(minPrice, d.y[2]); // low price
              maxPrice = Math.max(maxPrice, d.y[1]); // high price
            });

            const stepRatio = [1.0, 1.0, 1.0];
            const currentRatio = stepRatio[zoomOutStep];
            const maxAllowedRange = MAX_ZOOM_RANGE / currentRatio;

            // Determine new zoom step
            let newStep = zoomOutStep;
            if (
              zoomRange > maxAllowedRange &&
              zoomOutStep < stepRatio.length - 1
            ) {
              newStep = 2; // Zooming OUT
            } else if (zoomRange < maxAllowedRange && zoomOutStep > 0) {
              newStep = 2; // Zooming IN
            }

            // Only update if step changed
            if (newStep !== zoomOutStep) {
              const newRatio = stepRatio[newStep];

              setXAxisRange({
                min: center - MAX_ZOOM_RANGE / newRatio / 2,
                max: center + MAX_ZOOM_RANGE / newRatio / 2,
              });

              setZoomOutStep(newStep);

              // Update y-axis range based on new zoom level
              const dynamicOffset = getDynamicOffset();
              const latestClose =
                transformedData[transformedData.length - 1]?.y[3] ||
                latestPrice;

              setYAxisRange({
                min: latestClose - dynamicOffset,
                max: latestClose + dynamicOffset,
              });
            } else {
              setXAxisRange({ min: newMin, max: newMax });
            }
          },

          beforeZoom: (chartContext, { xaxis, yaxis }) => {
              // Maintain a minimum zoom level
              const minRange = 30 * 60 * 1000; // 30 minutes in milliseconds
              if (xaxis.max - xaxis.min < minRange) {
                return {
                  xaxis: {
                    min: xaxis.min,
                    max: xaxis.min + minRange,
                  },
                };
              }
              return { xaxis, yaxis };
            },

          mouseDown: (event, chartContext, config) => {
            setIsManualPan(true);
            const xAxis = chartContext.w.globals.minX;
            const xAxisMax = chartContext.w.globals.maxX;
            const chartWidth = chartContext.w.globals.gridWidth;

            dragState.current = {
              isDragging: true,
              startX: event.clientX,
              startRange: { min: xAxis.min, max: xAxis.max },
              chartX: xAxis,
              chartWidth: chartWidth,
            };
          },
          mouseMove: (event, chartContext, config) => {
            if (!dragState.current.isDragging) return;

            const deltaX = event.clientX - dragState.current.startX;
            const timePerPixel =
              (dragState.current.startRange.max -
                dragState.current.startRange.min) /
              dragState.current.chartWidth;

            const transformedDataTimes = transformedData.map((d) =>
              d.x.getTime()
            );
            const oldestCandle = Math.min(...transformedDataTimes);
            const newestCandle =
              Math.max(...transformedDataTimes) + RIGHT_PADDING;

            setXAxisRange((prev) => {
              let newMin =
                dragState.current.startRange.min - deltaX * timePerPixel;
              let newMax =
                dragState.current.startRange.max - deltaX * timePerPixel;

              // Prevent dragging beyond data boundaries
              if (newMax > newestCandle) {
                newMin -= newMax - newestCandle;
                newMax = newestCandle;
              }

              if (newMin < oldestCandle) {
                newMax += oldestCandle - newMin;
                newMin = oldestCandle;
              }

              return {
                min: Math.max(oldestCandle, newMin),
                max: Math.min(newestCandle, newMax),
              };
            });
          },
          mouseUp: () => {
            dragState.current.isDragging = false;
          },
        },
      },

      annotations: {
        yaxis: [
          {
            y: latestClose,
            borderColor: "#fff",
            strokeDashArray: 4,
            label: {
              text: `(${latestClose})`,
              style: {
                color: "#fff",
                background: "#026fd3",
                borderColor: "#026fd3",
              },
            },
          },
        ],
        xaxis: [
          {
            x: latestPrice,
            borderColor: "#775DD0",
            label: {
              style: {
                color: "#fff",
              },
              text: "X-axis annotation - 22 Nov",
            },
          },
        ],
      },
      title: { text: "", align: "left", style: { color: "#e2e8f0" } },
      xaxis: {
        type: "datetime",
        min: xAxisRange.min,
        max: xAxisRange.max,
        labels: {
          style: { colors: "#a0aec0" },
          datetimeFormatter: { hour: "HH:mm", minute: "HH:mm:ss" },
        },
        axisBorder: { color: "#2d3748" },
        axisTicks: { color: "#2d3748" },
        tickPlacement: "on",
        range: undefined, // Let chart auto-calculate range
        tickAmount: "dataPoints", // Show tick for each data point
        group: {
          style: {
            colors: [], // Remove grouping colors
          },
          groups: [], // Remove any grouping
        },
      },
      yaxis: {
        min: yAxisRange.min,
        max: yAxisRange.max,
        tooltip: { enabled: true },
        labels: {
          style: { colors: "#a0aec0" },
          formatter: (val) => val.toFixed(5),
        },
        forceNiceScale: true,
        yxisBorder: { color: "#2d3748" },
        tickAmount: 8,
        stepSize: 4,
        opposite: true,
      },
      transition: {
        enabled: true,
        easing: "easeinout",
        speed: 800,
        animateGradually: {
          enabled: true,
          delay: 150,
        },
      },
      grid: {
        borderColor: "#252a39",
        strokeDashArray: 0,
        xaxis: {
          lines: {
            show: true,
          },
        },
      },
      plotOptions: {
        candlestick: {
          colors: { upward: "#10a055", downward: "#e85b4e" },
          wick: { useFillColor: true },
          barWidth: "100%",
        },
      },
      tooltip: {
        theme: "dark",
        x: { format: "HH:mm:ss" },
        y: { formatter: (val) => val.toFixed(5) },
      },
    }),
    [xAxisRange, transformedData]
  );

  // Calculate dynamic offset based on zoom level
  const getDynamicOffset = () => {
    // Base minimum offset to ensure at least 0.00100 difference
    const baseMinOffset = 0.00050; // Half of 0.00100 since we add to both sides
    
    // Calculate dynamic offset based on visible price range
    if (transformedData.length === 0) return baseMinOffset;
  
    const visibleData = transformedData.filter(
      (d) => d.x.getTime() >= xAxisRange.min && d.x.getTime() <= xAxisRange.max
    );
  
    if (visibleData.length === 0) return baseMinOffset;
  
    // Calculate price range of visible candles
    let minPrice = Infinity;
    let maxPrice = -Infinity;
  
    visibleData.forEach((d) => {
      minPrice = Math.min(minPrice, d.y[2]); // Low price
      maxPrice = Math.max(maxPrice, d.y[1]); // High price
    });
  
    const priceRange = maxPrice - minPrice;
    
    // Use whichever is larger - the actual price range or our minimum offset
    return Math.max(baseMinOffset, priceRange * 0.5); // 0.5 because we add to both sides
  };

  useEffect(() => {
    if (transformedData.length === 0) return;

    const dynamicOffset = getDynamicOffset();
    const close = Number(transformedData[transformedData.length - 1]?.y?.[3]);
    const center = Number.isFinite(close) ? close : Number(latestPrice) || 1.44634;
    const min = Number((center - dynamicOffset).toFixed(5));
    const max = Number((center + dynamicOffset).toFixed(5));

    setYAxisRange((prev) => {
      if (prev.min === min && prev.max === max) return prev;
      return { min, max };
    });
  }, [transformedData, zoomOutStep, latestPrice, xAxisRange.min, xAxisRange.max]);
// Update the y-axis range calculation useEffect
useEffect(() => {
  if (transformedData.length === 0 || !xAxisRange.min || !xAxisRange.max) return;

  const visibleData = transformedData.filter(
    (d) => d.x.getTime() >= xAxisRange.min && d.x.getTime() <= xAxisRange.max
  );

  if (visibleData.length === 0) return;

  // Calculate min/max prices from visible candles
  let minY = Infinity;
  let maxY = -Infinity;

  visibleData.forEach((d) => {
    minY = Math.min(minY, d.y[2]); // Low price
    maxY = Math.max(maxY, d.y[1]); // High price
  });

  // Calculate the required padding to ensure at least 0.00100 difference
  const currentRange = maxY - minY;
  const minRequiredRange = 0.00100;
  
  let padding = 0;
  if (currentRange < minRequiredRange) {
    padding = (minRequiredRange - currentRange) / 2;
  } else {
    // Add 5% padding if we're already above minimum range
    padding = currentRange * 0.05;
  }

  // Apply the padding
  minY -= padding;
  maxY += padding;

  // Ensure we don't go below 0 for currency pairs
  minY = Math.max(0, minY);

  const nextRange = {
    min: Number(minY.toFixed(5)),
    max: Number(maxY.toFixed(5)),
  };

  setYAxisRange((prev) => {
    if (prev.min === nextRange.min && prev.max === nextRange.max) {
      return prev;
    }
    return nextRange;
  });
}, [xAxisRange.min, xAxisRange.max, transformedData]);

  // Remove the existing useEffect that sets yAxisRange based on latestClose

  // console.log("Zoom Out Step:", zoomOutStep);
  // console.log("Initial X-Axis Range:", xAxisRange);

  // Keep the chart data synchronized with Redux only when Redux data changes.
  // IMPORTANT: do not depend on `times` here. The server sends a candleUpdate
  // every second, and resetting series on every timer tick was overwriting the
  // live candle with the older Redux snapshot.
  useEffect(() => {
    if (!transformedData?.length) return;

    setSeries((prev) => {
      const previous = Array.isArray(prev?.[0]?.data)
        ? prev[0].data
        : [];

      const live = liveCandleRef.current;
      const liveTime = live ? new Date(live.x).getTime() : NaN;

      // Start from Redux history, then restore the latest server candle.
      const merged = transformedData.map((candle) => {
        const time = new Date(candle.x).getTime();

        if (
          live &&
          Number.isFinite(liveTime) &&
          time === liveTime
        ) {
          return live;
        }

        return candle;
      });

      // If the server has already moved to a new candle that Redux has not
      // received yet, append that candle so the chart visibly advances.
      if (
        live &&
        Number.isFinite(liveTime) &&
        !merged.some(
          (candle) => new Date(candle.x).getTime() === liveTime
        )
      ) {
        const lastTime = new Date(
          merged[merged.length - 1].x
        ).getTime();

        if (liveTime > lastTime) {
          merged.push(live);
        }
      }

      const nextData = merged.slice(-MAX_CANDLE_HISTORY);

      // Avoid a React/Apex update when OHLC/timestamps are unchanged.
      const prevData = previous;
      if (
        prevData.length === nextData.length &&
        prevData.every((item, index) => {
          const a = item;
          const b = nextData[index];

          return (
            new Date(a.x).getTime() === new Date(b.x).getTime() &&
            a.y?.[0] === b.y?.[0] &&
            a.y?.[1] === b.y?.[1] &&
            a.y?.[2] === b.y?.[2] &&
            a.y?.[3] === b.y?.[3]
          );
        })
      ) {
        return prev;
      }

      return [{ data: nextData }];
    });

    if (!initialAnimationDone.current) {
      initialAnimationDone.current = true;

      const lastCandleTime =
        transformedData[transformedData.length - 1].x.getTime();

      const visibleRange =
        DEFAULT_VISIBLE_CANDLES * CANDLE_INTERVAL;

      setXAxisRange((prev) => {
        const min = lastCandleTime - visibleRange;
        const max = lastCandleTime + RIGHT_PADDING;

        if (prev.min === min && prev.max === max) {
          return prev;
        }

        return { min, max };
      });

      newestCandleTimeRef.current =
        lastCandleTime + RIGHT_PADDING;
    }
  }, [transformedData]);

  // Price movement is driven exclusively by the server Socket.IO
  // `candleUpdate` event. Do not generate or animate prices on the client:
  // doing so would fight the server OHLC values and make the candle appear stuck
  // or jump backwards.

  // Navigation handlers
  // Updated navigation handlers
  const handleMoveLeft = () => {
    setIsManualPan(true);
    if (transformedData.length === 0) return;

    const oldestCandleTime = transformedData[0].x.getTime();
    const currentRange = xAxisRange.max - xAxisRange.min;

    setXAxisRange((prev) => {
      const newMin = Math.max(oldestCandleTime, prev.min - SHIFT_AMOUNT);
      return {
        min: newMin,
        max: newMin + currentRange,
      };
    });
  };

  const handleMoveRight = () => {
    setIsManualPan(true);
    if (transformedData.length === 0) return;

    const newestCandleTime =
      transformedData[transformedData.length - 1].x.getTime() + RIGHT_PADDING;
    const currentRange = xAxisRange.max - xAxisRange.min;

    setXAxisRange((prev) => {
      const newMax = Math.min(newestCandleTime, prev.max + SHIFT_AMOUNT);
      return {
        min: newMax - currentRange,
        max: newMax,
      };
    });
  };

  const handleTouchStart = (e) => {
    if (e.touches.length === 2) {
      const distance = Math.hypot(
        e.touches[0].clientX - e.touches[1].clientX,
        e.touches[0].clientY - e.touches[1].clientY
      );
      setTouchState({
        startDistance: distance,
        startRange: { ...xAxisRange }
      });
    }
  };
  
  const handleTouchMove = (e) => {
    if (e.touches.length === 2 && touchState.startDistance) {
      const currentDistance = Math.hypot(
        e.touches[0].clientX - e.touches[1].clientX,
        e.touches[0].clientY - e.touches[1].clientY
      );
      
      const scale = currentDistance / touchState.startDistance;
      const range = touchState.startRange.max - touchState.startRange.min;
      const newRange = range / scale;
      
      // Calculate center point
      const centerX = (touchState.startRange.min + touchState.startRange.max) / 2;
      
      setXAxisRange({
        min: centerX - newRange / 2,
        max: centerX + newRange / 2
      });
    }
  };

  useEffect(() => {
    const preventDefault = (e) => {
      if (e.touches.length > 1) {
        e.preventDefault();
      }
    };
    
    document.addEventListener('touchmove', preventDefault, { passive: false });
    
    return () => {
      document.removeEventListener('touchmove', preventDefault);
    };
  }, []);

  // Dropdown content state
  const [showButton, SetShowButton] = useState(false);
  const [activeFilter, setActiveFilter] = useState("CURRENCIES");
  const [searchQuery, setSearchQuery] = useState("");
  const [favorites, setFavorites] = useState([]);
  const [navbarOpen, SetNavbarOpen] = useState([]);
  const [index, setIndex] = useState(0);

  const setData = (data) => {
    SetNavbarOpen((prev) => [...prev, data]);
    setIndex(index + 1);
  };

  const filters = ["CURRENCIES"];

  const assets = [
    {
      id: 1,
      pair: "USD/JPY",
      type: "OTC",
      change: 0.81,
      payout1: 93,
      payout2: 93,
      link: "/SideNavbar",
      flag1: flag1,
      flag2: flag2,
    },
    {
      id: 2,
      pair: "USD/BRL",
      type: "OTC",
      change: -1.22,
      payout1: 86,
      payout2: 86,
      flag1: flag1,
      flag2: flag4,
    },
    {
      id: 3,
      pair: "USD/BDT",
      type: "OTC",
      change: 0.45,
      payout1: 24,
      payout2: 93,
      flag1: flag1,
      flag2: flag3,
    },
    {
      id: 4,
      pair: "USD/TRY",
      type: "OTC",
      change: -0.32,
      payout1: 93,
      payout2: 93,
      flag1: flag1,
      flag2: flag7,
    },
    {
      id: 5,
      pair: "USD/COP",
      type: "OTC",
      change: -0.32,
      payout1: 93,
      payout2: 93,
      flag1: flag1,
      flag2: flag6,
    },
    {
      id: 6,
      pair: "NZD/CAD",
      type: "OTC",
      change: -0.32,
      payout1: 93,
      payout2: 93,
      flag1: flag1,
      flag2: flag5,
    },
  ];

  const filteredAssets = assets.filter(
    (asset) =>
      asset.pair.toLowerCase().includes(searchQuery.toLowerCase()) &&
      activeFilter === "CURRENCIES"
  );

  const FlagIcon = ({ code }) => (
    <img
      src={`https://flagcdn.com/16x12/${code}.png`}
      alt={code}
      className="w-4 h-3 mr-1"
      onError={(e) => {
        e.target.style.display = "none";
      }}
    />
  );

  return (
    <div className="app">
      <div className="chart-container relative">
        {/* Top bar */}
        <div className="items-center gap-2 p-4 z-[10] absolute -top-6 left-0 hidden lg:flex">
          <div>
            <button
              onClick={() => SetShowButton((prev) => !prev)}
              className="bg-[#026fd3] rounded-md text-white p-3"
            >
              <FaPlus className="size-4" />
            </button>
            {showButton && (
              <div className="absolute top-[80px] z-50">
                <div className="bg-[#191919] rounded-lg shadow-md w-[750px] h-[600px] overflow-hidden">
                  {/* Header */}
                  <div className="flex justify-between items-center p-4 border-b border-gray-700">
                    <h3 className="font-semibold text-lg text-white">
                      Select trade pair
                    </h3>
                    <button
                      onClick={() => SetShowButton(false)}
                      className="text-white hover:text-gray-100 bg-[#2e2d2d] p-2 rounded"
                    >
                      <FaTimes />
                    </button>
                  </div>

                  {/* Filters */}
                  <div className="flex p-4 border-b border-gray-700">
                    {filters.map((filter) => (
                      <button
                        key={filter}
                        className={`px-1 text-xs font-medium ${
                          activeFilter === filter
                            ? " text-white rounded-sm bg-[#026fd3]"
                            : "text-white hover:text-gray-100"
                        }`}
                        onClick={() => setActiveFilter(filter)}
                      >
                        {filter}
                      </button>
                    ))}
                  </div>

                  {/* Search and Favorites */}
                  <div className="flex justify-between items-center p-4 border-b border-gray-700">
                    <div className="flex items-center text-gray-500 border p-1 px-2 rounded-md border-gray-500">
                      {favorites.length > 0 ? (
                        <>
                          <FaStar className="text-yellow-500 mr-1" />
                          <span>{favorites.length}</span>
                        </>
                      ) : (
                        <>
                          <FaRegStar className="mr-1" />
                          <span>0</span>
                        </>
                      )}
                    </div>
                    <div className="relative w-[90%]">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <FaSearch className="text-white" />
                      </div>
                      <input
                        type="text"
                        className="block w-full pl-10 pr-3 py-2 border-none rounded-md leading-5 bg-[#3b3b3b] text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#026fd3] sm:text-sm"
                        placeholder="Search"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                      />
                    </div>
                  </div>

                  {/* Table */}
                  <div className="overflow-y-auto h-[calc(400px-0px)]">
                    <table className="min-w-full divide-y divide-gray-700">
                      <thead className="bg-[#191919] sticky top-0">
                        <tr>
                          <th
                            scope="col"
                            className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider"
                          >
                            Name
                          </th>
                          <th
                            scope="col"
                            className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider hidden md:table-cell"
                          >
                            24h change
                          </th>
                          <th
                            scope="col"
                            className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider"
                          >
                            Profit 30 sec
                          </th>
                          <th
                            scope="col"
                            className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider"
                          >
                            1+ min
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-[#191919] divide-y divide-gray-700">
                        {filteredAssets.map((asset, index) => (
                          <tr
                            key={asset.id}
                            className="hover:bg-[#232323] cursor-pointer"
                            onClick={() => {
                              if (index === 0) {
                                navigate("/SideNavbar");
                                SetShowButton(false);
                              } else {
                                setComming(true);
                              }
                            }}
                          >
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="flex items-center">
                                <button
                                  className="mr-2 text-gray-400 hover:text-yellow-400"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setFavorites((prev) =>
                                      prev.includes(asset.id)
                                        ? prev.filter((id) => id !== asset.id)
                                        : [...prev, asset.id]
                                    );
                                  }}
                                >
                                  <span>
                                    <div className="flex items-center relative w-8">
                                      <img
                                        src={asset.flag1}
                                        alt=""
                                        className="h-5 w-5 overflow-hidden rounded-full object-cover"
                                      />
                                      <img
                                        src={asset.flag2}
                                        alt=""
                                        className="h-5 w-5 overflow-hidden rounded-full object-cover absolute left-2.5"
                                      />
                                    </div>
                                  </span>
                                </button>
                                <div className="flex items-center">
                                  <span className="text-white">
                                    {asset.pair}
                                    <span className="text-gray-400 ml-1">
                                      ({asset.type})
                                    </span>
                                  </span>
                                </div>
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap hidden md:table-cell">
                              <div
                                className={`flex items-center ${
                                  asset.change >= 0
                                    ? "text-green-500"
                                    : "text-red-500"
                                }`}
                              >
                                {asset.change >= 0 ? (
                                  <FaArrowUp className="mr-1" />
                                ) : (
                                  <FaArrowDown className="mr-1" />
                                )}
                                <span>{Math.abs(asset.change)}%</span>
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full text-orange-400">
                                {asset.payout1}%
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full text-orange-400">
                                {asset.payout2}%
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="bg-[#2b3040] rounded py-1 px-2 flex items-center justify-between">
            <div
              onClick={() => SetShowButton((prev) => !prev)}
              className="flex items-center gap-2 cursor-pointer"
            >
              <div className="flex items-center relative w-8">
                <img
                  src={flag1}
                  alt=""
                  className="h-5 w-5 overflow-hidden rounded-full object-cover"
                />
                <img
                  src={flag2}
                  alt=""
                  className="h-5 w-5 overflow-hidden rounded-full object-cover absolute left-2.5"
                />
              </div>
              <div className="flex flex-col">
                <span className="font-semibold text-sm">USD/JPY (OTC)</span>
                <div className="text-[#ffa723] font-semibold text-sm">93%</div>
              </div>
            </div>

            <div>
              {navbarOpen.length > 0 && (
                <div className="relative">
                  <div className="absolute -top-7">
                    <div className="flex gap-2 items-start ml-5">
                      {navbarOpen.slice(0, index).map((item, idx) => (
                        <div
                          key={idx}
                          className="relative bg-[#2b3040] rounded-md"
                        >
                          <div className="flex">
                            <div className="text-white px-7 flex flex-col p-1 items-start">
                              <div>{item.pair}</div>
                              <div>{item.payout1}%</div>
                            </div>
                          </div>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setIndex(index - 1);
                              SetNavbarOpen((prev) =>
                                prev.filter((_, i) => i !== idx)
                              );
                            }}
                            className="p-1 rounded-full absolute top-0 right-0"
                          >
                            <FaWindowClose className="h-3 w-3 text-white" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="time-display text-xs text-gray-300 absolute top-4 right-4">
          {new Date().toLocaleTimeString()} UTC
        </div>

        {/* Navigation controls */}
        <div className="flex justify-center items-center gap-4 mb-2 absolute top-10 right-4 z-10 opacity-100">
          <button
            onClick={handleMoveLeft}
            className="bg-[#026fd3] hover:bg-blue-600 text-white rounded-full p-1 shadow-lg transition"
            title="View older candles"
          >
            <ChevronLeft className="md:h-5 md:w-5 w-4 h-4" />
          </button>
          <button
            onClick={handleMoveRight}
            className="bg-[#026fd3] hover:bg-blue-600 text-white rounded-full p-1 shadow-lg transition"
            title="View newer candles"
          >
            <ChevronRight className="md:h-5 md:w-5 w-4 h-4" />
          </button>
        </div>

        {/* Main chart */}
        <div
          className="chart-wrapper md:pt-1 h-[50vh] lg:h-[88vh]"
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
        >
          <ReactApexChart
            options={options}
            series={series}
            type="candlestick"
            height="100%"
            width="100%"
          />
        </div>
      </div>
      {comming && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-[#2b3040] p-6 rounded-md text-center shadow-lg max-w-lg w-full">
            <h2 className="text-xl font-semibold mb-2">Coming Soon!</h2>
            <p className="text-gray-300">
              This chart is not available at the moment. For technical reasons,
              we cannot show the chart of this pair, please choose another
              trading pair.
            </p>
            <button
              onClick={() => setComming(false)}
              className="mt-4 px-4 py-2 bg-green-500 text-white rounded "
            >
              OK
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default ChartSection;
