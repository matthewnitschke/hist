import { TextAttributes } from "@opentui/core";
import { useEffect, useState } from "react";
import { Histogram } from "./Histogram";

export interface ProcessedItem {
  text: string;
  count: number;
}

export function App() {
  let [items, setItems] = useState<ProcessedItem[]>([]);

  useEffect(() => {
    Bun.file(process.argv[2]!)
      .text()
      .then((content) => {
        let lines = content.split('\n').filter(line => line.trim() !== '');
        let frequencyMap = new Map<string, number>();
        
        lines.forEach(line => {
          const count = frequencyMap.get(line) || 0;
          frequencyMap.set(line, count + 1);
        });
        
        const processedItems: ProcessedItem[] = Array.from(frequencyMap.entries())
          .map(([text, count]) => ({ text, count }))
          .sort((a, b) => b.count - a.count);
        
        setItems(processedItems);
      })
  }, [])

  if (items.length === 0) {
    return (
      <box flexDirection="column" flexGrow={1} padding={2}>
        <box marginBottom={1}>
          <text attributes={TextAttributes.BOLD}>Hist - Input Processor</text>
        </box>
        <box alignItems="center" justifyContent="center" flexGrow={1}>
          <text attributes={TextAttributes.DIM}>No input data available</text>
        </box>
      </box>
    );
  }
  
  return (
    <box
      flexDirection="column"
      padding={2}
      flexGrow={1}
      height="100%"
      alignItems="center"
    >
      <box marginBottom={1}>
        <text attributes={TextAttributes.BOLD}>Histogram</text>
      </box>
      <Histogram items={items} />
    </box>
  );
}



function ItemList({ items }: { items: ProcessedItem[] }) {
  if (items.length === 0) {
    return (
      <box alignItems="center" justifyContent="center" flexGrow={1}>
        <text attributes={TextAttributes.DIM}>No input data available</text>
      </box>
    );
  }
  
  return (
    <box flexDirection="column" flexGrow={1}>
      <box marginBottom={1}>
        <text attributes={TextAttributes.BOLD}>
          {items.length} unique items
        </text>
      </box>
      <box flexDirection="column" flexGrow={1}>
        {items.map((item, index) => (
          <box key={`${index}-${item.text}`} justifyContent="space-between" marginBottom={1}>
            <text>{item.text}</text>
            <text attributes={TextAttributes.DIM}>({item.count})</text>
          </box>
        ))}
      </box>
    </box>
  );
}