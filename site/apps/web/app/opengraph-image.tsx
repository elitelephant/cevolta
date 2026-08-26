import { ImageResponse } from "next/og";

export const runtime = "edge";
export const alt = "Cevolta: recurring payments that live in your wallet";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          padding: "80px",
          background: "#0b1211",
          color: "#ecf2f0",
          fontFamily: "sans-serif",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 40 }}>
          <div
            style={{
              width: 28,
              height: 28,
              borderRadius: "50%",
              background: "#55c1a2",
            }}
          />
          <span style={{ fontSize: 40, fontWeight: 700 }}>Cevolta</span>
        </div>
        <div style={{ fontSize: 56, fontWeight: 800, lineHeight: 1.1, maxWidth: 980 }}>
          A recurring payment that lives in your wallet
        </div>
        <div style={{ fontSize: 28, color: "#8a9994", marginTop: 32 }}>
          Non-custodial · Built on Stellar
        </div>
      </div>
    ),
    { ...size }
  );
}
