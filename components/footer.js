import Image from 'next/image';

export default function Footer() {
  return (
    <footer className="bg-black text-white">
      <div className="mx-auto max-w-screen-xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="lg:flex lg:items-start lg:gap-8">
          <div className="text-white">
            <Image
              src="/logo.png"
              alt="PFC Logo"
              width={120}
              height={40}
              className="object-contain"
            />
          </div>

          <div className="mt-8 grid grid-cols-2 gap-8 lg:mt-0 lg:grid-cols-5 lg:gap-y-16">
            <div className="col-span-2">
              <div>
                <h2 className="text-2xl font-bold text-white">Get the latest news!</h2>
                <p className="mt-4 text-gray-400">
                  Stay updated with fragrance trends, reviews, and decant deals across Pakistan.
                </p>
              </div>
            </div>

            <div className="col-span-2 lg:col-span-3 lg:flex lg:items-end">
              <form className="w-full">
                <label htmlFor="UserEmail" className="sr-only"> Email </label>
                <div className="border border-gray-700 p-2 focus-within:ring-3 sm:flex sm:items-center sm:gap-4">
                  <input
                    type="email"
                    id="UserEmail"
                    placeholder="your@email.com"
                    className="w-full border-none bg-black text-white placeholder-gray-500 focus:border-transparent focus:ring-transparent sm:text-sm"
                  />
                  <button
                    className="mt-1 w-full bg-white text-black px-6 py-3 text-sm font-bold tracking-wide uppercase transition hover:bg-gray-200 sm:mt-0 sm:w-auto sm:shrink-0"
                  >
                    Sign Up
                  </button>
                </div>
              </form>
            </div>

            <FooterLinks title="Services" links={["Decanting Help", "Buy/Sell Guidance", "Perfume Reviews", "Authenticity Checks"]} />
            <FooterLinks title="Company" links={["About PFC", "Our Team", "Mission"]} />
            <FooterLinks title="Helpful Links" links={["Contact", "FAQs", "Community Rules"]} />
            <FooterLinks title="Legal" links={["Terms", "Privacy", "Refund Policy"]} />
            <FooterLinks title="Contact" links={["pakfrag@gmail.com"]} />

            <div className="col-span-2 flex justify-start gap-6 lg:col-span-5 lg:justify-end">
              <SocialIcon href="https://www.facebook.com/groups/pkfragcom" label="Facebook">
                <svg className="size-6" fill="currentColor" viewBox="0 0 24 24"><path fillRule="evenodd" d="M22 12c0-5.523-4.477-10-10-10..." clipRule="evenodd" /></svg>
              </SocialIcon>
              <SocialIcon href="https://www.instagram.com/pakfragcom" label="Instagram">
                <svg className="size-6" fill="currentColor" viewBox="0 0 24 24"><path fillRule="evenodd" d="M12.315 2c2.43 0 2.784..." clipRule="evenodd" /></svg>
              </SocialIcon>
            </div>
          </div>
        </div>

        <div className="mt-8 border-t border-gray-700 pt-8">
          <div className="sm:flex sm:justify-between">
            <p className="text-xs text-gray-500">&copy; 2025 Pakistan Fragrance Community. All rights reserved.</p>
            <ul className="mt-8 flex flex-wrap justify-start gap-4 text-xs sm:mt-0 lg:justify-end">
              <li><a href="#" className="text-gray-400 transition hover:text-white"> Terms </a></li>
              <li><a href="#" className="text-gray-400 transition hover:text-white"> Privacy </a></li>
              <li><a href="#" className="text-gray-400 transition hover:text-white"> Cookies </a></li>
            </ul>
          </div>
        </div>
      </div>
    </footer>
  );
}

function FooterLinks({ title, links }) {
  return (
    <div className="col-span-2 sm:col-span-1">
      <p className="font-medium text-white">{title}</p>
      <ul className="mt-6 space-y-4 text-sm">
        {links.map((link, i) => (
          <li key={i}>
            <a href="#" className="text-gray-400 hover:text-white transition"> {link} </a>
          </li>
        ))}
      </ul>
    </div>
  );
}

function SocialIcon({ href, label, children }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={label}
      className="text-gray-400 hover:text-white transition"
    >
      {children}
    </a>
  );
}
