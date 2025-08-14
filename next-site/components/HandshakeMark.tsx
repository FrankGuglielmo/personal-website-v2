import Image from "next/image";
import { twMerge } from "tailwind-merge";

type Props = {
  className?: string;
  alt?: string;
};

export default function HandshakeMark({ className = "", alt = "Handshake mark" }: Props) {
  return (
    <Image
      src="/images/handshake-logo.jpg"
      alt={alt}
      className={twMerge("h-10 w-10 object-contain", className)}
      sizes="(min-width: 768px) 2.5rem, 2.5rem"
      priority={false}
    />
  );
}


