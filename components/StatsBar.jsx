import Link from 'next/link';
import { m } from 'framer-motion';
import Reveal from './ui/Reveal';

const EASE = [0.25, 0.46, 0.45, 0.94];

const countVariants = {
  hidden: { opacity: 0, y: 12 },
  show: { opacity: 1, y: 0, transition: { duration: 0.5, ease: EASE } },
};

const stagger = {
  hidden: {},
  show: { transition: { staggerChildren: 0.1, delayChildren: 0.05 } },
};

export default function StatsBar({ stats = {} }) {
  const { reviews = 0, fragrances = 0, reviewers = 0 } = stats;
  if (!reviews && !fragrances && !reviewers) return null;

  const items = [
    { value: reviews,    label: 'Reviews',    href: '/reviews' },
    { value: fragrances, label: 'Fragrances', href: '/fragrances' },
    { value: reviewers,  label: 'Reviewers',  href: null },
  ];

  return (
    <section className="border-y border-white/8 bg-white/[0.02]">
      <Reveal>
        <m.div
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, amount: 0.3 }}
          variants={stagger}
          className="mx-auto max-w-3xl px-6 py-8 flex items-center justify-center divide-x divide-white/10"
        >
          {items.map(({ value, label, href }) => (
            <m.div key={label} variants={countVariants}
              className="flex-1 text-center px-4 sm:px-8">
              {href ? (
                <Link href={href} className="group block">
                  <p className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight group-hover:text-[#94aea7] transition-colors">
                    {value > 0 ? value.toLocaleString() : '—'}
                  </p>
                  <p className="text-[11px] uppercase tracking-[0.15em] text-gray-500 mt-1 group-hover:text-gray-400 transition-colors">{label}</p>
                </Link>
              ) : (
                <>
                  <p className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
                    {value > 0 ? value.toLocaleString() : '—'}
                  </p>
                  <p className="text-[11px] uppercase tracking-[0.15em] text-gray-500 mt-1">{label}</p>
                </>
              )}
            </m.div>
          ))}
        </m.div>
      </Reveal>
    </section>
  );
}
