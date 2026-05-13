import { useEffect, useRef, useMemo } from "react";
import Chart from "chart.js/auto";

function MahdarsActivityChart({ mahdars }) {
    const canvasRef = useRef(null);
    const chartRef = useRef(null);

    const { labels, counts, total, peakDay, peakCount, peakIdx } = useMemo(() => {
        const now = new Date();
        const days = Array.from({ length: 30 }, (_, i) => {
            const d = new Date(now);
            d.setDate(now.getDate() - (29 - i));
            return d;
        });

        const counts = days.map(day => {
            const dayStr = day.toDateString();
            return mahdars.filter(m => new Date(m.created_at).toDateString() === dayStr).length;
        });

        const labels = days.map(d =>
            d.toLocaleDateString("en-GB", { day: "numeric", month: "short" })
        );

        const total = counts.reduce((a, b) => a + b, 0);
        const peakVal = Math.max(...counts);
        const peakIdx = counts.indexOf(peakVal);

        return {
            labels,
            counts,
            total,
            peakDay: labels[peakIdx],
            peakCount: peakVal,
            peakIdx,
        };
    }, [mahdars]);

    useEffect(() => {
        if (!canvasRef.current) return;
        if (chartRef.current) chartRef.current.destroy();

        const isDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
        const lineColor = "#1D9E75";
        const fillColor = isDark ? "rgba(29,158,117,0.12)" : "rgba(29,158,117,0.08)";
        const gridColor = isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.05)";
        const tickColor = isDark ? "rgba(255,255,255,0.35)" : "rgba(0,0,0,0.35)";

        chartRef.current = new Chart(canvasRef.current, {
            type: "line",
            data: {
                labels,
                datasets: [{
                    data: counts,
                    borderColor: lineColor,
                    borderWidth: 2,
                    pointRadius: counts.map((v, i) => i === peakIdx ? 5 : v > 0 ? 3 : 0),
                    pointBackgroundColor: counts.map((_, i) => i === peakIdx ? lineColor : "transparent"),
                    pointBorderColor: lineColor,
                    pointBorderWidth: 2,
                    backgroundColor: fillColor,
                    fill: true,
                    tension: 0.4,
                }],
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { display: false },
                    tooltip: {
                        backgroundColor: isDark ? "#1a1a1a" : "#fff",
                        borderColor: isDark ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.1)",
                        borderWidth: 1,
                        titleColor: isDark ? "#fff" : "#111",
                        bodyColor: isDark ? "rgba(255,255,255,0.6)" : "rgba(0,0,0,0.5)",
                        titleFont: { size: 12, weight: "500" },
                        bodyFont: { size: 12 },
                        padding: 10,
                        cornerRadius: 8,
                        displayColors: false,
                        callbacks: {
                            title: items => items[0].label,
                            label: item => `${item.raw} mahdar${item.raw !== 1 ? "s" : ""}`,
                        },
                    },
                },
                scales: {
                    x: {
                        grid: { display: false },
                        border: { display: false },
                        ticks: { color: tickColor, font: { size: 11 }, maxTicksLimit: 6, maxRotation: 0 },
                    },
                    y: {
                        grid: { color: gridColor },
                        border: { display: false },
                        ticks: { color: tickColor, font: { size: 11 }, stepSize: 1, maxTicksLimit: 4, callback: v => Math.round(v) },
                        min: 0,
                    },
                },
            },
        });

        return () => chartRef.current?.destroy();
    }, [labels, counts, peakIdx]);

    return (
        <div style={{
            background: "#fff",
            border: "1px solid #e8e7ea",
            borderRadius: "14px",
            padding: "20px 22px 16px",
            marginBottom: "20px",
            boxShadow: "0 2px 8px rgba(26,46,34,0.05)",
            fontFamily: "'DM Sans', system-ui, sans-serif",
        }}>
            {/* Header stats */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "20px" }}>
                <div>
                    <p style={{ fontSize: "11px", fontWeight: "600", letterSpacing: "0.07em", textTransform: "uppercase", color: "#b0adb5", margin: "0 0 4px" }}>Activity</p>
                    <p style={{ fontSize: "24px", fontWeight: "600", color: "#1a2e22", margin: 0 }}>{total}</p>
                    <p style={{ fontSize: "12px", color: "#b0adb5", margin: "3px 0 0" }}>mahdars in the last 30 days</p>
                </div>
                {peakCount > 0 && (
                    <div style={{ textAlign: "right" }}>
                        <p style={{ fontSize: "11px", fontWeight: "600", letterSpacing: "0.07em", textTransform: "uppercase", color: "#b0adb5", margin: "0 0 4px" }}>Peak day</p>
                        <p style={{ fontSize: "13px", fontWeight: "600", color: "#1a2e22", margin: 0 }}>{peakDay}</p>
                        <p style={{ fontSize: "12px", color: "#b0adb5", margin: "3px 0 0" }}>{peakCount} mahdar{peakCount !== 1 ? "s" : ""}</p>
                    </div>
                )}
            </div>

            {/* Chart */}
            <div style={{ position: "relative", width: "100%", height: "120px" }}>
                <canvas ref={canvasRef} role="img" aria-label="Line chart of daily mahdar creation over the last 30 days" />
            </div>

            {/* Axis labels */}
            <div style={{ display: "flex", justifyContent: "space-between", marginTop: "8px" }}>
                <span style={{ fontSize: "11px", color: "#b0adb5" }}>{labels[0]}</span>
                <span style={{ fontSize: "11px", color: "#b0adb5" }}>Today</span>
            </div>
        </div>
    );
}

export default MahdarsActivityChart;