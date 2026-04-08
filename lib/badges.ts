export const getBadge = (rank: number, total: number) => {
  if (total === 0 || rank === 0) return { label: "BRONZE", class: "bg-[#2a1500] text-[#F0997B]", color: "#F0997B" };
  
  const platinum = Math.ceil(total * 0.25);
  const gold = Math.ceil(total * 0.5);
  const silver = Math.ceil(total * 0.75);
  
  if (rank <= platinum) return { label: "PLATINUM", class: "bg-[#1a1540] text-[#AFA9EC]", color: "#AFA9EC" };
  if (rank <= gold) return { label: "GOLD", class: "bg-[#3a2e00] text-[#FAC775]", color: "#FAC775" };
  if (rank <= silver) return { label: "SILVER", class: "bg-[#222] text-[#ccc]", color: "#cccccc" };
  return { label: "BRONZE", class: "bg-[#2a1500] text-[#F0997B]", color: "#F0997B" };
};