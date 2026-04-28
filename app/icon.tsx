export const size = { width: 32, height: 32 };
export const contentType = "image/svg+xml";

export default function Icon() {
  return (
    <svg width="32" height="32" viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg">
      <rect width="32" height="32" rx="6" fill="#0f0f0f"/>
      <text x="2" y="23" fontSize="18" fontWeight="bold" fontFamily="Arial" fill="#ff751f">C</text>
      <text x="15" y="23" fontSize="18" fontWeight="bold" fontFamily="Arial" fill="#ffffff">P</text>
    </svg>
  );
}