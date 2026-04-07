import { ImageResponse } from "next/og";

export const runtime = "edge";

export const alt = "KidsNote - 幼稚園業務管理システム";
export const size = {
  width: 1200,
  height: 630,
};
export const contentType = "image/png";

export default function Image() {
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
          background: "linear-gradient(135deg, #faeee7 0%, #fffffe 100%)",
        }}
      >
        {/* K Logo */}
        <div
          style={{
            width: 120,
            height: 120,
            borderRadius: 24,
            background: "linear-gradient(135deg, #ff8ba7 0%, #c3f0ca 100%)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            marginBottom: 32,
            boxShadow: "0 8px 32px rgba(255, 139, 167, 0.3)",
          }}
        >
          <span
            style={{
              fontSize: 64,
              fontWeight: 700,
              color: "#ffffff",
            }}
          >
            K
          </span>
        </div>

        {/* App Name */}
        <div
          style={{
            fontSize: 56,
            fontWeight: 700,
            color: "#33272a",
            marginBottom: 16,
          }}
        >
          KidsNote
        </div>

        {/* Tagline */}
        <div
          style={{
            fontSize: 24,
            color: "#594a4e",
          }}
        >
          保育の瞬間を逃さず記録し、AIが全ての事務処理を代行する
        </div>
      </div>
    ),
    {
      ...size,
    }
  );
}
