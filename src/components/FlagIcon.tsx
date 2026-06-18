import { getFlagUrl } from "../data/teams";

interface Props {
  code: string;
  size?: number; // height in px
}

export default function FlagIcon({ code, size = 16 }: Props) {
  if (!code || code.length < 2) {
    return (
      <span
        className="flag-icon flag-empty"
        style={{ width: size * 1.33, height: size }}
      />
    );
  }
  const src = getFlagUrl(code);
  return (
    <img
      src={src}
      alt=""
      className="flag-icon"
      style={{
        height: size,
        width: "auto",
        aspectRatio: "4/3",
        objectFit: "cover",
      }}
      loading="lazy"
    />
  );
}
