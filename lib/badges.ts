export const getBadge = (rank: number, total: number) => {
  if (total === 0) return { label: "BRONZE", class: "bg-[#2a1500] text-[#F0997B]", color: "#F0997B" };
  
  const pct = rank / total;
  
  if (pct <= 0.25) return { label: "PLATINUM", class: "bg-[#1a1540] text-[#AFA9EC]", color: "#AFA9EC" };
  if (pct <= 0.5) return { label: "GOLD", class: "bg-[#3a2e00] text-[#FAC775]", color: "#FAC775" };
  if (pct <= 0.75) return { label: "SILVER", class: "bg-[#222] text-[#ccc]", color: "#cccccc" };
  return { label: "BRONZE", class: "bg-[#2a1500] text-[#F0997B]", color: "#F0997B" };
};