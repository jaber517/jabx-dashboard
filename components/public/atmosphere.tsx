// Soft premium glow behind the void background — not a hard color block.
export function Atmosphere() {
  return (
    <div
      className="pointer-events-none fixed inset-0 -z-10"
      style={{
        background:
          "radial-gradient(640px 420px at 18% -8%, rgba(10, 132, 255, 0.30), transparent 60%), radial-gradient(520px 520px at 92% 6%, rgba(124, 111, 255, 0.16), transparent 60%)"
      }}
    />
  );
}
