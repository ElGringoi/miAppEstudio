import React from 'react';
import { View } from 'react-native';
import Svg, { Polygon, Line, Circle, Text as SvgText } from 'react-native-svg';

interface RadarDataPoint {
  label: string;
  value: number; // 0–1
  color: string;
}

interface Props {
  data: RadarDataPoint[];
  size?: number;
}

export function RadarChart({ data, size = 220 }: Props) {
  const cx = size / 2;
  const cy = size / 2;
  const radius = size * 0.36;
  const rings = [0.25, 0.5, 0.75, 1];
  const n = data.length;

  const angleStep = (Math.PI * 2) / n;
  const startAngle = -Math.PI / 2;

  function pointAt(i: number, r: number) {
    const angle = startAngle + i * angleStep;
    return {
      x: cx + r * Math.cos(angle),
      y: cy + r * Math.sin(angle),
    };
  }

  // Polígono de fondo por anillo
  const ringPolygons = rings.map((ring) =>
    Array.from({ length: n }, (_, i) => {
      const p = pointAt(i, radius * ring);
      return `${p.x},${p.y}`;
    }).join(' ')
  );

  // Polígono de datos del hero
  const dataPolygon = data
    .map((d, i) => {
      const p = pointAt(i, radius * Math.min(d.value, 1));
      return `${p.x},${p.y}`;
    })
    .join(' ');

  return (
    <View style={{ width: size, height: size }}>
      <Svg width={size} height={size}>
        {/* Anillos de fondo */}
        {ringPolygons.map((pts, ri) => (
          <Polygon
            key={`ring-${ri}`}
            points={pts}
            fill="none"
            stroke="#334155"
            strokeWidth={1}
          />
        ))}

        {/* Radios */}
        {Array.from({ length: n }, (_, i) => {
          const outer = pointAt(i, radius);
          return (
            <Line
              key={`spoke-${i}`}
              x1={cx} y1={cy}
              x2={outer.x} y2={outer.y}
              stroke="#334155"
              strokeWidth={1}
            />
          );
        })}

        {/* Área de datos */}
        <Polygon
          points={dataPolygon}
          fill="rgba(59,130,246,0.18)"
          stroke="#3b82f6"
          strokeWidth={2}
        />

        {/* Puntos en vértices */}
        {data.map((d, i) => {
          const p = pointAt(i, radius * Math.min(d.value, 1));
          return (
            <Circle
              key={`dot-${i}`}
              cx={p.x} cy={p.y}
              r={4}
              fill={d.color}
              stroke="#0f172a"
              strokeWidth={1.5}
            />
          );
        })}

        {/* Etiquetas */}
        {data.map((d, i) => {
          const p = pointAt(i, radius + 20);
          const anchor =
            p.x < cx - 5 ? 'end' : p.x > cx + 5 ? 'start' : 'middle';
          return (
            <SvgText
              key={`label-${i}`}
              x={p.x}
              y={p.y + 4}
              textAnchor={anchor}
              fontSize={11}
              fontWeight="700"
              fill={d.color}
            >
              {d.label}
            </SvgText>
          );
        })}
      </Svg>
    </View>
  );
}
