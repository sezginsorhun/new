import WhatsAppIcon from "./WhatsAppIcon";

/**
 * Sağ altta sabit WhatsApp düğmesi.
 * Yalnızca panelde WhatsApp numarası girildiyse görünür.
 */
export default function WhatsAppFloat({ number, siteName }: { number: string; siteName: string }) {
  const text = encodeURIComponent(`Merhaba ${siteName}, bir ürün hakkında bilgi almak istiyorum.`);
  return (
    <a
      href={`https://wa.me/${number}?text=${text}`}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="WhatsApp ile yaz"
      className="fixed bottom-5 right-5 z-40 flex h-14 w-14 items-center justify-center rounded-full bg-[#25d366] text-white shadow-[0_6px_20px_rgba(0,0,0,0.18)] transition-transform hover:scale-105"
    >
      <WhatsAppIcon size={28} />
    </a>
  );
}
