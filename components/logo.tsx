export function Logo({ className = "size-9" }: { className?: string }) {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src="/logo.png"
      alt="PanaDesk"
      className={`${className} rounded-lg object-contain`}
    />
  );
}
