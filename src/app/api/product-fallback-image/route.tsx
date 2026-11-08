import { ImageResponse } from "next/og";

export const runtime = "edge";

export async function GET() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "72px",
          background:
            "linear-gradient(135deg, rgb(10, 15, 28) 0%, rgb(23, 40, 70) 58%, rgb(42, 102, 180) 100%)",
          color: "white",
          fontFamily: "Arial, sans-serif",
        }}
      >
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "space-between",
            width: "100%",
            height: "100%",
            padding: "56px",
            borderRadius: 48,
            border: "2px solid rgba(255, 255, 255, 0.14)",
            background: "rgba(255, 255, 255, 0.04)",
          }}
        >
          <div
            style={{
              display: "flex",
              fontSize: 34,
              letterSpacing: 10,
              fontWeight: 700,
              opacity: 0.72,
            }}
          >
            PARTS PASS
          </div>

          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              gap: "22px",
              flex: 1,
              textAlign: "center",
            }}
          >
            <div
              style={{
                display: "flex",
                fontSize: 114,
                lineHeight: 0.95,
                fontWeight: 800,
              }}
            >
              Auto Parts
            </div>
            <div
              style={{
                display: "flex",
                fontSize: 96,
                lineHeight: 0.95,
                fontWeight: 800,
                color: "rgb(132, 195, 255)",
              }}
            >
              Guaranteed Fit
            </div>
          </div>

          <div
            style={{
              display: "flex",
              fontSize: 30,
              lineHeight: 1.2,
              fontWeight: 600,
              color: "rgba(255, 255, 255, 0.76)",
            }}
          >
            Quality replacement parts for your vehicle
          </div>
        </div>
      </div>
    ),
    {
      width: 1200,
      height: 1200,
    },
  );
}
