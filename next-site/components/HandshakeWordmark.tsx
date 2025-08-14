import Image from "next/image";
import { twMerge } from "tailwind-merge";
import handshakeWordmark from "@/app/images/handshake-logo-word.png";

type Props = {
  className?: string;
  alt?: string;
};

export default function HandshakeWordmark({ className = "", alt = "Handshake" }: Props) {
  return (
    <Image
      src={handshakeWordmark}
      alt={alt}
      className={twMerge("h-6 w-auto object-contain", className)}
      sizes="(min-width: 768px) 10rem, 10rem"
      priority={false}
    />
  );
}


