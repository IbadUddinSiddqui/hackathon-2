import { ImageResponse } from "next/og";

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export const alt = "AnK's — Pakistani Fashion & Clothing Brand";

export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          background: "linear-gradient(135deg, #111111 0%, #3b2f2f 55%, #6b4f2e 100%)",
          color: "#ffffff",
          fontFamily: "sans-serif",
        }}
      >
        <div style={{ display: "flex", fontSize: 120, fontWeight: 800, letterSpacing: 2 }}>
          AnK&apos;s
        </div>
        <div style={{ display: "flex", fontSize: 34, fontWeight: 500, opacity: 0.85, marginTop: 16 }}>
          Pakistani Fashion &amp; Clothing Brand
        </div>
      </div>
    ),
    { ...size }
  );
}
