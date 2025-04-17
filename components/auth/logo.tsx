import Image from "next/image"

export function Logo() {
  return (
    <div className="flex justify-center mb-8">
      <Image
        src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/image-sUMm3zwGrdmUG8P9IjT2BGmeJ4mTEX.png"
        alt="AnyQuant Logo"
        width={300}
        height={80}
        priority
      />
    </div>
  )
}
