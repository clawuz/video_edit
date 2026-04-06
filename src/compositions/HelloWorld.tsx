import { AbsoluteFill, useCurrentFrame, useVideoConfig, interpolate } from "remotion";

export const HelloWorld: React.FC = () => {
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();

  const opacity = interpolate(frame, [0, 20], [0, 1], {
    extrapolateRight: "clamp",
  });

  const scale = interpolate(frame, [0, 20], [0.8, 1], {
    extrapolateRight: "clamp",
  });

  return (
    <AbsoluteFill
      style={{
        backgroundColor: "#0b84f3",
        justifyContent: "center",
        alignItems: "center",
      }}
    >
      <div
        style={{
          opacity,
          transform: `scale(${scale})`,
          color: "white",
          fontSize: 80,
          fontWeight: "bold",
          fontFamily: "sans-serif",
        }}
      >
        Hello World!
      </div>
    </AbsoluteFill>
  );
};
