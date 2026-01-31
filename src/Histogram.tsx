import { TextAttributes } from "@opentui/core";
import { useState } from "react";
import type { ProcessedItem } from "./App";

const BAR_CHAR = "█";
const GRID_CHAR = "─";
const CHART_HEIGHT = 17;
const MAX_BAR_HEIGHT = CHART_HEIGHT - 1;
const BAR_WIDTH = 2;
const GAP_WIDTH = 1;
const COLUMN_WIDTH = BAR_WIDTH + GAP_WIDTH;
const Y_AXIS_WIDTH = 4;
const CHART_LEFT_PADDING = 1;
const NUM_Y_TICKS = 6;
const BAR_COLOR = "#7aa2f7";
const BAR_COLOR_HOVERED = "#5a82d7";
const GRID_COLOR = "#6b7280";
const TABLE_ROW_HOVER_BG = "#374151";
const TABLE_SCROLL_HEIGHT = 25;
const DEFAULT_MAX_SECTIONS = 30;
const OTHER_LABEL = "Other";

/** Round value up to a "nice" axis bound (1, 2, 5, 10 * 10^n). */
function roundUpToNice(value: number): number {
  if (value <= 0) return 1;
  const magnitude = Math.pow(10, Math.floor(Math.log10(value)));
  const normalized = value / magnitude;
  let nice: number;
  if (normalized <= 1) nice = 1;
  else if (normalized <= 2) nice = 2;
  else if (normalized <= 5) nice = 5;
  else nice = 10;
  return nice * magnitude;
}

/** Generate evenly spaced tick values from lo to hi (inclusive). */
function generateYTicks(lo: number, hi: number, count: number): number[] {
  if (count <= 1) return [hi];
  const step = (hi - lo) / (count - 1);
  return Array.from({ length: count }, (_, i) => Math.round(lo + i * step));
}

export interface HistogramProps {
  items: ProcessedItem[];
  maxBarHeight?: number;
  maxSections?: number;
}

