export default function Logo({ className = "h-10", light = false }: { className?: string; light?: boolean }) {
  return (
    <img
      src="/transportos-logo.png"
      alt="TransportOS Logo"
      className={className}
      style={{
        objectFit: "contain",
        objectPosition: "left center",
        // On dark backgrounds invert just enough to keep colors but make dark parts light
        filter: light ? "brightness(0) invert(1)" : "none",
      }}
    />
  )
}
