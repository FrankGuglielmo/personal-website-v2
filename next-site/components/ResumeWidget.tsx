import Link from "next/link";

export default function ResumeWidget() {
  return (
    <div className="glass glass-flat rounded-2xl p-4 flex items-center justify-between gap-3">
      <div>
        <div className="text-sm text-[--color-muted]">Resume</div>
        <div className="font-medium">Frank Guglielmo</div>
      </div>
      <Link
        href="/FrankGuglielmoResume-15.pdf"
        target="_blank"
        className="inline-flex items-center gap-2 px-3 py-2 rounded-xl bg-white/20 hover:bg-white/30 transition-colors"
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
          <path d="M14 3H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9l-6-6zm1 7V4.5L19.5 10H15zM8 13h8v2H8v-2zm0 4h8v2H8v-2z"/>
        </svg>
        <span className="text-sm font-medium">Open</span>
      </Link>
    </div>
  );
}



