// pages/_document.js
import Document, { Html, Head, Main, NextScript } from 'next/document'

class MyDocument extends Document {
  render() {
    const hero = '/hero.jpg'

    return (
      <Html lang="en" className="dark">
        <Head>
          {/* Preconnects */}
          <link rel="preconnect" href="https://fonts.googleapis.com" />
          <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
          <link rel="preconnect" href="https://www.googletagmanager.com" crossOrigin="" />
          <link rel="preconnect" href="https://www.google-analytics.com" crossOrigin="" />

          {/* Geist Sans — PFC design system font */}
          <link
            href="https://fonts.googleapis.com/css2?family=Geist:wght@300;400;500;600;700;800&display=swap"
            rel="stylesheet"
          />

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
