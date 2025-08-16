'use client'
export default function WhatsAppCTA({ perfume, phone = '+92XXXXXXXXXX' }) {
  const text = encodeURIComponent(`Hi, I'm interested in ${perfume?.brand?.name} ${perfume?.name}.`)
  const href = `https://wa.me/${phone.replace(/\D/g, '')}?text=${text}`

  return (
    <a href={href} target="_blank" rel="noopener noreferrer"
       className="block text-center rounded-2xl border border-emerald-700 bg-emerald-900/30 hover:bg-emerald-900/50 transition p-4 font-semibold">
      Enquire / Order on WhatsApp
    </a>
  )
}