export function Histogram({
  items,
  maxBarHeight = MAX_BAR_HEIGHT,
  maxSections = DEFAULT_MAX_SECTIONS,
}: HistogramProps) {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  if (items.length === 0) {
    return (
      <box flexDirection="column" flexGrow={1} alignItems="center" justifyContent="center">
        <text attributes={TextAttributes.DIM}>No data to display</text>
      </box>
    );
  }

  const displayItems: ProcessedItem[] =
    items.length <= maxSections
      ? items
      : [
          ...items.slice(0, maxSections - 1),
          {
            text: OTHER_LABEL,
            count: items
              .slice(maxSections - 1)
              .reduce((sum, item) => sum + item.count, 0),
          },
        ];

  const maxCount = Math.max(...displayItems.map((item) => item.count), 1);
  const yMax = roundUpToNice(maxCount);
  const yTicksAsc = generateYTicks(0, yMax, NUM_Y_TICKS);
  const barHeights = displayItems.map((item) =>
    Math.floor((item.count / yMax) * maxBarHeight)
  );
  const chartRows = maxBarHeight + 1;
  const yAxisWidth = Math.max(Y_AXIS_WIDTH, String(yMax).length);
  const chartWidth =
    yAxisWidth +
    CHART_LEFT_PADDING * 2 +
    displayItems.length * COLUMN_WIDTH;
  const hoveredItem = hoveredIndex !== null ? displayItems[hoveredIndex] : undefined;

  return (
    <box
      flexDirection="column"
      flexGrow={1}
      height="100%"
      minHeight={0}
      alignItems="center"
    >
      {/* Chart area: Y-axis + grid + vertical bars (fixed height, does not shrink) */}
      <box
        flexDirection="column"
        width={chartWidth}
        height={CHART_HEIGHT}
      >
        {Array.from({ length: chartRows }, (_, y) => {
          const nTicks = yTicksAsc.length;
          const range = chartRows - 1;
          const step = Math.ceil(range / (nTicks - 1));
          const tickRows = Array.from(
            { length: nTicks },
            (_, i) => (i === nTicks - 1 ? range : Math.min(i * step, range))
          );
          const isTick = tickRows.includes(y);
          const valueIndex = isTick
            ? nTicks - 1 - tickRows.lastIndexOf(y)
            : 0;
          const displayValue = isTick ? yTicksAsc[valueIndex] : 0;
          const yLabel = isTick
            ? String(displayValue).padStart(yAxisWidth)
            : " ".repeat(yAxisWidth);

          return (
            <box key={y} flexDirection="row" alignItems="center">
              <box width={yAxisWidth}>
                <text>{yLabel}</text>
              </box>
              <box width={CHART_LEFT_PADDING} />
              <box width={CHART_LEFT_PADDING}>
                <text>
                  <span fg={GRID_COLOR}>{GRID_CHAR.repeat(CHART_LEFT_PADDING)}</span>
                </text>
              </box>
              <box flexDirection="row">
                {displayItems.map((item, i) => {
                  const barHeight = barHeights[i] ?? 0;
                  const showBlock = y >= chartRows - 1 - barHeight;
                  const isHovered = hoveredIndex === i;
                  const barColor = isHovered ? BAR_COLOR_HOVERED : BAR_COLOR;
                  return (
                    <box
                      key={`${i}-${item.text}`}
                      width={COLUMN_WIDTH}
                      flexDirection="row"
                      onMouseMove={() => setHoveredIndex(i)}
                    >
                      <text>
                        {showBlock ? (
                          <span fg={barColor}>{BAR_CHAR.repeat(BAR_WIDTH)}</span>
                        ) : (
                          <span fg={GRID_COLOR}>{GRID_CHAR.repeat(BAR_WIDTH)}</span>
                        )}
                      </text>
                      {GAP_WIDTH > 0 && (
                        <box width={GAP_WIDTH}>
                          <text>
                            <span fg={GRID_COLOR}>{GRID_CHAR.repeat(GAP_WIDTH)}</span>
                          </text>
                        </box>
                      )}
                    </box>
                  );
                })}
              </box>
            </box>
          );
        })}
      </box>

      {/* Hover value display underneath chart - left-aligned within chart width */}
      <box width={chartWidth} height={1} marginBottom={1} marginTop={1}>
        {hoveredItem && (
          <text>
            <span fg={BAR_COLOR_HOVERED}>{hoveredItem.text}</span>
            <span fg="grey">: </span>
            <span>{hoveredItem.count}</span>
          </text>
        )}
      </box>

      {/* Table: Capture group | Count - same width as chart, stretches for scrollbox height */}
      <box
        flexDirection="column"
        width={chartWidth}
        flexGrow={1}
        minHeight={0}
        alignSelf="stretch"
        onMouseMove={() => setHoveredIndex(null)}
      >
        <box flexDirection="row" marginBottom={1}>
          <box flexGrow={1}>
            <text attributes={TextAttributes.BOLD}>Group</text>
          </box>
          <box width={8} justifyContent="flex-end">
            <text attributes={TextAttributes.BOLD}>Count</text>
          </box>
        </box>
        <box marginBottom={1}>
          <text>
            <span fg={GRID_COLOR}>{"─".repeat(chartWidth)}</span>
          </text>
        </box>
        <box flexGrow={1} minHeight={0}>
          <scrollbox
            height={TABLE_SCROLL_HEIGHT}
            paddingTop={1}
            focused
          >
          {displayItems.map((item, i) => {
            const isRowHovered = hoveredIndex === i;
            return (
              <box
                key={`${i}-${item.text}`}
                flexDirection="row"
                justifyContent="space-between"
                marginBottom={1}
                backgroundColor={isRowHovered ? TABLE_ROW_HOVER_BG : undefined}
              >
                <box flexGrow={1}>
                  <text>{item.text}</text>
                </box>
                <box width={8} justifyContent="flex-end">
                  <text>{item.count}</text>
                </box>
              </box>
            );
          })}
          </scrollbox>
        </box>
      </box>
    </box>
  );
}
