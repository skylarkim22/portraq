import Image from "next/image";

interface LogoSymbolProps {
  size?: number;
}

export default function LogoSymbol({ size = 32 }: LogoSymbolProps) {
  return (
    <Image
      src="/logo-symbol.svg"
      alt="Portraq"
      width={size}
      height={size}
      priority
    />
  );
}
