import Image from "next/image";
import { twMerge } from "tailwind-merge";

type Props = {
  className?: string;
  alt?: string;
};

export default function HandshakeWordmark({ className = "", alt = "Handshake" }: Props) {
  return (
    <Image
      src="/images/handshake-logo-word.png"
      alt={alt}
      className={twMerge("h-6 w-auto object-contain", className)}
      sizes="(min-width: 768px) 10rem, 10rem"
      priority={false}
    />
  );
}


