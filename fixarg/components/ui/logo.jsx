import Image from 'next/image'
import Link from 'next/link'

export function Logo({ className = "" }) {
  return (
    <Link href="/" className={`flex items-center gap-2 ${className}`}>
      <div className="relative h-20 w-60 md:h-24 md:w-72">
        <Image
          src="/fixarg.png"
          alt="FixArg Logo"
          fill
          className="object-contain"
          priority
        />
      </div>
    </Link>
  )
}

