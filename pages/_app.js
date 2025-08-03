import Head from 'next/head'
import '../styles/main.css'
import ScrollToTop from '../components/ScrollToTop'

export default function App({ Component, pageProps }) {
  return (
    <>
      <Head>
        <link
          href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;600;700&display=swap"
          rel="stylesheet"
        />
        <link
          rel="icon"
          href="/pfc-round.png"
          type="image/png"
        />
      </Head>

      <Component {...pageProps} />
      <ScrollToTop />
    </>
  )
}
