"use client";
import { useId } from "react";

import { bodyTypeForModel, type BodyType } from "@/lib/vehicleBodyType";

/** Side profiles facing left, 44 units tall: body outline, window, wheel centers, and box width. */
const SHAPES: Record<BodyType, { body: string; window: string; wheels: [number, number]; wheelRadius: number; width: number }> = {
  sedan: {
    body: "M 5.4 37 V 29 Q 5.4 25 10.8 24 L 30.6 21 L 41.4 13 Q 45 10 50.4 10 H 68.4 Q 73.8 10 78.3 14 L 86.4 21 L 97.2 23 Q 102.6 24 102.6 29 V 37 Z",
    window: "M 35.1 21 L 43.2 14.5 Q 45.9 12.5 49.5 12.5 H 57.6 V 21 Z M 60.3 21 V 12.5 H 67.5 Q 72 12.5 75.6 15.5 L 81 21 Z",
    wheelRadius: 6.5,
    wheels: [25.2, 84.6],
    width: 107,
  },
  coupe: {
    body: "M 4.5 37 V 29 Q 5.4 25 11.7 24 L 32.4 21 L 46.8 13 Q 50.4 11 55.8 11 H 64.8 Q 71.1 11 77.4 16 L 88.2 22 L 98.1 23.5 Q 103.5 24.5 103.5 29 V 37 Z",
    window: "M 37.8 21 L 47.7 15 Q 51.3 13.5 55.8 13.5 H 63 Q 68.4 13.5 73.8 17 L 79.2 21 Z",
    wheelRadius: 6.5,
    wheels: [24.3, 85.5],
    width: 108,
  },
  hatchback: {
    body: "M 9 37 V 29 Q 9 25 14.4 24 L 29.7 21 L 40.5 12 Q 43.2 10 46.8 10 H 85.5 Q 90 10 91.8 15 L 95.4 25 V 37 Z",
    window: "M 34.2 21 L 42.3 14.5 Q 44.6 12.5 47.7 12.5 H 62.1 V 21 Z M 64.8 21 V 12.5 H 84.6 Q 87.8 12.5 89.1 16 L 90.9 21 Z",
    wheelRadius: 6.5,
    wheels: [26.1, 81],
    width: 99,
  },
  suv: {
    body: "M 3.9 36 V 26 Q 3.9 21.5 8.5 20.5 L 23.2 19 L 27 9.5 Q 28.2 7.5 30.9 7.5 H 83.4 Q 87.3 8.5 88.1 12 L 89.6 23 V 36 Z",
    window: "M 25.9 19 L 29 11 Q 29.7 10 31.6 10 H 47.9 V 19 Z M 50.2 19 V 10 H 66.4 V 19 Z M 68.8 19 V 10 H 82.7 Q 85.4 10 85.7 12.5 L 86.6 19 Z",
    wheelRadius: 7.5,
    wheels: [20.1, 74.2],
    width: 94,
  },
  pickup: {
    body: "M 3.2 36 V 25 Q 3.2 21 7.2 20.5 L 25.6 20 L 32 9 Q 33.2 7.5 35.2 7.5 H 50.4 Q 52 7.5 52 10 V 20 H 92.8 V 36 Z",
    window: "M 28.8 19 L 33.6 10.5 Q 34.4 10 36 10 H 49.6 V 19 Z",
    wheelRadius: 7.5,
    wheels: [20, 76.8],
    width: 97,
  },
  minivan: {
    body: "M 3.2 36 V 26 Q 4 21 9.6 20 L 18.4 18 L 29.6 8 Q 32 6 35.2 6 H 86.4 Q 91.2 6 92 11 L 92.8 36 Z",
    window: "M 23.2 18 L 31.2 10.5 Q 33.2 8.5 36 8.5 H 49.6 V 18 Z M 52 18 V 8.5 H 70.4 V 18 Z M 72.8 18 V 8.5 H 86.4 Q 89.2 8.5 89.6 11.5 L 90 18 Z",
    wheelRadius: 7.5,
    wheels: [20.8, 76.8],
    width: 97,
  },
  van: {
    body: "M 3.1 36 V 24 Q 3.1 20 7 19 L 14 17 L 20.3 6 Q 21.4 4 23.4 4 H 87.4 Q 90.5 4 90.5 8 V 36 Z",
    window: "M 16.4 16.5 L 21.8 7.5 Q 22.6 6.5 24.2 6.5 H 34.3 V 16.5 Z",
    wheelRadius: 7.5,
    wheels: [18.7, 76.4],
    width: 94,
  },
};

type Props = {
  model?: string | null;
  bodyType?: BodyType;
  className?: string;
};

/** Generic outline of the vehicle's body type, since the catalog has no vehicle photos. */
export default function VehicleSilhouette({ model, bodyType, className = "h-8 w-auto" }: Props) {
  const shape = SHAPES[bodyType ?? bodyTypeForModel(model)];
  const maskId = `vehicle-${useId().replace(/[^a-zA-Z0-9-]/g, "")}`;
  return (
    <svg viewBox={`0 0 ${shape.width} 44`} className={className} aria-hidden="true" focusable="false">
      <mask id={maskId}>
        <path d={shape.body} fill="white" />
        <path d={shape.window} fill="black" />
        {shape.wheels.map((cx) => (
          <circle key={cx} cx={cx} cy={34} r={shape.wheelRadius + 2} fill="black" />
        ))}
      </mask>
      <rect width={shape.width} height="44" fill="currentColor" mask={`url(#${maskId})`} />
      {shape.wheels.map((cx) => (
        <circle key={cx} cx={cx} cy={34} r={shape.wheelRadius} fill="currentColor" />
      ))}
    </svg>
  );
}
