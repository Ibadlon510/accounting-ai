import { ImageResponse } from "next/og";

const ALLOWED_SIZES = [192, 512] as const;

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ size: string }> }
) {
  const { size: raw } = await params;
  const parsed = Number(raw);
  const size = ALLOWED_SIZES.includes(parsed as (typeof ALLOWED_SIZES)[number])
    ? parsed
    : 512;
  const iconDim = Math.round(size * 0.5);

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "linear-gradient(135deg, #EF4444 0%, #F97316 100%)",
        }}
      >
        <svg
          width={iconDim}
          height={iconDim}
          viewBox="0 0 24 24"
          fill="none"
        >
          <path
            d="M2 16 L12 21 L22 16 L22 18 L12 23 L2 18 Z"
            fill="white"
            opacity="0.6"
          />
          <path
            d="M2 12 L12 17 L22 12 L22 14 L12 19 L2 14 Z"
            fill="white"
            opacity="0.8"
          />
          <path d="M12 2 L22 7 L12 12 L2 7 Z" fill="white" />
        </svg>
      </div>
    ),
    { width: size, height: size }
  );
}
