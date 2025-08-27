// pages/_document.js
import Document, { Html, Head, Main, NextScript } from 'next/document'

class MyDocument extends Document {
  render() {
    // Adjust these paths to your real assets
    const hero = '/images/hero.avif' // keep an AVIF/WebP hero in /public/images

    return (
      <Html lang="en" className="dark">
        <Head>
          {/* Preconnects for faster hops */}
          <link rel="preconnect" href="https://forum.pakfrag.com" crossOrigin="" />
          <link rel="preconnect" href="https://fonts.googleapis.com" />
          <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
          <link rel="preconnect" href="https://www.googletagmanager.com" crossOrigin="" />
          <link rel="preconnect" href="https://www.google-analytics.com" crossOrigin="" />

          {/* Preload LCP image (hero) */}
          <link rel="preload" as="image" href={hero} />
        </Head>
        <body className="bg-black text-white antialiased">
          <Main />
          <NextScript />
        </body>
      </Html>
    )
  }
}

export default MyDocument
